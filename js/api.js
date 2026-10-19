/**
 * Smart Focus Guardian - Centralized API Service
 * Handles all HTTP REST communication between the frontend, Express backend,
 * and IoT devices. Supports automatic base URL detection, request timeouts,
 * graceful offline fallback, and structured error reporting.
 */

// Auto-detect backend base URL:
// 1. Check localStorage override
// 2. If running on same origin as Express server (e.g. :5000), use origin
// 3. Otherwise default to http://localhost:5000
function getInitialBaseUrl() {
  try {
    const custom = localStorage.getItem('sfg.apiUrl');
    if (custom) return custom.trim().replace(/\/$/, '');
  } catch (e) {}

  if (window.location.protocol.startsWith('http') && window.location.port === '5000') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
}

export const API_CONFIG = {
  baseUrl: getInitialBaseUrl(),
  timeoutMs: 5000,
  deviceToken: 'sfg_device_secret_2026'
};

export function setApiBaseUrl(url) {
  API_CONFIG.baseUrl = url.trim().replace(/\/$/, '');
  try {
    localStorage.setItem('sfg.apiUrl', API_CONFIG.baseUrl);
  } catch (e) {}
}

/**
 * Standard HTTP Fetch Wrapper with timeout and error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_CONFIG.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || API_CONFIG.timeoutMs);

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    let body = null;
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }

    if (!res.ok) {
      const errorMsg = (body && body.error) || `Server error (${res.status})`;
      return { ok: false, status: res.status, error: errorMsg, data: body };
    }

    return { ok: true, status: res.status, data: body && body.data !== undefined ? body.data : body };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      error: isTimeout ? 'Request timed out. Backend may be offline.' : 'Cannot connect to backend server.',
      isOffline: true
    };
  }
}

export const API = {
  // System Health
  async checkHealth() {
    return request('/api/health');
  },

  // Devices
  async getDevices() {
    return request('/api/devices');
  },
  async getDevice(deviceId) {
    return request(`/api/devices/${encodeURIComponent(deviceId)}`);
  },
  async registerDevice(payload) {
    return request('/api/devices', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async getDeviceStatus(deviceId) {
    return request(`/api/devices/${encodeURIComponent(deviceId)}/status`);
  },

  // Sensor Readings & Telemetry
  async getLatestReading(deviceId) {
    return request(`/api/devices/${encodeURIComponent(deviceId)}/readings/latest`);
  },
  async getReadings(deviceId, limit = 50) {
    return request(`/api/devices/${encodeURIComponent(deviceId)}/readings?limit=${limit}`);
  },
  async getMotionEvents(deviceId, limit = 50) {
    return request(`/api/devices/${encodeURIComponent(deviceId)}/motion-events?limit=${limit}`);
  },
  async sendDeviceData(payload) {
    return request('/api/device-data', {
      method: 'POST',
      headers: { 'x-device-token': API_CONFIG.deviceToken },
      body: JSON.stringify(payload)
    });
  },

  // Lamp Commands
  async sendLampCommand(deviceId, { requestedState, brightness, autoMode }) {
    return request(`/api/devices/${encodeURIComponent(deviceId)}/commands/lamp`, {
      method: 'POST',
      body: JSON.stringify({ requestedState, brightness, autoMode })
    });
  },
  async getPendingCommands(deviceId) {
    return request(`/api/devices/${encodeURIComponent(deviceId)}/commands/pending`, {
      headers: { 'x-device-token': API_CONFIG.deviceToken }
    });
  },
  async ackLampCommand(deviceId, commandId, { success = true, failureReason = null } = {}) {
    return request(`/api/devices/${encodeURIComponent(deviceId)}/commands/${encodeURIComponent(commandId)}/ack`, {
      method: 'POST',
      headers: { 'x-device-token': API_CONFIG.deviceToken },
      body: JSON.stringify({ success, failureReason })
    });
  },

  // Study Sessions
  async getSessions(limit = 100) {
    return request(`/api/sessions?limit=${limit}`);
  },
  async getSession(sessionId) {
    return request(`/api/sessions/${encodeURIComponent(sessionId)}`);
  },
  async createSession(sessionPayload) {
    return request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionPayload)
    });
  },
  async updateSession(sessionId, sessionPayload) {
    return request(`/api/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'PATCH',
      body: JSON.stringify(sessionPayload)
    });
  },
  async completeSession(sessionId, payload = {}) {
    return request(`/api/sessions/${encodeURIComponent(sessionId)}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Analytics
  async getAnalyticsSummary() {
    return request('/api/analytics/summary');
  },
  async getAnalyticsDaily(days = 7) {
    return request(`/api/analytics/daily?days=${days}`);
  },
  async getAnalyticsWeekly() {
    return request('/api/analytics/weekly');
  },

  // Settings
  async getSettings() {
    return request('/api/settings');
  },
  async updateSettings(settingsPayload) {
    return request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsPayload)
    });
  }
};
