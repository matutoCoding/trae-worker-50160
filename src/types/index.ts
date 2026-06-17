export type TimeSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated' | 'overtime';

export type UserRole = 'student' | 'teacher' | 'admin';

export type EscalationLevel = 1 | 2 | 3;

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  location: string;
  status: 'active' | 'maintenance';
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department: string;
}

export interface ApprovalStep {
  id: string;
  bookingId: string;
  level: 1 | 2;
  status: ApprovalStatus;
  approverId: string | null;
  comment: string;
  deadline: string;
  processedAt: string | null;
}

export interface OvertimeRecord {
  id: string;
  bookingId: string;
  approvalLevel: 1 | 2;
  responsiblePersonId: string;
  overtimeAt: string;
  escalationLevel: EscalationLevel;
  notificationSent: boolean;
  message: string;
}

export interface Booking {
  id: string;
  classroomId: string;
  className: string;
  date: string;
  startSlot: TimeSlot;
  endSlot: TimeSlot;
  status: BookingStatus;
  purpose: string;
  isMerged: boolean;
  mergedFromIds: string[];
  submittedBy: string;
  submittedAt: string;
  approvalSteps: ApprovalStep[];
  overtimeRecords: OvertimeRecord[];
}

export interface Recording {
  id: string;
  bookingId: string | null;
  classroomId: string;
  title: string;
  videoUrl: string;
  recordedAt: string;
  duration: number;
  caseType: string;
}

export interface CreateBookingParams {
  classroomId: string;
  className: string;
  date: string;
  slots: TimeSlot[];
  purpose: string;
  submittedBy: string;
}

export interface CancelBookingParams {
  bookingId: string;
  cancelSlots?: TimeSlot[];
  reason?: string;
}

export const TIME_SLOT_CONFIG: Record<TimeSlot, { label: string; start: string; end: string }> = {
  1: { label: '第1节', start: '08:00', end: '09:30' },
  2: { label: '第2节', start: '09:45', end: '11:15' },
  3: { label: '第3节', start: '13:00', end: '14:30' },
  4: { label: '第4节', start: '14:45', end: '16:15' },
  5: { label: '第5节', start: '16:30', end: '18:00' },
  6: { label: '第6节', start: '19:00', end: '20:30' },
  7: { label: '第7节', start: '20:45', end: '22:15' },
};

export const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-amber-500',
  approved: 'bg-emerald-600',
  rejected: 'bg-rose-600',
  cancelled: 'bg-gray-500',
  completed: 'bg-sky-600',
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已驳回',
  cancelled: '已取消',
  completed: '已完成',
};
