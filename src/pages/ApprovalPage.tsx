import { useState } from "react";
import { useAppStore } from "@/store";
import { canApprove } from "@/utils/approval";
import ApprovalCard from "@/components/Approval/ApprovalCard";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Clock, XCircle, Filter, Users } from "lucide-react";

export default function ApprovalPage() {
  const { bookings, currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");

  const pendingBookings = bookings.filter(
    (b) => b.status === "pending" && canApprove(b, currentUser)
  );

  const approvedBookings = bookings.filter(
    (b) => b.status === "approved" || b.status === "completed"
  );

  const rejectedBookings = bookings.filter((b) => b.status === "rejected");

  const tabs = [
    { id: "pending" as const, label: "待我审批", icon: Clock, count: pendingBookings.length },
    { id: "approved" as const, label: "已通过", icon: CheckCircle, count: approvedBookings.length },
    { id: "rejected" as const, label: "已驳回", icon: XCircle, count: rejectedBookings.length },
  ];

  const getDisplayBookings = () => {
    switch (activeTab) {
      case "pending":
        return pendingBookings;
      case "approved":
        return approvedBookings;
      case "rejected":
        return rejectedBookings;
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
