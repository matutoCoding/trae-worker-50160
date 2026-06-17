import { Booking, TimeSlot, CreateBookingParams, User } from '@/types';
import { generateId, generateApprovalDeadline, formatDate } from './time';
import { ApprovalStep } from '@/types';
import { mockUsers } from '@/data/mockData';

function groupSlotsToRanges(slots: TimeSlot[]): { start: TimeSlot; end: TimeSlot }[] {
  if (slots.length === 0) return [];
  
  const sorted = [...slots].sort((a, b) => a - b);
  const ranges: { start: TimeSlot; end: TimeSlot }[] = [];
  let currentStart = sorted[0];
  let currentEnd = sorted[0];
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === currentEnd + 1) {
      currentEnd = sorted[i];
    } else {
      ranges.push({ start: currentStart, end: currentEnd });
      currentStart = sorted[i];
      currentEnd = sorted[i];
    }
  }
  ranges.push({ start: currentStart, end: currentEnd });
  return ranges;
}

function getSubmitter(userId: string): { id: string; name: string } {
  const user = mockUsers.find((u) => u.id === userId);
  return { id: userId, name: user?.name || '未知' };
}

export function mergeAdjacentBookings(bookings: Omit<Booking, 'id'>[]): Booking[] {
  const grouped: Record<string, Omit<Booking, 'id'>[]> = {};
  
  for (const booking of bookings) {
    const key = `${booking.date}-${booking.classroomId}-${booking.className}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(booking);
  }
  
  const merged: Booking[] = [];
  
  for (const key in grouped) {
    const group = grouped[key];
    const sorted = group.sort((a, b) => a.startSlot - b.startSlot);
    
    let current: Omit<Booking, 'id'> | null = null;
    const tempIds: string[] = [];
    
    for (const booking of sorted) {
      const tempId = generateId();
      tempIds.push(tempId);
      
      if (!current) {
        current = { ...booking };
      } else if (booking.startSlot === current.endSlot + 1) {
        current.endSlot = booking.endSlot;
      } else {
        merged.push({
          ...current,
          id: generateId(),
          isMerged: tempIds.length > 1,
          mergedFromIds: [...tempIds],
        });
        current = { ...booking };
        tempIds.length = 0;
        tempIds.push(tempId);
      }
    }
    
    if (current) {
      merged.push({
        ...current,
        id: generateId(),
        isMerged: tempIds.length > 1,
        mergedFromIds: [...tempIds],
      });
    }
  }
  
  return merged;
}

export function splitBookingOnCancel(
  booking: Booking,
  cancelSlots: TimeSlot[]
): Booking[] {
  const allSlots: TimeSlot[] = [];
  for (let i = booking.startSlot; i <= booking.endSlot; i++) {
    if (!cancelSlots.includes(i as TimeSlot)) {
      allSlots.push(i as TimeSlot);
    }
  }
  
  if (allSlots.length === 0) {
    return [];
  }
  
  const ranges = groupSlotsToRanges(allSlots);
  
  return ranges.map((range) => {
    const newId = generateId();
    const baseDeadline = generateApprovalDeadline(24);
    const level2Deadline = generateApprovalDeadline(48);
    
    const approvalSteps: ApprovalStep[] = [
      {
        id: generateId(),
        bookingId: newId,
        level: 1,
        role: 'teacher',
        status: booking.approvalSteps[0]?.status || 'pending',
        approverId: booking.approvalSteps[0]?.approverId || null,
        comment: booking.approvalSteps[0]?.comment || '',
        deadline: baseDeadline,
        processedAt: booking.approvalSteps[0]?.processedAt || null,
      },
      {
        id: generateId(),
        bookingId: newId,
        level: 2,
        role: 'admin',
        status: booking.approvalSteps[1]?.status || 'pending',
        approverId: booking.approvalSteps[1]?.approverId || null,
        comment: booking.approvalSteps[1]?.comment || '',
        deadline: level2Deadline,
        processedAt: booking.approvalSteps[1]?.processedAt || null,
      },
    ];
    
    return {
      ...booking,
      id: newId,
      startSlot: range.start,
      endSlot: range.end,
      isMerged: range.start !== range.end,
      mergedFromIds: [booking.id],
      approvalSteps,
      overtimeRecords: [],
    };
  });
}

export function createBookingsFromParams(params: CreateBookingParams): Booking[] {
  const ranges = groupSlotsToRanges(params.slots);
  const now = new Date().toISOString();
  const baseDeadline = generateApprovalDeadline(24);
  const level2Deadline = generateApprovalDeadline(48);
  const submitter = getSubmitter(params.submittedBy);
  
  const bookingTemplates: Omit<Booking, 'id'>[] = ranges.map((range) => {
    const bookingId = generateId();
    return {
      classroomId: params.classroomId,
      className: params.className,
      date: params.date,
      startSlot: range.start,
      endSlot: range.end,
      status: 'pending',
      purpose: params.purpose,
      caseName: params.purpose,
      isMerged: false,
      mergedFromIds: [],
      submittedBy: params.submittedBy,
      submittedAt: now,
      createdBy: submitter,
      createdAt: now,
      participants: 30,
      approvalSteps: [
        {
          id: generateId(),
          bookingId,
          level: 1,
          role: 'teacher',
          status: 'pending',
          approverId: null,
          comment: '',
          deadline: baseDeadline,
          processedAt: null,
        },
        {
          id: generateId(),
          bookingId,
          level: 2,
          role: 'admin',
          status: 'pending',
          approverId: null,
          comment: '',
          deadline: level2Deadline,
          processedAt: null,
        },
      ],
      overtimeRecords: [],
    };
  });
  
  return mergeAdjacentBookings(bookingTemplates);
}

export function checkSlotsConflict(
  existingBookings: Booking[],
  classroomId: string,
  date: string,
  slots: TimeSlot[]
): Booking[] {
  const targetDate = formatDate(date);
  return existingBookings.filter((b) => {
    if (b.classroomId !== classroomId || b.date !== targetDate) return false;
    if (b.status === 'cancelled' || b.status === 'rejected') return false;
    
    const bookingSlots: TimeSlot[] = [];
    for (let i = b.startSlot; i <= b.endSlot; i++) {
      bookingSlots.push(i as TimeSlot);
    }
    
    return slots.some((s) => bookingSlots.includes(s));
  });
}
