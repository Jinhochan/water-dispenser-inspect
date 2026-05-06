import { useState } from 'react';
import { Droplets, LogIn, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

const ALL_PAGES = [
  { path: '/', label: '总览' },
  { path: '/devices', label: '设备管理' },
  { path: '/maintenance', label: '维保记录' },
  { path: '/users', label: '人员管理' },
  { path: '/nfc-config', label: 'NFC 配置' },
  { path: '/feishu-config', label: '飞书配置' },
];

export default function Login({ onLogin }) {
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!employeeId.trim()) return setError('请输入工号');
    setLoading(true);
    setError('');
    try {
      const data = await api.verifyUser({ employee_id: employeeId.trim(), name: name.trim() || undefined });
      // Save login info
      const user = {
        id: data.id,
        name: data.name,
        role: data.role,
        employee_id: employeeId.trim(),
        permissions: data.permissions || [],
      };
      localStorage.setItem('wd_user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">饮水机巡检管理系统</h1>
          <p className="text-sm text-gray-500 mt-1">请输入工号登录</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">工号 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={employeeId}
              onChange={e => { setEmployeeId(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="请输入工号"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">姓名 <span className="text-gray-400">(可选，用于核验)</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="请输入姓名"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? '登录中...' : '登录'}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          维保人员仅需工号即可提交记录，无需登录
        </p>
      </div>
    </div>
  );
}
