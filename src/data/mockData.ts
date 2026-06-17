import { Classroom, User, Booking, Recording, TimeSlot } from '@/types';
import { addDays, subHours } from 'date-fns';
import { generateId, formatDate } from '@/utils/time';

export const mockClassrooms: Classroom[] = [
  {
    id: 'cr-001',
    name: '模拟法庭一号庭',
    capacity: 60,
    equipment: ['高清投影仪', '电子白板', '庭审录像系统', '音响系统', '证据展示台'],
    location: '法学院A座101室',
    status: 'active',
  },
  {
    id: 'cr-002',
    name: '模拟法庭二号庭',
    capacity: 45,
    equipment: ['高清投影仪', '电子白板', '庭审录像系统', '音响系统'],
    location: '法学院A座102室',
    status: 'active',
  },
  {
    id: 'cr-003',
    name: '模拟法庭三号庭',
    capacity: 80,
    equipment: ['4K投影仪', '智能交互白板', '多机位录像系统', '专业音响', '证据展示台', '直播系统'],
    location: '法学院B座201室',
    status: 'active',
  },
  {
    id: 'cr-004',
    name: '模拟仲裁庭',
    capacity: 30,
    equipment: ['高清投影仪', '电子白板', '录像系统', '会议音响'],
    location: '法学院A座301室',
    status: 'maintenance',
  },
];

export const mockUsers: User[] = [
  { id: 'stu-001', name: '张明', role: 'student', department: '法学2021级1班' },
  { id: 'stu-002', name: '李华', role: 'student', department: '法学2021级2班' },
  { id: 'stu-003', name: '王芳', role: 'student', department: '法学2022级1班' },
  { id: 'tea-001', name: '陈教授', role: 'teacher', department: '民事诉讼法教研室' },
  { id: 'tea-002', name: '刘副教授', role: 'teacher', department: '刑事诉讼法教研室' },
  { id: 'adm-001', name: '赵主任', role: 'admin', department: '教务处' },
  { id: 'adm-002', name: '孙科长', role: 'admin', department: '实验教学中心' },
];

const today = new Date();
const tomorrow = addDays(today, 1);
const dayAfter = addDays(today, 2);
const threeDaysLater = addDays(today, 3);
const yesterday = addDays(today, -1);

function getSubmitter(userId: string): { id: string; name: string } {
  const user = mockUsers.find((u) => u.id === userId);
  return { id: userId, name: user?.name || '未知' };
}

function createApprovalSteps(
  bookingId: string,
  l1Status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'overtime',
  l2Status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'overtime',
  hoursAgo: number = 0
) {
  const baseTime = subHours(new Date(), hoursAgo);
  return [
    {
      id: generateId(),
      bookingId,
      level: 1 as const,
      role: 'teacher' as const,
      status: l1Status,
      approverId: l1Status === 'approved' || l1Status === 'rejected' ? 'tea-001' : null,
      comment: l1Status === 'approved' ? '同意，教学安排合理' : l1Status === 'rejected' ? '时段冲突，请调整' : '',
      deadline: subHours(baseTime, -24).toISOString(),
      processedAt: l1Status === 'approved' || l1Status === 'rejected' ? baseTime.toISOString() : null,
    },
    {
      id: generateId(),
      bookingId,
      level: 2 as const,
      role: 'admin' as const,
      status: l2Status,
      approverId: l2Status === 'approved' || l2Status === 'rejected' ? 'adm-001' : null,
      comment: l2Status === 'approved' ? '批准使用' : l2Status === 'rejected' ? '资源已被占用' : '',
      deadline: subHours(baseTime, -48).toISOString(),
      processedAt: l2Status === 'approved' || l2Status === 'rejected' ? baseTime.toISOString() : null,
    },
  ];
}

function createBooking(
  classroomId: string,
  className: string,
  submitterId: string,
  date: Date,
  startSlot: TimeSlot,
  endSlot: TimeSlot,
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed',
  purpose: string,
  l1Status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'overtime',
  l2Status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'overtime',
  hoursAgo: number = 0,
  extraOvertime: boolean = false
): Booking {
  const id = generateId();
  const submittedAt = subHours(new Date(), hoursAgo > 0 ? hoursAgo : 72).toISOString();
  const submitter = getSubmitter(submitterId);
  const slotCount = endSlot - startSlot + 1;
  const mergedFromIds = slotCount > 1 ? Array.from({ length: slotCount }, () => generateId()) : [];

  let approvalSteps = createApprovalSteps(id, l1Status, l2Status, hoursAgo);
  const overtimeRecords = [];

  if (extraOvertime) {
    approvalSteps[0].deadline = subHours(new Date(), 2).toISOString();
    overtimeRecords.push({
      id: generateId(),
      bookingId: id,
      approvalLevel: 1 as const,
      responsiblePersonId: 'tea-001',
      overtimeAt: subHours(new Date(), 1).toISOString(),
      escalationLevel: 2 as const,
      notificationSent: true,
      message: '审批已超时2小时，已自动升级至管理员审批',
    });
  }

  return {
    id,
    classroomId,
    className,
    date: formatDate(date),
    startSlot,
    endSlot,
    status,
    purpose,
    caseName: purpose,
    isMerged: slotCount > 1,
    mergedFromIds,
    submittedBy: submitterId,
    submittedAt,
    createdBy: submitter,
    createdAt: submittedAt,
    participants: 30 + Math.floor(Math.random() * 20),
    approvalSteps,
    overtimeRecords,
  };
}

export const mockBookings: Booking[] = [
  createBooking('cr-001', '法学2021级1班', 'stu-001', today, 1, 3, 'approved', '民事诉讼法模拟庭审', 'approved', 'approved', 48),
  createBooking('cr-001', '法学2021级2班', 'stu-002', today, 5, 6, 'pending', '刑法案例研讨', 'pending', 'pending', 12),
  createBooking('cr-002', '法学2022级1班', 'stu-003', tomorrow, 2, 4, 'pending', '行政诉讼法模拟庭审', 'pending', 'pending', 2),
  createBooking('cr-003', '法学2021级1班', 'stu-001', dayAfter, 1, 2, 'pending', '国际经济法模拟仲裁', 'pending', 'pending', 36),
  createBooking('cr-002', '法学2021级2班', 'stu-002', threeDaysLater, 3, 5, 'approved', '商法案例分析', 'approved', 'approved', 72),
  createBooking('cr-001', '法学2022级1班', 'stu-003', yesterday, 4, 5, 'completed', '民法总论模拟庭审', 'approved', 'approved', 96),
  createBooking('cr-003', '法学2021级1班', 'stu-001', tomorrow, 6, 7, 'rejected', '劳动法模拟仲裁', 'rejected', 'pending', 24),
  createBooking('cr-001', '法学2021级1班', 'stu-001', dayAfter, 5, 7, 'pending', '知识产权法模拟庭审', 'overtime', 'pending', 4, true),
];

export const mockRecordings: Recording[] = [
  {
    id: generateId(),
    bookingId: mockBookings[5].id,
    classroomId: 'cr-001',
    title: '民法总论模拟庭审 - 张三诉李四合同纠纷案',
    caseName: '民法总论模拟庭审 - 张三诉李四合同纠纷案',
    videoUrl: '/recordings/demo1.mp4',
    recordedAt: subHours(new Date(), 20).toISOString(),
    recordDate: formatDate(subHours(new Date(), 20)),
    duration: 180,
    caseType: '民事',
  },
  {
    id: generateId(),
    bookingId: null,
    classroomId: 'cr-003',
    title: '2024年度校级模拟法庭大赛决赛',
    caseName: '2024年度校级模拟法庭大赛决赛',
    videoUrl: '/recordings/demo2.mp4',
    recordedAt: subHours(new Date(), 168).toISOString(),
    recordDate: formatDate(subHours(new Date(), 168)),
    duration: 240,
    caseType: '刑事',
  },
  {
    id: generateId(),
    bookingId: null,
    classroomId: 'cr-002',
    title: '行政诉讼法教学录像 - 行政复议程序',
    caseName: '行政诉讼法教学录像 - 行政复议程序',
    videoUrl: '/recordings/demo3.mp4',
    recordedAt: subHours(new Date(), 336).toISOString(),
    recordDate: formatDate(subHours(new Date(), 336)),
    duration: 120,
    caseType: '行政',
  },
  {
    id: generateId(),
    bookingId: mockBookings[0].id,
    classroomId: 'cr-001',
    title: '民事诉讼法模拟庭审 - 王五诉赵六侵权案',
    caseName: '民事诉讼法模拟庭审 - 王五诉赵六侵权案',
    videoUrl: '/recordings/demo4.mp4',
    recordedAt: subHours(new Date(), 4).toISOString(),
    recordDate: formatDate(subHours(new Date(), 4)),
    duration: 270,
    caseType: '民事',
  },
];

export const caseTypes = ['民事', '刑事', '行政', '商事', '知识产权', '劳动', '国际私法'];

export const equipmentOptions = [
  '高清投影仪',
  '4K投影仪',
  '电子白板',
  '智能交互白板',
  '庭审录像系统',
  '多机位录像系统',
  '音响系统',
  '专业音响',
  '会议音响',
  '证据展示台',
  '直播系统',
  '无线麦系统',
];
