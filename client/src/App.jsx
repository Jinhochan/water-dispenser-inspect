import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Monitor, ClipboardList, Users, Nfc, Settings, Menu, X, Droplets, LogOut
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import DeviceDetail from './pages/DeviceDetail';
import Maintenance from './pages/Maintenance';
import UserManage from './pages/UserManage';
import NfcConfig from './pages/NfcConfig';
import FeishuConfig from './pages/FeishuConfig';
import SubmitForm from './pages/SubmitForm';
import Login from './pages/Login';

const ALL_NAV = [
  { path: '/', label: '总览', icon: LayoutDashboard, element: Dashboard },
  { path: '/devices', label: '设备管理', icon: Monitor, element: Devices },
  { path: '/devices/:id', element: DeviceDetail },
  { path: '/maintenance', label: '维保记录', icon: ClipboardList, element: Maintenance },
  { path: '/users', label: '人员管理', icon: Users, element: UserManage },
  { path: '/nfc-config', label: 'NFC 配置', icon: Nfc, element: NfcConfig },
  { path: '/feishu-config', label: '飞书配置', icon: Settings, element: FeishuConfig },
];

function getStoredUser() {
  try {
    const raw = localStorage.getItem('wd_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser);

  // SubmitForm page has its own layout (no sidebar)
  if (location.pathname.startsWith('/submit/')) {
    return (
      <Routes>
        <Route path="/submit/:deviceCode" element={<SubmitForm />} />
      </Routes>
    );
  }

  // Not logged in
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const permissions = user.permissions || [];
  const isAdmin = user.role === 'admin';

  // Filter nav items based on permissions
  const navItems = ALL_NAV.filter(n => n.label && (isAdmin || permissions.includes(n.path)));

  const handleLogout = () => {
    localStorage.removeItem('wd_user');
    setUser(null);
  };

  // Check if a path is accessible
  const canAccess = (path) => {
    if (isAdmin) return true;
    if (path.startsWith('/devices/')) return permissions.includes('/devices');
    return permissions.includes(path);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">饮水机巡检</h1>
            <p className="text-xs text-gray-500">管理系统</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">{user.name} ({user.employee_id})</span>
            <button onClick={handleLogout} className="p-1 rounded hover:bg-gray-100" title="退出登录">
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <p className="text-xs text-gray-400">v1.0.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-sm font-semibold text-gray-900">饮水机巡检管理系统</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Routes>
            {ALL_NAV.map(nav => {
              const Element = nav.element;
              if (!Element) return null;
              // Check access
              const path = nav.path;
              if (!canAccess(path)) {
                return <Route key={path} path={path} element={<Navigate to="/" replace />} />;
              }
              return <Route key={path} path={path} element={<Element />} />;
            })}
          </Routes>
        </main>
      </div>
    </div>
  );
}
