import {
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  Merge,
  Split,
  Clock,
  Video,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "如何预约模拟法庭？",
    answer: "进入「教室排期」页面，选择日期和空闲时段，点击即可发起预约。同一班级连续预约多个相邻时段时，系统会自动合并为一个整段占用。",
  },
  {
    question: "预约审批流程是怎样的？",
    answer: "预约提交后，首先由指导教师审批，教师通过后再由实验室管理员终审。每一级审批都有处理时限，超时未处理系统会自动升级催办并记录责任人。",
  },
  {
    question: "什么是时段合并和拆分？",
    answer: "当同一班级在同一天连续预约多个相邻时段时，系统会自动将这些时段合并显示为一个整段占用。如果中途需要退订部分时段，系统会自动将剩余时段拆分为新的预约记录。",
  },
  {
    question: "超时催办机制是怎样的？",
    answer: "系统采用三级超时预警：1小时内为预警状态，1-4小时升级处理，超过4小时为紧急状态。每次超时都会自动记录责任人，并发送催办通知。",
  },
  {
    question: "如何查看审批轨迹？",
    answer: "在「预约管理」或「预约审批」页面点击任意预约卡片，即可查看完整的审批时间轴，包括每一级审批的处理人、处理时间和处理意见。",
  },
  {
    question: "庭审录像如何归档？",
    answer: "预约完成后，可在「庭审录像」页面上传庭审录像。录像需要关联对应的预约记录，填写案件类型、时长等信息后即可归档保存。",
  },
  {
    question: "如何切换用户身份？",
    answer: "点击左下角的用户头像区域，可以在学生、教师、管理员三种身份之间切换，方便体验不同角色的功能权限。",
  },
  {
    question: "数据会被保存吗？",
    answer: "本系统为纯前端演示应用，所有数据保存在浏览器的LocalStorage中。清除浏览器数据或使用无痕模式会导致数据丢失。点击左下角「重置数据」可恢复初始演示数据。",
  },
];

export default function HelpPage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const modules = [
    {
      title: "教室排期模块",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      features: ["法庭教室资源建档", "周视图排期展示", "时段冲突检测", "快速预约入口"],
    },
    {
      title: "占用合并拆分模块",
      icon: Merge,
      color: "text-green-600",
      bgColor: "bg-green-50",
      features: ["相邻时段自动合并", "中途退订自动拆分", "合并标识显示", "拆分轨迹记录"],
    },
    {
      title: "预约审批模块",
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      features: ["两级审批流程", "审批轨迹留痕", "权限控制", "审批意见记录"],
    },
    {
      title: "超时催办模块",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      features: ["节点超时计时", "三级超时预警", "自动升级催办", "责任人记录"],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary font-serif">帮助中心</h1>
        <p className="text-gray-500 mt-1">了解系统功能和使用指南</p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-primary font-serif mb-4">系统功能模块</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((module, index) => (
            <div key={index} className={`p-4 ${module.bgColor} rounded-lg`}>
              <div className={`p-2 ${module.color} w-fit rounded-lg mb-3`}>
                <module.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{module.title}</h3>
              <ul className="space-y-1">
                {module.features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-primary font-serif mb-4">核心概念</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg h-fit">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">时段配置</h3>
                <p className="text-sm text-gray-500 mt-1">
                  每天分为7个时段，每时段90分钟。时段1(08:00-09:30)到时段7(20:00-21:30)。
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg h-fit">
                <Merge className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">合并规则</h3>
                <p className="text-sm text-gray-500 mt-1">
                  同一班级、同一教室、同一日期、时段编号连续的预约会自动合并显示。
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg h-fit">
                <Split className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">拆分规则</h3>
                <p className="text-sm text-gray-500 mt-1">
                  从合并预约中取消部分时段后，剩余时段会自动重新分组为连续区间。
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg h-fit">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">超时升级</h3>
                <p className="text-sm text-gray-500 mt-1">
                  教师审批时限2小时，管理员审批时限4小时。超时自动升级并记录责任人。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-primary font-serif mb-4">用户角色</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-blue-800">学生</h3>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 发起预约申请</li>
                <li>• 查看自己的预约状态</li>
                <li>• 取消或修改自己的预约</li>
                <li>• 查看庭审录像</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-green-800">教师</h3>
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 审批学生的预约申请（一级审批）</li>
                <li>• 查看所有预约记录</li>
                <li>• 管理庭审录像</li>
                <li>• 查看超时催办记录</li>
              </ul>
            </div>
            <div className="p-4 bg-gold/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-gold" />
                <h3 className="font-bold text-gold">管理员</h3>
              </div>
              <ul className="text-sm text-gold space-y-1">
                <li>• 终审预约申请（二级审批）</li>
                <li>• 管理法庭教室资源</li>
                <li>• 查看所有超时记录和责任人</li>
                <li>• 模拟时间流逝测试超时功能</li>
                <li>• 拥有系统所有权限</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-primary font-serif mb-4">常见问题</h2>
        <div className="space-y-2">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="border border-gray-100 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-800">{item.question}</span>
                {expandedIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {expandedIndex === index && (
                <div className="px-4 pb-4">
                  <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Video className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif">关于本系统</h2>
            <p className="mt-2 text-white/80 leading-relaxed">
              本系统是高校模拟法庭预约管理的纯前端演示应用，采用 React + TypeScript + Tailwind CSS 技术栈开发。
              系统实现了完整的预约流程、智能时段合并拆分、多级审批、超时自动催办等核心功能，
              所有数据保存在浏览器 LocalStorage 中，无需后端支持即可运行。
            </p>
            <p className="mt-3 text-white/60 text-sm">
              版本号：v1.0.0 | 技术栈：React 18 + TypeScript 5 + Vite 5 + Tailwind CSS 3 + Zustand 4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
