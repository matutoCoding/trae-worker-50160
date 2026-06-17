import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Classroom,
  Booking,
  Recording,
  User,
  CreateBookingParams,
  TimeSlot,
  CancelBookingParams,
} from '@/types';
import { generateId, formatDate } from '@/utils/time';
import {
  createBookingsFromParams,
  splitBookingOnCancel,
  checkSlotsConflict,
} from '@/utils/merge';
import { processApprovalStep } from '@/utils/approval';
import { checkAndProcessOvertime, simulateTimePass } from '@/utils/overtime';
import { mockClassrooms, mockBookings, mockRecordings, mockUsers } from '@/data/mockData';

interface AppState {
  classrooms: Classroom[];
  bookings: Booking[];
  recordings: Recording[];
  users: User[];
  currentUser: User | null;
  selectedDate: string;
  selectedClassroom: string | null;
  isBookingModalOpen: boolean;
  bookingSlots: TimeSlot[];

  setCurrentUser: (user: User | null) => void;
  setSelectedDate: (date: string) => void;
  setSelectedClassroom: (id: string | null) => void;
  setBookingModalOpen: (open: boolean) => void;
  setBookingSlots: (slots: TimeSlot[]) => void;
  toggleBookingSlot: (slot: TimeSlot) => void;

  addClassroom: (c: Omit<Classroom, 'id'>) => void;
  updateClassroom: (id: string, c: Partial<Classroom>) => void;
  deleteClassroom: (id: string) => void;

  createBooking: (params: CreateBookingParams) => Booking[];
  cancelBooking: (params: CancelBookingParams) => Booking[];

  processApproval: (
    stepId: string,
    bookingId: string,
    status: 'approved' | 'rejected',
    comment: string
  ) => void;

  checkAndProcessOvertime: () => void;
  simulateBookingOvertime: (bookingId: string, hours: number) => void;

  addRecording: (r: Omit<Recording, 'id'>) => void;
  updateRecording: (id: string, r: Partial<Recording>) => void;
  deleteRecording: (id: string) => void;

  checkConflict: (classroomId: string, date: string, slots: TimeSlot[]) => Booking[];
  resetToMockData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      classrooms: mockClassrooms,
      bookings: mockBookings,
      recordings: mockRecordings,
      users: mockUsers,
      currentUser: mockUsers[0],
      selectedDate: formatDate(new Date()),
      selectedClassroom: null,
      isBookingModalOpen: false,
      bookingSlots: [],

      setCurrentUser: (user) => set({ currentUser: user }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setSelectedClassroom: (id) => set({ selectedClassroom: id }),
      setBookingModalOpen: (open) => set({ isBookingModalOpen: open, bookingSlots: [] }),
      setBookingSlots: (slots) => set({ bookingSlots: slots }),
      toggleBookingSlot: (slot) =>
        set((state) => ({
          bookingSlots: state.bookingSlots.includes(slot)
            ? state.bookingSlots.filter((s) => s !== slot)
            : [...state.bookingSlots, slot].sort((a, b) => a - b),
        })),

      addClassroom: (c) =>
        set((state) => ({
          classrooms: [...state.classrooms, { ...c, id: generateId() }],
        })),
      updateClassroom: (id, c) =>
        set((state) => ({
          classrooms: state.classrooms.map((cr) =>
            cr.id === id ? { ...cr, ...c } : cr
          ),
        })),
      deleteClassroom: (id) =>
        set((state) => ({
          classrooms: state.classrooms.filter((cr) => cr.id !== id),
        })),

      createBooking: (params) => {
        const state = get();
        const newBookings = createBookingsFromParams(params);
        set({
          bookings: [...state.bookings, ...newBookings],
          isBookingModalOpen: false,
          bookingSlots: [],
        });
        return newBookings;
      },
      cancelBooking: ({ bookingId, cancelSlots }) => {
        const state = get();
        const booking = state.bookings.find((b) => b.id === bookingId);
        if (!booking) return [];

        if (!cancelSlots || cancelSlots.length === 0) {
          set((state) => ({
            bookings: state.bookings.map((b) =>
              b.id === bookingId ? { ...b, status: 'cancelled' } : b
            ),
          }));
          return [];
        }

        const splitBookings = splitBookingOnCancel(booking, cancelSlots);
        const otherBookings = state.bookings.filter((b) => b.id !== bookingId);
        set({ bookings: [...otherBookings, ...splitBookings] });
        return splitBookings;
      },

      processApproval: (stepId, bookingId, status, comment) => {
        const state = get();
        const approver = state.currentUser;
        if (!approver) return;

        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId
              ? processApprovalStep(b, stepId, status, approver.id, comment)
              : b
          ),
        }));
      },

      checkAndProcessOvertime: () => {
        const state = get();
        const teachers = state.users.filter((u) => u.role === 'teacher');
        const admins = state.users.filter((u) => u.role === 'admin');
        const { updatedBookings } = checkAndProcessOvertime(state.bookings, teachers, admins);
        set({ bookings: updatedBookings });
      },

      simulateBookingOvertime: (bookingId, hours) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId ? simulateTimePass(b, hours) : b
          ),
        }));
        setTimeout(() => {
          get().checkAndProcessOvertime();
        }, 100);
      },

      addRecording: (r) =>
        set((state) => ({
          recordings: [...state.recordings, { ...r, id: generateId() }],
        })),
      updateRecording: (id, r) =>
        set((state) => ({
          recordings: state.recordings.map((rec) =>
            rec.id === id ? { ...rec, ...r } : rec
          ),
        })),
      deleteRecording: (id) =>
        set((state) => ({
          recordings: state.recordings.filter((rec) => rec.id !== id),
        })),

      checkConflict: (classroomId, date, slots) => {
        return checkSlotsConflict(get().bookings, classroomId, date, slots);
      },

      resetToMockData: () =>
        set({
          classrooms: mockClassrooms,
          bookings: mockBookings,
          recordings: mockRecordings,
          users: mockUsers,
          currentUser: mockUsers[0],
        }),
    }),
    {
      name: 'moot-court-storage',
      partialize: (state) => ({
        classrooms: state.classrooms,
        bookings: state.bookings,
        recordings: state.recordings,
        users: state.users,
        currentUser: state.currentUser,
      }),
    }
  )
);
