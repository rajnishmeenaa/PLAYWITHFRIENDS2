import axios from "axios";

let envUrl = (process.env.REACT_APP_BACKEND_URL || "").trim();
if (envUrl.endsWith("/")) {
  envUrl = envUrl.slice(0, -1);
}

export const BACKEND_URL = envUrl;
export const API = envUrl ? `${envUrl}/api` : "/api";

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const setToken = (t) => {
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
};

export const getToken = () => localStorage.getItem("token");
