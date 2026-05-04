import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.DEV
  ? "http://192.168.1.254:8090"
  : "";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  autoConnect: true,
  path: "/socket.io",
});

export default socket;