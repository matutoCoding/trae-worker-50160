import { useState } from 'react';
import { Clock, MapPin, User, Calendar, Scissors, XCircle, Zap, CheckSquare, Square, Video, Play, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Booking, TimeSlot, Recording } from '@/types';
import { TIME_SLOT_CONFIG } from '@/types';
import { useAppStore } from '@/store';
import { formatSlotRange, getSlotRange, formatDateTime } from '@/utils/time';
import { getCurrentApprovalStep } from '@/utils/approval';
import { StatusBadge, MergedBadge, OvertimeBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface BookingCardProps {
  booking: Booking;
  viewMode?: 'grid' | 'list';
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export default function BookingCard({ 
  booking, 
  viewMode = 'grid',
  selectable = false,
  isSelected = false,
  onToggleSelect,
}: BookingCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSlots, setCancelSlots] = useState<TimeSlot[]>([]);
  const [showSplitPreview, setShowSplitPreview] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

  const navigate = useNavigate();
  const { classrooms, users, cancelBooking, currentUser, simulateBookingOvertime, recordings } = useAppStore();

  const classroom = classrooms.find((c) => c.id === booking.classroomId);
  const submitter = users.find((u) => u.id === booking.submittedBy) || { name: booking.createdBy?.name || '未知' };
  const currentStep = getCurrentApprovalStep(booking);
  const allSlots = getSlotRange(booking.startSlot, booking.endSlot);

  const hasOvertime = booking.overtimeRecords.length > 0;
  const highestEscalation = Math.max(
    ...booking.overtimeRecords.map((r) => r.escalationLevel),
    0
  ) as 1 | 2 | 3 | 0;

  function handleCancel() {
    cancelBooking({
      bookingId: booking.id,
      cancelSlots: cancelSlots.length > 0 ? cancelSlots : undefined,
    });
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

  return (
    <>
      <div
        className={`card border-l-4 ${statusColor} p-4 transition-all duration-300 hover:shadow-lg ${
          viewMode === 'list' ? 'flex items-center gap-4' : ''
        } ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
      >
        {selectable && (
          <div
            className="flex-shrink-0 mr-3 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (booking.status !== 'cancelled' && booking.status !== 'rejected') {
                onToggleSelect?.(booking.id);
              }
            }}
          >
            {booking.status === 'cancelled' || booking.status === 'rejected' ? (
              <Square className="w-5 h-5 text-gray-300" />
            ) : isSelected ? (
              <CheckSquare className="w-5 h-5 text-primary" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </div>
        )}

        <div className={`flex-1 ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}>
          <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-primary font-serif">
                {booking.purpose || booking.caseName || '未命名预约'}
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
              {classroom?.name || '未知教室'}
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
              {submitter?.name || '未知申请人'}
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
              onClick={() => simulateBookingOvertime(booking.id, 5)}
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
              <label className="block text-sm font-medium text-gray-500">案件/用途</label>
              <p className="font-medium">{booking.purpose || booking.caseName || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">申请班级</label>
              <p className="font-medium">{booking.className}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">申请人</label>
              <p className="font-medium">{submitter?.name || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">使用教室</label>
              <p className="font-medium">{classroom?.name || '-'}</p>
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
              <p className="font-medium">{formatDateTime(booking.submittedAt || booking.createdAt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">参与人数</label>
              <p className="font-medium">{booking.participants || 30}人</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">使用用途</label>
            <p className="font-medium">{booking.purpose || '-'}</p>
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

          {recordings.filter((r) => r.bookingId === booking.id).length > 0 && (
            <div className="p-4 bg-sky-50 rounded-lg border border-sky-100">
              <h5 className="font-medium text-sky-800 mb-3 flex items-center gap-2">
                <Video className="w-4 h-4" />
                关联庭审录像
                <button
                  onClick={() => navigate('/recordings')}
                  className="ml-auto text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1"
                >
                  去录像页
                  <ExternalLink className="w-3 h-3" />
                </button>
              </h5>
              <div className="space-y-2">
                {recordings
                  .filter((r) => r.bookingId === booking.id)
                  .map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between p-2 bg-white rounded border border-sky-100"
                    >
                      <div>
                        <p className="text-sm font-medium text-sky-900">{rec.title}</p>
                        <p className="text-xs text-sky-600">
                          {rec.caseType} · {Math.floor(rec.duration / 60)}小时{rec.duration % 60}分钟
                          {rec.recordDate && ` · ${rec.recordDate}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedRecording(rec)}>
                          <Play className="w-4 h-4 mr-1" />
                          详情
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/recordings')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowDetail(false)}>
              关闭
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedRecording}
        onClose={() => setSelectedRecording(null)}
        title="录像详情"
      >
        {selectedRecording && (
          <div className="space-y-4">
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Play className="w-16 h-16 mx-auto text-white/30 mb-2" />
                <p className="text-white/50 text-sm">点击播放视频</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">录像标题</label>
                <p className="font-medium">{selectedRecording.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">案件类型</label>
                <p className="font-medium">{selectedRecording.caseType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">录制教室</label>
                <p className="font-medium">
                  {classrooms.find((c) => c.id === selectedRecording.classroomId)?.name || '未知'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">录制日期</label>
                <p className="font-medium">{selectedRecording.recordDate || selectedRecording.recordedAt?.slice(0, 10)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">时长</label>
                <p className="font-medium">
                  {Math.floor(selectedRecording.duration / 60)}小时{selectedRecording.duration % 60}分钟
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setSelectedRecording(null)}>
                关闭
              </Button>
              <Button onClick={() => {
                setSelectedRecording(null);
                navigate('/recordings');
              }}>
                <ExternalLink className="w-4 h-4 mr-1" />
                前往录像归档
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
