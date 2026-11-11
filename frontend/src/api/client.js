const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('cyber_jwt_token');
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If token expired, clear and notify
    localStorage.removeItem('cyber_jwt_token');
    localStorage.removeItem('cyber_user');
    if (!window.location.pathname.includes('/login')) {
      window.dispatchEvent(new Event('auth_expired'));
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const authAPI = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),
};

export const complaintsAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/complaints?${query}`);
  },
  getById: (id) => request(`/complaints/${id}`),
  create: (complaintData) => request('/complaints', { method: 'POST', body: JSON.stringify(complaintData) }),
  assign: (complaintId, payload) => request(`/complaints/${complaintId}/assign`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateStatus: (complaintId, payload) => request(`/complaints/${complaintId}/status`, { method: 'PUT', body: JSON.stringify(payload) }),
  addInvestigationNote: (complaintId, noteData) => request(`/complaints/${complaintId}/investigation-notes`, { method: 'POST', body: JSON.stringify(noteData) }),
};

export const evidenceAPI = {
  upload: (complaintId, formData) => request(`/evidence/upload/${complaintId}`, { method: 'POST', body: formData }),
  listByComplaint: (complaintId) => request(`/evidence/complaint/${complaintId}`),
  getFileUrl: (evidenceId) => `${API_BASE}/evidence/${evidenceId}`,
};

export const analyticsAPI = {
  getAdminStats: () => request('/analytics/admin'),
  getOfficerStats: () => request('/analytics/officer'),
  getCitizenStats: () => request('/analytics/citizen'),
};

export const notificationsAPI = {
  list: (unreadOnly = false) => request(`/notifications?unread_only=${unreadOnly}`),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
};

export const adminAPI = {
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/users?${query}`);
  },
  toggleUserStatus: (userId) => request(`/admin/users/${userId}/toggle-status`, { method: 'PUT' }),
  getOfficers: () => request('/admin/officers'),
  createOfficer: (officerData) => request('/admin/officers', { method: 'POST', body: JSON.stringify(officerData) }),
  getCategories: () => request('/admin/categories'),
  createCategory: (catData) => request('/admin/categories', { method: 'POST', body: JSON.stringify(catData) }),
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/audit-logs?${query}`);
  },
  exportComplaintsUrl: () => `${API_BASE}/admin/export/complaints`,
  exportAuditLogsUrl: () => `${API_BASE}/admin/export/audit-logs`,
};
