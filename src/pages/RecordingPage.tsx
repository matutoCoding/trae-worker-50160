import { useAppStore } from "@/store";
import { RecordingCard, AddRecordingButton } from "@/components/Recording/RecordingCard";
import { Video, Search } from "lucide-react";
import { useState } from "react";

export default function RecordingPage() {
  const { recordings, bookings } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [caseTypeFilter, setCaseTypeFilter] = useState<string>("all");

  const caseTypes = [
    { value: "all", label: "全部类型" },
    { value: "民事", label: "民事案件" },
    { value: "刑事", label: "刑事案件" },
    { value: "行政", label: "行政案件" },
    { value: "商事", label: "商事案件" },
    { value: "知识产权", label: "知识产权" },
  ];

  const filteredRecordings = recordings.filter((r) => {
    const booking = bookings.find((b) => b.id === r.bookingId);
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (r.title || "").toLowerCase().includes(searchLower) ||
      (r.caseName || "").toLowerCase().includes(searchLower) ||
      (booking?.className || "").toLowerCase().includes(searchLower) ||
      (r.caseType || "").toLowerCase().includes(searchLower);
    const matchesType = caseTypeFilter === "all" || r.caseType === caseTypeFilter;
    return matchesSearch && matchesType;
  });

  const totalDuration = recordings.reduce((sum, r) => sum + r.duration, 0);
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary font-serif">庭审录像归档</h1>
          <p className="text-gray-500 mt-1">管理和查看庭审录像资料</p>
        </div>
        <AddRecordingButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">录像总数</p>
              <p className="text-2xl font-bold text-primary">{recordings.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Video className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总时长</p>
              <p className="text-2xl font-bold text-primary">{formatDuration(totalDuration)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gold/20 rounded-lg">
              <Video className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-sm text-gray-500">本月新增</p>
              <p className="text-2xl font-bold text-primary">
                {recordings.filter((r) => {
                  const now = new Date();
                  const recordDate = new Date(r.recordedAt);
                  return (
                    recordDate.getMonth() === now.getMonth() &&
                    recordDate.getFullYear() === now.getFullYear()
                  );
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {caseTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setCaseTypeFilter(type.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  caseTypeFilter === type.value
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索录像标题、案件类型..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredRecordings.length === 0 ? (
        <div className="card p-12 text-center">
          <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">暂无录像记录</p>
          <p className="text-gray-400 text-sm mt-2">点击右上角按钮上传新录像</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRecordings.map((recording) => (
            <RecordingCard key={recording.id} recording={recording} />
          ))}
        </div>
      )}
    </div>
  );
}
