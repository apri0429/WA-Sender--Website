import { io } from "socket.io-client";

const devSocketUrl = `${window.location.protocol}//${window.location.hostname}:8098`;
const SOCKET_URL = import.meta.env.DEV
  ? devSocketUrl
  : "";
const apiKey = import.meta.env.VITE_API_KEY || "";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  autoConnect: true,
  path: "/socket.io",
  auth: apiKey ? { apiKey } : undefined,
});

export default socket;
