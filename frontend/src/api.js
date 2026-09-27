/**
 * KisanMitra AI — Frontend API Service
 * Connects frontend React components to Express backend with automatic fallback.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getToken = () => localStorage.getItem('km_token');
export const setToken = (t) => localStorage.setItem('km_token', t);
export const clearToken = () => localStorage.removeItem('km_token');
export const getUser = () => { try { return JSON.parse(localStorage.getItem('km_user')); } catch { return null; } };
export const setUser = (u) => localStorage.setItem('km_user', JSON.stringify(u));
export const clearUser = () => localStorage.removeItem('km_user');

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.warn(`[API] Backend not reachable at ${BASE_URL}${path}. Using offline support.`);
      return null;
    }
    throw err;
  }
}

const get  = (path, params) => apiFetch(params ? `${path}?${new URLSearchParams(params)}` : path);
const post = (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
const put  = (path, body) => apiFetch(path, { method: 'PUT',  body: JSON.stringify(body) });
const del  = (path) =>       apiFetch(path, { method: 'DELETE' });

export const authAPI = {
  register: async (data) => {
    const res = await post('/auth/register', data);
    if (res?.data?.token) { setToken(res.data.token); setUser(res.data.user); }
    return res;
  },
  login: async (phone, password) => {
    const res = await post('/auth/login', { phone, password });
    if (res?.data?.token) { setToken(res.data.token); setUser(res.data.user); }
    return res;
  },
  logout: () => { clearToken(); clearUser(); },
  me: () => get('/auth/me'),
  updateProfile: (data) => put('/auth/profile', data),
};

export const cropsAPI = {
  getAll: () => get('/crops'),
  getById: (id) => get(`/crops/${id}`),
  add: (data) => post('/crops', data),
  update: (id, data) => put(`/crops/${id}`, data),
  delete: (id) => del(`/crops/${id}`),
  getRecommendations: () => get('/crops/meta/recommendations'),
};

export const mandisAPI = {
  getAll: (params) => get('/mandis', params),
  getNearby: (lat, lon, radiusKm = 150, commodity) => get('/mandis/nearby', { lat, lon, radiusKm, ...(commodity ? { commodity } : {}) }),
  getById: (id) => get(`/mandis/${id}`),
};

export const marketAPI = {
  getPrices: (params) => get('/market', params),
  getLatest: (commodity) => get('/market/latest', { commodity }),
  getTrend: (commodity, mandiId, days = 30) => get('/market/trend', { commodity, mandiId, days }),
  getCommodities: () => get('/market/commodities'),
};

export const calcAPI = {
  transport: (data) => post('/calculator/transport', data),
  profit: (data) => post('/calculator/profit', data),
  compareMandis: (data) => post('/calculator/compare-mandis', data),
};

export const weatherAPI = {
  getCurrent: (lat, lon) => get('/weather/current', lat && lon ? { lat, lon } : undefined),
  getForecast: (lat, lon) => get('/weather/forecast', lat && lon ? { lat, lon } : undefined),
  getAlerts: () => get('/weather/alerts'),
};

export const assistantAPI = {
  chat: (message, language, cropContext, location) => post('/assistant/chat', { message, language, cropContext, location }),
  diagnose: (description, crop) => post('/assistant/diagnose', { description, crop }),
  getSchemes: () => get('/assistant/schemes'),
};

export const decisionAPI = {
  generate: (data) => post('/decisions', data),
  getHistory: () => get('/decisions/history'),
};

export const predictionAPI = {
  getPrice: (commodity, mandiId, horizon = 30) => post('/predictions/price', { commodity, mandiId, horizon }),
  getHistory: () => get('/predictions/history'),
};

export const checkBackend = async () => {
  try {
    const res = await fetch(`${BASE_URL.replace('/api', '')}/health`);
    return res.ok;
  } catch { return false; }
};

export default { authAPI, cropsAPI, mandisAPI, marketAPI, calcAPI, weatherAPI, assistantAPI, decisionAPI, predictionAPI };
