import { io } from "socket.io-client";

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const SOCKET_URL = isLocal
  ? "http://localhost:4000"
  : (import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
      : "https://student-study-vault-backend.onrender.com");

let socket = null;

/**
 * 🎧 Get or initialize the Socket.io WebSocket connection singleton
 */
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("🔌 Connected to StudyVault Real-time Support WebSocket:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected from Support WebSocket:", reason);
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

/**
 * Join specific ticket conversation room
 */
export function joinTicketRoom(ticketId) {
  if (!ticketId) return;
  const s = getSocket();
  s.emit("join_ticket", ticketId);
}

/**
 * Leave ticket conversation room
 */
export function leaveTicketRoom(ticketId) {
  if (!ticketId) return;
  const s = getSocket();
  s.emit("leave_ticket", ticketId);
}

/**
 * Join developer CMS support channel (for live ticket alerts)
 */
export function joinAdminSupportChannel() {
  const s = getSocket();
  s.emit("join_admin_support");
}

/**
 * Leave developer CMS support channel
 */
export function leaveAdminSupportChannel() {
  const s = getSocket();
  s.emit("leave_admin_support");
}

/**
 * Broadcast live typing indicator
 */
export function emitTyping(ticketId, username, role, isTyping) {
  if (!ticketId) return;
  const s = getSocket();
  s.emit("typing", {
    ticketId,
    username,
    role,
    isTyping: Boolean(isTyping),
  });
}

export default getSocket;
