import { useAppStore } from "@/store";
import { useBookingStats } from "@/hooks/useOvertimeCheck";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Video,
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function Dashboard() {
  const { currentUser, bookings, classrooms } = useAppStore();
  const stats = useBookingStats();

  const statCards = [
    {
      title: "今日预约",
      value: stats.today,
      icon: Calendar,
      color: "bg-primary",
    },
    {
      title: "待我审批",
      value: stats.pendingApproval,
      icon: Clock,
      color: "bg-gold",
    },
    {
      title: "已通过",
      value: stats.approved,
      icon: CheckCircle,
      color: "bg-green-600",
    },
    {
      title: "超时未处理",
      value: stats.overtime,
      icon: AlertTriangle,
      color: "bg-red-600",
    },
  ];

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
      completed: "bg-blue-100 text-blue-800",
    };
    const labels: Record<string, string> = {
      pending: "待审批",
      approved: "已通过",
      rejected: "已驳回",
      cancelled: "已取消",
      completed: "已完成",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary font-serif">
            欢迎回来，{currentUser?.name}
          </h1>
          <p className="text-gray-500 mt-1">
            {format(new Date(), "yyyy年M月d日 EEEE", { locale: zhCN })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-lg">
          <Users className="w-5 h-5 text-gold" />
          <span className="text-gold font-medium">
            {currentUser?.role === "admin" ? "管理员" : currentUser?.role === "teacher" ? "教师" : "学生"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-3xl font-bold mt-2 text-primary">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-primary font-serif">最近预约</h2>
            <span className="text-sm text-gray-500">共 {bookings.length} 条记录</span>
          </div>
          <div className="space-y-3">
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无预约记录</p>
              </div>
            ) : (
              recentBookings.map((booking) => {
                const classroom = classrooms.find((c) => c.id === booking.classroomId);
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Video className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-primary">{booking.purpose || booking.caseName || booking.className}</p>
                        <p className="text-sm text-gray-500">
                          {classroom?.name} · {booking.className} · {booking.date}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-primary font-serif mb-4">法庭教室资源</h2>
          <div className="space-y-3">
            {classrooms.map((classroom) => (
              <div key={classroom.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-primary">{classroom.name}</span>
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {classroom.capacity}座
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <span>{classroom.location}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {classroom.equipment.slice(0, 3).map((eq, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary font-serif">系统功能概览</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "教室排期",
              desc: "周视图展示所有预约，支持拖拽选择时段",
              icon: Calendar,
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
            {
              title: "占用合并拆分",
              desc: "相邻时段自动合并，中途退订自动拆分",
              icon: TrendingUp,
              color: "text-green-600",
              bgColor: "bg-green-50",
            },
            {
              title: "多级审批",
              desc: "教师+管理员两级审批，轨迹全程留痕",
              icon: CheckCircle,
              color: "text-purple-600",
              bgColor: "bg-purple-50",
            },
            {
              title: "超时催办",
              desc: "超时自动升级，记录责任人，三级预警",
              icon: AlertTriangle,
              color: "text-orange-600",
              bgColor: "bg-orange-50",
            },
          ].map((item, index) => (
            <div key={index} className={`p-4 ${item.bgColor} rounded-lg`}>
              <item.icon className={`w-8 h-8 ${item.color} mb-2`} />
              <h3 className="font-bold text-gray-800">{item.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
