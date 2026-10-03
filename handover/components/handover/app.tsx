"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ApiError, api } from "@/lib/client-api";
import {
  errorText,
  translate,
  type ExtraKey,
  type Language,
  type TextKey,
} from "@/lib/i18n";
import type {
  ChangeRequest,
  ConflictResult,
  Handover,
  Lesson,
  RequestInput,
  SchoolClass,
  User,
  Workspace,
} from "@/shared/types";
import { addDays, defaultSchoolMonday, schoolToday } from "@/shared/time";
import "./handover.css";

type View =
  | "overview"
  | "timetable"
  | "requests"
  | "notifications"
  | "profile"
  | "users"
  | "audit"
  | "impact";
type AuthMode = "login" | "register" | "recover";
const emptyHandover = (): Handover => ({
  progress: "",
  plan: "",
  materials: [{ title: "", url: "" }],
  assessment: "",
  equipment: "",
  studentReminder: "",
  teacherNotes: "",
});

type Prefs = {
  language: Language;
  theme: string;
  large: boolean;
  contrast: boolean;
  simple: boolean;
};
const defaultPrefs: Prefs = {
  language: "en",
  theme: "light",
  large: false,
  contrast: false,
  simple: false,
};
let prefsState = defaultPrefs;
const prefListeners = new Set<() => void>();
function emitPrefs() {
  for (const listener of prefListeners) listener();
}
function readPrefs() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("handover-prefs");
  if (!stored) return;
  prefsState = { ...defaultPrefs, ...(JSON.parse(stored) as Partial<Prefs>) };
}
let prefsLoaded = false;
function ensurePrefs() {
  if (prefsLoaded || typeof window === "undefined") return;
  prefsLoaded = true;
  readPrefs();
  document.documentElement.lang =
    prefsState.language === "zh" ? "zh-Hant" : "en";
}
function updatePrefs(patch: Partial<Prefs>) {
  ensurePrefs();
  prefsState = { ...prefsState, ...patch };
  localStorage.setItem("handover-prefs", JSON.stringify(prefsState));
  document.documentElement.lang =
    prefsState.language === "zh" ? "zh-Hant" : "en";
  emitPrefs();
}
async function downloadCalendar() {
  const response = await fetch("/api/calendar", { credentials: "same-origin" });
  if (!response.ok) return;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "handover.ics";
  link.click();
  URL.revokeObjectURL(url);
}

function usePrefs() {
  const snapshot = useSyncExternalStore(
    (listener) => {
      prefListeners.add(listener);
      return () => {
        prefListeners.delete(listener);
      };
    },
    () => {
      ensurePrefs();
      return JSON.stringify(prefsState);
    },
    () => JSON.stringify(defaultPrefs),
  );
  const prefs = JSON.parse(snapshot) as Prefs;
  return {
    ...prefs,
    setLanguage: (language: Language) => updatePrefs({ language }),
    setTheme: (theme: string) => updatePrefs({ theme }),
    setLarge: (large: boolean) => updatePrefs({ large }),
    setContrast: (contrast: boolean) => updatePrefs({ contrast }),
    setSimple: (simple: boolean) => updatePrefs({ simple }),
  };
}

export default function HandoverApp() {
  const prefs = usePrefs();
  const t = (key: TextKey | ExtraKey) => translate(prefs.language, key);
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [view, setView] = useState<View>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [week, setWeek] = useState(defaultSchoolMonday());
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  async function load(
    nextWeek = week,
    nextClass = classId,
    nextTeacher = teacherId,
  ) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ week: nextWeek });
      if (nextClass) params.set("classId", nextClass);
      if (nextTeacher) params.set("teacherId", nextTeacher);
      const data = await api<Workspace>(`/api/workspace?${params.toString()}`);
      setWorkspace(data);
      setUser(data.user);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? errorText(prefs.language, caught.code)
          : t("networkError"),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api<{ user: User }>("/api/auth/me")
      .then((data) => {
        setUser(data.user);
        return load();
      })
      .catch(() => setLoading(false));
    // Initial session check only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setMessage("");
    await load();
  }

  if (loading && !workspace && !error)
    return (
      <main className="handover-root">
        <p className="main">{t("loading")}</p>
      </main>
    );
  if (!user || !workspace) {
    return (
      <AuthScreen
        t={t}
        language={prefs.language}
        setLanguage={prefs.setLanguage}
        onUser={(next) => {
          setUser(next);
          setWeek(defaultSchoolMonday());
          void load(defaultSchoolMonday());
        }}
      />
    );
  }

  const unread = workspace.notifications.filter((item) => !item.read).length;
  const nav: Array<[View, TextKey]> = [
    ["overview", "dashboard"],
    ["timetable", "timetable"],
    ["requests", "requests"],
    ["notifications", "notifications"],
    ["profile", "profile"],
  ];
  if (user.role === "admin" && !prefs.simple)
    nav.push(["users", "users"], ["audit", "audit"], ["impact", "impact"]);

  return (
    <div
      className="handover-root"
      data-theme={prefs.theme}
      data-large={String(prefs.large)}
      data-contrast={String(prefs.contrast)}
      data-simple={String(prefs.simple)}
    >
      <a className="skip-link" href="#main">
        {t("mainNav")}
      </a>
      <div className="shell">
        <nav className="sidebar" aria-label={t("mainNav")}>
          <strong>Handover</strong>
          <p>{t("tagline")}</p>
          {nav.map(([id, key]) => (
            <button
              key={id}
              type="button"
              aria-current={view === id ? "page" : undefined}
              onClick={() => {
                setView(id);
                setEditing(false);
              }}
            >
              {t(key)}
              {id === "notifications" && unread ? ` (${unread})` : ""}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              prefs.setLanguage(prefs.language === "en" ? "zh" : "en")
            }
          >
            {prefs.language === "en" ? "繁體中文" : "English"}
          </button>
          <button
            type="button"
            onClick={async () => {
              await api("/api/auth/logout", {});
              setUser(null);
              setWorkspace(null);
            }}
          >
            {t("logout")}
          </button>
        </nav>
        <main id="main" className="main">
          <div className="topbar">
            <div>
              <p className="sr">{t("signedIn")}</p>
              <h1>
                {t("hello")} {user.name}
              </h1>
              <p>
                {user.role === "student"
                  ? t("studentHint")
                  : user.role === "admin"
                    ? t("adminHint")
                    : t("overviewHint")}
              </p>
            </div>
            <button
              className="btn ghost"
              type="button"
              onClick={() => void refresh()}
            >
              {t("refresh")}
            </button>
          </div>
          {error ? (
            <p className="notice error" role="alert">
              {error}{" "}
              <button
                className="btn ghost"
                type="button"
                onClick={() => void refresh()}
              >
                {t("retry")}
              </button>
            </p>
          ) : null}
          {message ? (
            <p className="notice ok" role="status">
              {message}
            </p>
          ) : null}
          {loading ? <p>{t("loadingData")}</p> : null}
          {view === "overview" ? (
            <Overview
              t={t}
              user={user}
              workspace={workspace}
              onOpen={(id) => {
                setSelected(id);
                setView("requests");
              }}
            />
          ) : null}
          {view === "timetable" ? (
            <Timetable
              t={t}
              workspace={workspace}
              user={user}
              week={week}
              classId={classId}
              teacherId={teacherId}
              onWeek={(value) => {
                setWeek(value);
                void load(value);
              }}
              onClass={(value) => {
                setClassId(value);
                void load(week, value, teacherId);
              }}
              onTeacher={(value) => {
                setTeacherId(value);
                void load(week, classId, value);
              }}
              onOpen={(id) => {
                setSelected(id);
                setView("requests");
              }}
            />
          ) : null}
          {view === "requests" ? (
            <Requests
              t={t}
              user={user}
              workspace={workspace}
              selected={selected}
              editing={editing}
              setEditing={setEditing}
              onSelect={setSelected}
              onMessage={setMessage}
              onReload={refresh}
            />
          ) : null}
          {view === "notifications" ? (
            <Notifications
              t={t}
              workspace={workspace}
              onOpen={(id) => {
                setSelected(id);
                setView("requests");
              }}
              onReload={refresh}
              onMessage={setMessage}
            />
          ) : null}
          {view === "profile" ? (
            <Profile
              t={t}
              user={user}
              classes={workspace.classes}
              prefs={prefs}
              onMessage={setMessage}
              onReload={async () => {
                const me = await api<{ user: User }>("/api/auth/me");
                setUser(me.user);
                await refresh();
              }}
            />
          ) : null}
          {view === "users" && user.role === "admin" ? (
            <Users t={t} onMessage={setMessage} />
          ) : null}
          {view === "audit" && user.role === "admin" ? <Audit t={t} /> : null}
          {view === "impact" && user.role === "admin" ? (
            <Impact t={t} week={week} />
          ) : null}
        </main>
      </div>
      <nav className="bottom-nav" aria-label={t("mainNav")}>
        {nav.slice(0, 4).map(([id, key]) => (
          <button
            key={id}
            type="button"
            aria-current={view === id ? "page" : undefined}
            onClick={() => setView(id)}
          >
            {t(key)}
          </button>
        ))}
      </nav>
    </div>
  );
}

function AuthScreen({
  t,
  language,
  setLanguage,
  onUser,
}: {
  t: (key: TextKey | ExtraKey) => string;
  language: Language;
  setLanguage: (value: Language) => void;
  onUser: (user: User) => void;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [classId, setClassId] = useState("demo-class-7a");
  const [subjects, setSubjects] = useState("Math");
  const [invite, setInvite] = useState("");
  const [recovery, setRecovery] = useState("");
  const [shownCode, setShownCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        const data = await api<{ user: User }>("/api/auth/login", {
          email,
          password,
        });
        onUser(data.user);
      } else if (mode === "register") {
        const data = await api<{ user: User; recoveryCode: string }>(
          "/api/auth/register",
          {
            email,
            password,
            name,
            role,
            classId: role === "student" ? classId : undefined,
            subjects:
              role === "teacher"
                ? subjects
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                : undefined,
            inviteCode: invite,
          },
        );
        setShownCode(data.recoveryCode);
      } else {
        const data = await api<{ recoveryCode: string }>("/api/auth/reset", {
          email,
          recoveryCode: recovery,
          password,
        });
        setShownCode(data.recoveryCode);
        setMode("login");
      }
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? errorText(language, caught.code)
          : t("networkError"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function demo(nextRole: string, teacherIndex = 0) {
    setBusy(true);
    setError("");
    try {
      const data = await api<{ user: User }>("/api/auth/demo", {
        role: nextRole,
        teacherIndex,
      });
      onUser(data.user);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? errorText(language, caught.code)
          : t("networkError"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="handover-root">
      <div className="auth-shell">
        <section className="auth-brand">
          <div>
            <p>{t("campus")}</p>
            <h1>{t("authPromise")}</h1>
            <p>{t("authDescription")}</p>
          </div>
          <p>{t("demoHint")}</p>
        </section>
        <section className="auth-panel">
          <div className="row">
            <button
              className="btn ghost"
              type="button"
              onClick={() => setLanguage(language === "en" ? "zh" : "en")}
            >
              {language === "en" ? "繁體中文" : "English"}
            </button>
          </div>
          <div className="auth-card stack">
            <h2>
              {mode === "login"
                ? t("welcome")
                : mode === "register"
                  ? t("register")
                  : t("resetPassword")}
            </h2>
            <p>{mode === "recover" ? t("recoveryIntro") : t("loginHint")}</p>
            {shownCode ? (
              <p className="notice" role="status">
                <strong>
                  {t("recoveryCode")}: {shownCode}
                </strong>
                <br />
                {t("recoveryHint")}
              </p>
            ) : null}
            {error ? (
              <p className="notice error" role="alert">
                {error}
              </p>
            ) : null}
            <form className="stack" onSubmit={submit}>
              <label>
                {t("email")}
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              {mode === "register" ? (
                <label>
                  {t("name")}
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </label>
              ) : null}
              {mode === "register" ? (
                <label>
                  {t("role")}
                  <select
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value as "student" | "teacher")
                    }
                  >
                    <option value="student">{t("student")}</option>
                    <option value="teacher">{t("teacher")}</option>
                  </select>
                </label>
              ) : null}
              {mode === "register" && role === "student" ? (
                <label>
                  {t("class")}
                  <select
                    value={classId}
                    onChange={(event) => setClassId(event.target.value)}
                  >
                    <option value="demo-class-7a">Class 7A</option>
                    <option value="demo-class-7b">Class 7B</option>
                    <option value="demo-class-8a">Class 8A</option>
                  </select>
                </label>
              ) : null}
              {mode === "register" && role === "teacher" ? (
                <label>
                  {t("subjects")}
                  <input
                    value={subjects}
                    onChange={(event) => setSubjects(event.target.value)}
                    required
                  />
                </label>
              ) : null}
              {mode === "register" && role === "teacher" ? (
                <label>
                  {t("invitation")}
                  <input
                    value={invite}
                    onChange={(event) => setInvite(event.target.value)}
                    required
                  />
                </label>
              ) : null}
              {mode === "recover" ? (
                <label>
                  {t("recoveryCode")}
                  <input
                    value={recovery}
                    onChange={(event) => setRecovery(event.target.value)}
                    required
                  />
                </label>
              ) : null}
              <label>
                {mode === "recover" ? t("newPassword") : t("password")}
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength={8}
                  required
                />
              </label>
              <button className="btn" type="submit" disabled={busy}>
                {busy ? t("loadingData") : t("continue")}
              </button>
            </form>
            <div className="row">
              <button
                className="btn ghost"
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? t("register") : t("backLogin")}
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={() => setMode("recover")}
              >
                {t("forgot")}
              </button>
            </div>
          </div>
          <div className="stack">
            <h2>{t("demo")}</h2>
            <div className="demo-grid">
              <button
                className="btn secondary"
                type="button"
                onClick={() => void demo("student")}
              >
                {t("demoStudent")}
              </button>
              <button
                className="btn secondary"
                type="button"
                onClick={() => void demo("teacher", 0)}
              >
                {t("demoTeacher")}
              </button>
              <button
                className="btn secondary"
                type="button"
                onClick={() => void demo("teacher", 1)}
              >
                {t("demoRecipient")}
              </button>
              <button
                className="btn secondary"
                type="button"
                onClick={() => void demo("admin")}
              >
                {t("demoAdmin")}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Overview({
  t,
  user,
  workspace,
  onOpen,
}: {
  t: (key: TextKey | ExtraKey) => string;
  user: User;
  workspace: Workspace;
  onOpen: (id: string) => void;
}) {
  const today = schoolToday();
  const todays = workspace.lessons.filter((lesson) => lesson.date === today);
  const incoming = workspace.requests.filter(
    (item) => item.status === "Pending" && item.recipientId === user.id,
  );
  const drafts = workspace.requests.filter(
    (item) =>
      (item.status === "Draft" || item.status === "Declined") &&
      item.originalTeacherId === user.id,
  );
  const next =
    user.role === "student"
      ? workspace.requests.find((item) => item.status === "Confirmed")
      : (incoming[0] ?? drafts[0]);
  return (
    <section className="stack">
      <div className="card notice">
        <p>{t("nextStep")}</p>
        <strong>
          {user.role === "student"
            ? t("nextStudent")
            : user.role === "admin"
              ? t("nextAdmin")
              : t("nextTeacher")}
        </strong>
        {next ? (
          <button className="btn" type="button" onClick={() => onOpen(next.id)}>
            {t("openHandover")}
          </button>
        ) : null}
      </div>
      <div className="stats">
        <article className="card">
          <span>{t("weekLessons")}</span>
          <strong>{workspace.lessons.length}</strong>
        </article>
        <article className="card">
          <span>{t("waiting")}</span>
          <strong>{workspace.stats.pending}</strong>
        </article>
        <article className="card">
          <span>{t("Declined")}</span>
          <strong>{workspace.stats.declined}</strong>
        </article>
        <article className="card">
          <span>{t("ready")}</span>
          <strong>{workspace.stats.confirmed}</strong>
        </article>
      </div>
      <section className="card stack">
        <h2>{t("today")}</h2>
        {todays.length === 0 ? (
          <p>
            {t("noLessons")}. {t("noLessonsHint")}
          </p>
        ) : (
          todays.map((lesson) => (
            <LessonButton
              key={lesson.id}
              lesson={lesson}
              t={t}
              onOpen={onOpen}
            />
          ))
        )}
      </section>
      {user.role === "admin" && workspace.risks.length ? (
        <section className="card stack">
          <h2>{t("risks")}</h2>
          {workspace.risks.slice(0, 6).map((risk) => (
            <button
              className="btn ghost"
              type="button"
              key={risk.id}
              onClick={() => onOpen(risk.requestId)}
            >
              {risk.message}
            </button>
          ))}
        </section>
      ) : null}
    </section>
  );
}

function LessonButton({
  lesson,
  t,
  onOpen,
}: {
  lesson: Lesson;
  t: (key: TextKey | ExtraKey) => string;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      className={`lesson ${lesson.changed ? "changed" : ""}`}
      type="button"
      onClick={() => lesson.requestId && onOpen(lesson.requestId)}
    >
      <strong>{lesson.subject}</strong> · {t("period")} {lesson.period} ·{" "}
      {lesson.room}
      <br />
      {lesson.teacherName} · {lesson.date}
      {lesson.changed ? (
        <span className="badge changed"> {t("changed")}</span>
      ) : null}
    </button>
  );
}

function Timetable({
  t,
  workspace,
  user,
  week,
  classId,
  teacherId,
  onWeek,
  onClass,
  onTeacher,
  onOpen,
}: {
  t: (key: TextKey | ExtraKey) => string;
  workspace: Workspace;
  user: User;
  week: string;
  classId: string;
  teacherId: string;
  onWeek: (value: string) => void;
  onClass: (value: string) => void;
  onTeacher: (value: string) => void;
  onOpen: (id: string) => void;
}) {
  const days = [0, 1, 2, 3, 4].map((offset) => addDays(week, offset));
  const labels: TextKey[] = [
    "shortMon",
    "shortTue",
    "shortWed",
    "shortThu",
    "shortFri",
  ];
  const [day, setDay] = useState(schoolToday());
  const visibleDay = days.includes(day) ? day : days[0];
  return (
    <section className="stack">
      <div className="row">
        <button
          className="btn ghost"
          type="button"
          onClick={() => onWeek(addDays(week, -7))}
        >
          {t("previousWeek")}
        </button>
        <strong>
          {t("weekRange")} {week}
        </strong>
        <button
          className="btn ghost"
          type="button"
          onClick={() => onWeek(addDays(week, 7))}
        >
          {t("nextWeek")}
        </button>
        <button
          className="btn ghost"
          type="button"
          onClick={() => void downloadCalendar()}
        >
          {t("calendar")}
        </button>
      </div>
      {user.role === "admin" ? (
        <div className="row">
          <label>
            {t("class")}
            <select
              value={classId}
              onChange={(event) => onClass(event.target.value)}
            >
              <option value="">{t("allClasses")}</option>
              {workspace.classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("teacher")}
            <select
              value={teacherId}
              onChange={(event) => onTeacher(event.target.value)}
            >
              <option value="">{t("allTeachers")}</option>
              {workspace.teachers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      <div className="row">
        {days.map((date, index) => (
          <button
            className="btn ghost"
            type="button"
            key={date}
            aria-pressed={visibleDay === date}
            onClick={() => setDay(date)}
          >
            {t(labels[index])} {date.slice(5)}
          </button>
        ))}
      </div>
      <div className="day-list">
        {workspace.lessons.filter((lesson) => lesson.date === visibleDay)
          .length === 0 ? (
          <p className="card">
            {t("noLessons")}. {t("noLessonsHint")}
          </p>
        ) : (
          workspace.lessons
            .filter((lesson) => lesson.date === visibleDay)
            .map((lesson) => (
              <LessonButton
                key={lesson.id}
                lesson={lesson}
                t={t}
                onOpen={onOpen}
              />
            ))
        )}
      </div>
      <div className="week-grid">
        {days.map((date, index) => (
          <section key={date} className="card stack">
            <h2>
              {t(labels[index])}
              <br />
              {date}
            </h2>
            {workspace.lessons
              .filter((lesson) => lesson.date === date)
              .map((lesson) => (
                <LessonButton
                  key={lesson.id}
                  lesson={lesson}
                  t={t}
                  onOpen={onOpen}
                />
              ))}
            {workspace.lessons.every((lesson) => lesson.date !== date) ? (
              <p>{t("free")}</p>
            ) : null}
          </section>
        ))}
      </div>
    </section>
  );
}

function Requests({
  t,
  user,
  workspace,
  selected,
  editing,
  setEditing,
  onSelect,
  onMessage,
  onReload,
}: {
  t: (key: TextKey | ExtraKey) => string;
  user: User;
  workspace: Workspace;
  selected: string | null;
  editing: boolean;
  setEditing: (value: boolean) => void;
  onSelect: (id: string | null) => void;
  onMessage: (value: string) => void;
  onReload: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const filtered = workspace.requests.filter((item) => {
    const haystack =
      `${item.subject} ${item.className} ${item.originalTeacherName} ${item.recipientName}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (status && item.status !== status) return false;
    if (date && item.originalDate !== date && item.targetDate !== date)
      return false;
    return true;
  });
  const current =
    workspace.requests.find((item) => item.id === selected) ?? null;
  return (
    <section className="stack">
      <div className="filters">
        <label>
          {t("search")}
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          {t("status")}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">{t("allStates")}</option>
            {[
              "Draft",
              "Pending",
              "Confirmed",
              "Declined",
              "Completed",
              "Cancelled",
            ].map((item) => (
              <option key={item} value={item}>
                {t(item as TextKey)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("date")}
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        {user.role === "teacher" ? (
          <button
            className="btn"
            type="button"
            onClick={() => {
              onSelect(null);
              setEditing(true);
            }}
          >
            {t("newRequest")}
          </button>
        ) : null}
      </div>
      {editing ? (
        <Editor
          t={t}
          user={user}
          workspace={workspace}
          existing={current}
          onClose={() => setEditing(false)}
          onMessage={onMessage}
          onReload={onReload}
        />
      ) : null}
      {!filtered.length && !editing ? (
        <p className="card">{t("noFilteredRequests")}</p>
      ) : null}
      {filtered.map((item) => (
        <article className="card stack" key={item.id}>
          <div className="row">
            <strong>
              {item.subject} · {item.className}
            </strong>
            <span className={`badge ${item.status}`}>
              {t(item.status as TextKey)}
            </span>
          </div>
          <p>
            {item.originalTeacherName} → {item.recipientName}
            <br />
            {item.originalDate} {t("period")} {item.originalPeriod} →{" "}
            {item.targetDate} {t("period")} {item.targetPeriod} ·{" "}
            {item.targetRoom}
          </p>
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              onSelect(item.id);
              setEditing(false);
            }}
          >
            {t("openHandover")}
          </button>
        </article>
      ))}
      {current && !editing ? (
        <Detail
          t={t}
          user={user}
          request={current}
          onEdit={() => setEditing(true)}
          onMessage={onMessage}
          onReload={onReload}
        />
      ) : null}
    </section>
  );
}

function Editor({
  t,
  user,
  workspace,
  existing,
  onClose,
  onMessage,
  onReload,
}: {
  t: (key: TextKey | ExtraKey) => string;
  user: User;
  workspace: Workspace;
  existing: ChangeRequest | null;
  onClose: () => void;
  onMessage: (value: string) => void;
  onReload: () => Promise<void>;
}) {
  const choices = workspace.lessons.filter(
    (lesson) => lesson.teacherId === user.id || lesson.originalDate,
  );
  const mine = workspace.lessons.filter(
    (lesson) => !lesson.changed && lesson.teacherId === user.id,
  );
  const [lessonId, setLessonId] = useState(
    existing?.lessonId || mine[0]?.id || "",
  );
  const lesson = workspace.lessons.find((item) => item.id === lessonId);
  const [kind, setKind] = useState<"move" | "substitute">(
    existing?.kind || "substitute",
  );
  const [targetDate, setTargetDate] = useState(
    existing?.targetDate || lesson?.date || "",
  );
  const [targetPeriod, setTargetPeriod] = useState(
    existing?.targetPeriod || lesson?.period || 1,
  );
  const [targetRoom, setTargetRoom] = useState(
    existing?.targetRoom || lesson?.room || "",
  );
  const [recipientId, setRecipientId] = useState(existing?.recipientId || "");
  const [reasonCategory, setReasonCategory] = useState(
    existing?.reasonCategory || "leave",
  );
  const [reason, setReason] = useState(existing?.reason || "");
  const [handover, setHandover] = useState<Handover>(
    existing?.handover || emptyHandover(),
  );
  const [report, setReport] = useState<ConflictResult | null>(null);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState<string[]>([]);

  function input(): RequestInput {
    return {
      lessonId,
      kind,
      targetDate,
      targetPeriod: Number(targetPeriod),
      targetRoom,
      recipientId: kind === "move" ? user.id : recipientId,
      reasonCategory,
      reason,
      handover,
    };
  }
  async function check() {
    setReport(await api<ConflictResult>("/api/conflicts", input()));
  }
  async function save(submit: boolean) {
    setError("");
    try {
      const payload = input();
      const saved = existing
        ? await api<{ request: ChangeRequest }>(
            `/api/requests/${existing.id}`,
            payload,
            "PATCH",
          )
        : await api<{ request: ChangeRequest }>("/api/requests", payload);
      if (submit) await api(`/api/requests/${saved.request.id}/submit`, {});
      onMessage(submit ? t("sent") : t("savedDraft"));
      onClose();
      await onReload();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setMissing(caught.fields);
        setError(errorText("en", caught.code));
      } else setError(t("networkError"));
    }
  }
  function template() {
    const subject = lesson?.subject || "Lesson";
    setHandover({
      ...handover,
      progress: `${subject}, current section`,
      plan: `Open with a review, teach the next example, then check understanding.`,
      materials: [
        { title: `${subject} worksheet`, url: "https://example.org/worksheet" },
      ],
      assessment: "Finish the class exercise before the next lesson.",
      equipment: "Board and projector",
      studentReminder: "Bring the usual subject materials.",
      teacherNotes: "Watch for students who need the example repeated.",
    });
  }
  return (
    <form
      className="card stack"
      onSubmit={(event) => {
        event.preventDefault();
        void save(false);
      }}
    >
      <h2>{t("newRequest")}</h2>
      {error ? (
        <p className="notice error" role="alert">
          {error}
          {missing.length ? ` ${missing.join(", ")}` : ""}
        </p>
      ) : null}
      <label>
        {t("selectLesson")}
        <select
          value={lessonId}
          onChange={(event) => setLessonId(event.target.value)}
        >
          {(mine.length ? mine : choices).map((item) => (
            <option key={item.id} value={item.id}>
              {item.date} · {item.subject} · {t("period")} {item.period}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("stepOne")}
        <select
          value={kind}
          onChange={(event) =>
            setKind(event.target.value as "move" | "substitute")
          }
        >
          <option value="substitute">{t("substitute")}</option>
          <option value="move">{t("move")}</option>
        </select>
      </label>
      <div className="row">
        <label>
          {t("date")}
          <input
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            required
          />
        </label>
        <label>
          {t("period")}
          <input
            type="number"
            min={1}
            max={6}
            value={targetPeriod}
            onChange={(event) => setTargetPeriod(Number(event.target.value))}
            required
          />
        </label>
        <label>
          {t("room")}
          <input
            value={targetRoom}
            onChange={(event) => setTargetRoom(event.target.value)}
            required
          />
        </label>
      </div>
      {kind === "substitute" ? (
        <label>
          {t("recipient")}
          <select
            value={recipientId}
            onChange={(event) => setRecipientId(event.target.value)}
            required
          >
            <option value="">{t("choose")}</option>
            {workspace.teachers
              .filter((teacher) => teacher.id !== user.id)
              .map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} · {teacher.subjects.join(", ")}
                </option>
              ))}
          </select>
        </label>
      ) : null}
      <label>
        {t("reasonCategory")}
        <select
          value={reasonCategory}
          onChange={(event) => setReasonCategory(event.target.value)}
        >
          {["meeting", "leave", "training", "medical", "other"].map((item) => (
            <option key={item} value={item}>
              {t(item as TextKey | ExtraKey)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("reason")}
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
        />
      </label>
      <button className="btn ghost" type="button" onClick={template}>
        {t("useTemplate")}
      </button>
      {(
        [
          "progress",
          "plan",
          "assessment",
          "equipment",
          "studentReminder",
          "teacherNotes",
        ] as const
      ).map((key) => (
        <label key={key}>
          {t(key)}
          <textarea
            value={handover[key] || ""}
            onChange={(event) =>
              setHandover({ ...handover, [key]: event.target.value })
            }
          />
        </label>
      ))}
      <fieldset className="stack">
        <legend>{t("materials")}</legend>
        {handover.materials.map((material, index) => (
          <div className="row" key={index}>
            <label className="grow">
              {t("materialTitle")}
              <input
                value={material.title}
                onChange={(event) =>
                  setHandover({
                    ...handover,
                    materials: handover.materials.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, title: event.target.value }
                        : item,
                    ),
                  })
                }
              />
            </label>
            <label className="grow">
              {t("materialUrl")}
              <input
                value={material.url}
                onChange={(event) =>
                  setHandover({
                    ...handover,
                    materials: handover.materials.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, url: event.target.value }
                        : item,
                    ),
                  })
                }
              />
            </label>
          </div>
        ))}
        <button
          className="btn ghost"
          type="button"
          onClick={() =>
            setHandover({
              ...handover,
              materials: [...handover.materials, { title: "", url: "" }],
            })
          }
        >
          {t("addMaterial")}
        </button>
      </fieldset>
      <button className="btn ghost" type="button" onClick={() => void check()}>
        {t("checking")}
      </button>
      {report ? (
        <div className="notice">
          {report.conflicts.length ? (
            report.conflicts.map((item) => (
              <p key={`${item.kind}${item.date}${item.period}`}>
                {item.kind === "class"
                  ? t("conflictClass")
                  : t("conflictTeacher")}{" "}
                {item.name} · {item.subject} · {item.date} {t("period")}{" "}
                {item.period}
              </p>
            ))
          ) : (
            <p>{t("noConflicts")}</p>
          )}
          {report.availableSlots.length ? (
            <p>
              {t("availableSlots")}:{" "}
              {report.availableSlots
                .map((slot) => `${slot.date} P${slot.period}`)
                .join(", ")}
            </p>
          ) : null}
          {report.candidates.length ? (
            <p>
              {t("availableTeachers")}:{" "}
              {report.candidates.map((teacher) => teacher.name).join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="row">
        <button className="btn ghost" type="submit">
          {t("saveDraft")}
        </button>
        <button className="btn" type="button" onClick={() => void save(true)}>
          {t("sendRequest")}
        </button>
        <button className="btn ghost" type="button" onClick={onClose}>
          {t("close")}
        </button>
      </div>
    </form>
  );
}

function Detail({
  t,
  user,
  request,
  onEdit,
  onMessage,
  onReload,
}: {
  t: (key: TextKey | ExtraKey) => string;
  user: User;
  request: ChangeRequest;
  onEdit: () => void;
  onMessage: (value: string) => void;
  onReload: () => Promise<void>;
}) {
  const [comment, setComment] = useState("");
  const [supplement, setSupplement] = useState("");
  const [error, setError] = useState("");
  async function act(path: string, body: unknown, method = "POST") {
    setError("");
    try {
      await api(path, body, method);
      onMessage(t("changesSaved"));
      await onReload();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? errorText("en", caught.code)
          : t("networkError"),
      );
    }
  }
  const canEdit =
    user.id === request.originalTeacherId &&
    (request.status === "Draft" || request.status === "Declined");
  const canRespond =
    user.id === request.recipientId && request.status === "Pending";
  return (
    <article className="card stack" id="handover-detail">
      <div className="row">
        <h2>{request.subject}</h2>
        <span className={`badge ${request.status}`}>
          {t(request.status as TextKey)}
        </span>
      </div>
      {error ? (
        <p className="notice error" role="alert">
          {error}
        </p>
      ) : null}
      <p>
        {t("source")}: {request.originalTeacherName}, {request.originalDate},{" "}
        {t("period")} {request.originalPeriod}, {request.originalRoom}
      </p>
      <p>
        {t("target")}: {request.recipientName}, {request.targetDate},{" "}
        {t("period")} {request.targetPeriod}, {request.targetRoom}
      </p>
      <p>
        {t("reason")}: {request.reason}
      </p>
      <h3>{t("handover")}</h3>
      <p>
        {t("progress")}: {request.handover.progress || "—"}
      </p>
      <p>
        {t("plan")}: {request.handover.plan || "—"}
      </p>
      <ul>
        {request.handover.materials
          .filter((item) => item.url)
          .map((item) => (
            <li key={item.url}>
              <a href={item.url} rel="noreferrer">
                {item.title || item.url}
              </a>
            </li>
          ))}
      </ul>
      <p>
        {t("assessment")}: {request.handover.assessment || "—"}
      </p>
      <p>
        {t("equipment")}: {request.handover.equipment || "—"}
      </p>
      <p>
        {t("studentReminder")}: {request.handover.studentReminder || "—"}
      </p>
      {user.role !== "student" && request.handover.teacherNotes ? (
        <p>
          {t("teacherNotes")}: {request.handover.teacherNotes}
        </p>
      ) : null}
      {user.role === "student" &&
      (request.status === "Confirmed" || request.status === "Completed") ? (
        <fieldset className="stack">
          <legend>{t("preparation")}</legend>
          <p>{t("prepHint")}</p>
          {(
            [
              ["materials", "materialsTodo"],
              ["assessment", "assessmentTodo"],
              ["reminder", "reminderTodo"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              <span>
                <input
                  type="checkbox"
                  checked={Boolean(request.todo[key])}
                  onChange={(event) =>
                    void act(`/api/requests/${request.id}/todo`, {
                      key,
                      done: event.target.checked,
                    })
                  }
                />{" "}
                {t(label)}
              </span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {user.role !== "student" ? (
        <p>
          {t("receipts")}: {request.viewedCount} {t("viewed")} ·{" "}
          {request.preparedCount} {t("prepared")}
        </p>
      ) : null}
      {request.supplements.length ? (
        <section>
          <h3>{t("supplements")}</h3>
          {request.supplements.map((item) => (
            <p key={item.id}>
              {item.authorName} · {item.at}
              <br />
              {item.text}
            </p>
          ))}
        </section>
      ) : null}
      <section>
        <h3>{t("timeline")}</h3>
        {request.timeline.map((item) => (
          <p key={item.id}>
            {item.at} · {item.actorName} · {item.action} {item.comment}
          </p>
        ))}
      </section>
      {canEdit ? (
        <button className="btn" type="button" onClick={onEdit}>
          {t("edit")}
        </button>
      ) : null}
      {canRespond ? (
        <div className="stack">
          <label>
            {t("comment")}
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </label>
          <div className="row">
            <button
              className="btn"
              type="button"
              onClick={() =>
                void act(`/api/requests/${request.id}/respond`, {
                  decision: "accept",
                  comment,
                })
              }
            >
              {t("accept")}
            </button>
            <button
              className="btn warn"
              type="button"
              onClick={() =>
                void act(`/api/requests/${request.id}/respond`, {
                  decision: "decline",
                  comment,
                })
              }
            >
              {t("decline")}
            </button>
          </div>
        </div>
      ) : null}
      {user.role === "teacher" &&
      (user.id === request.originalTeacherId ||
        user.id === request.recipientId) &&
      ["Pending", "Confirmed", "Declined", "Completed"].includes(
        request.status,
      ) ? (
        <div className="stack">
          <label>
            {t("addSupplement")}
            <textarea
              value={supplement}
              onChange={(event) => setSupplement(event.target.value)}
            />
          </label>
          <button
            className="btn ghost"
            type="button"
            onClick={() =>
              void act(`/api/requests/${request.id}/supplements`, {
                text: supplement,
              })
            }
          >
            {t("submit")}
          </button>
        </div>
      ) : null}
      {request.status === "Confirmed" &&
      (user.id === request.originalTeacherId ||
        user.id === request.recipientId) ? (
        <button
          className="btn"
          type="button"
          onClick={() =>
            void act(`/api/requests/${request.id}/status`, {
              status: "Completed",
              comment,
            })
          }
        >
          {t("complete")}
        </button>
      ) : null}
      {(user.id === request.originalTeacherId || user.role === "admin") &&
      ["Draft", "Pending", "Confirmed", "Declined"].includes(request.status) ? (
        <button
          className="btn warn"
          type="button"
          onClick={() => {
            if (window.confirm(t("cancelConfirm")))
              void act(`/api/requests/${request.id}/status`, {
                status: "Cancelled",
                comment: "Cancelled",
              });
          }}
        >
          {t("cancelRequest")}
        </button>
      ) : null}
      <button
        className="btn ghost no-print"
        type="button"
        onClick={() => window.print()}
      >
        {t("print")}
      </button>
    </article>
  );
}

function Notifications({
  t,
  workspace,
  onOpen,
  onReload,
  onMessage,
}: {
  t: (key: TextKey | ExtraKey) => string;
  workspace: Workspace;
  onOpen: (id: string) => void;
  onReload: () => Promise<void>;
  onMessage: (value: string) => void;
}) {
  if (!workspace.notifications.length)
    return (
      <p className="card">
        {t("noNotifications")}. {t("noNotificationsHint")}
      </p>
    );
  return (
    <section className="stack">
      <button
        className="btn ghost"
        type="button"
        onClick={async () => {
          await api("/api/notifications/read", {});
          onMessage(t("read"));
          await onReload();
        }}
      >
        {t("markAllRead")}
      </button>
      {workspace.notifications.map((item) => (
        <button
          className="lesson"
          type="button"
          key={item.id}
          onClick={async () => {
            await api("/api/notifications/read", { id: item.id });
            onOpen(item.requestId);
            await onReload();
          }}
        >
          <strong>{item.title}</strong>
          <br />
          {item.createdAt} {item.read ? `· ${t("read")}` : ""}
        </button>
      ))}
    </section>
  );
}

function Profile({
  t,
  user,
  classes,
  prefs,
  onMessage,
  onReload,
}: {
  t: (key: TextKey | ExtraKey) => string;
  user: User;
  classes: SchoolClass[];
  prefs: ReturnType<typeof usePrefs>;
  onMessage: (value: string) => void;
  onReload: () => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [classId, setClassId] = useState(user.classId ?? "");
  const [subjects, setSubjects] = useState(user.subjects.join(", "));
  const [confirm, setConfirm] = useState("");
  return (
    <section className="card stack">
      <h2>{t("account")}</h2>
      <p>
        {user.email} · {t(user.role)}
      </p>
      <label>
        {t("name")}
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      {user.role === "student" ? (
        <label>
          {t("class")}
          <select
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
          >
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {user.role === "teacher" ? (
        <label>
          {t("subjects")}
          <input
            value={subjects}
            onChange={(event) => setSubjects(event.target.value)}
          />
        </label>
      ) : null}
      <button
        className="btn"
        type="button"
        onClick={async () => {
          await api(
            "/api/profile",
            {
              name,
              classId: user.role === "student" ? classId : undefined,
              subjects:
                user.role === "teacher"
                  ? subjects
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  : undefined,
            },
            "PATCH",
          );
          onMessage(t("saved"));
          await onReload();
        }}
      >
        {t("saveProfile")}
      </button>
      <h3>{t("accessibility")}</h3>
      <label>
        <span>
          <input
            type="checkbox"
            checked={prefs.large}
            onChange={(event) => prefs.setLarge(event.target.checked)}
          />{" "}
          {t("largeText")}
        </span>
      </label>
      <label>
        <span>
          <input
            type="checkbox"
            checked={prefs.contrast}
            onChange={(event) => prefs.setContrast(event.target.checked)}
          />{" "}
          {t("highContrast")}
        </span>
      </label>
      <label>
        <span>
          <input
            type="checkbox"
            checked={prefs.theme === "dark"}
            onChange={(event) =>
              prefs.setTheme(event.target.checked ? "dark" : "light")
            }
          />{" "}
          {t("darkMode")}
        </span>
      </label>
      {user.role === "student" ? (
        <label>
          <span>
            <input
              type="checkbox"
              checked={prefs.simple}
              onChange={(event) => prefs.setSimple(event.target.checked)}
            />{" "}
            {t("simpleStudent")}
          </span>
        </label>
      ) : null}
      {user.role === "admin" ? (
        <div className="stack">
          <h3>{t("resetDemo")}</h3>
          <p>{t("resetHint")}</p>
          <label>
            {t("resetConfirm")}
            <input
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </label>
          <button
            className="btn warn"
            type="button"
            disabled={confirm !== "RESET DEMO"}
            onClick={async () => {
              await api("/api/admin/reset", { confirm: "RESET DEMO" });
              onMessage(t("resetSuccess"));
              setConfirm("");
              await onReload();
            }}
          >
            {t("resetConfirm")}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function Users({
  t,
  onMessage,
}: {
  t: (key: TextKey | ExtraKey) => string;
  onMessage: (value: string) => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    void api<{ users: User[] }>("/api/admin/users").then((data) =>
      setUsers(data.users),
    );
  }, []);
  const shown = users
    .filter((item) =>
      `${item.name} ${item.email} ${item.role}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 80);
  return (
    <section className="stack">
      <h2>{t("schoolPeople")}</h2>
      <label>
        {t("search")}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("role")}</th>
              <th>{t("status")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.name}
                  <br />
                  {item.email}
                </td>
                <td>{t(item.role)}</td>
                <td>{item.active ? t("active") : t("inactive")}</td>
                <td>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={async () => {
                      await api(
                        `/api/admin/users/${item.id}`,
                        { active: !item.active },
                        "PATCH",
                      );
                      onMessage(t("changesSaved"));
                      const data = await api<{ users: User[] }>(
                        "/api/admin/users",
                      );
                      setUsers(data.users);
                    }}
                  >
                    {item.active ? t("disable") : t("enable")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Audit({ t }: { t: (key: TextKey | ExtraKey) => string }) {
  const [events, setEvents] = useState<
    Array<{
      id: string;
      actorName: string;
      action: string;
      entityId: string;
      at: string;
      detail: string;
    }>
  >([]);
  useEffect(() => {
    void api<{ events: typeof events }>("/api/admin/audit").then((data) =>
      setEvents(data.events),
    );
  }, []);
  return (
    <section className="card stack">
      <h2>{t("audit")}</h2>
      {events.length === 0 ? (
        <p>{t("noActivity")}</p>
      ) : (
        events.map((event) => (
          <p key={event.id}>
            {event.at} · {event.actorName} · {event.action}
            <br />
            {event.detail}
          </p>
        ))
      )}
    </section>
  );
}

function Impact({
  t,
  week,
}: {
  t: (key: TextKey | ExtraKey) => string;
  week: string;
}) {
  const [data, setData] = useState<{
    byClass: { name: string; count: number }[];
    bySubject: { name: string; count: number }[];
    learningMinutesProtected: number;
    coverageRate: number;
  } | null>(null);
  useEffect(() => {
    void api<NonNullable<typeof data>>(`/api/admin/impact?week=${week}`).then(
      setData,
    );
  }, [week]);
  if (!data) return <p>{t("loadingData")}</p>;
  return (
    <section className="stack">
      <h2>{t("impact")}</h2>
      <p>{t("impactHint")}</p>
      <div className="stats">
        <article className="card">
          <span>{t("protected")}</span>
          <strong>{data.learningMinutesProtected}</strong>
        </article>
        <article className="card">
          <span>{t("coverage")}</span>
          <strong>{Math.round(data.coverageRate * 100)}%</strong>
        </article>
      </div>
      <section className="card">
        <h3>{t("byClass")}</h3>
        {data.byClass.map((item) => (
          <p key={item.name}>
            {item.name}: {item.count}
          </p>
        ))}
        {data.byClass.length === 0 ? <p>{t("noActivity")}</p> : null}
      </section>
      <section className="card">
        <h3>{t("bySubject")}</h3>
        {data.bySubject.map((item) => (
          <p key={item.name}>
            {item.name}: {item.count}
          </p>
        ))}
      </section>
    </section>
  );
}
