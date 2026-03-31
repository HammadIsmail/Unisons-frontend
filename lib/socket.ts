import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(
    process.env.NEXT_PUBLIC_SOCKET_URL ||
      "https://unison-backend-lxmu.onrender.com",
    {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket auth failed:", error.message);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};