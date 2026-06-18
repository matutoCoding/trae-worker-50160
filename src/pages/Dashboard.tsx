import { useAppStore } from "@/store";
import { useBookingStats } from "@/hooks/useOvertimeCheck";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Video,
  GraduationCap,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { getSlotDurationMinutes } from "@/utils/time";

export default function Dashboard() {
  const { currentUser, bookings, classrooms } = useAppStore();
  const stats = useBookingStats();
  const navigate = useNavigate();

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-primary font-serif">班级预约排行</h2>
            </div>
            <button
              onClick={() => navigate('/bookings')}
              className="text-xs text-primary/60 hover:text-primary flex items-center gap-1 transition-colors"
            >
              查看全部
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {useMemo(() => {
              const classMap: Record<string, { count: number; minutes: number }> = {};
              bookings.forEach((b) => {
                if (b.status === 'cancelled' || b.status === 'rejected') return;
                if (!b.className) return;
                if (!classMap[b.className]) {
                  classMap[b.className] = { count: 0, minutes: 0 };
                }
                classMap[b.className].count += 1;
                classMap[b.className].minutes += getSlotDurationMinutes(b.startSlot, b.endSlot);
              });
              return Object.entries(classMap)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 5)
                .map(([className, data], index) => (
                  <div
                    key={className}
                    onClick={() => navigate(`/bookings?search=${encodeURIComponent(className)}`)}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors group"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-gold text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 group-hover:text-primary transition-colors">{className}</p>
                      <p className="text-xs text-gray-500">
                        累计时长 {Math.floor(data.minutes / 60)}小时{data.minutes % 60}分钟
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{data.count}</p>
                      <p className="text-xs text-gray-500">次预约</p>
                    </div>
                  </div>
                ));
            }, [bookings, navigate])}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-primary font-serif">用途时长分析</h2>
            </div>
            <button
              onClick={() => navigate('/bookings')}
              className="text-xs text-primary/60 hover:text-primary flex items-center gap-1 transition-colors"
            >
              查看全部
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {useMemo(() => {
              const purposeMap: Record<string, { minutes: number; count: number }> = {};
              bookings.forEach((b) => {
                if (b.status === 'cancelled' || b.status === 'rejected') return;
                const purpose = b.purpose || b.caseName || '未填写';
                if (!purposeMap[purpose]) {
                  purposeMap[purpose] = { minutes: 0, count: 0 };
                }
                purposeMap[purpose].minutes += getSlotDurationMinutes(b.startSlot, b.endSlot);
                purposeMap[purpose].count += 1;
              });
              const maxMinutes = Math.max(...Object.values(purposeMap).map((v) => v.minutes), 1);
              return Object.entries(purposeMap)
                .sort((a, b) => b[1].minutes - a[1].minutes)
                .slice(0, 5)
                .map(([purpose, data], index) => (
                  <div
                    key={purpose}
                    onClick={() => navigate(`/bookings?search=${encodeURIComponent(purpose)}`)}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-800 group-hover:text-primary transition-colors text-sm truncate">
                        {purpose}
                      </p>
                      <p className="text-sm font-bold text-primary ml-2 whitespace-nowrap">
                        {Math.floor(data.minutes / 60)}h{data.minutes % 60}m
                      </p>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all"
                        style={{ width: `${(data.minutes / maxMinutes) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{data.count}次预约</p>
                  </div>
                ));
            }, [bookings, navigate])}
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
