import { useEffect, useState } from 'react';
import { Monitor, Wrench, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../utils/api';

const STATUS_MAP = {
  normal: { label: '正常', color: 'text-emerald-600', bg: 'bg-emerald-50', bar: '#10b981' },
  repair: { label: '维修中', color: 'text-amber-600', bg: 'bg-amber-50', bar: '#f59e0b' },
  replace: { label: '待更换', color: 'text-red-600', bg: 'bg-red-50', bar: '#ef4444' },
};

const TYPE_MAP = { '巡检': 'text-blue-600', '维保': 'text-emerald-600', '维修': 'text-amber-600' };

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [statusDist, setStatusDist] = useState([]);
  const [buildingDist, setBuildingDist] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getOverview(),
      api.getDeviceStatus(),
      api.getBuildingDistribution(),
      api.getRecentMaintenance(),
    ]).then(([ov, sd, bd, rm]) => {
      setOverview(ov);
      setStatusDist(sd.items || []);
      setBuildingDist(bd || []);
      setRecentRecords(rm || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>;
  }

  const cards = [
    { label: '设备总数', value: overview?.totalDevices ?? 0, icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '本月维保', value: overview?.monthlyMaintenance ?? 0, icon: Wrench, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '逾期维保', value: overview?.overdueDevices ?? 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '正常运转', value: `${overview?.normalRate ?? '0'}%`, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">数据总览</h2>
        <span className="text-sm text-gray-500">设备总数: {overview?.totalDevices ?? 0}</span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device status distribution */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">设备状态分布</h3>
          <div className="space-y-3">
            {statusDist.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16">{item.label}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">{item.value}台</span>
                <span className="text-xs text-gray-400 w-12 text-right">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Building distribution */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">楼栋设备分布</h3>
          {buildingDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={buildingDist} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="building" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  formatter={(value) => [`${value} 台`, '设备数']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {buildingDist.map((_, index) => (
                    <Cell key={index} fill={['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">暂无数据</div>
          )}
        </div>
      </div>

      {/* Recent maintenance records */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">最近维保记录</h3>
        </div>
        {recentRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">设备编码</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">位置</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">维保类型</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">维保人</th>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500">日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-gray-900 font-medium">{r.device_code}</td>
                    <td className="px-5 py-2.5 text-gray-600">{r.location}</td>
                    <td className="px-5 py-2.5">
                      <span className={`font-medium ${TYPE_MAP[r.maintenance_type] || 'text-gray-600'}`}>
                        {r.maintenance_type}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-gray-600">{r.handler_name}</td>
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
