import { useEffect, useState } from 'react';
import { Search, Download, Eye, X } from 'lucide-react';
import { api } from '../utils/api';

const TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: '巡检', label: '巡检' },
  { value: '维保', label: '维保' },
  { value: '维修', label: '维修' },
];

const STATUS_CLS = {
  '已完成': 'bg-emerald-100 text-emerald-700',
  '处理中': 'bg-amber-100 text-amber-700',
  '待处理': 'bg-gray-100 text-gray-700',
};

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const fetchRecords = () => {
    setLoading(true);
    const params = { page: 1, pageSize: 100 };
    if (search) params.search = search;
    if (type) params.type = type;
    api.getMaintenance(params).then(data => {
      setRecords(data.list || []);
      setTotal(data.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRecords(); }, [search, type]);

  const handleExport = () => {
    const url = api.exportMaintenance({ search, type });
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">维保记录</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          导出 CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索设备编码、维保人或内容..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <p className="text-xs text-gray-500">共 {total} 条记录</p>

      {/* Records table */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">加载中...</div>
      ) : records.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">暂无维保记录</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">设备编码</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500 hidden sm:table-cell">位置</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">维保类型</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500 hidden md:table-cell">维保内容</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">维保人</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">日期</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">状态</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500 w-10">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-gray-900 font-medium">{r.device_code}</td>
                    <td className="px-5 py-2.5 text-gray-600 hidden sm:table-cell">{r.device_location}</td>
                    <td className="px-5 py-2.5 text-gray-900">{r.maintenance_type}</td>
                    <td className="px-5 py-2.5 text-gray-600 max-w-xs truncate hidden md:table-cell">{r.content || '-'}</td>
                    <td className="px-5 py-2.5 text-gray-600">{r.handler_name}</td>
                    <td className="px-5 py-2.5 text-gray-500 whitespace-nowrap">{r.created_at?.slice(0, 16)}</td>
                    <td className="px-5 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLS[r.status] || 'bg-gray-100 text-gray-700'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5">
                      <button onClick={() => setDetail(r)} className="p-1 rounded hover:bg-gray-100">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">维保记录详情</h3>
              <button onClick={() => setDetail(null)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: '设备编码', value: detail.device_code },
                { label: '位置', value: `${detail.building || ''} ${detail.device_location || ''}` },
                { label: '维保类型', value: detail.maintenance_type },
                { label: '维保内容', value: detail.content },
                { label: '维保人', value: `${detail.handler_name} (${detail.handler_id})` },
                { label: '设备状态', value: detail.device_status },
                { label: '问题描述', value: detail.problem_desc },
                { label: '处理结果', value: detail.result },
                { label: '处理状态', value: detail.status },
                { label: '日期', value: detail.created_at?.slice(0, 16) },
              ].map(f => (
                <div key={f.label} className="flex gap-4">
                  <span className="text-xs text-gray-500 w-16 shrink-0">{f.label}</span>
                  <span className="text-sm text-gray-900">{f.value || '-'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
