import { useAppStore } from "@/store";
import ClassroomCard, { AddClassroomButton } from "@/components/Classroom/ClassroomCard";
import { Building2, Search } from "lucide-react";
import { useState } from "react";

export default function ClassroomManagePage() {
  const { classrooms } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClassrooms = classrooms.filter(
    (c) =>
      c.name.includes(searchTerm) ||
      c.location.includes(searchTerm) ||
      c.equipment.some((e) => e.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary font-serif">教室资源管理</h1>
          <p className="text-gray-500 mt-1">管理模拟法庭教室资源，支持增删改查</p>
        </div>
        <AddClassroomButton />
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索教室名称、位置、设备..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gold/10 rounded-lg">
            <Building2 className="w-4 h-4 text-gold" />
            <span className="text-gold text-sm font-medium">
              共 {classrooms.length} 个教室
            </span>
          </div>
        </div>
      </div>

      {filteredClassrooms.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">暂无符合条件的教室</p>
          <p className="text-gray-400 text-sm mt-2">点击右上角按钮添加新教室</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClassrooms.map((classroom) => (
            <ClassroomCard key={classroom.id} classroom={classroom} />
          ))}
        </div>
      )}
    </div>
  );
}
