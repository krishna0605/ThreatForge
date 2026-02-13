'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Refresh token concurrency control
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

// Helper to construct headers
function getHeaders(token: string | null = null, isMultipart = false): HeadersInit {
  const headers: HeadersInit = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  const accessToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}

// Process queued requests
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function handleResponse(res: Response) {
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Internal request handler with refresh logic
async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}/api${path}`;
  
  // Default headers if not provided
  if (!options.headers) {
      const isFormData = options.body instanceof FormData;
      options.headers = getHeaders(null, isFormData);
  }

  let res = await fetch(url, options);

  // Intercept 401
  if (res.status === 401) {
    // If this was already a refresh attempt (path is refresh), let handleResponse handle it (logout)
    if (path === '/auth/refresh') {
       return handleResponse(res);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        // Retry with new token
        const newHeaders = new Headers(options.headers);
        newHeaders.set('Authorization', `Bearer ${token}`);
        return fetch(url, { ...options, headers: newHeaders });
      }).then(handleResponse);
    }
    
    // Start refresh
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    
    if (!refreshToken) {
         // No refresh token, proceed to standard 401 handling (logout)
         return handleResponse(res);
    }
    
    isRefreshing = true;
    
    try {
        const refreshHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`
        };
        
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: refreshHeaders
        });
        
        const refreshData = await refreshRes.json();
        
        if (refreshRes.ok && refreshData.status === 'success') {
            const newAccessToken = refreshData.data.access_token;
            localStorage.setItem('access_token', newAccessToken);
            
            processQueue(null, newAccessToken);
            isRefreshing = false;
            
            // Retry original request
            const newHeaders = new Headers(options.headers);
            newHeaders.set('Authorization', `Bearer ${newAccessToken}`);
            const retryRes = await fetch(url, { ...options, headers: newHeaders });
            return handleResponse(retryRes);
        } else {
            throw new Error('Refresh failed');
        }
    } catch (error) {
        processQueue(error as Error, null);
        isRefreshing = false;
        return handleResponse(res); 
    }
  }

  return handleResponse(res);
}

export async function apiGet<T = any>(path: string): Promise<T> {
  return request(path, { method: 'GET' });
}

export async function apiPost<T = any>(path: string, body?: unknown): Promise<T> {
  return request(path, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  });
}

export async function apiPut<T = any>(path: string, body: unknown): Promise<T> {
  return request(path, { 
    method: 'PUT', 
    body: JSON.stringify(body) 
  });
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  return request(path, { method: 'DELETE' });
}

export async function apiUpload(path: string, formData: FormData) {
  return request(path, {
    method: 'POST',
    body: formData
  });
}

export async function getDashboardStats() {
  return await apiGet('/dashboard/stats');
}

export async function getDashboardActivity() {
  return await apiGet('/dashboard/activity');
}

export async function getThreatDistribution() {
  return await apiGet('/dashboard/threat-distribution');
}

export async function getScans(page = 1, per_page = 10, status = '', order = 'desc') {
  let query = `/scans?page=${page}&per_page=${per_page}&order=${order}`;
  if (status) query += `&status=${status}`;
  return await apiGet(query);
}

export async function getSecurityHealth() {
  return await apiGet('/dashboard/security-health');
}

export async function getSeverityBreakdown() {
  return await apiGet('/dashboard/severity-breakdown');
}

export async function getSecurityActions() {
  return await apiGet('/dashboard/security-actions');
}

export async function getThreatMapData() {
  return await apiGet('/threats/map');
}

export async function getThreatOrigins() {
  return await apiGet('/threats/origins');
}

// ─── Security Settings ─────────────────────────────────
export async function changePassword(current_password: string, new_password: string, confirm_password: string) {
  return apiPut('/auth/change-password', { current_password, new_password, confirm_password });
}

export async function enrollMFA() {
  return apiPost('/auth/mfa/enroll');
}

export async function verifyMFA(totp_code: string) {
  return apiPost('/auth/mfa/verify', { totp_code });
}

export async function disableMFA(totp_code: string) {
  return apiPost('/auth/mfa/disable', { totp_code });
}

export async function getSecuritySessions() {
  return apiGet('/security/sessions');
}

export async function revokeSession(sessionId: string) {
  return apiDelete(`/security/sessions/${sessionId}`);
}

export async function getSecurityPreferences() {
  return apiGet('/security/preferences');
}

export async function updateSecurityPreferences(prefs: Record<string, any>) {
  return apiPut('/security/preferences', prefs);
}

export async function getIpWhitelist() {
  return apiGet('/security/ip-whitelist');
}

export async function addIpWhitelist(cidr_range: string, label: string) {
  return apiPost('/security/ip-whitelist', { cidr_range, label });
}

export async function removeIpWhitelist(entryId: string) {
  return apiDelete(`/security/ip-whitelist/${entryId}`);
}

export async function getAuditLogs(page = 1, per_page = 20) {
  return apiGet(`/security/audit-logs?page=${page}&per_page=${per_page}`);
}

// ─── Notification Settings ─────────────────────────
export async function getNotificationPrefs() {
  return apiGet('/notifications/preferences');
}

export async function updateNotificationPrefs(prefs: Record<string, any>) {
  return apiPut('/notifications/preferences', prefs);
}

export async function subscribePush(subscription: PushSubscriptionJSON) {
  return apiPost('/notifications/push/subscribe', { subscription });
}

export async function unsubscribePush() {
  return apiPost('/notifications/push/unsubscribe', {});
}

export async function getNotifications(page = 1, per_page = 20) {
  return apiGet(`/notifications?page=${page}&per_page=${per_page}`);
}

export async function markNotificationRead(id: string) {
  return apiPut(`/notifications/${id}/read`, {});
}

export async function markAllRead() {
  return apiPut('/notifications/read-all', {});
}

export async function getUnreadCount() {
  return apiGet('/notifications/unread-count');
}

export async function sendTestNotification(channel = 'all') {
  return apiPost('/notifications/test', { channel });
}
