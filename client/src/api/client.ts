import axios from "axios";

/** 末尾必须有 `/`，且请求 path 不要用前导 `/`，否则 axios 会拼成站点根路径导致 404（如误请求 `/register`）。 */
const api = axios.create({ baseURL: "/api/" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("resume_studio_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
