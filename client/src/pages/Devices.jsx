import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit, Trash2, RefreshCw, X } from 'lucide-react';
import { api } from '../utils/api';

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'normal', label: '正常' },
  { value: 'repair', label: '维修中' },
  { value: 'replace', label: '待更换' },
];

const STATUS_MAP = {
  normal: { label: '正常', cls: 'bg-emerald-100 text-emerald-700' },
  repair: { label: '维修中', cls: 'bg-amber-100 text-amber-700' },
  replace: { label: '待更换', cls: 'bg-red-100 text-red-700' },
};

export default function Devices() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [building, setBuilding] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  const [form, setForm] = useState({ code: '', brand: '', type: '饮水机', location: '', building: '', floor: '', status: 'normal' });
  const [syncing, setSyncing] = useState(false);

  const fetchDevices = () => {
    setLoading(true);
    const params = { page: 1, pageSize: 100 };
    if (search) params.search = search;
    if (building) params.building = building;
    if (status) params.status = status;
    api.getDevices(params).then(data => {
      setDevices(data.list || []);
      setTotal(data.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDevices(); }, [search, building, status]);

  const buildings = [...new Set(devices.map(d => d.building).filter(Boolean))];

  const openAdd = () => {
    setEditDevice(null);
    setForm({ code: '', brand: '', type: '饮水机', location: '', building: '', floor: '', status: 'normal' });
    setShowModal(true);
  };

  const openEdit = (device) => {
    setEditDevice(device);
    setForm({ ...device });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editDevice) {
        await api.updateDevice(editDevice.id, form);
      } else {
        await api.createDevice(form);
      }
      setShowModal(false);
      fetchDevices();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除该设备？')) return;
    try {
      await api.deleteDevice(id);
      fetchDevices();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSyncFeishu = async () => {
    setSyncing(true);
    try {
      const result = await api.syncFeishu();
      alert(result.message || '同步成功');
      fetchDevices();
    } catch (err) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">设备管理</h2>
        <div className="flex gap-2">
          <button
            onClick={handleSyncFeishu}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            从飞书同步
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            添加设备
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索设备编码或位置..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={building}
          onChange={e => setBuilding(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">全部楼栋</option>
          {buildings.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <p className="text-xs text-gray-500">共 {total} 台设备</p>

      {/* Device cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">加载中...</div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <p className="text-sm">暂无设备数据</p>
          <button onClick={openAdd} className="mt-2 text-sm text-primary-600 hover:underline">添加第一台设备</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map(device => {
            const st = STATUS_MAP[device.status] || STATUS_MAP.normal;
            return (
              <div key={device.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{device.code}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{device.brand} · {device.type}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{device.building} {device.floor} · {device.location}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/devices/${device.id}`)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    查看详情
                  </button>
                  <button
                    onClick={() => openEdit(device)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(device.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">{editDevice ? '编辑设备' : '添加设备'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { key: 'code', label: '设备编码', placeholder: '如 WS-A1-001' },
                { key: 'brand', label: '品牌', placeholder: '如 美的、沁园' },
                { key: 'type', label: '设备类型', placeholder: '饮水机/净水器' },
                { key: 'location', label: '位置', placeholder: '如 1楼大厅东侧' },
                { key: 'building', label: '楼栋', placeholder: '如 A栋' },
                { key: 'floor', label: '楼层', placeholder: '如 1F' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type="text"
                    value={form[f.key] || ''}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    disabled={f.key === 'code' && !!editDevice}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">设备状态</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="normal">正常</option>
                  <option value="repair">维修中</option>
                  <option value="replace">待更换</option>
                </select>
              </div>
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
