import { useEffect, useState } from 'react';
import { Settings, Wifi, WifiOff, Save, RefreshCw, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function FeishuConfig() {
  const [config, setConfig] = useState({ app_id: '', app_secret: '', app_token: '', table_id: '', connected: false, last_sync_at: '' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.getFeishuConfig().then(data => {
      if (data) setConfig(prev => ({ ...prev, ...data }));
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.saveFeishuConfig(config);
      setMessage({ type: 'success', text: '配置保存成功' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const result = await api.testFeishu();
      setConfig(prev => ({ ...prev, connected: true }));
      setMessage({ type: 'success', text: result.message || '连接成功' });
    } catch (err) {
      setConfig(prev => ({ ...prev, connected: false }));
      setMessage({ type: 'error', text: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const result = await api.syncFeishu();
      setMessage({ type: 'success', text: result.message || '同步成功' });
      setConfig(prev => ({ ...prev, last_sync_at: new Date().toISOString() }));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-lg font-semibold text-gray-900">飞书配置</h2>

      {/* Connection status */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
        config.connected
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-gray-50 border-gray-200'
      }`}>
        {config.connected ? (
          <>
            <Wifi className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-800">已连接</p>
              {config.last_sync_at && (
                <p className="text-xs text-emerald-600">上次同步: {config.last_sync_at.replace('T', ' ').slice(0, 19)}</p>
              )}
            </div>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-600">未连接</p>
              <p className="text-xs text-gray-500">请完成下方配置后测试连接</p>
            </div>
          </>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Setup guide */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary-600" />
          配置指引
        </h3>
        <ol className="text-xs text-gray-600 space-y-3 list-decimal list-inside">
          <li>
            登录
            <a href="https://open.feishu.cn" target="_blank" rel="noopener" className="text-primary-600 hover:underline inline-flex items-center gap-1 mx-1">
              飞书开放平台 <ExternalLink className="w-3 h-3" />
            </a>
            创建自建应用
          </li>
          <li>在应用管理页面，开通 <strong>bitable:app</strong>（多维表格）权限</li>
          <li>发布应用版本，获取 <strong>App ID</strong> 和 <strong>App Secret</strong></li>
          <li>打开飞书多维表格，在 URL 中获取 <strong>App Token</strong>（/base/ 后面的字符串）</li>
          <li>在多维表格中获取 <strong>Table ID</strong>（table= 后面的字符串）</li>
          <li>将多维表格的协作者权限授予刚创建的飞书应用</li>
        </ol>
      </div>

      {/* Config form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">凭证配置</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">App ID <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={config.app_id}
              onChange={e => setConfig({ ...config, app_id: e.target.value })}
              placeholder="cli_xxxxxxxxxx"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">App Secret <span className="text-red-500">*</span></label>
            <input
              type="password"
              value={config.app_secret}
              onChange={e => setConfig({ ...config, app_secret: e.target.value })}
              placeholder="请输入 App Secret"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">多维表格 App Token <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={config.app_token}
              onChange={e => setConfig({ ...config, app_token: e.target.value })}
              placeholder="bascnXXXXXXXXXX"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">数据表 Table ID <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={config.table_id}
              onChange={e => setConfig({ ...config, table_id: e.target.value })}
              placeholder="tblXXXXXXXXXX"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : '保存配置'}
        </button>
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <Wifi className="w-4 h-4" />
          {testing ? '测试中...' : '测试连接'}
        </button>
        <button
          onClick={handleSync}
          disabled={syncing || !config.connected}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? '同步中...' : '手动同步'}
        </button>
      </div>

      {/* Sync info */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">数据同步说明</h3>
        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
          <li>配置成功后，系统设备台账将自动同步至飞书多维表格</li>
          <li>维保记录提交后也会同步到飞书</li>
          <li>支持从飞书多维表格反向同步设备信息到系统</li>
          <li>多维表格需包含字段：设备编码、品牌、设备类型、位置、楼栋、楼层、状态</li>
        </ul>
      </div>
    </div>
  );
}
