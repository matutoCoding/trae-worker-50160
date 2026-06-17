import { useState } from 'react';
import { Clock, MapPin, User, Calendar, Scissors, XCircle, Zap } from 'lucide-react';
import type { Booking, TimeSlot } from '@/types';
import { TIME_SLOT_CONFIG } from '@/types';
import { useAppStore } from '@/store';
import { formatSlotRange, getSlotRange } from '@/utils/time';
import { getCurrentApprovalStep } from '@/utils/approval';
import { StatusBadge, MergedBadge, OvertimeBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface BookingCardProps {
  booking: Booking;
  viewMode?: 'grid' | 'list';
}

export default function BookingCard({ booking, viewMode = 'grid' }: BookingCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSlots, setCancelSlots] = useState<TimeSlot[]>([]);
  const [showSplitPreview, setShowSplitPreview] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const { classrooms, users, cancelBooking, currentUser, simulateTimePass } = useAppStore();

  const classroom = classrooms.find((c) => c.id === booking.classroomId);
  const submitter = users.find((u) => u.id === booking.createdBy.id);
  const currentStep = getCurrentApprovalStep(booking);
  const allSlots = getSlotRange(booking.startSlot, booking.endSlot);

  const hasOvertime = booking.overtimeRecords.length > 0;
  const highestEscalation = Math.max(
    ...booking.overtimeRecords.map((r) => r.escalationLevel),
    0
  ) as 1 | 2 | 3 | 0;

  function handleCancel() {
    cancelBooking(
      booking.id,
      cancelSlots.length > 0 ? cancelSlots : undefined
    );
    setShowCancelModal(false);
    setCancelSlots([]);
  }

  function toggleCancelSlot(slot: TimeSlot) {
    setCancelSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  }

  const statusColor = {
    pending: 'border-amber-300 bg-amber-50',
    approved: 'border-green-300 bg-green-50',
    rejected: 'border-red-300 bg-red-50',
    cancelled: 'border-gray-300 bg-gray-50',
    completed: 'border-blue-300 bg-blue-50',
  }[booking.status];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <>
      <div
        className={`card border-l-4 ${statusColor} p-4 transition-all duration-300 hover:shadow-lg ${
          viewMode === 'list' ? 'flex items-center gap-4' : ''
        }`}
      >
        <div className={`flex-1 ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}>
          <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-primary font-serif">
                {booking.caseName}
              </h4>
              <StatusBadge status={booking.status} />
              {booking.isMerged && <MergedBadge />}
              {hasOvertime && highestEscalation > 0 && (
                <OvertimeBadge level={highestEscalation as 1 | 2 | 3} />
              )}
            </div>
            <p className="text-sm text-gray-600">{booking.className} · {booking.purpose}</p>
          </div>

          <div className={`grid ${viewMode === 'list' ? 'grid-cols-4 flex-1' : 'grid-cols-2'} gap-2 text-sm text-gray-600 my-3`}>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {classroom?.name}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              {booking.date}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              {formatSlotRange(booking.startSlot, booking.endSlot)}
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              {submitter?.name}
            </div>
          </div>
        </div>

        {booking.isMerged && (
          <div className="mb-3 p-2 bg-gold/10 rounded-lg border border-gold/20">
            <div className="text-xs text-gold flex items-center gap-2">
              <Zap className="w-3 h-3" />
              合并时段：{allSlots.map((s) => TIME_SLOT_CONFIG[s].label).join('、')}
              {cancelSlots.length > 0 && (
                <span className="text-red-600 ml-2">
                  (退订: {cancelSlots.map((s) => TIME_SLOT_CONFIG[s].label).join('、')})
                </span>
              )}
            </div>
          </div>
        )}

        {booking.overtimeRecords.length > 0 && (
          <div className="mb-3 p-2 bg-red-50 rounded-lg border border-red-200">
            <div className="text-xs text-red-700">
              {booking.overtimeRecords[booking.overtimeRecords.length - 1].message}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetail(true)}
          >
            查看详情
          </Button>
          {currentUser?.role === 'student' &&
            booking.status !== 'cancelled' &&
            booking.status !== 'rejected' && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowSplitPreview(true);
                    setShowCancelModal(true);
                  }}
                >
                  <Scissors className="w-4 h-4 mr-1" />
                  部分退订
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setCancelSlots([]);
                    setShowSplitPreview(false);
                    setShowCancelModal(true);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  全部取消
                </Button>
              </>
            )}
          {currentUser?.role === 'admin' && booking.status === 'pending' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => simulateTimePass(booking.id, 5)}
            >
              <Zap className="w-4 h-4 mr-1" />
              模拟超时
            </Button>
          )}
        </div>
      </div>

      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setCancelSlots([]);
        }}
        title={showSplitPreview ? '部分退订 - 选择要退订的时段' : '确认取消预约'}
        size="md"
      >
        <div className="space-y-4">
          {showSplitPreview && (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                选择要退订的时段，系统将自动拆分剩余时段：
              </p>
              <div className="grid grid-cols-4 gap-2">
                {allSlots.map((slot) => {
                  const isSelected = cancelSlots.includes(slot);
                  return (
                    <div
                      key={slot}
                      onClick={() => toggleCancelSlot(slot)}
                      className={`time-slot cursor-pointer ${isSelected ? 'time-slot-selected' : ''}`}
                    >
                      <div className="text-xs font-medium">{TIME_SLOT_CONFIG[slot].label}</div>
                    </div>
                  );
                })}
              </div>

              {cancelSlots.length > 0 && cancelSlots.length < allSlots.length && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium mb-2">拆分预览：</p>
                  <div className="text-xs text-blue-600">
                    退订 {cancelSlots.map((s) => TIME_SLOT_CONFIG[s].label).join('、')} 后，
                    剩余时段将被拆分为独立预约
                  </div>
                </div>
              )}
            </div>
          )}

          {!showSplitPreview && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">
                确认要取消这个预约吗？此操作不可撤销。
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCancelModal(false);
                setCancelSlots([]);
              }}
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={showSplitPreview && cancelSlots.length === 0}
            >
              {showSplitPreview ? '确认退订' : '确认取消'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="预约详情"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">案件名称</label>
              <p className="font-medium">{booking.caseName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">申请班级</label>
              <p className="font-medium">{booking.className}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">申请人</label>
              <p className="font-medium">{submitter?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">使用教室</label>
              <p className="font-medium">{classroom?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">使用日期</label>
              <p className="font-medium">{booking.date}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">使用时段</label>
              <p className="font-medium">
                {formatSlotRange(booking.startSlot, booking.endSlot)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">申请时间</label>
              <p className="font-medium">{formatDate(booking.createdAt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">参与人数</label>
              <p className="font-medium">{booking.participants}人</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">使用用途</label>
            <p className="font-medium">{booking.purpose}</p>
          </div>

          {currentStep && (
            <div className="p-4 bg-primary/5 rounded-lg">
              <h5 className="font-medium mb-2">当前审批状态</h5>
              <p className="text-sm text-gray-600">
                {currentStep.role === 'teacher' ? '教师' : '管理员'}审批中
                {currentStep.status === 'overtime' && (
                  <span className="text-red-500 ml-2">（已超时）</span>
                )}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowDetail(false)}>
              关闭
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
