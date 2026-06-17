import { TIME_SLOT_CONFIG, TimeSlot } from '@/types';
import { format, addHours, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function getSlotRange(startSlot: TimeSlot, endSlot: TimeSlot): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let i = startSlot; i <= endSlot; i++) {
    slots.push(i as TimeSlot);
  }
  return slots;
}

export function formatTimeSlot(slot: TimeSlot): string {
  const config = TIME_SLOT_CONFIG[slot];
  return `${config.label} (${config.start}-${config.end})`;
}

export function formatSlotRange(startSlot: TimeSlot, endSlot: TimeSlot): string {
  const start = TIME_SLOT_CONFIG[startSlot];
  const end = TIME_SLOT_CONFIG[endSlot];
  return `${start.label}-${end.label} (${start.start}-${end.end})`;
}

export function getSlotDurationMinutes(startSlot: TimeSlot, endSlot: TimeSlot): number {
  return (endSlot - startSlot + 1) * 90;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm');
}

export function formatDateDisplay(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'M月d日 EEEE', { locale: zhCN });
}

export function getWeekDates(baseDate?: string | Date): Date[] {
  const base = baseDate ? (typeof baseDate === 'string' ? parseISO(baseDate) : baseDate) : new Date();
  const dayOfWeek = base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function generateApprovalDeadline(hours: number = 24): string {
  return addHours(new Date(), hours).toISOString();
}

export function isOverdue(deadline: string): boolean {
  return new Date() > parseISO(deadline);
}

export function getOverdueHours(deadline: string): number {
  const now = new Date().getTime();
  const dl = parseISO(deadline).getTime();
  return Math.max(0, Math.floor((now - dl) / (1000 * 60 * 60)));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
