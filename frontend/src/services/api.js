import axios from "axios";

const apiBaseUrl = import.meta.env.DEV
  ? "http://192.168.1.254:8090"
  : "/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false
});

export default api;