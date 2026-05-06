const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(data.message || '请求失败');
  }
  return data.data;
}

export const api = {
  // Auth
  verifyUser: (data) => request('/users/verify', { method: 'POST', body: JSON.stringify(data) }),

  // Stats
  getOverview: () => request('/stats/overview'),
  getDeviceStatus: () => request('/stats/device-status'),
  getBuildingDistribution: () => request('/stats/building-distribution'),
  getRecentMaintenance: () => request('/stats/recent-maintenance'),

  // Devices
  getDevices: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/devices?${qs}`);
  },
  getDevice: (id) => request(`/devices/${id}`),
  createDevice: (data) => request('/devices', { method: 'POST', body: JSON.stringify(data) }),
  updateDevice: (id, data) => request(`/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDevice: (id) => request(`/devices/${id}`, { method: 'DELETE' }),

  // Maintenance
  getMaintenance: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/maintenance?${qs}`);
  },
  getMaintenanceDetail: (id) => request(`/maintenance/${id}`),
  createMaintenance: (data) => request('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  exportMaintenance: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return `${BASE_URL}/maintenance/export?${qs}`;
  },

  // Users
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // Feishu
  getFeishuConfig: () => request('/feishu/config'),
  saveFeishuConfig: (data) => request('/feishu/config', { method: 'POST', body: JSON.stringify(data) }),
  testFeishu: () => request('/feishu/test', { method: 'POST' }),
  syncFeishu: () => request('/feishu/sync', { method: 'POST' }),
};
