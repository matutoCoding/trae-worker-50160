import { useState } from 'react';
import { Video, MapPin, Clock, Calendar, Play, Edit3, Trash2, Plus } from 'lucide-react';
import type { Recording } from '@/types';
import { useAppStore } from '@/store';
import { formatDateDisplay, formatDateTime } from '@/utils/time';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { caseTypes } from '@/data/mockData';
import { generateId } from '@/utils/time';

interface RecordingCardProps {
  recording: Recording;
}

export function RecordingCard({ recording }: RecordingCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const classrooms = useAppStore((s) => s.classrooms);
  const bookings = useAppStore((s) => s.bookings);

  const classroom = classrooms.find((c) => c.id === recording.classroomId);
  const booking = recording.bookingId ? bookings.find((b) => b.id === recording.bookingId) : null;

  function formatDuration(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`;
  }

  return (
    <>
      <div
        className="card h-full flex flex-col cursor-pointer group"
        onClick={() => setShowDetail(true)}
      >
        <div className="relative aspect-video bg-gradient-to-br from-primary-700 to-primary-900 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
            {formatDuration(recording.duration)}
          </div>
          <div className="absolute top-2 left-2">
            <Badge variant="info" className="bg-sky-100 text-sky-700">
              {recording.caseType}
            </Badge>
          </div>
        </div>
        <div className="card-body flex-1">
          <h4 className="font-semibold text-primary-800 font-serif line-clamp-2 mb-2">
            {recording.title}
          </h4>
          <div className="space-y-1 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {classroom?.name}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDateDisplay(recording.recordedAt)}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="录像详情"
        size="lg"
      >
        <div className="space-y-4">
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Video className="w-16 h-16 mx-auto mb-2 opacity-50" />
              <p>视频播放器占位</p>
              <p className="text-sm">{recording.videoUrl}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">案件类型</label>
              <p className="font-medium">{recording.caseType}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">时长</label>
              <p className="font-medium">{formatDuration(recording.duration)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">录制地点</label>
              <p className="font-medium">{classroom?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">录制时间</label>
              <p className="font-medium">{formatDateTime(recording.recordedAt)}</p>
            </div>
          </div>

          {booking && (
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
              <h5 className="font-medium text-primary-800 mb-2">关联预约</h5>
              <div className="text-sm text-primary-600">
                <p>{booking.className}</p>
                <p className="text-primary-500">{booking.purpose}</p>
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
    </>
  );
}

export function AddRecordingButton() {
  const [showModal, setShowModal] = useState(false);
  const addRecording = useAppStore((s) => s.addRecording);
  const classrooms = useAppStore((s) => s.classrooms);
  const bookings = useAppStore((s) => s.bookings);

  const [form, setForm] = useState({
    title: '',
    classroomId: classrooms[0]?.id || '',
    bookingId: '',
    caseType: caseTypes[0],
    duration: 120,
    videoUrl: '',
  });

  function handleSubmit() {
    if (!form.title) {
      alert('请填写录像标题');
      return;
    }
    const now = new Date();
    addRecording({
      ...form,
      caseName: form.title,
      recordedAt: now.toISOString(),
      recordDate: formatDateDisplay(now),
      bookingId: form.bookingId || null,
    });
    setShowModal(false);
  }

  const availableBookings = bookings.filter(
    (b) => (b.status === 'completed' || b.status === 'approved') && b.classroomId === form.classroomId
  );

  const CASE_TYPE_MAP: Array<{ keyword: string; type: string }> = [
    { keyword: '民事', type: '民事' },
    { keyword: '刑事', type: '刑事' },
    { keyword: '行政', type: '行政' },
    { keyword: '商法', type: '商事' },
    { keyword: '知识产权', type: '知识产权' },
    { keyword: '劳动', type: '劳动' },
    { keyword: '仲裁', type: '民事' },
    { keyword: '合同', type: '民事' },
    { keyword: '侵权', type: '民事' },
    { keyword: '国际', type: '国际私法' },
  ];

  function inferCaseType(text: string): string {
    for (const { keyword, type } of CASE_TYPE_MAP) {
      if (text.includes(keyword)) {
        return type;
      }
    }
    return '民事';
  }

  function handleBookingChange(bookingId: string) {
    if (!bookingId) {
      setForm({ ...form, bookingId: '' });
      return;
    }
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      const suggestedTitle = `${booking.purpose || booking.caseName || ''} - ${booking.className}`;
      const caseText = booking.purpose || booking.caseName || '';
      const suggestedCaseType = inferCaseType(caseText);
      setForm({
        ...form,
        bookingId,
        classroomId: booking.classroomId,
        title: suggestedTitle,
        caseType: suggestedCaseType,
      });
    }
  }

  const allBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'approved'
  );

  return (
    <>
      <Button onClick={() => setShowModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
        上传录像
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="上传庭审录像"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">录像标题</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="如：民事诉讼法模拟庭审 - 张三诉李四合同纠纷案"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">录制教室</label>
              <select
                value={form.classroomId}
                onChange={(e) => setForm({ ...form, classroomId: e.target.value })}
                className="input-field"
              >
                {classrooms
                  .filter((c) => c.status === 'active')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">案件类型</label>
              <select
                value={form.caseType}
                onChange={(e) => setForm({ ...form, caseType: e.target.value })}
                className="input-field"
              >
                {caseTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">时长（分钟）</label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关联预约</label>
              <select
                value={form.bookingId}
                onChange={(e) => handleBookingChange(e.target.value)}
                className="input-field"
              >
                <option value="">不关联预约</option>
                {allBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.purpose || b.caseName} - {b.className} ({b.date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">视频地址</label>
            <input
              type="text"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="请输入视频文件地址"
              className="input-field"
            />
          </div>

          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <Video className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">点击或拖拽视频文件到此处上传</p>
            <p className="text-xs text-gray-400 mt-1">支持 MP4, MOV, AVI 格式</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>上传</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
