const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function getHeaders() {
  const token = sessionStorage.getItem('wedding_admin_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...getHeaders(), ...(options.headers || {}) };

  const res = await fetch(url, {
    ...options,
    headers
  });

  if (res.status === 401) {
    sessionStorage.removeItem('wedding_admin_token');
    sessionStorage.removeItem('wedding_admin_user');
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  // Handle CSV/blob downloads
  if (options.responseType === 'blob') {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(err.message || 'Download failed');
    }
    return res.blob();
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const errorMsg = data?.message || `Request failed with status ${res.status}`;
    const error = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  async login(username, password) {
    const data = await request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (data.token) {
      sessionStorage.setItem('wedding_admin_token', data.token);
      sessionStorage.setItem('wedding_admin_user', JSON.stringify(data.admin));
    }
    return data;
  },

  logout() {
    sessionStorage.removeItem('wedding_admin_token');
    sessionStorage.removeItem('wedding_admin_user');
  },

  async getMe() {
    return request('/api/admin/me');
  },

  // Statistics
  async getStatistics() {
    return request('/api/admin/statistics');
  },

  // RSVPs
  async getRsvps(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.attending && params.attending !== 'all') searchParams.set('attending', params.attending);
    if (params.event && params.event !== 'all') searchParams.set('event', params.event);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const qs = searchParams.toString();
    return request(`/api/admin/rsvps${qs ? `?${qs}` : ''}`);
  },

  async getRsvpById(id) {
    return request(`/api/admin/rsvps/${id}`);
  },

  async deleteRsvp(id) {
    return request(`/api/admin/rsvps/${id}`, {
      method: 'DELETE'
    });
  },

  async exportRsvpsCsv() {
    const blob = await request('/api/admin/export/rsvps', { responseType: 'blob' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `wedding_rsvps_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Blessings
  async getBlessings(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const qs = searchParams.toString();
    return request(`/api/admin/blessings${qs ? `?${qs}` : ''}`);
  },

  async deleteBlessing(id) {
    return request(`/api/admin/blessings/${id}`, {
      method: 'DELETE'
    });
  },

  async exportBlessingsCsv() {
    const blob = await request('/api/admin/export/blessings', { responseType: 'blob' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `wedding_blessings_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
};

