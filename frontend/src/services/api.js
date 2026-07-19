import axios from "axios";

const devBackendUrl = `${window.location.protocol}//${window.location.hostname}:8098`;
const apiBaseUrl = import.meta.env.DEV
  ? devBackendUrl
  : "/api";
const apiKey = import.meta.env.VITE_API_KEY || "";

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false,
  headers: apiKey ? { "x-api-key": apiKey } : undefined,
});

export default api;
