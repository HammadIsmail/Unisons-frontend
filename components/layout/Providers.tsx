"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "@/lib/queryClient";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { disconnectSocket } from "@/lib/socket";

function SocketManager() {
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket();
    }
  }, [isAuthenticated, token]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketManager />
      {children}
    </QueryClientProvider>
  );
}