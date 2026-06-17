import { Clock, User, AlertTriangle, TrendingUp, Bell } from 'lucide-react';
import { useAppStore } from '@/store';
import { OvertimeBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function OvertimeList() {
  const { bookings, users, classrooms, checkAndProcessOvertime } = useAppStore();

  const overtimeBookings = bookings.filter(
    (b) => b.overtimeRecords.length > 0 && b.status === 'pending'
  );

  const allOvertimeRecords = bookings.flatMap((b) =>
    b.overtimeRecords.map((r) => ({ ...r, booking: b }))
  ).sort((a, b) => new Date(b.overtimeAt).getTime() - new Date(a.overtimeAt).getTime());

  const stats = {
    total: allOvertimeRecords.length,
    level1: allOvertimeRecords.filter((r) => r.escalationLevel === 1).length,
    level2: allOvertimeRecords.filter((r) => r.escalationLevel === 2).length,
    level3: allOvertimeRecords.filter((r) => r.escalationLevel === 3).length,
  };

  const byPerson: Record<string, number> = {};
  allOvertimeRecords.forEach((r) => {
    byPerson[r.responsiblePersonId] = (byPerson[r.responsiblePersonId] || 0) + 1;
  });

  function getPersonName(id: string) {
    return users.find((u) => u.id === id)?.name || '未知';
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary font-serif">超时监控</h2>
          <p className="text-sm text-gray-500">实时监控审批节点超时情况</p>
        </div>
        <Button onClick={checkAndProcessOvertime}>
          <Bell className="w-4 h-4 mr-1" />
          立即检测
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-amber-700">预警通知</p>
              <p className="text-2xl font-bold text-amber-800">{stats.level1}</p>
            </div>
          </div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-orange-700">已升级</p>
              <p className="text-2xl font-bold text-orange-800">{stats.level2}</p>
            </div>
          </div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-white animate-pulse">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-red-700">紧急处理</p>
              <p className="text-2xl font-bold text-red-800">{stats.level3}</p>
            </div>
          </div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center text-white">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-700">涉及责任人</p>
              <p className="text-2xl font-bold text-gray-800">{Object.keys(byPerson).length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-primary">超时审批列表</h3>
            </div>
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {overtimeBookings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无超时审批</p>
                </div>
              ) : (
                overtimeBookings.map((booking) => {
                  const classroom = classrooms.find((c) => c.id === booking.classroomId);
                  const latestRecord = booking.overtimeRecords[booking.overtimeRecords.length - 1];
                  const highestLevel = Math.max(
                    ...booking.overtimeRecords.map((r) => r.escalationLevel)
                  ) as 1 | 2 | 3;

                  return (
                    <div
                      key={booking.id}
                      className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${
                        highestLevel === 3
                          ? 'border-red-300 bg-red-50'
                          : highestLevel === 2
                          ? 'border-orange-300 bg-orange-50'
                          : 'border-amber-300 bg-amber-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-primary font-serif">
                            {booking.caseName}
                          </h4>
                          <p className="text-sm text-gray-600">{booking.className}</p>
                        </div>
                        <OvertimeBadge level={highestLevel} />
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">教室：</span>
                          {classroom?.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">最新记录：</span>
                          {latestRecord.message}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">责任人：</span>
                          <span className="text-red-600 font-medium">
                            {getPersonName(latestRecord.responsiblePersonId)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-primary">责任人统计</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {Object.entries(byPerson).length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    暂无责任人记录
                  </div>
                ) : (
                  Object.entries(byPerson)
                    .sort((a, b) => b[1] - a[1])
                    .map(([personId, count]) => {
                      const person = users.find((u) => u.id === personId);
                      const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                      return (
                        <div key={personId}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {person?.name || '未知'}
                            </span>
                            <span className="text-sm text-gray-500">{count} 次</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-primary">催办历史</h3>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto">
              <div className="space-y-3">
                {allOvertimeRecords.slice(0, 10).map((record) => {
                  const booking = record.booking;
                  return (
                    <div
                      key={record.id}
                      className="text-sm border-b border-gray-100 pb-2 last:border-0"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <OvertimeBadge level={record.escalationLevel as 1 | 2 | 3} />
                        <span className="text-gray-500 text-xs">
                          {formatDate(record.overtimeAt)}
                        </span>
                      </div>
                      <p className="text-gray-700">{record.message}</p>
                      <p className="text-xs text-gray-500">
                        {booking.className} · {getPersonName(record.responsiblePersonId)}
                      </p>
                    </div>
                  );
                })}
                {allOvertimeRecords.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    暂无催办记录
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
