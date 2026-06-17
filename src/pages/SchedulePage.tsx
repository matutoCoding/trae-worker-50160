import { WeeklySchedule } from "@/components/Schedule/WeeklySchedule";

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary font-serif">教室排期</h1>
        <p className="text-gray-500 mt-1">查看和管理所有法庭教室的预约排期</p>
      </div>
      <WeeklySchedule />
    </div>
  );
}
