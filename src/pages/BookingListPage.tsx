import { useState } from "react";
import { useAppStore } from "@/store";
import BookingCard from "@/components/Booking/BookingCard";
import { Button } from "@/components/ui/Button";
import { Calendar, Filter, Search, LayoutGrid, List } from "lucide-react";

export default function BookingListPage() {
  const { bookings, currentUser } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const statusOptions = [
    { value: "all", label: "全部" },
    { value: "pending", label: "待审批" },
    { value: "approved", label: "已通过" },
    { value: "rejected", label: "已驳回" },
    { value: "cancelled", label: "已取消" },
    { value: "completed", label: "已完成" },
  ];

  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (booking.purpose || "").toLowerCase().includes(searchLower) ||
      (booking.caseName || "").toLowerCase().includes(searchLower) ||
      (booking.className || "").toLowerCase().includes(searchLower) ||
      (booking.createdBy?.name || "").toLowerCase().includes(searchLower) ||
      (booking.submittedBy || "").toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  const sortedBookings = [...filteredBookings].sort(
    (a, b) =>
      new Date(b.submittedAt || b.createdAt).getTime() -
      new Date(a.submittedAt || a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary font-serif">预约管理</h1>
          <p className="text-gray-500 mt-1">管理所有预约，支持时段合并和拆分</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gold/10 rounded-lg">
          <Calendar className="w-4 h-4 text-gold" />
          <span className="text-gold text-sm font-medium">
            共 {bookings.length} 条预约
          </span>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? "primary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索用途、班级、申请人..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow" : ""}`}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded ${viewMode === "list" ? "bg-white shadow" : ""}`}
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {sortedBookings.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">暂无符合条件的预约记录</p>
          <p className="text-gray-400 text-sm mt-2">尝试调整筛选条件或搜索关键词</p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              : "space-y-4"
          }
        >
          {sortedBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}
