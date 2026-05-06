import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { api } from '../utils/api';

const STATUS_MAP = {
  normal: { label: '正常', cls: 'bg-emerald-100 text-emerald-700' },
  repair: { label: '维修中', cls: 'bg-amber-100 text-amber-700' },
  replace: { label: '待更换', cls: 'bg-red-100 text-red-700' },
};

export default function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [records, setRecords] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDevice(id).then(data => {
      setDevice(data);
      setRecords(data.records || []);
      setForm(data);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    try {
      await api.updateDevice(id, form);
      setDevice({ ...device, ...form });
      setEditing(false);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>;
  if (!device) return <div className="flex items-center justify-center h-64 text-gray-400">设备不存在</div>;

  const st = STATUS_MAP[device.status] || STATUS_MAP.normal;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/devices')} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900 flex-1">设备详情</h2>
        {!editing && (
          <button
            onClick={() => { setEditing(true); setForm(device); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" />
            编辑
          </button>
        )}
      </div>

      {/* Device info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-base font-semibold text-gray-900">{device.code}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
        </div>

        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'brand', label: '品牌' },
              { key: 'type', label: '设备类型' },
              { key: 'location', label: '位置' },
              { key: 'building', label: '楼栋' },
              { key: 'floor', label: '楼层' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type="text"
                  value={form[f.key] || ''}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">状态</label>
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
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700">
                <Save className="w-4 h-4" /> 保存
              </button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                <X className="w-4 h-4" /> 取消
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-8">
            {[
              { label: '品牌', value: device.brand },
              { label: '设备类型', value: device.type },
              { label: '位置', value: device.location },
              { label: '楼栋', value: device.building },
              { label: '楼层', value: device.floor },
              { label: 'NFC URL', value: device.nfc_url },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-gray-500">{f.label}</p>
                <p className="text-sm text-gray-900 mt-0.5">{f.value || '-'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maintenance history */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">历史维保记录 ({records.length})</h3>
        </div>
        {records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">维保类型</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">维保内容</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">维保人</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">状态</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-gray-900 font-medium">{r.maintenance_type}</td>
                    <td className="px-5 py-2.5 text-gray-600 max-w-xs truncate">{r.content || '-'}</td>
                    <td className="px-5 py-2.5 text-gray-600">{r.handler_name} ({r.handler_id})</td>
                    <td className="px-5 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === '已完成' ? 'bg-emerald-100 text-emerald-700' :
                        r.status === '处理中' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-5 py-2.5 text-gray-500">{r.created_at?.slice(0, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">暂无维保记录</div>
        )}
      </div>
    </div>
  );
}
