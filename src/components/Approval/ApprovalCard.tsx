import { useState } from 'react';
import { Clock, MapPin, User, Calendar, Check, X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { Booking } from '@/types';
import { TIME_SLOT_CONFIG } from '@/types';
import { useAppStore } from '@/store';
import { formatSlotRange, isOverdue as checkIsOverdue } from '@/utils/time';
import { getCurrentApprovalStep, canApprove } from '@/utils/approval';
import { StatusBadge, MergedBadge, OvertimeBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface ApprovalCardProps {
  booking: Booking;
}

export default function ApprovalCard({ booking }: ApprovalCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [comment, setComment] = useState('');
  const [showTrail, setShowTrail] = useState(false);

  const { classrooms, users, currentUser, processApproval } = useAppStore();

  const classroom = classrooms.find((c) => c.id === booking.classroomId);
  const submitter = users.find((u) => u.id === booking.createdBy.id);
  const currentStep = getCurrentApprovalStep(booking);

  const canApproveThis = currentUser && currentStep
    ? canApprove(booking, currentUser!)
    : false;

  const isOverdue = currentStep?.deadline ? checkIsOverdue(currentStep.deadline) : false;
  const overdueHours = currentStep?.deadline 
    ? Math.floor((new Date().getTime() - new Date(currentStep.deadline).getTime()) / (1000 * 60 * 60)) 
    : 0;

  const highestEscalation = Math.max(
    ...booking.overtimeRecords.map((r) => r.escalationLevel),
    0
  ) as 1 | 2 | 3 | 0;

  function handleApprove() {
    if (!currentStep || !currentUser) return;
    processApproval(booking.id, 'approved', comment);
    setShowDetail(false);
    setComment('');
  }

  function handleReject() {
    if (!currentStep || !currentUser) return;
    processApproval(booking.id, 'rejected', comment);
    setShowDetail(false);
    setComment('');
  }

  function getApproverName(approverId: string | null) {
    if (!approverId) return null;
    return users.find((u) => u.id === approverId)?.name || '未知';
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <>
      <div className="card p-4 animate-fade-in">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-primary font-serif">
                {booking.caseName}
              </h4>
              <StatusBadge status={booking.status} />
              {booking.isMerged && (
                <MergedBadge />
              )}
              {isOverdue && (
                <OvertimeBadge level={Math.max(highestEscalation, overdueHours > 4 ? 3 : overdueHours > 1 ? 2 : 1) as 1 | 2 | 3} />
              )}
            </div>
            <p className="text-sm text-gray-600">{booking.className} · {booking.purpose}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetail(true)}
          >
            审批
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
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

        {currentStep && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary">
                  当前节点：{currentStep.role === 'teacher' ? '教师一级审批' : '管理员二级审批'}
                </span>
                {isOverdue && (
                  <span className="text-red-500 text-sm flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    已超时 {overdueHours} 小时
                  </span>
                )}
              </div>
              <button
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                onClick={() => setShowTrail(!showTrail)}
              >
                {showTrail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                审批轨迹
              </button>
            </div>
          </div>
        )}

        {showTrail && (
          <div className="mt-3 pl-4 border-l-2 border-primary/20 space-y-3">
            {booking.approvalSteps.map((step) => {
              const approver = getApproverName(step.approverId);
              const isCurrent = step.id === currentStep?.id;
              return (
                <div key={step.id} className="relative">
                  <div className={`w-3 h-3 rounded-full absolute -left-[25px] top-1.5 ${
                    step.status === 'approved' ? 'bg-green-500' :
                    step.status === 'rejected' ? 'bg-red-500' :
                    step.status === 'pending' ? 'bg-amber-500' :
                    step.status === 'overtime' ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                  }`} />
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {step.role === 'teacher' ? '教师审批' : '管理员审批'}
                      </span>
                      {isCurrent && (
                        <span className="text-xs text-primary">← 当前</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      状态：{
                        step.status === 'approved' ? `已通过${approver ? ` - ${approver}` : ''}` :
                        step.status === 'rejected' ? `已驳回${approver ? ` - ${approver}` : ''}` :
                        step.status === 'pending' ? '待处理' :
                        step.status === 'overtime' ? '已超时' : '已升级'
                      }
                    </div>
                    {step.comment && (
                      <div className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                        {step.comment}
                      </div>
                    )}
                    {step.processedAt && (
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(step.processedAt)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {booking.overtimeRecords.map((record) => {
              const responsible = getApproverName(record.responsiblePersonId);
              return (
                <div key={record.id} className="relative">
                  <div className="w-3 h-3 rounded-full bg-red-500 absolute -left-[25px] top-1.5" />
                  <div className="text-sm text-red-600">
                    <div className="font-medium">超时催办 - 级别 {record.escalationLevel}</div>
                    <div className="text-xs text-red-500">{record.message}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      责任人：{responsible} · {formatDate(record.overtimeAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="审批详情"
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

          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-3">审批意见</h5>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="请输入审批意见（可选）"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px]"
            />
          </div>

          {!canApproveThis && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              您没有权限审批此申请
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowDetail(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!canApproveThis}
            >
              <X className="w-4 h-4 mr-1" />
              驳回
            </Button>
            <Button
              variant="success"
              onClick={handleApprove}
              disabled={!canApproveThis}
            >
              <Check className="w-4 h-4 mr-1" />
              通过
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
