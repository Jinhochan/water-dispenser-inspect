import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Droplets, Send } from 'lucide-react';
import { api } from '../utils/api';

const TYPE_OPTIONS = ['巡检', '维保', '维修'];
const STATUS_OPTIONS = [
  { value: 'normal', label: '正常' },
  { value: 'repair', label: '维修中' },
  { value: 'replace', label: '待更换' },
];

export default function SubmitForm() {
  const { deviceCode } = useParams();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');

  const [form, setForm] = useState({
    maintenance_type: '巡检',
    content: '',
    handler_name: '',
    handler_id: '',
    device_status: 'normal',
    problem_desc: '',
    result: '',
  });

  // Load device info by code
  useEffect(() => {
    setLoading(true);
    api.getDevices({ search: deviceCode, pageSize: 1 }).then(data => {
      const found = (data.list || []).find(d => d.code === deviceCode);
      if (found) {
        setDevice(found);
        setForm(prev => ({ ...prev, device_status: found.status }));
      } else {
        setError('设备不存在，请检查 NFC 标签');
      }
    }).catch(() => setError('加载设备信息失败')).finally(() => setLoading(false));
  }, [deviceCode]);

  // Verify employee ID when both name and id are filled
  const handleVerify = async () => {
    if (!form.handler_id || !form.handler_name) return;
    try {
      await api.verifyUser({ employee_id: form.handler_id, name: form.handler_name });
      setVerifyMsg('');
    } catch (err) {
      setVerifyMsg(err.message);
    }
  };

  const handleSubmit = async () => {
    if (!form.handler_name.trim()) return alert('请输入您的姓名');
    if (!form.handler_id.trim()) return alert('请输入您的工号');
    if (!form.content.trim()) return alert('请填写维保内容');

    setSubmitting(true);
    try {
      await api.createMaintenance({
        ...form,
        device_code: deviceCode,
      });
      setSubmitted(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">{error}</p>
          <p className="text-gray-500 text-sm mt-1">设备编码: {deviceCode}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">提交成功</h2>
          <p className="text-gray-600 text-sm mb-1">维保记录已保存</p>
          <p className="text-gray-500 text-sm">设备: {deviceCode}</p>
          <button
            onClick={() => { setSubmitted(false); setForm(prev => ({ ...prev, content: '', problem_desc: '', result: '' })); }}
            className="mt-6 px-6 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            继续填报
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">设备维保填报</h1>
            <p className="text-xs text-gray-500">饮水机巡检管理系统</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Device info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">{device.code}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              device.status === 'normal' ? 'bg-emerald-100 text-emerald-700' :
              device.status === 'repair' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {device.status === 'normal' ? '正常' : device.status === 'repair' ? '维修中' : '待更换'}
            </span>
          </div>
          <p className="text-xs text-gray-500">{device.brand} · {device.type}</p>
          <p className="text-xs text-gray-500">{device.building} {device.floor} · {device.location}</p>
        </div>

        {/* Maintenance type */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">维保类型</label>
          <div className="flex gap-2">
            {TYPE_OPTIONS.map(t => (
              <button
                key={t}
                onClick={() => setForm({ ...form, maintenance_type: t })}
                className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                  form.maintenance_type === t
                    ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">维保内容 <span className="text-red-500">*</span></label>
          <textarea
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder="请描述维保内容..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Device status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">设备状态</label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s.value}
                onClick={() => setForm({ ...form, device_status: s.value })}
                className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                  form.device_status === s.value
                    ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Problem & result */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">问题描述</label>
            <textarea
              value={form.problem_desc}
              onChange={e => setForm({ ...form, problem_desc: e.target.value })}
              placeholder="如有问题请描述..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">处理结果</label>
            <textarea
              value={form.result}
              onChange={e => setForm({ ...form, result: e.target.value })}
              placeholder="请描述处理结果..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>

        {/* Identity verification */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">身份核验</label>
          <div className="space-y-3">
            <input
              type="text"
              value={form.handler_name}
              onChange={e => setForm({ ...form, handler_name: e.target.value })}
              onBlur={handleVerify}
              placeholder="请输入您的姓名"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="text"
              value={form.handler_id}
              onChange={e => { setForm({ ...form, handler_id: e.target.value }); setVerifyMsg(''); }}
              onBlur={handleVerify}
              placeholder="请输入您的工号"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {verifyMsg && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {verifyMsg}
              </p>
            )}
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
          {submitting ? '提交中...' : '提交维保记录'}
        </button>

        <p className="text-xs text-gray-400 text-center pb-4">
          提交后记录将自动保存并同步
        </p>
      </div>
    </div>
  );
}
