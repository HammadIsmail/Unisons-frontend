import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const connectSocket = (token: string): Socket => {
  if (socket) {
    if (socket.connected && (socket as any).auth?.token === token) return socket;
    socket.disconnect();
  }
  console.log(token)
  socket = io(
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000",
    {
      auth: {
        token: token,
      },
      transports: ["websocket"],
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  socket.on("connect", () => {
    console.log("Socket connected! ID:", socket?.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket auth/connection failed:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.warn("Socket disconnected:", reason);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};