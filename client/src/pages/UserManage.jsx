import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Shield, Wrench, Eye as EyeIcon } from 'lucide-react';
import { api } from '../utils/api';

const ROLE_OPTIONS = [
  { value: 'admin', label: '系统管理员', cls: 'bg-purple-100 text-purple-700', icon: Shield },
  { value: 'maintainer', label: '维保人员', cls: 'bg-blue-100 text-blue-700', icon: Wrench },
  { value: 'viewer', label: '企业管理者', cls: 'bg-gray-100 text-gray-700', icon: EyeIcon },
];

const ROLE_MAP = Object.fromEntries(ROLE_OPTIONS.map(r => [r.value, r]));

const PAGE_OPTIONS = [
  { path: '/', label: '总览' },
  { path: '/devices', label: '设备管理' },
  { path: '/maintenance', label: '维保记录' },
  { path: '/users', label: '人员管理' },
  { path: '/nfc-config', label: 'NFC 配置' },
  { path: '/feishu-config', label: '飞书配置' },
];

export default function UserManage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', employee_id: '', phone: '', role: 'maintainer', permissions: [] });

  const fetchUsers = () => {
    setLoading(true);
    api.getUsers().then(data => setUsers(data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => {
    setEditUser(null);
    setForm({ name: '', employee_id: '', phone: '', role: 'maintainer', permissions: ['/'] });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ ...user, permissions: user.permissions || [] });
    setShowModal(true);
  };

  const togglePermission = (path) => {
    const perms = [...form.permissions];
    const idx = perms.indexOf(path);
    if (idx >= 0) perms.splice(idx, 1);
    else perms.push(path);
    setForm({ ...form, permissions: perms });
  };

  const selectAllPerms = () => setForm({ ...form, permissions: PAGE_OPTIONS.map(p => p.path) });
  const clearAllPerms = () => setForm({ ...form, permissions: [] });

  // Auto-set permissions based on role
  const handleRoleChange = (role) => {
    let perms = form.permissions;
    if (role === 'admin') perms = PAGE_OPTIONS.map(p => p.path);
    else if (role === 'viewer') perms = ['/'];
    else if (role === 'maintainer') perms = ['/', '/devices', '/maintenance'];
    setForm({ ...form, role, permissions: perms });
  };

  const handleSave = async () => {
    try {
      if (editUser) {
        await api.updateUser(editUser.id, form);
      } else {
        await api.createUser(form);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除该人员？删除后将取消其系统授权。')) return;
    try {
      await api.deleteUser(id);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">人员管理</h2>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <Plus className="w-4 h-4" /> 添加人员
        </button>
      </div>

      {/* Permission rules */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">权限规则</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {ROLE_OPTIONS.map(r => {
            const Icon = r.icon;
            return (
              <div key={r.value} className="flex items-start gap-2">
                <Icon className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-blue-900">{r.label}</span>
                  <p className="text-blue-700 mt-0.5">
                    {r.value === 'admin' && '全模块操作权限，可管理所有设备、人员、配置'}
                    {r.value === 'maintainer' && '提交维保记录、查看对应设备信息，需工号核验'}
                    {r.value === 'viewer' && '数据看板只读权限'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">加载中...</div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <p className="text-sm">暂无授权人员</p>
          <button onClick={openAdd} className="mt-2 text-sm text-primary-600 hover:underline">添加第一位人员</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">姓名</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">工号</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500 hidden sm:table-cell">手机号</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">角色</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500 hidden md:table-cell">可访问页面</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => {
                  const role = ROLE_MAP[u.role] || ROLE_MAP.maintainer;
                  const perms = u.permissions || [];
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5 text-gray-900 font-medium">{u.name}</td>
                      <td className="px-5 py-2.5 text-gray-600 font-mono">{u.employee_id}</td>
                      <td className="px-5 py-2.5 text-gray-600 hidden sm:table-cell">{u.phone || '-'}</td>
                      <td className="px-5 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${role.cls}`}>{role.label}</span>
                      </td>
                      <td className="px-5 py-2.5 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {u.role === 'admin' ? (
                            <span className="text-xs text-gray-500">全部页面</span>
                          ) : perms.map(p => {
                            const pg = PAGE_OPTIONS.find(x => x.path === p);
                            return pg ? (
                              <span key={p} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{pg.label}</span>
                            ) : null;
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(u)} className="p-1 rounded hover:bg-gray-100">
                            <Edit className="w-4 h-4 text-gray-400" />
                          </button>
                          <button onClick={() => handleDelete(u.id)} className="p-1 rounded hover:bg-red-50">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">{editUser ? '编辑人员' : '添加人员'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">姓名 <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="请输入姓名"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">工号 <span className="text-red-500">*</span></label>
                <input type="text" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} placeholder="如 EMP001"
                  disabled={!!editUser} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">手机号</label>
                <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="请输入手机号"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">角色</label>
                <select value={form.role} onChange={e => handleRoleChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {/* Permission checkboxes */}
              {form.role !== 'admin' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-700">可访问页面</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={selectAllPerms} className="text-xs text-primary-600 hover:underline">全选</button>
                      <button type="button" onClick={clearAllPerms} className="text-xs text-gray-500 hover:underline">清空</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PAGE_OPTIONS.map(pg => (
                      <label key={pg.path} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        form.permissions.includes(pg.path) ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(pg.path)}
                          onChange={() => togglePermission(pg.path)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{pg.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {form.role === 'admin' && (
                <p className="text-xs text-gray-500">管理员拥有全部页面访问权限</p>
              )}
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
