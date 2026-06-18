import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Users, MapPin, Plus, BarChart3, CheckCircle, Clock3, TrendingUp, CalendarDays } from 'lucide-react';
import { format, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAppStore } from '@/store';
import { TIME_SLOT_CONFIG, type TimeSlot, type Booking, type Classroom } from '@/types';
import { formatDate, formatDateDisplay, getWeekDates, getSlotDurationMinutes } from '@/utils/time';
import { StatusBadge, MergedBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export function WeeklySchedule() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [hoveredBooking, setHoveredBooking] = useState<Booking | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [bookingPurpose, setBookingPurpose] = useState('');
  const [statsFilter, setStatsFilter] = useState<'all' | 'approved' | 'pending'>('all');

  const bookings = useAppStore((s) => s.bookings);
  const classrooms = useAppStore((s) => s.classrooms);
  const currentUser = useAppStore((s) => s.currentUser);
  const toggleBookingSlot = useAppStore((s) => s.toggleBookingSlot);
  const bookingSlots = useAppStore((s) => s.bookingSlots);
  const setBookingModalOpen = useAppStore((s) => s.setBookingModalOpen);
  const isBookingModalOpen = useAppStore((s) => s.isBookingModalOpen);
  const createBooking = useAppStore((s) => s.createBooking);
  const checkConflict = useAppStore((s) => s.checkConflict);

  const weekDates = getWeekDates(currentWeek);
  const monthDates = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);
  
  const displayDates = viewMode === 'week' ? weekDates : monthDates;
  
  const timeSlots = Object.entries(TIME_SLOT_CONFIG) as unknown as [TimeSlot, typeof TIME_SLOT_CONFIG[TimeSlot]][];

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (selectedClassroom && b.classroomId !== selectedClassroom) return false;
      if (b.status === 'cancelled' || b.status === 'rejected') return false;
      return true;
    });
  }, [bookings, selectedClassroom]);

  function computeStats(dates: Date[], crs: Classroom[], bks: Booking[]) {
    const totalSlotsPerDay = 7;
    const totalMinutesPerDay = totalSlotsPerDay * 90;
    const totalMinutes = dates.length * totalMinutesPerDay;

    const classroomStats = crs.map((classroom) => {
      const classroomBookings = bks.filter((b) => {
        if (b.classroomId !== classroom.id) return false;
        const dateStrs = dates.map((d) => formatDate(d));
        if (!dateStrs.includes(b.date)) return false;
        if (b.status === 'cancelled' || b.status === 'rejected') return false;
        return true;
      });

      let approvedMinutes = 0;
      let pendingMinutes = 0;

      classroomBookings.forEach((b) => {
        const minutes = getSlotDurationMinutes(b.startSlot, b.endSlot);
        if (b.status === 'approved' || b.status === 'completed') {
          approvedMinutes += minutes;
        } else if (b.status === 'pending') {
          pendingMinutes += minutes;
        }
      });

      const usedMinutes = statsFilter === 'approved' ? approvedMinutes
        : statsFilter === 'pending' ? pendingMinutes
        : approvedMinutes + pendingMinutes;

      const freeMinutes = Math.max(0, totalMinutes - usedMinutes);
      const utilizationRate = totalMinutes > 0 ? (usedMinutes / totalMinutes) * 100 : 0;
      const freeRate = totalMinutes > 0 ? (freeMinutes / totalMinutes) * 100 : 0;

      return {
        classroom,
        approvedMinutes,
        pendingMinutes,
        freeMinutes,
        utilizationRate,
        freeRate,
        bookingCount: classroomBookings.length,
      };
    });

    const dailyTrend = dates.map((date) => {
      const dateStr = formatDate(date);
      const dayBookings = bks.filter((b) => {
        if (b.date !== dateStr) return false;
        if (b.status === 'cancelled' || b.status === 'rejected') return false;
        if (selectedClassroom && b.classroomId !== selectedClassroom) return false;
        return true;
      });

      let approvedMin = 0;
      let pendingMin = 0;
      dayBookings.forEach((b) => {
        const minutes = getSlotDurationMinutes(b.startSlot, b.endSlot);
        if (b.status === 'approved' || b.status === 'completed') {
          approvedMin += minutes;
        } else if (b.status === 'pending') {
          pendingMin += minutes;
        }
      });
      
      const usedMin = statsFilter === 'approved' ? approvedMin
        : statsFilter === 'pending' ? pendingMin
        : approvedMin + pendingMin;

      return {
        date,
        dateStr,
        approvedMinutes: approvedMin,
        pendingMinutes: pendingMin,
        usedMinutes: usedMin,
        rate: totalMinutesPerDay > 0 ? (usedMin / totalMinutesPerDay) * 100 : 0,
      };
    });

    return { classroomStats, dailyTrend, totalMinutes };
  }

  const weekStatsData = useMemo(() => {
    return computeStats(weekDates, classrooms, bookings);
  }, [classrooms, bookings, weekDates, statsFilter, selectedClassroom]);

  const monthStatsData = useMemo(() => {
    return computeStats(monthDates, classrooms, bookings);
  }, [classrooms, bookings, monthDates, statsFilter, selectedClassroom]);

  const activeStats = viewMode === 'week' ? weekStatsData : monthStatsData;

  function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}分钟`;
    if (mins === 0) return `${hours}小时`;
    return `${hours}小时${mins}分钟`;
  }

  function handlePrev() {
    if (viewMode === 'week') {
      setCurrentWeek(subWeeks(currentWeek, 1));
    } else {
      setCurrentMonth(subMonths(currentMonth, 1));
    }
  }

  function handleNext() {
    if (viewMode === 'week') {
      setCurrentWeek(addWeeks(currentWeek, 1));
    } else {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  }

  function handleTrendDayClick(date: Date) {
    if (viewMode === 'month') {
      setCurrentWeek(startOfWeek(date, { weekStartsOn: 1 }));
      setViewMode('week');
    }
    setSelectedDate(date);
  }

  function handleClassroomStatClick(classroomId: string) {
    setSelectedClassroom(
      selectedClassroom === classroomId ? null : classroomId
    );
  }

  function getBookingsForCell(date: Date, slot: TimeSlot): Booking[] {
    const dateStr = formatDate(date);
    return filteredBookings.filter((b) => {
      if (b.date !== dateStr) return false;
      return slot >= b.startSlot && slot <= b.endSlot;
    });
  }

  function isFirstSlotOfBooking(booking: Booking, slot: TimeSlot): boolean {
    return booking.startSlot === slot;
  }

  function getBookingColSpan(booking: Booking): number {
    return booking.endSlot - booking.startSlot + 1;
  }

  function getCellStatus(date: Date, slot: TimeSlot) {
    const bookings = getBookingsForCell(date, slot);
    if (bookings.length === 0) return 'empty';
    const booking = bookings[0];
    if (booking.status === 'pending') return 'pending';
    if (booking.status === 'approved') return 'approved';
    if (booking.status === 'completed') return 'completed';
    return 'empty';
  }

  function getCellClasses(status: string) {
    const base = 'transition-all duration-200';
    switch (status) {
      case 'pending':
        return `${base} bg-amber-100 hover:bg-amber-200`;
      case 'approved':
        return `${base} bg-emerald-100 hover:bg-emerald-200`;
      case 'completed':
        return `${base} bg-sky-100 hover:bg-sky-200`;
      default:
        return `${base} hover:bg-primary-50 cursor-pointer`;
    }
  }

  const conflicts = checkConflict(
    selectedClassroom || classrooms[0]?.id || '',
    formatDate(selectedDate),
    bookingSlots
  );

  function handleCellClick(date: Date, slot: TimeSlot) {
    if (currentUser?.role !== 'student') return;
    const bookings = getBookingsForCell(date, slot);
    if (bookings.length > 0) return;

    if (!isSameDay(date, selectedDate) || selectedClassroom !== (selectedClassroom || classrooms[0]?.id)) {
      setSelectedDate(date);
      setSelectedClassroom(selectedClassroom || classrooms[0]?.id);
      setBookingModalOpen(true);
    }
    toggleBookingSlot(slot);
  }

  function handleSubmitBooking() {
    if (!currentUser || !selectedClassroom || bookingSlots.length === 0) return;

    const conflicts = checkConflict(selectedClassroom, formatDate(selectedDate), bookingSlots);
    if (conflicts.length > 0) {
      alert('所选时段存在冲突，请重新选择');
      return;
    }

    if (!bookingPurpose.trim()) {
      alert('请填写使用用途');
      return;
    }

    createBooking({
      classroomId: selectedClassroom,
      className: currentUser.department,
      date: formatDate(selectedDate),
      slots: bookingSlots,
      purpose: bookingPurpose.trim(),
      submittedBy: currentUser.id,
    });

    setBookingPurpose('');
  }

  function handleOpenBookingModal() {
    setSelectedClassroom(classrooms[0]?.id || null);
    setBookingPurpose('');
    setBookingModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-primary-800 font-serif">教室排期</h2>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'week' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              按周
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'month' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              按月
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium text-primary-700 min-w-[220px] text-center">
              {viewMode === 'week' ? (
                <>
                  {format(currentWeek, 'yyyy年M月d日', { locale: zhCN })} -{' '}
                  {format(addWeeks(currentWeek, 1), 'M月d日', { locale: zhCN })}
                </>
              ) : (
                format(currentMonth, 'yyyy年M月', { locale: zhCN })
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statsFilter}
            onChange={(e) => setStatsFilter(e.target.value as 'all' | 'approved' | 'pending')}
            className="input-field w-40"
          >
            <option value="all">全部状态</option>
            <option value="approved">仅已批准</option>
            <option value="pending">仅待审批</option>
          </select>
          <select
            value={selectedClassroom || ''}
            onChange={(e) => setSelectedClassroom(e.target.value || null)}
            className="input-field w-64"
          >
            <option value="">全部教室</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {currentUser?.role === 'student' && (
            <Button onClick={handleOpenBookingModal}>
              <Plus className="w-4 h-4 mr-1" />
              新建预约
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
          已批准
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
          待审批
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-sky-100 border border-sky-300" />
          已完成
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-primary font-serif">
              {viewMode === 'week' ? '本周' : '本月'}资源利用概览
            </h3>
          </div>
          <div className="text-xs text-gray-500">
            {statsFilter === 'all' && '显示全部状态'}
            {statsFilter === 'approved' && '仅显示已批准'}
            {statsFilter === 'pending' && '仅显示待审批'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {activeStats.classroomStats.map((stat) => (
            <div
              key={stat.classroom.id}
              onClick={() => handleClassroomStatClick(stat.classroom.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedClassroom === stat.classroom.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-100 bg-white hover:border-primary/30'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-primary font-serif">{stat.classroom.name}</h4>
                  <p className="text-xs text-gray-500">{stat.classroom.capacity}座 · {stat.bookingCount}个预约</p>
                </div>
                <div className={`text-lg font-bold ${
                  stat.utilizationRate > 60 ? 'text-emerald-600' :
                  stat.utilizationRate > 30 ? 'text-amber-600' : 'text-gray-500'
                }`}>
                  {stat.utilizationRate.toFixed(0)}%
                </div>
              </div>
              
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${(stat.approvedMinutes / activeStats.totalMinutes) * 100}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500 -mt-2"
                  style={{ 
                    width: `${(stat.pendingMinutes / activeStats.totalMinutes) * 100}%`,
                    marginLeft: `${(stat.approvedMinutes / activeStats.totalMinutes) * 100}%`
                  }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span className="text-gray-600">{formatMinutes(stat.approvedMinutes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock3 className="w-3 h-3 text-amber-500" />
                  <span className="text-gray-600">{formatMinutes(stat.pendingMinutes)}</span>
                </div>
                <div className="text-right">
                  <span className={`font-medium ${
                    stat.freeRate > 50 ? 'text-sky-600' : 'text-gray-500'
                  }`}>
                    空闲 {stat.freeRate.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-medium text-gray-700">
              {viewMode === 'week' ? '每日' : '每日'}利用趋势
              {selectedClassroom && (
                <span className="ml-2 text-xs text-primary">
                  （{classrooms.find((c) => c.id === selectedClassroom)?.name}）
                </span>
              )}
            </h4>
          </div>
          <div className="flex items-end gap-1 h-28 overflow-x-auto pb-2">
            {activeStats.dailyTrend.map((day) => {
              const isSelected = isSameDay(day.date, selectedDate);
              const isToday = isSameDay(day.date, new Date());
              return (
                <div
                  key={day.dateStr}
                  onClick={() => handleTrendDayClick(day.date)}
                  className={`flex flex-col items-center min-w-[32px] flex-1 cursor-pointer group ${
                    viewMode === 'month' && !isSameMonth(day.date, currentMonth) ? 'opacity-30' : ''
                  }`}
                  title={`${day.dateStr}: 利用率 ${day.rate.toFixed(0)}%`}
                >
                  <div className="w-full flex-1 flex items-end justify-center mb-1">
                    <div className="w-full max-w-[20px] flex flex-col justify-end relative" style={{ height: '80px' }}>
                      <div
                        className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t transition-all group-hover:from-emerald-600 group-hover:to-emerald-500"
                        style={{ 
                          height: `${Math.max(2, (day.approvedMinutes / (7 * 90)) * 100)}%`,
                        }}
                      />
                      {day.pendingMinutes > 0 && (
                        <div
                          className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t mt-0.5 transition-all group-hover:from-amber-600 group-hover:to-amber-500"
                          style={{ 
                            height: `${Math.max(2, (day.pendingMinutes / (7 * 90)) * 100)}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className={`text-[10px] ${
                    isSelected ? 'text-primary font-bold' : 
                    isToday ? 'text-emerald-600 font-medium' : 'text-gray-400'
                  }`}>
                    {viewMode === 'week' 
                      ? format(day.date, 'EEE', { locale: zhCN })
                      : format(day.date, 'd')
                    }
                  </div>
                  {isSelected && (
                    <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-4 text-xs text-gray-500 mt-2">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-400" />
              已批准
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-400" />
              待审批
            </div>
            {viewMode === 'month' && (
              <div className="text-sky-600">
                <CalendarDays className="w-3 h-3 inline mr-1" />
                点击某日跳转周视图
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-primary-800 to-primary-700 text-white">
                <th className="p-3 text-left font-medium w-28 sticky left-0 bg-primary-800 z-10">
                  时段
                </th>
                {displayDates.map((date) => (
                  <th
                    key={date.toISOString()}
                    className={`p-3 text-center font-medium min-w-[140px] ${
                      viewMode === 'month' && !isSameMonth(date, currentMonth) ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="font-serif">{formatDateDisplay(date)}</div>
                    {isSameDay(date, new Date()) && (
                      <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 bg-gold text-white rounded-full">
                        今天
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(([slot, config]) => (
                <tr key={slot} className="border-b border-gray-100">
                  <td className="p-2 bg-gray-50 sticky left-0 z-10">
                    <div className="text-sm font-medium text-gray-700">{config.label}</div>
                    <div className="text-xs text-gray-500">
                      {config.start}-{config.end}
                    </div>
                  </td>
                  {displayDates.map((date) => {
                    const bookings = getBookingsForCell(date, slot);
                    const status = getCellStatus(date, slot);
                    const firstBookings = bookings.filter((b) => isFirstSlotOfBooking(b, slot));
                    const dimmed = viewMode === 'month' && !isSameMonth(date, currentMonth);

                    return (
                      <td
                        key={`${date.toISOString()}-${slot}`}
                        className={`p-1 border-r border-gray-100 ${getCellClasses(status)} ${dimmed ? 'bg-gray-50/50' : ''}`}
                        onClick={() => !dimmed && handleCellClick(date, slot)}
                        onMouseEnter={() => !dimmed && bookings[0] && setHoveredBooking(bookings[0])}
                        onMouseLeave={() => setHoveredBooking(null)}
                      >
                        {firstBookings.map((booking) => {
                          const classroom = classrooms.find((c) => c.id === booking.classroomId);
                          const colSpan = getBookingColSpan(booking);
                          return (
                            <div
                              key={booking.id}
                              className="relative rounded-md p-2 text-white text-xs shadow-md animate-fade-in"
                              style={{
                                background:
                                  booking.status === 'approved'
                                    ? 'linear-gradient(135deg, #059669, #047857)'
                                    : booking.status === 'pending'
                                    ? 'linear-gradient(135deg, #d97706, #b45309)'
                                    : 'linear-gradient(135deg, #0284c7, #0369a1)',
                              }}
                            >
                              <div className="font-medium truncate">{booking.className}</div>
                              <div className="opacity-80 truncate">{booking.purpose}</div>
                              {booking.isMerged && (
                                <div className="absolute top-1 right-1">
                                  <span className="text-[10px] bg-white/20 px-1 rounded">合并</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {bookings.length === 0 && bookingSlots.includes(slot) && !dimmed && (
                          <div className="h-10 rounded-md bg-primary-500/30 border-2 border-dashed border-primary-500 flex items-center justify-center text-xs text-primary-700">
                            已选择
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hoveredBooking && (
        <div className="fixed bottom-6 right-6 card p-4 w-80 animate-slide-in-right z-50">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-primary-800 font-serif">
              {hoveredBooking.className}
            </h4>
            <StatusBadge status={hoveredBooking.status} />
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {classrooms.find((c) => c.id === hoveredBooking.classroomId)?.name}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {TIME_SLOT_CONFIG[hoveredBooking.startSlot].start} -{' '}
              {TIME_SLOT_CONFIG[hoveredBooking.endSlot].end}
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {hoveredBooking.purpose}
            </div>
            {hoveredBooking.isMerged && <MergedBadge />}
          </div>
        </div>
      )}

      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title="新建预约申请"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择教室</label>
              <select
                value={selectedClassroom || ''}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="input-field"
              >
                {classrooms
                  .filter((c) => c.status === 'active')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.capacity}人)
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预约日期</label>
              <input
                type="date"
                value={formatDate(selectedDate)}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择时段</label>
            <div className="grid grid-cols-7 gap-2">
              {timeSlots.map(([slot, config]) => {
                const isSelected = bookingSlots.includes(slot);
                const hasConflict = conflicts.some(
                  (b) => slot >= b.startSlot && slot <= b.endSlot
                );
                const existingBookings = getBookingsForCell(selectedDate, slot);
                const isBooked = existingBookings.length > 0;

                let slotClass = 'time-slot';
                if (isSelected) slotClass += ' time-slot-selected';
                else if (hasConflict) slotClass += ' time-slot-conflict';
                else if (isBooked) slotClass += ' time-slot-booked';

                return (
                  <div
                    key={slot}
                    className={slotClass}
                    onClick={() => !isBooked && toggleBookingSlot(slot)}
                  >
                    <div className="text-xs font-medium">{config.label}</div>
                    <div className="text-[10px] opacity-75">
                      {config.start}-{config.end}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {bookingSlots.length > 1 && (
            <div className="flex items-center gap-2 p-3 bg-gold-50 border border-gold-200 rounded-lg text-gold-800">
              <div className="w-2 h-2 rounded-full bg-gold-500" />
              <span className="text-sm">
                已选择 {bookingSlots.length} 个时段，系统将自动合并相邻时段为整段占用
              </span>
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
              <p className="text-sm font-medium">时段冲突：</p>
              {conflicts.map((c) => (
                <p key={c.id} className="text-xs mt-1">
                  {c.className} 已预约 {TIME_SLOT_CONFIG[c.startSlot].start} -{' '}
                  {TIME_SLOT_CONFIG[c.endSlot].end}
                </p>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">使用用途</label>
            <input
              type="text"
              placeholder="请输入使用用途，如：民事诉讼法模拟庭审"
              className="input-field"
              value={bookingPurpose}
              onChange={(e) => setBookingPurpose(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setBookingModalOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmitBooking}
              disabled={bookingSlots.length === 0 || conflicts.length > 0}
            >
              提交申请
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
