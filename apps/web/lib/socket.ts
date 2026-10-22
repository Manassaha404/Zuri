"use client";
import { io, Socket } from "socket.io-client";

const socketUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5080"
    : undefined);

const socket: Socket = io(socketUrl, {
  autoConnect: true,
  withCredentials: true,
  transports: ["websocket", "polling"],
});

const roomRefCounts = new Map<string, number>();

export function connectSocket() {
  if (typeof window !== "undefined" && !socket.connected) {
    socket.connect();
  }
}

export function joinRoom(event: string, room: string) {
  connectSocket();
  const count = roomRefCounts.get(room) ?? 0;
  roomRefCounts.set(room, count + 1);
  if (socket.connected) {
    socket.emit(event, room);
  }
}

export function leaveRoom(event: string, room: string) {
  const count = roomRefCounts.get(room) ?? 0;
  if (count <= 1) {
    roomRefCounts.delete(room);
    if (socket.connected) {
      socket.emit(event, room);
    }
  } else {
    roomRefCounts.set(room, count - 1);
  }
}

socket.on("connect", () => {
  for (const [room, count] of roomRefCounts.entries()) {
    if (count > 0) {
      socket.emit("join:agent", room);
    }
  }
});

export default socket;
