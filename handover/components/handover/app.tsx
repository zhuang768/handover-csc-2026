"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ArrowRightLeft,
  Ban,
  Check,
  CircleCheck,
  Clock,
  Pencil,
  RotateCcw,
} from "lucide-react";
import {
  ApiError,
  api,
  getPendingWriteCount,
  subscribePendingWrites,
} from "@/lib/client-api";
import { errorText, translate, type ExtraKey, type TextKey } from "@/lib/i18n";
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
import {
  addDays,
  defaultSchoolMonday,
  mondayOnOrBefore,
  schoolToday,
} from "@/shared/time";
import "./handover.css";
import { InstallGuide } from "./install-guide";

function localWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Taipei",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isUnauthorized(caught: unknown) {
  return caught instanceof ApiError && caught.status === 401;
}

function auditDetail(detail: string, t: (key: TextKey | ExtraKey) => string) {
  if (detail === "Demo data rebuilt") return t("detailDemoReset");
  if (detail === "supplement") return t("actionSupplement");
  if (detail === "password rotated") return t("detailPassword");
  if (detail === "student" || detail === "teacher" || detail === "admin")
    return t(detail as TextKey);
  return detail;
}

function actionLabel(action: string, t: (key: TextKey | ExtraKey) => string) {
  const bare = action.replace(/^request\./, "");
  const map: Record<string, ExtraKey> = {
    created: "actionCreated",
    updated: "actionUpdated",
    submitted: "actionSubmitted",
    confirmed: "actionConfirmed",
    declined: "actionDeclined",
    completed: "actionCompleted",
    cancelled: "actionCancelled",
    supplement: "actionSupplement",
    "demo.reset": "actionReset",
    "user.updated": "actionUserUpdated",
    "account.registered": "actionRegistered",
    "account.reset": "actionPasswordReset",
  };
  const key = map[bare];
  return key ? t(key) : action;
}

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
  language: "en";
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
  try {
    const stored = localStorage.getItem("handover-prefs");
    if (!stored) return;
    prefsState = {
      ...defaultPrefs,
      ...(JSON.parse(stored) as Partial<Prefs>),
      language: "en",
    };
  } catch {
    prefsState = defaultPrefs;
    return;
  }
  persistPrefs();
}
function persistPrefs() {
  try {
    localStorage.setItem("handover-prefs", JSON.stringify(prefsState));
  } catch {
    // Display preferences still work when browser storage is unavailable.
  }
}
let prefsLoaded = false;
function ensurePrefs() {
  if (prefsLoaded || typeof window === "undefined") return;
  prefsLoaded = true;
  readPrefs();
  document.documentElement.lang = "en";
}
function updatePrefs(patch: Partial<Prefs>) {
  ensurePrefs();
  prefsState = { ...prefsState, ...patch, language: "en" };
  persistPrefs();
  document.documentElement.lang = "en";
  emitPrefs();
}
async function downloadCalendar(week: string) {
  const response = await fetch(
    `/api/calendar?week=${encodeURIComponent(week)}`,
    { credentials: "same-origin" },
  );
  if (!response.ok) throw new Error("calendar");
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
    setTheme: (theme: string) => updatePrefs({ theme }),
    setLarge: (large: boolean) => updatePrefs({ large }),
    setContrast: (contrast: boolean) => updatePrefs({ contrast }),
    setSimple: (simple: boolean) => updatePrefs({ simple }),
  };
}

export default function HandoverApp() {
  const prefs = usePrefs();
  const pendingWrites = useSyncExternalStore(
    subscribePendingWrites,
    getPendingWriteCount,
    () => 0,
  );
  const t = (key: TextKey | ExtraKey) => translate(key);
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [view, setView] = useState<View>("overview");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const loadGeneration = useRef(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [week, setWeek] = useState(defaultSchoolMonday());
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<ChangeRequest | null>(null);
  const [seedLesson, setSeedLesson] = useState("");
  const [editing, setEditing] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [sessionProblem, setSessionProblem] = useState("");
  const [sessionAttempt, setSessionAttempt] = useState(0);

  const signOut = useCallback(() => {
    setUser(null);
    setWorkspace(null);
    setEditing(false);
    setDrafting(false);
    setMoreOpen(false);
    setSelected(null);
    setFocus(null);
  }, []);

  async function openRequest(id: string, keepError = false) {
    if (!keepError) setError("");
    try {
      const data = await api<{ request: ChangeRequest }>(
        `/api/requests/${id}`,
        undefined,
        "GET",
      );
      setFocus(data.request);
      setSelected(id);
      setEditing(false);
      setView("requests");
      const targetWeek = mondayOnOrBefore(data.request.targetDate);
      if (targetWeek !== week) {
        setWeek(targetWeek);
        await load(targetWeek, classId, teacherId, keepError);
      }
    } catch (caught) {
      setFocus(null);
      setSelected(null);
      setView("requests");
      if (isUnauthorized(caught)) signOut();
      setError(
        caught instanceof ApiError
          ? caught.status === 404
            ? translate("unavailableHandover")
            : errorText(caught.code)
          : t("networkError"),
      );
    }
  }

  async function load(
    nextWeek = week,
    nextClass = classId,
    nextTeacher = teacherId,
    keepError = false,
  ) {
    const generation = loadGeneration.current + 1;
    loadGeneration.current = generation;
    setLoading(true);
    if (!keepError) setError("");
    try {
      const params = new URLSearchParams({ week: nextWeek });
      if (nextClass) params.set("classId", nextClass);
      if (nextTeacher) params.set("teacherId", nextTeacher);
      const data = await api<Workspace>(`/api/workspace?${params.toString()}`);
      if (generation !== loadGeneration.current) return;
      setWorkspace(data);
      setUser(data.user);
    } catch (caught) {
      if (generation !== loadGeneration.current) return;
      if (caught instanceof ApiError && caught.status === 401) {
        setUser(null);
        setWorkspace(null);
        setError(errorText(caught.code));
        return;
      }
      setError(
        caught instanceof ApiError ? errorText(caught.code) : t("networkError"),
      );
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  }

  useEffect(() => {
    let live = true;
    api<{ user: User }>("/api/auth/me")
      .then((data) => {
        if (!live) return;
        setSessionProblem("");
        setUser(data.user);
        return load();
      })
      .catch((caught: unknown) => {
        if (!live) return;
        setLoading(false);
        if (isUnauthorized(caught)) {
          setSessionProblem("");
          return;
        }
        setSessionProblem(
          caught instanceof ApiError
            ? errorText(caught.code)
            : translate("sessionOffline"),
        );
      });
    return () => {
      live = false;
    };
    // Session check runs once and again only from the explicit retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionAttempt]);

  async function refresh() {
    await load();
  }

  if (loading && !workspace && !error)
    return (
      <main className="handover-root">
        <p className="main">{t("loading")}</p>
      </main>
    );
  if (!user) {
    return (
      <AuthScreen
        t={t}

        notice={error}
        sessionProblem={sessionProblem}
        onRetrySession={() => setSessionAttempt((value) => value + 1)}
        onUser={(next) => {
          setUser(next);
          setWeek(defaultSchoolMonday());
          setEditing(false);
          setSelected(null);
          setFocus(null);
          setSeedLesson("");
          setView("overview");
          void load(defaultSchoolMonday());
        }}
      />
    );
  }
  if (!workspace) {
    return (
      <main className="handover-root">
        <section className="main stack">
          <p className="notice error" role="alert">
            {error || t("loadFailed")}
          </p>
          <button className="btn" type="button" onClick={() => void load()}>
            {t("retry")}
          </button>
        </section>
      </main>
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
  if (user.role === "admin")
    nav.push(["users", "users"], ["audit", "audit"], ["impact", "impact"]);

  return (
    <div
      className="handover-root"
      data-theme={prefs.theme}
      data-large={String(prefs.large)}
      data-contrast={String(prefs.contrast)}
      data-simple={String(user.role === "student" && prefs.simple)}
    >
      <a className="skip-link" href="#main">
        {t("mainNav")}
      </a>
      <div className="shell">
        <nav className="sidebar" aria-label={t("mainNav")}>
          <strong>Handover</strong>
          <p>{t("tagline")}</p>
          <div className="desktop-nav">
            {nav.map(([id, key]) => (
              <button
                key={id}
                type="button"
                aria-current={view === id ? "page" : undefined}
                onClick={() => {
                  setView(id);
                  setEditing(false);
                  setMoreOpen(false);
                }}
              >
                {t(key)}
                {id === "notifications" && unread ? ` (${unread})` : ""}
              </button>
            ))}
            <button
              type="button"
              disabled={loggingOut}
              onClick={async () => {
                setLoggingOut(true);
                setError("");
                try {
                  await api("/api/auth/logout", {});
                  setUser(null);
                  setWorkspace(null);
                  setEditing(false);
                  setSelected(null);
                  setFocus(null);
                  setSeedLesson("");
                  setView("overview");
                  setMessage("");
                } catch (caught) {
                  if (caught instanceof ApiError && caught.status === 401) {
                    setUser(null);
                    setWorkspace(null);
                    return;
                  }
                  setError(
                    caught instanceof ApiError
                      ? errorText(caught.code)
                      : t("networkError"),
                  );
                } finally {
                  setLoggingOut(false);
                }
              }}
            >
              {t("logout")}
            </button>
          </div>
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
          <InstallGuide
            t={t}
            editing={editing || drafting}
            pending={pendingWrites > 0}
          />
          {view === "overview" ? (
            <Overview
              t={t}
              user={user}
              workspace={workspace}
              onOpen={(id) => void openRequest(id)}
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
              onOpen={(id) => void openRequest(id)}
              onCreate={(lessonId) => {
                setSeedLesson(lessonId);
                setSelected(null);
                setFocus(null);
                setEditing(true);
                setView("requests");
              }}
              onCalendarError={(text) => setError(text)}
            />
          ) : null}
          {view === "requests" ? (
            <Requests
              t={t}

              user={user}
              workspace={workspace}
              selected={selected}
              focus={focus}
              seedLesson={seedLesson}
              editing={editing}
              setEditing={setEditing}
              onSelect={(id) => {
                setSelected(id);
                if (!id) setFocus(null);
              }}
              onMessage={setMessage}
              onReload={refresh}
              onUnauthorized={signOut}
              onDrafting={setDrafting}
            />
          ) : null}
          {view === "notifications" ? (
            <Notifications
              t={t}

              workspace={workspace}
              onOpen={(id, keepError) => void openRequest(id, keepError)}
              onReload={refresh}
              onMessage={setMessage}
              onError={setError}
              onUnauthorized={signOut}
            />
          ) : null}
          {view === "profile" ? (
            <Profile
              t={t}
              user={user}
              classes={workspace.classes}
              prefs={prefs}
              onMessage={setMessage}
              onUnauthorized={signOut}
              onDrafting={setDrafting}
              onReload={async () => {
                try {
                  const me = await api<{ user: User }>("/api/auth/me");
                  setUser(me.user);
                  await refresh();
                } catch (caught) {
                  if (isUnauthorized(caught)) signOut();
                  else throw caught;
                }
              }}
            />
          ) : null}
          {view === "users" && user.role === "admin" ? (
            <Users
              t={t}

              onMessage={setMessage}
              onUnauthorized={signOut}
            />
          ) : null}
          {view === "audit" && user.role === "admin" ? (
            <Audit t={t} onUnauthorized={signOut} />
          ) : null}
          {view === "impact" && user.role === "admin" ? (
            <Impact t={t} week={week} onUnauthorized={signOut} />
          ) : null}
        </main>
      </div>
      <nav className="bottom-nav" aria-label={t("mainNav")}>
        {nav
          .filter(([id]) => ["overview", "timetable", "requests"].includes(id))
          .map(([id, key]) => (
            <button
              key={id}
              type="button"
              aria-current={view === id ? "page" : undefined}
              onClick={() => {
                setView(id);
                setMoreOpen(false);
              }}
            >
              {t(key)}
            </button>
          ))}
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-current={
            ["notifications", "profile", "users", "audit", "impact"].includes(
              view,
            )
              ? "page"
              : undefined
          }
          onClick={() => setMoreOpen((open) => !open)}
        >
          {t("more")}
          {unread ? ` (${unread})` : ""}
        </button>
      </nav>
      {moreOpen ? (
        <div className="more-sheet" role="dialog" aria-label={t("more")}>
          {nav
            .filter(
              ([id]) => !["overview", "timetable", "requests"].includes(id),
            )
            .map(([id, key]) => (
              <button
                key={id}
                type="button"
                aria-current={view === id ? "page" : undefined}
                onClick={() => {
                  setView(id);
                  setEditing(false);
                  setMoreOpen(false);
                }}
              >
                {t(key)}
                {id === "notifications" && unread ? ` (${unread})` : ""}
              </button>
            ))}
          <button
            type="button"
            disabled={loggingOut}
            onClick={async () => {
              setLoggingOut(true);
              try {
                await api("/api/auth/logout", {});
                signOut();
              } catch (caught) {
                if (isUnauthorized(caught)) signOut();
                else
                  setError(
                    caught instanceof ApiError
                      ? errorText(caught.code)
                      : t("networkError"),
                  );
              } finally {
                setLoggingOut(false);
                setMoreOpen(false);
              }
            }}
          >
            {t("logout")}
          </button>
          <button type="button" onClick={() => setMoreOpen(false)}>
            {t("close")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AuthScreen({
  t,
  onUser,
  notice,
  sessionProblem,
  onRetrySession,
}: {
  t: (key: TextKey | ExtraKey) => string;
  onUser: (user: User) => void;
  notice?: string;
  sessionProblem?: string;
  onRetrySession?: () => void;
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
        caught instanceof ApiError ? errorText(caught.code) : t("networkError"),
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
        caught instanceof ApiError ? errorText(caught.code) : t("networkError"),
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
            <svg className="auth-mark" viewBox="0 0 280 120" aria-hidden="true">
              <rect
                x="8"
                y="16"
                width="36"
                height="72"
                fill="none"
                stroke="currentColor"
              />
              <rect
                x="52"
                y="16"
                width="36"
                height="72"
                fill="none"
                stroke="currentColor"
              />
              <rect
                x="96"
                y="16"
                width="36"
                height="72"
                fill="none"
                stroke="currentColor"
              />
              <rect
                x="16"
                y="28"
                width="20"
                height="14"
                fill="currentColor"
                opacity="0.25"
              />
              <rect x="60" y="48" width="20" height="14" fill="currentColor" />
              <path d="M150 52 H210" stroke="currentColor" strokeWidth="2" />
              <path
                d="M202 44 L214 52 L202 60"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <rect
                x="224"
                y="28"
                width="48"
                height="48"
                fill="none"
                stroke="currentColor"
              />
              <path d="M236 52 H260 M248 40 V64" stroke="currentColor" />
            </svg>
          </div>
          <p>{t("demoHint")}</p>
        </section>
        <section className="auth-panel">
          <div className="auth-card stack">
            <h2>
              {mode === "login"
                ? t("welcome")
                : mode === "register"
                  ? t("register")
                  : t("resetPassword")}
            </h2>
            <p>{mode === "recover" ? t("recoveryIntro") : t("loginHint")}</p>
            {sessionProblem ? (
              <p className="notice error" role="alert">
                {sessionProblem}{" "}
                <button className="btn" type="button" onClick={onRetrySession}>
                  {t("retry")}
                </button>
              </p>
            ) : null}
            {notice ? (
              <p className="notice error" role="alert">
                {notice}
              </p>
            ) : null}
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
                disabled={busy}
                onClick={() => void demo("student")}
              >
                {t("demoStudent")}
              </button>
              <button
                className="btn secondary"
                type="button"
                disabled={busy}
                onClick={() => void demo("teacher", 0)}
              >
                {t("demoTeacher")}
              </button>
              <button
                className="btn secondary"
                type="button"
                disabled={busy}
                onClick={() => void demo("teacher", 1)}
              >
                {t("demoRecipient")}
              </button>
              <button
                className="btn secondary"
                type="button"
                disabled={busy}
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
  const nextLesson = [...workspace.lessons]
    .filter((lesson) => lesson.date >= today)
    .sort((a, b) =>
      a.date === b.date ? a.period - b.period : a.date.localeCompare(b.date),
    )[0];
  const lessonHandover = nextLesson
    ? workspace.requests.find(
        (item) =>
          item.lessonId === nextLesson.id &&
          (item.status === "Confirmed" || item.status === "Completed"),
      )
    : undefined;
  const next =
    user.role === "student" ? lessonHandover : (incoming[0] ?? drafts[0]);
  const otherChanges =
    user.role === "student"
      ? workspace.requests.filter(
          (item) =>
            item.status === "Confirmed" && item.id !== lessonHandover?.id,
        )
      : [];
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
      {user.role === "student" ? (
        <article className="card stack next-lesson">
          <h2>{nextLesson?.date === today ? t("today") : t("thisWeek")}</h2>
          {nextLesson ? (
            <LessonButton
              lesson={nextLesson}
              user={user}
              t={t}
              onOpen={onOpen}
            />
          ) : (
            <p>
              {t("noLessons")}. {t("noLessonsHint")}
            </p>
          )}
          {lessonHandover ? (
            <p>
              {lessonHandover.targetDate} · {t("period")}{" "}
              {lessonHandover.targetPeriod}
              <br />
              {lessonHandover.originalTeacherName} →{" "}
              {lessonHandover.recipientName} · {lessonHandover.targetRoom}
              <br />
              {lessonHandover.handover.studentReminder || "—"}
            </p>
          ) : null}
        </article>
      ) : null}
      {otherChanges.length ? (
        <section className="card stack">
          <h2>{t("weeklyChanges")}</h2>
          {otherChanges.map((item) => (
            <button
              className="btn ghost"
              type="button"
              key={item.id}
              onClick={() => onOpen(item.id)}
            >
              {item.targetDate} · {t("period")} {item.targetPeriod} ·{" "}
              {item.subject}
            </button>
          ))}
        </section>
      ) : null}
      <div className="ledger">
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
        {user.role === "admin" ? (
          <article className="card">
            <span>{t("weeklyChanges")}</span>
            <strong>{workspace.stats.weekly}</strong>
            <p>{workspace.week}</p>
          </article>
        ) : null}
      </div>
      {user.role === "teacher" && incoming.length ? (
        <section className="card stack">
          <h2>{t("awaitingMe")}</h2>
          {incoming.map((item) => (
            <button
              className="btn ghost"
              type="button"
              key={item.id}
              onClick={() => onOpen(item.id)}
            >
              {item.className} · {item.subject} · {item.targetDate}{" "}
              {t("period")} {item.targetPeriod}
            </button>
          ))}
        </section>
      ) : null}
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
              user={user}
              t={t}
              onOpen={onOpen}
            />
          ))
        )}
      </section>
      {user.role === "student" ? (
        <section className="card stack">
          <h2>{t("thisWeek")}</h2>
          {workspace.requests.length === 0 ? (
            <p>{t("noFilteredRequests")}</p>
          ) : (
            workspace.requests.map((item) => (
              <button
                className="btn ghost"
                type="button"
                key={item.id}
                onClick={() => onOpen(item.id)}
              >
                {item.subject}: {item.handover.studentReminder || "—"} ·{" "}
                {
                  item.handover.materials.filter((material) => material.title)
                    .length
                }{" "}
                {t("materials")} · {t("assessment")}:{" "}
                {item.handover.assessment || "—"}
              </button>
            ))
          )}
        </section>
      ) : null}
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
              {risk.message === "unconfirmed"
                ? t("riskUnconfirmed")
                : risk.message === "returned"
                  ? t("riskReturned")
                  : risk.message}
            </button>
          ))}
        </section>
      ) : null}
    </section>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const Icon =
    status === "Pending" || status === "changed"
      ? Clock
      : status === "Confirmed"
        ? Check
        : status === "Completed"
          ? CircleCheck
          : status === "Declined"
            ? RotateCcw
            : status === "Cancelled"
              ? Ban
              : status === "changed-move"
                ? ArrowRightLeft
                : Pencil;
  return (
    <span className={`badge ${status === "changed-move" ? "changed" : status}`}>
      <Icon aria-hidden="true" size={14} strokeWidth={2} />
      {label}
    </span>
  );
}

function LessonButton({
  lesson,
  t,
  user,
  onOpen,
  onCreate,
}: {
  lesson: Lesson;
  t: (key: TextKey | ExtraKey) => string;
  user: User;
  onOpen: (id: string) => void;
  onCreate?: (lessonId: string) => void;
}) {
  const body = (
    <>
      <strong>{lesson.subject}</strong> · {lesson.className} · {t("period")}{" "}
      {lesson.period} · {lesson.room}
      <br />
      {lesson.teacherName} · {lesson.date}
      {lesson.changed ? (
        <StatusBadge status="changed-move" label={t("changed")} />
      ) : null}
    </>
  );
  if (!lesson.requestId) {
    return (
      <article className="lesson lesson-static">
        {body}
        {onCreate && user.role === "teacher" && lesson.teacherId === user.id ? (
          <button
            className="btn ghost"
            type="button"
            onClick={() => onCreate(lesson.id)}
          >
            {t("createFromLesson")}
          </button>
        ) : null}
      </article>
    );
  }
  return (
    <button
      className={`lesson ${lesson.changed ? "changed" : ""}`}
      type="button"
      onClick={() => onOpen(lesson.requestId!)}
    >
      {body}
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
  onCreate,
  onCalendarError,
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
  onCreate: (lessonId: string) => void;
  onCalendarError: (message: string) => void;
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
  const incoming = workspace.requests.filter(
    (item) => item.status === "Pending" && item.recipientId === user.id,
  );
  return (
    <section className={user.role === "teacher" ? "teacher-board" : "stack"}>
      <div className="stack">
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
            onClick={() =>
              void downloadCalendar(week).catch(() =>
                onCalendarError(t("calendarFailed")),
              )
            }
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
                  user={user}
                  t={t}
                  onOpen={onOpen}
                  onCreate={onCreate}
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
                    user={user}
                    t={t}
                    onOpen={onOpen}
                    onCreate={onCreate}
                  />
                ))}
              {workspace.lessons.every((lesson) => lesson.date !== date) ? (
                <p>{t("free")}</p>
              ) : null}
            </section>
          ))}
        </div>
      </div>
      {user.role === "teacher" ? (
        <aside className="card stack">
          <h2>{t("awaitingMe")}</h2>
          {incoming.length === 0 ? (
            <p>{t("noFilteredRequests")}</p>
          ) : (
            incoming.map((item) => (
              <button
                className="btn ghost"
                type="button"
                key={item.id}
                onClick={() => onOpen(item.id)}
              >
                <StatusBadge
                  status={item.status}
                  label={t(item.status as TextKey)}
                />
                <br />
                {item.className} · {item.subject}
              </button>
            ))
          )}
        </aside>
      ) : null}
    </section>
  );
}

function Requests({
  t,
  user,
  workspace,
  selected,
  focus,
  seedLesson,
  editing,
  setEditing,
  onSelect,
  onMessage,
  onReload,
  onUnauthorized,
  onDrafting,
}: {
  t: (key: TextKey | ExtraKey) => string;
  user: User;
  workspace: Workspace;
  selected: string | null;
  focus: ChangeRequest | null;
  seedLesson: string;
  editing: boolean;
  setEditing: (value: boolean) => void;
  onSelect: (id: string | null) => void;
  onMessage: (value: string) => void;
  onReload: () => Promise<void>;
  onUnauthorized: () => void;
  onDrafting: (value: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const filtered = workspace.requests.filter((item) => {
    const haystack =
      `${item.subject} ${item.className} ${item.originalTeacherName} ${item.recipientName}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (status && item.status !== status) return false;
    if (date && item.originalDate !== date && item.targetDate !== date)
      return false;
    if (classFilter && item.className !== classFilter) return false;
    if (
      teacherFilter &&
      item.originalTeacherName !== teacherFilter &&
      item.recipientName !== teacherFilter
    )
      return false;
    return true;
  });
  const listed =
    workspace.requests.find((item) => item.id === selected) ?? null;
  const current = listed ?? (focus?.id === selected ? focus : null);
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
        {user.role === "admin" ? (
          <>
            <label>
              {t("class")}
              <select
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
              >
                <option value="">{t("allClasses")}</option>
                {workspace.classes.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("teacher")}
              <select
                value={teacherFilter}
                onChange={(event) => setTeacherFilter(event.target.value)}
              >
                <option value="">{t("allTeachers")}</option>
                {workspace.teachers.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
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
          key={`${current?.id ?? "new"}:${seedLesson}`}
          t={t}
          user={user}
          workspace={workspace}
          existing={current}
          seedLesson={seedLesson}
          onClose={() => setEditing(false)}
          onMessage={onMessage}
          onReload={onReload}
          onUnauthorized={onUnauthorized}
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
            <StatusBadge
              status={item.status}
              label={t(item.status as TextKey)}
            />
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
          key={current.id}
          t={t}
          user={user}
          request={current}
          onEdit={() => setEditing(true)}
          onMessage={onMessage}
          onReload={onReload}
          onUnauthorized={onUnauthorized}
          onDrafting={onDrafting}
        />
      ) : null}
    </section>
  );
}

function handoverGaps(value: Handover) {
  const fields: string[] = [];
  if (!value.progress.trim()) fields.push("progress");
  if (!value.plan.trim()) fields.push("plan");
  if (!value.assessment.trim()) fields.push("assessment");
  if (!value.equipment.trim()) fields.push("equipment");
  if (!value.studentReminder.trim()) fields.push("studentReminder");
  if (!value.teacherNotes?.trim()) fields.push("teacherNotes");
  if (
    !value.materials.some(
      (item) =>
        item.title.trim() &&
        (/^https?:\/\/\S+$/i.test(item.url.trim()) ||
          (item.url.trim().startsWith("/") && !item.url.includes(".."))),
    )
  )
    fields.push("materials");
  return fields;
}

function Editor({
  t,
  user,
  workspace,
  existing,
  seedLesson,
  onClose,
  onMessage,
  onReload,
  onUnauthorized,
}: {
  t: (key: TextKey | ExtraKey) => string;
  user: User;
  workspace: Workspace;
  existing: ChangeRequest | null;
  seedLesson: string;
  onClose: () => void;
  onMessage: (value: string) => void;
  onReload: () => Promise<void>;
  onUnauthorized: () => void;
}) {
  const choices = workspace.lessons.filter(
    (lesson) => lesson.teacherId === user.id || lesson.originalDate,
  );
  const mine = workspace.lessons.filter(
    (lesson) => !lesson.changed && lesson.teacherId === user.id,
  );
  const [lessonId, setLessonId] = useState(
    existing?.lessonId || seedLesson || mine[0]?.id || "",
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
  const [checked, setChecked] = useState<{
    key: string;
    report: ConflictResult;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [draftId, setDraftId] = useState(existing?.id ?? "");
  const [error, setError] = useState("");
  const [missing, setMissing] = useState<string[]>([]);
  const checkGeneration = useRef(0);

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
  const gaps = handoverGaps(handover);
  const arrangementReady = Boolean(
    lessonId &&
    targetDate &&
    targetPeriod &&
    targetRoom.trim() &&
    reason.trim() &&
    (kind === "move" || recipientId),
  );
  const scheduleKey = [
    lessonId,
    kind,
    targetDate,
    targetPeriod,
    targetRoom,
    recipientId,
  ].join("|");
  const [failedKey, setFailedKey] = useState("");
  const [retryCheck, setRetryCheck] = useState(0);
  const report = checked?.key === scheduleKey ? checked.report : null;
  const checking = arrangementReady && !report && failedKey !== scheduleKey;
  useEffect(() => {
    if (!arrangementReady) return;
    const generation = checkGeneration.current + 1;
    checkGeneration.current = generation;
    const key = scheduleKey;
    const timer = setTimeout(() => {
      void api<ConflictResult>("/api/conflicts", {
        lessonId,
        kind,
        targetDate,
        targetPeriod: Number(targetPeriod),
        targetRoom,
        recipientId: kind === "move" ? user.id : recipientId,
        reasonCategory,
        reason,
        handover,
      })
        .then((next) => {
          if (checkGeneration.current !== generation) return;
          setFailedKey("");
          setError("");
          setChecked({ key, report: next });
        })
        .catch((caught: unknown) => {
          if (checkGeneration.current !== generation) return;
          setFailedKey(key);
          if (isUnauthorized(caught)) {
            onUnauthorized();
            return;
          }
          if (caught instanceof ApiError && caught.status === 403) {
            setError(translate("permissionError"));
            return;
          }
          setError(
            caught instanceof ApiError
              ? errorText(caught.code)
              : translate("networkError"),
          );
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [
    arrangementReady,
    scheduleKey,
    lessonId,
    kind,
    targetDate,
    targetPeriod,
    targetRoom,
    recipientId,
    reasonCategory,
    reason,
    handover,
    user.id,
    retryCheck,
    onUnauthorized,
  ]);
  async function save(submit: boolean) {
    setError("");
    setBusy(true);
    try {
      const payload = input();
      const idToUse = draftId;
      const saved = idToUse
        ? await api<{ request: ChangeRequest }>(
            `/api/requests/${idToUse}`,
            payload,
            "PATCH",
          )
        : await api<{ request: ChangeRequest }>("/api/requests", payload);
      setDraftId(saved.request.id);
      if (submit) await api(`/api/requests/${saved.request.id}/submit`, {});
      onMessage(submit ? t("sent") : t("savedDraft"));
      onClose();
      await onReload();
    } catch (caught) {
      if (isUnauthorized(caught)) {
        onUnauthorized();
        return;
      }
      if (caught instanceof ApiError) {
        setMissing(caught.fields);
        setError(errorText(caught.code));
      } else setError(t("networkError"));
    } finally {
      setBusy(false);
    }
  }
  function chooseLesson(id: string) {
    setLessonId(id);
    const next = workspace.lessons.find((item) => item.id === id);
    if (next) {
      setTargetDate(next.date);
      setTargetPeriod(next.period);
      setTargetRoom(next.room);
    }
    setChecked(null);
  }
  function template() {
    const subject = lesson?.subject || "Lesson";
    const file = `${window.location.origin}/worksheets/class-practice.txt`;
    setHandover({
      ...handover,
      progress: `${subject}: the class has finished the previous worked example.`,
      plan: `Review the last ${subject} example, teach the next one, then ask students to finish the practice file.`,
      materials: [{ title: `${subject} practice`, url: file }],
      assessment: `Students finish the ${subject} practice before the next lesson.`,
      equipment: "Board and one shared projector",
      studentReminder: `Bring the ${subject} notebook and a pen.`,
      teacherNotes: `Repeat the ${subject} example for anyone who missed the first pass.`,
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
          {missing.length
            ? ` ${missing.map((field) => t(field as TextKey)).join(", ")}`
            : ""}
        </p>
      ) : null}
      {failedKey === scheduleKey ? (
        <button
          className="btn secondary"
          type="button"
          onClick={() => {
            setFailedKey("");
            setRetryCheck((value) => value + 1);
          }}
        >
          {t("retry")}
        </button>
      ) : null}
      <label>
        {t("selectLesson")}
        <select
          value={lessonId}
          onChange={(event) => chooseLesson(event.target.value)}
        >
          {(mine.length ? mine : choices).map((item) => (
            <option key={item.id} value={item.id}>
              {item.className} · {item.date} · {item.subject} · {t("period")}{" "}
              {item.period}
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
      <p>
        {checking
          ? t("checkingSchedule")
          : gaps.length
            ? `${t("sendBlocked")} ${gaps.map((field) => t(field as TextKey)).join(", ")}`
            : report?.conflicts.length
              ? t("conflictError")
              : report
                ? t("noConflicts")
                : t("sendBlocked")}
      </p>
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
        <button className="btn ghost" type="submit" disabled={busy}>
          {t("saveDraft")}
        </button>
        <button
          className="btn"
          type="button"
          disabled={
            busy ||
            checking ||
            !arrangementReady ||
            gaps.length > 0 ||
            !report ||
            report.conflicts.length > 0
          }
          onClick={() => void save(true)}
        >
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
  onUnauthorized,
  onDrafting,
}: {
  t: (key: TextKey | ExtraKey) => string;
  user: User;
  request: ChangeRequest;
  onEdit: () => void;
  onMessage: (value: string) => void;
  onReload: () => Promise<void>;
  onUnauthorized: () => void;
  onDrafting: (value: boolean) => void;
}) {
  const [comment, setComment] = useState("");
  const [supplement, setSupplement] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    document.getElementById("handover-detail")?.focus();
    if (user.role !== "student") return;
    if (request.status !== "Confirmed" && request.status !== "Completed")
      return;
    void api(`/api/requests/${request.id}/view`, {}).catch(
      (caught: unknown) => {
        if (isUnauthorized(caught)) onUnauthorized();
        else if (caught instanceof ApiError) setError(errorText(caught.code));
        else setError(translate("networkError"));
      },
    );
  }, [request.id, request.status, user.role, onUnauthorized]);
  useEffect(() => {
    onDrafting(comment.trim().length > 0 || supplement.trim().length > 0);
    return () => onDrafting(false);
  }, [comment, supplement, onDrafting]);
  async function act(path: string, body: unknown, method = "POST") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api(path, body, method);
      onMessage(t("changesSaved"));
      await onReload();
    } catch (caught) {
      onMessage("");
      if (isUnauthorized(caught)) {
        onUnauthorized();
        return;
      }
      setError(
        caught instanceof ApiError ? errorText(caught.code) : t("networkError"),
      );
    } finally {
      setBusy(false);
    }
  }
  const canEdit =
    user.id === request.originalTeacherId &&
    (request.status === "Draft" || request.status === "Declined");
  const canRespond =
    user.id === request.recipientId && request.status === "Pending";
  return (
    <article className="card stack" id="handover-detail" tabIndex={-1}>
      <div className="row">
        <h2>{request.subject}</h2>
        <StatusBadge
          status={request.status}
          label={t(request.status as TextKey)}
        />
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
      {user.role !== "student" && request.reason ? (
        <p>
          {t("reason")}: {request.reason}
        </p>
      ) : null}
      {user.role === "student" && request.status === "Cancelled" ? (
        <p>{t("unavailableHandover")}</p>
      ) : null}
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
              {item.authorName} · {localWhen(item.at)}
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
            {localWhen(item.at)} · {item.actorName} ·{" "}
            {actionLabel(item.action, t)} {item.comment}
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
              disabled={busy}
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
              disabled={busy}
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
            disabled={busy}
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
          disabled={busy}
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
          disabled={busy}
          onClick={() => {
            if (window.confirm(t("cancelConfirm")))
              void act(`/api/requests/${request.id}/status`, {
                status: "Cancelled",
                comment: t("cancelRequest"),
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
  onError,
  onUnauthorized,
}: {
  t: (key: TextKey | ExtraKey) => string;
  workspace: Workspace;
  onOpen: (id: string, keepError?: boolean) => void;
  onReload: () => Promise<void>;
  onMessage: (value: string) => void;
  onError: (value: string) => void;
  onUnauthorized: () => void;
}) {
  const [busy, setBusy] = useState(false);
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
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          onError("");
          try {
            await api("/api/notifications/read", {});
            onMessage(t("read"));
            await onReload();
          } catch (caught) {
            onMessage("");
            if (caught instanceof ApiError && caught.status === 401) {
              onUnauthorized();
              return;
            }
            onError(
              caught instanceof ApiError
                ? errorText(caught.code)
                : t("networkError"),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {t("markAllRead")}
      </button>
      {workspace.notifications.map((item) => (
        <button
          className="lesson"
          type="button"
          key={item.id}
          aria-pressed={item.read}
          disabled={busy}
          onClick={() => {
            if (busy) return;
            setBusy(true);
            void api("/api/notifications/read", { id: item.id })
              .then(async () => {
                onError("");
                await onReload();
                onOpen(item.requestId);
              })
              .catch((caught: unknown) => {
                onMessage("");
                if (isUnauthorized(caught)) {
                  onUnauthorized();
                  return;
                }
                onError(
                  caught instanceof ApiError
                    ? errorText(caught.code)
                    : t("networkError"),
                );
                onOpen(item.requestId, true);
              })
              .finally(() => setBusy(false));
          }}
        >
          <strong>
            {item.event === "pending"
              ? t("eventPending")
              : item.event === "declined"
                ? t("eventDeclined")
                : item.event === "accepted"
                  ? t("eventAccepted")
                  : item.event === "class_change"
                    ? t("eventClassChange")
                    : item.event === "reminder"
                      ? t("eventReminder")
                      : item.title}
          </strong>
          <br />
          {localWhen(item.createdAt)} · {item.read ? t("read") : t("unread")}
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
  onUnauthorized,
  onDrafting,
}: {
  t: (key: TextKey | ExtraKey) => string;
  user: User;
  classes: SchoolClass[];
  prefs: ReturnType<typeof usePrefs>;
  onMessage: (value: string) => void;
  onReload: () => Promise<void>;
  onUnauthorized: () => void;
  onDrafting: (value: boolean) => void;
}) {
  const [name, setName] = useState(user.name);
  const [classId, setClassId] = useState(user.classId ?? "");
  const [subjects, setSubjects] = useState(user.subjects.join(", "));
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const dirty =
      name !== user.name ||
      (user.role === "student" && classId !== (user.classId ?? "")) ||
      (user.role === "teacher" && subjects !== user.subjects.join(", "));
    onDrafting(dirty);
    return () => onDrafting(false);
  }, [name, classId, subjects, user, onDrafting]);
  return (
    <section className="card stack">
      <h2>{t("account")}</h2>
      {error ? (
        <p className="notice error" role="alert">
          {error}
        </p>
      ) : null}
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
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
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
          } catch (caught) {
            onMessage("");
            if (isUnauthorized(caught)) {
              onUnauthorized();
              return;
            }
            setError(
              caught instanceof ApiError
                ? errorText(caught.code)
                : t("networkError"),
            );
          } finally {
            setBusy(false);
          }
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
            disabled={busy || confirm !== "RESET DEMO"}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await api("/api/admin/reset", { confirm: "RESET DEMO" });
                onMessage(t("resetSuccess"));
                setConfirm("");
                await onReload();
              } catch (caught) {
                onMessage("");
                if (isUnauthorized(caught)) {
                  onUnauthorized();
                  return;
                }
                setError(
                  caught instanceof ApiError
                    ? errorText(caught.code)
                    : t("networkError"),
                );
              } finally {
                setBusy(false);
              }
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
  onUnauthorized,
}: {
  t: (key: TextKey | ExtraKey) => string;
  onMessage: (value: string) => void;
  onUnauthorized: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [writingId, setWritingId] = useState("");
  useEffect(() => {
    let live = true;
    void api<{ users: User[] }>("/api/admin/users")
      .then((data) => {
        if (!live) return;
        setUsers(data.users);
        setError("");
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (!live) return;
        setLoading(false);
        if (isUnauthorized(caught)) {
          onUnauthorized();
          return;
        }
        setError(
          caught instanceof ApiError
            ? errorText(caught.code)
            : translate("networkError"),
        );
      });
    return () => {
      live = false;
    };
    // Retry is driven by the explicit attempt counter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);
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
      {error ? (
        <p className="notice error" role="alert">
          {error}{" "}
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              setError("");
              setLoading(true);
              setAttempt((value) => value + 1);
            }}
          >
            {t("retry")}
          </button>
        </p>
      ) : null}
      {loading ? <p>{t("loading")}</p> : null}
      {!loading && !error && shown.length === 0 ? (
        <p>{t("noFilteredRequests")}</p>
      ) : null}
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
                    disabled={writingId !== ""}
                    onClick={async () => {
                      if (writingId) return;
                      setWritingId(item.id);
                      setError("");
                      try {
                        await api(
                          `/api/admin/users/${item.id}`,
                          { active: !item.active },
                          "PATCH",
                        );
                        try {
                          const data = await api<{ users: User[] }>(
                            "/api/admin/users",
                          );
                          setUsers(data.users);
                          onMessage(t("changesSaved"));
                        } catch (caught) {
                          onMessage("");
                          if (isUnauthorized(caught)) {
                            onUnauthorized();
                            return;
                          }
                          setError(t("listNeedsRefresh"));
                        }
                      } catch (caught) {
                        onMessage("");
                        if (isUnauthorized(caught)) {
                          onUnauthorized();
                          return;
                        }
                        setError(
                          caught instanceof ApiError
                            ? errorText(caught.code)
                            : t("networkError"),
                        );
                      } finally {
                        setWritingId("");
                      }
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

function Audit({
  t,
  onUnauthorized,
}: {
  t: (key: TextKey | ExtraKey) => string;
  onUnauthorized: () => void;
}) {
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
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    void api<{ events: typeof events }>("/api/admin/audit")
      .then((data) => {
        if (!live) return;
        setEvents(data.events);
        setError("");
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (!live) return;
        setLoading(false);
        if (isUnauthorized(caught)) {
          onUnauthorized();
          return;
        }
        setError(
          caught instanceof ApiError
            ? errorText(caught.code)
            : translate("networkError"),
        );
      });
    return () => {
      live = false;
    };
    // `t` is recreated each render; retry is driven by `attempt`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);
  return (
    <section className="card stack">
      <h2>{t("audit")}</h2>
      {error ? (
        <p className="notice error" role="alert">
          {error}{" "}
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              setError("");
              setLoading(true);
              setAttempt((value) => value + 1);
            }}
          >
            {t("retry")}
          </button>
        </p>
      ) : null}
      {loading ? <p>{t("loading")}</p> : null}
      {!loading && !error && events.length === 0 ? (
        <p>{t("noActivity")}</p>
      ) : null}
      {!loading && !error
        ? events.map((event) => (
            <p key={event.id}>
              {localWhen(event.at)} · {event.actorName} ·{" "}
              {actionLabel(event.action, t)}
              <br />
              {auditDetail(event.detail, t)}
            </p>
          ))
        : null}
    </section>
  );
}

function Impact({
  t,
  week,
  onUnauthorized,
}: {
  t: (key: TextKey | ExtraKey) => string;
  week: string;
  onUnauthorized: () => void;
}) {
  const [data, setData] = useState<{
    byClass: { name: string; count: number }[];
    bySubject: { name: string; count: number }[];
    learningMinutesProtected: number;
    coverageRate: number;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    void api<NonNullable<typeof data>>(`/api/admin/impact?week=${week}`)
      .then((next) => {
        if (live) setData(next);
      })
      .catch((caught: unknown) => {
        if (!live) return;
        if (isUnauthorized(caught)) {
          onUnauthorized();
          return;
        }
        setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [week, attempt, onUnauthorized]);
  if (failed)
    return (
      <p className="notice error" role="alert">
        {t("networkError")}{" "}
        <button
          className="btn ghost"
          type="button"
          onClick={() => {
            setFailed(false);
            setAttempt((value) => value + 1);
          }}
        >
          {t("retry")}
        </button>
      </p>
    );
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
