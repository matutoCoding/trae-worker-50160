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
      status: l2Status,
      approverId: l2Status === 'approved' || l2Status === 'rejected' ? 'adm-001' : null,
      comment: l2Status === 'approved' ? '批准使用' : l2Status === 'rejected' ? '资源已被占用' : '',
      deadline: subHours(baseTime, -48).toISOString(),
      processedAt: l2Status === 'approved' || l2Status === 'rejected' ? baseTime.toISOString() : null,
    },
  ];
}

export const mockBookings: Booking[] = [
  {
    id: generateId(),
    classroomId: 'cr-001',
    className: '法学2021级1班',
    date: formatDate(today),
    startSlot: 1,
    endSlot: 3,
    status: 'approved',
    purpose: '民事诉讼法模拟庭审',
    isMerged: true,
    mergedFromIds: [generateId(), generateId(), generateId()],
    submittedBy: 'stu-001',
    submittedAt: subHours(new Date(), 72).toISOString(),
    approvalSteps: createApprovalSteps('1', 'approved', 'approved', 48),
    overtimeRecords: [],
  },
  {
    id: generateId(),
    classroomId: 'cr-001',
    className: '法学2021级2班',
    date: formatDate(today),
    startSlot: 5,
    endSlot: 6,
    status: 'pending',
    purpose: '刑法案例研讨',
    isMerged: true,
    mergedFromIds: [generateId(), generateId()],
    submittedBy: 'stu-002',
    submittedAt: subHours(new Date(), 12).toISOString(),
    approvalSteps: createApprovalSteps('2', 'pending', 'pending', 12),
    overtimeRecords: [],
  },
  {
    id: generateId(),
    classroomId: 'cr-002',
    className: '法学2022级1班',
    date: formatDate(tomorrow),
    startSlot: 2,
    endSlot: 4,
    status: 'pending',
    purpose: '行政诉讼法模拟庭审',
    isMerged: true,
    mergedFromIds: [generateId(), generateId(), generateId()],
    submittedBy: 'stu-003',
    submittedAt: subHours(new Date(), 2).toISOString(),
    approvalSteps: createApprovalSteps('3', 'pending', 'pending', 2),
    overtimeRecords: [],
  },
  {
    id: generateId(),
    classroomId: 'cr-003',
    className: '法学2021级1班',
    date: formatDate(dayAfter),
    startSlot: 1,
    endSlot: 2,
    status: 'pending',
    purpose: '国际经济法模拟仲裁',
    isMerged: true,
    mergedFromIds: [generateId(), generateId()],
    submittedBy: 'stu-001',
    submittedAt: subHours(new Date(), 36).toISOString(),
    approvalSteps: (() => {
      const steps = createApprovalSteps('4', 'pending', 'pending', 36);
      steps[0].deadline = subHours(new Date(), 12).toISOString();
      return steps;
    })(),
    overtimeRecords: [],
  },
  {
    id: generateId(),
    classroomId: 'cr-002',
    className: '法学2021级2班',
    date: formatDate(threeDaysLater),
    startSlot: 3,
    endSlot: 5,
    status: 'approved',
    purpose: '商法案例分析',
    isMerged: true,
    mergedFromIds: [generateId(), generateId(), generateId()],
    submittedBy: 'stu-002',
    submittedAt: subHours(new Date(), 96).toISOString(),
    approvalSteps: createApprovalSteps('5', 'approved', 'approved', 72),
    overtimeRecords: [],
  },
  {
    id: generateId(),
    classroomId: 'cr-001',
    className: '法学2022级1班',
    date: formatDate(yesterday),
    startSlot: 4,
    endSlot: 5,
    status: 'completed',
    purpose: '民法总论模拟庭审',
    isMerged: true,
    mergedFromIds: [generateId(), generateId()],
    submittedBy: 'stu-003',
    submittedAt: subHours(new Date(), 120).toISOString(),
    approvalSteps: createApprovalSteps('6', 'approved', 'approved', 96),
    overtimeRecords: [],
  },
  {
    id: generateId(),
    classroomId: 'cr-003',
    className: '法学2021级1班',
    date: formatDate(tomorrow),
    startSlot: 6,
    endSlot: 7,
    status: 'rejected',
    purpose: '劳动法模拟仲裁',
    isMerged: true,
    mergedFromIds: [generateId(), generateId()],
    submittedBy: 'stu-001',
    submittedAt: subHours(new Date(), 48).toISOString(),
    approvalSteps: createApprovalSteps('7', 'rejected', 'pending', 24),
    overtimeRecords: [],
  },
  {
    id: generateId(),
    classroomId: 'cr-001',
    className: '法学2021级1班',
    date: formatDate(dayAfter),
    startSlot: 5,
    endSlot: 7,
    status: 'pending',
    purpose: '知识产权法模拟庭审',
    isMerged: true,
    mergedFromIds: [generateId(), generateId(), generateId()],
    submittedBy: 'stu-001',
    submittedAt: subHours(new Date(), 4).toISOString(),
    approvalSteps: (() => {
      const steps = createApprovalSteps('8', 'overtime', 'pending', 4);
      steps[0].deadline = subHours(new Date(), 2).toISOString();
      return steps;
    })(),
    overtimeRecords: [
      {
        id: generateId(),
        bookingId: 'overtime-demo',
        approvalLevel: 1,
        responsiblePersonId: 'tea-001',
        overtimeAt: subHours(new Date(), 1).toISOString(),
        escalationLevel: 2,
        notificationSent: true,
        message: '审批已超时2小时，已自动升级至管理员审批',
      },
    ],
  },
];

export const mockRecordings: Recording[] = [
  {
    id: generateId(),
    bookingId: mockBookings[5].id,
    classroomId: 'cr-001',
    title: '民法总论模拟庭审 - 张三诉李四合同纠纷案',
    videoUrl: '/recordings/demo1.mp4',
    recordedAt: subHours(new Date(), 20).toISOString(),
    duration: 180,
    caseType: '民事',
  },
  {
    id: generateId(),
    bookingId: null,
    classroomId: 'cr-003',
    title: '2024年度校级模拟法庭大赛决赛',
    videoUrl: '/recordings/demo2.mp4',
    recordedAt: subHours(new Date(), 168).toISOString(),
    duration: 240,
    caseType: '刑事',
  },
  {
    id: generateId(),
    bookingId: null,
    classroomId: 'cr-002',
    title: '行政诉讼法教学录像 - 行政复议程序',
    videoUrl: '/recordings/demo3.mp4',
    recordedAt: subHours(new Date(), 336).toISOString(),
    duration: 120,
    caseType: '行政',
  },
  {
    id: generateId(),
    bookingId: mockBookings[0].id,
    classroomId: 'cr-001',
    title: '民事诉讼法模拟庭审 - 王五诉赵六侵权案',
    videoUrl: '/recordings/demo4.mp4',
    recordedAt: subHours(new Date(), 4).toISOString(),
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
