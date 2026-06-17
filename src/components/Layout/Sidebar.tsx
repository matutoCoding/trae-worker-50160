import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Building2,
  FileText,
  ClipboardList,
  CheckSquare,
  Bell,
  Video,
  Scale,
  User,
  Settings,
} from 'lucide-react';
import { useAppStore } from '@/store';

const navItems = [
  { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard, roles: ['student', 'teacher', 'admin'] },
  { path: '/schedule', label: '教室排期', icon: Calendar, roles: ['student', 'teacher', 'admin'] },
  { path: '/bookings', label: '预约管理', icon: ClipboardList, roles: ['student', 'teacher', 'admin'] },
  { path: '/approval', label: '预约审批', icon: CheckSquare, roles: ['teacher', 'admin'] },
  { path: '/overtime', label: '超时催办', icon: Bell, roles: ['teacher', 'admin'] },
  { path: '/classrooms', label: '教室管理', icon: Building2, roles: ['admin'] },
  { path: '/recordings', label: '录像归档', icon: Video, roles: ['student', 'teacher', 'admin'] },
  { path: '/help', label: '帮助中心', icon: Settings, roles: ['student', 'teacher', 'admin'] },
];

export function Sidebar() {
  const currentUser = useAppStore((s) => s.currentUser);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const users = useAppStore((s) => s.users);
  const resetToMockData = useAppStore((s) => s.resetToMockData);

  const visibleItems = navItems.filter((item) =>
    currentUser ? item.roles.includes(currentUser.role) : true
  );

  return (
    <aside className="w-60 bg-gradient-to-b from-primary-900 to-primary-800 text-white flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center shadow-glow-gold">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-serif text-shadow-gold">模拟法庭</h1>
            <p className="text-xs text-primary-300">预约管理系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        {visibleItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `sidebar-link group ${isActive ? 'sidebar-link-active' : ''}`
            }
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-primary-700 space-y-3">
        <div className="px-4 py-3 bg-primary-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser?.name}</p>
              <p className="text-xs text-primary-300 truncate">{currentUser?.department}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <select
            value={currentUser?.id || ''}
            onChange={(e) => {
              const user = users.find((u) => u.id === e.target.value);
              setCurrentUser(user || null);
            }}
            className="w-full px-3 py-2 bg-primary-800 border border-primary-600 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <optgroup label="切换身份">
              {users.map((user) => (
                <option key={user.id} value={user.id} className="bg-primary-800">
                  {user.name} ({user.role === 'student' ? '学生' : user.role === 'teacher' ? '教师' : '管理员'})
                </option>
              ))}
            </optgroup>
          </select>

          <button
            onClick={resetToMockData}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary-300 hover:text-white hover:bg-primary-700 rounded-md transition-colors"
          >
            <Settings className="w-4 h-4" />
            重置数据
          </button>
        </div>
      </div>
    </aside>
  );
}
