import { useState, useMemo } from "react";
import { useAppStore } from "@/store";
import BookingCard from "@/components/Booking/BookingCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Calendar, Filter, Search, LayoutGrid, List, CheckSquare, Square, Download, XCircle, Trash2 } from "lucide-react";
import { TIME_SLOT_CONFIG, STATUS_LABELS } from "@/types";
import type { Booking } from "@/types";
import { formatSlotRange } from "@/utils/time";

export default function BookingListPage() {
  const { bookings, currentUser, users, classrooms, batchCancelBookings } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchCancelModal, setShowBatchCancelModal] = useState(false);

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

  const cancellableBookings = sortedBookings.filter(
    (b) => b.status !== "cancelled" && b.status !== "rejected"
  );

  const allSelected = cancellableBookings.length > 0 && 
    cancellableBookings.every((b) => selectedIds.includes(b.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cancellableBookings.map((b) => b.id));
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleBatchCancel() {
    if (selectedIds.length === 0) return;
    batchCancelBookings(selectedIds);
    setSelectedIds([]);
    setShowBatchCancelModal(false);
  }

  function exportBookings() {
    const bookingsToExport = selectedIds.length > 0
      ? sortedBookings.filter((b) => selectedIds.includes(b.id))
      : sortedBookings;

    if (bookingsToExport.length === 0) {
      alert("没有可导出的预约记录");
      return;
    }

    const headers = ["班级", "用途", "申请人", "日期", "时段", "审批状态"];
    const rows = bookingsToExport.map((b) => {
      const submitter = users.find((u) => u.id === b.submittedBy)?.name || b.createdBy?.name || "未知";
      return [
        b.className,
        b.purpose || b.caseName || "",
        submitter,
        b.date,
        formatSlotRange(b.startSlot, b.endSlot),
        STATUS_LABELS[b.status] || b.status,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `预约清单_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

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
          <div className="flex flex-wrap gap-2 items-center">
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
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-primary" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>全选可取消项</span>
            </button>
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

      {selectedIds.length > 0 && (
        <div className="card p-3 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-primary" />
              <span className="font-medium text-primary">
                已选择 {selectedIds.length} 条预约
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={exportBookings}
              >
                <Download className="w-4 h-4 mr-1" />
                导出选中
              </Button>
              {currentUser?.role === "student" && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowBatchCancelModal(true)}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  批量取消
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                取消选择
              </Button>
            </div>
          </div>
        </div>
      )}

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
            <BookingCard
              key={booking.id}
              booking={booking}
              viewMode={viewMode}
              selectable={true}
              isSelected={selectedIds.includes(booking.id)}
              onToggleSelect={toggleSelectOne}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showBatchCancelModal}
        onClose={() => setShowBatchCancelModal(false)}
        title="批量取消预约"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">
              确认要取消选中的 {selectedIds.length} 条预约吗？此操作不可撤销。
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setShowBatchCancelModal(false)}
            >
              取消
            </Button>
            <Button variant="danger" onClick={handleBatchCancel}>
              <XCircle className="w-4 h-4 mr-1" />
              确认取消
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
