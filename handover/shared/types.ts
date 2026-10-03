export type Role = "student" | "teacher" | "admin";
export type Status =
  "Draft" | "Pending" | "Confirmed" | "Declined" | "Completed" | "Cancelled";
export type Kind = "move" | "substitute";
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  classId: string | null;
  subjects: string[];
  isDemo: boolean;
  active: boolean;
}
export interface SchoolClass {
  id: string;
  name: string;
}
export interface Teacher {
  id: string;
  name: string;
  subjects: string[];
}
export interface Material {
  title: string;
  url: string;
}
export interface Handover {
  progress: string;
  plan: string;
  materials: Material[];
  assessment: string;
  equipment: string;
  studentReminder: string;
  teacherNotes?: string;
}
export interface Lesson {
  id: string;
  classId: string;
  className: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  date: string;
  period: number;
  room: string;
  requestId?: string;
  changed?: boolean;
  originalDate?: string;
  originalPeriod?: number;
}
export interface TimelineEvent {
  id: string;
  actorName: string;
  action: string;
  at: string;
  comment: string;
}
export interface Supplement {
  id: string;
  authorName: string;
  text: string;
  at: string;
}
export interface ChangeRequest {
  id: string;
  lessonId: string;
  classId: string;
  className: string;
  subject: string;
  originalTeacherId: string;
  originalTeacherName: string;
  originalDate: string;
  originalPeriod: number;
  originalRoom: string;
  kind: Kind;
  targetDate: string;
  targetPeriod: number;
  targetRoom: string;
  recipientId: string;
  recipientName: string;
  reasonCategory: string;
  reason: string;
  handover: Handover;
  status: Status;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
  supplements: Supplement[];
  todo: Record<string, boolean>;
  viewedCount: number;
  preparedCount: number;
  studentCount: number;
}
export interface Notification {
  id: string;
  requestId: string;
  event: string;
  title: string;
  createdAt: string;
  read: boolean;
}
export interface Risk {
  id: string;
  requestId: string;
  kind: string;
  message: string;
}
export interface Stats {
  weekly: number;
  pending: number;
  declined: number;
  confirmed: number;
}
export interface Workspace {
  user: User;
  classes: SchoolClass[];
  teachers: Teacher[];
  lessons: Lesson[];
  requests: ChangeRequest[];
  notifications: Notification[];
  stats: Stats;
  risks: Risk[];
  week: string;
}
export interface RequestInput {
  lessonId: string;
  kind: Kind;
  targetDate: string;
  targetPeriod: number;
  targetRoom: string;
  recipientId: string;
  reasonCategory: string;
  reason: string;
  handover: Handover;
}
export interface ConflictResult {
  conflicts: {
    kind: string;
    subject: string;
    date: string;
    period: number;
    name: string;
  }[];
  availableSlots: { date: string; period: number }[];
  candidates: Teacher[];
}
export interface AuditEvent {
  id: string;
  actorName: string;
  action: string;
  entityId: string;
  at: string;
  detail: string;
}
export interface Impact {
  byClass: { name: string; count: number }[];
  bySubject: { name: string; count: number }[];
  learningMinutesProtected: number;
  coverageRate: number;
}
