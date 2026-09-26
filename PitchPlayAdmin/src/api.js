import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ─── Change this to your deployed backend URL ────────────────────────────────
export const BASE_URL = 'http://localhost:8000';  // local dev
// export const BASE_URL = 'https://your-backend.onrender.com'; // production
// ─────────────────────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject token from secure store on every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('admin_token');
    }
    return Promise.reject(err);
  }
);

export default api;
