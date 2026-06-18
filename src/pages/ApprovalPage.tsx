import { useState } from "react";
import { useAppStore } from "@/store";
import { canApprove, getCurrentApprovalStep } from "@/utils/approval";
import ApprovalCard from "@/components/Approval/ApprovalCard";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Clock, XCircle, Filter, Users, Archive, UserCheck, ShieldAlert, TrendingUp } from "lucide-react";
import type { Booking } from "@/types";

type TabId = "pending" | "approved" | "rejected" | "archive";
type ArchiveGroup = "teacher" | "admin" | "escalated" | "all";

export default function ApprovalPage() {
  const { bookings, currentUser, users } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabId>("pending");
  const [archiveGroup, setArchiveGroup] = useState<ArchiveGroup>("all");

  const pendingBookings = bookings.filter(
    (b) => b.status === "pending" && canApprove(b, currentUser)
  );

  const approvedBookings = bookings.filter(
    (b) => b.status === "approved" || b.status === "completed"
  );

  const rejectedBookings = bookings.filter((b) => b.status === "rejected");

  function getArchiveGroup(b: Booking): ArchiveGroup {
    const hasEscalated = b.overtimeRecords && b.overtimeRecords.length > 0;
    if (hasEscalated) return "escalated";
    const lastStep = [...b.approvalSteps].sort((a, b) => b.level - a.level).find(
      (s) => s.status === "approved" || s.status === "rejected"
    );
    if (!lastStep) return "all";
    return lastStep.role === "admin" ? "admin" : "teacher";
  }

  const archiveBookings = bookings.filter(
    (b) => b.status === "approved" || b.status === "rejected" || b.status === "completed"
  );

  const filteredArchive = archiveBookings.filter((b) => {
    if (archiveGroup === "all") return true;
    return getArchiveGroup(b) === archiveGroup;
  });

  const teacherCount = archiveBookings.filter((b) => getArchiveGroup(b) === "teacher").length;
  const adminCount = archiveBookings.filter((b) => getArchiveGroup(b) === "admin").length;
  const escalatedCount = archiveBookings.filter((b) => getArchiveGroup(b) === "escalated").length;

  function getFinalResult(b: Booking): { label: string; color: string } {
    if (b.status === "approved" || b.status === "completed") {
      return { label: "已通过", color: "text-emerald-600" };
    }
    if (b.status === "rejected") {
      return { label: "已驳回", color: "text-red-600" };
    }
    return { label: "处理中", color: "text-amber-600" };
  }

  function getFinalProcessor(b: Booking) {
    const step = [...b.approvalSteps].reverse().find(
      (s) => s.status === "approved" || s.status === "rejected"
    );
    if (!step) return null;
    const user = users.find((u) => u.id === step.approverId);
    return {
      name: user?.name || "未知",
      role: step.role === "teacher" ? "教师" : "管理员",
      comment: step.comment,
      level: step.level,
    };
  }

  function getGroupName(g: ArchiveGroup) {
    switch (g) {
      case "teacher": return "教师一级处理";
      case "admin": return "管理员二级处理";
      case "escalated": return "升级处理";
      default: return "全部归档";
    }
  }

  const tabs = [
    { id: "pending" as const, label: "待我审批", icon: Clock, count: pendingBookings.length },
    { id: "approved" as const, label: "已通过", icon: CheckCircle, count: approvedBookings.length },
    { id: "rejected" as const, label: "已驳回", icon: XCircle, count: rejectedBookings.length },
    { id: "archive" as const, label: "审批归档", icon: Archive, count: archiveBookings.length },
  ];

  const archiveTabs = [
    { id: "all" as const, label: "全部", count: archiveBookings.length, icon: Filter },
    { id: "teacher" as const, label: "教师一级", count: teacherCount, icon: UserCheck },
    { id: "admin" as const, label: "管理员二级", count: adminCount, icon: Users },
    { id: "escalated" as const, label: "升级处理", count: escalatedCount, icon: TrendingUp },
  ];

  const getDisplayBookings = () => {
    switch (activeTab) {
      case "pending": return pendingBookings;
      case "approved": return approvedBookings;
      case "rejected": return rejectedBookings;
      case "archive": return filteredArchive;
    }
  };

  const displayBookings = getDisplayBookings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary font-serif">预约审批</h1>
          <p className="text-gray-500 mt-1">处理预约申请，查看审批轨迹</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gold/10 rounded-lg">
          <Users className="w-4 h-4 text-gold" />
          <span className="text-gold text-sm font-medium">
            当前角色：{currentUser?.role === "teacher" ? "教师" : currentUser?.role === "admin" ? "管理员" : "学生"}
          </span>
        </div>
      </div>

      {currentUser?.role === "student" && (
        <div className="card p-4 bg-yellow-50 border-l-4 border-yellow-500">
          <p className="text-yellow-800">
            <strong>提示：</strong>学生角色没有审批权限，请在右上角切换到教师或管理员身份进行审批操作。
          </p>
        </div>
      )}

      <div className="card p-1">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? "bg-white/20" : "bg-gray-200"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "archive" && (
        <div className="card p-2">
          <div className="flex gap-2 flex-wrap">
            {archiveTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setArchiveGroup(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${
                  archiveGroup === tab.id
                    ? "bg-primary-100 text-primary-700 font-medium shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`text-xs ${archiveGroup === tab.id ? "text-primary-600" : "text-gray-400"}`}>
                  ({tab.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {displayBookings.length === 0 ? (
        <div className="card p-12 text-center">
          {activeTab === "pending" ? (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <p className="text-gray-500 text-lg">太棒了！没有待处理的审批</p>
              <p className="text-gray-400 text-sm mt-2">所有预约申请都已处理完毕</p>
            </>
          ) : (
            <>
              <Filter className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">暂无{tabs.find(t => t.id === activeTab)?.label}记录</p>
            </>
          )}
        </div>
      ) : activeTab === "archive" ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">预约用途</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">班级</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">日期/时段</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">处理层级</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">处理人</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">处理意见</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">结果</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayBookings.map((b) => {
                const result = getFinalResult(b);
                const processor = getFinalProcessor(b);
                const group = getArchiveGroup(b);
                return (
                  <tr key={b.id} className="hover:bg-primary-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">{b.purpose || b.caseName}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.className}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{b.date}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                        group === "escalated" ? "bg-rose-100 text-rose-700" :
                        group === "admin" ? "bg-primary-100 text-primary-700" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>
                        {group === "escalated" && <TrendingUp className="w-3 h-3" />}
                        {group === "admin" && <ShieldAlert className="w-3 h-3" />}
                        {group === "teacher" && <UserCheck className="w-3 h-3" />}
                        {getGroupName(group)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {processor ? (
                        <div>
                          <div className="text-gray-900 font-medium">{processor.name}</div>
                          <div className="text-xs text-gray-400">{processor.role}审批</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                      {processor?.comment || <span className="text-gray-400 italic">无意见</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium text-sm ${result.color}`}>
                        {result.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {displayBookings.map((booking) => (
            <ApprovalCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
