import { useState } from 'react';
import { Nfc, Tag, Link2, Copy, Check, Info } from 'lucide-react';

export default function NfcConfig() {
  const [sampleCode, setSampleCode] = useState('WS-A1-001');
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState(typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com');

  const generatedUrl = `${baseUrl}/submit/${sampleCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-lg font-semibold text-gray-900">NFC 配置</h2>

      {/* How it works */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-primary-600" />
          工作原理
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { step: '1', title: '生成 URL', desc: '按设备编码生成唯一访问地址' },
            { step: '2', title: '写入标签', desc: '将 URL 写入 NFC 标签芯片' },
            { step: '3', title: '粘贴标签', desc: '将 NFC 标签粘贴至对应设备' },
            { step: '4', title: '触碰跳转', desc: '手机触碰自动跳转设备详情页' },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center mx-auto mb-2">
                {s.step}
              </div>
              <p className="text-sm font-medium text-gray-900">{s.title}</p>
              <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* NFC tag specs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary-600" />
          标签规格推荐
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {[
                { label: '推荐芯片', value: 'NTAG213 / NTAG215 / NTAG216' },
                { label: '标签形式', value: 'PVC 卡片 / 不干胶贴纸 / 防水标签' },
                { label: '推荐尺寸', value: '直径 25mm 圆形 或 85.5×54mm 卡片' },
                { label: '存储容量', value: 'NTAG213: 144 字节 / NTAG215: 504 字节' },
                { label: '读写距离', value: '1-5cm（手机 NFC 感应距离）' },
                { label: '参考成本', value: '0.3-1.5 元/枚（批量采购）' },
                { label: '采购渠道', value: '1688 / 淘宝搜索 "NTAG213 空白标签"' },
              ].map(r => (
                <tr key={r.label}>
                  <td className="px-4 py-2.5 text-gray-500 w-28">{r.label}</td>
                  <td className="px-4 py-2.5 text-gray-900">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* URL generator */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary-600" />
          URL 规则设定
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">系统访问地址</label>
            <input
              type="text"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="https://your-domain.com"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">部署后请填写实际域名或 IP 地址</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">设备编码</label>
            <input
              type="text"
              value={sampleCode}
              onChange={e => setSampleCode(e.target.value)}
              placeholder="如 WS-A1-001"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">生成的 URL</label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-mono break-all">
                {generatedUrl}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">URL 格式: {`{系统地址}/submit/{设备编码}`}</p>
          </div>
        </div>
      </div>

      {/* Writing guide */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-amber-900 mb-2">NFC 写入操作指引</h3>
        <ol className="text-xs text-amber-800 space-y-1.5 list-decimal list-inside">
          <li>在手机应用商店下载 NFC 写入工具（推荐 "NFC Tools" 或 "NFC TagWriter"）</li>
          <li>打开 App，选择 "写入" 功能</li>
          <li>添加 "URL/链接" 类型数据</li>
          <li>粘贴上方生成的 URL 地址</li>
          <li>将手机贴近 NFC 标签，点击 "写入" 按钮</li>
          <li>写入成功后，将标签粘贴至对应饮水机设备上</li>
        </ol>
      </div>
    </div>
  );
}
