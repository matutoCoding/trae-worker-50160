import OvertimeList from "@/components/Overtime/OvertimeList";

export default function OvertimePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary font-serif">超时催办中心</h1>
        <p className="text-gray-500 mt-1">监控审批节点超时情况，自动升级催办</p>
      </div>
      <OvertimeList />
    </div>
  );
}
