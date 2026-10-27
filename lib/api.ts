import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  timeout: 60000, // 60 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("unison_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      const isAuthRoute = window.location.pathname === "/login";
      const status = error.response?.status;
      const message = error.response?.data?.message || "";

      if (status === 401 && !isAuthRoute) {
        localStorage.removeItem("unison_token");
        if (message.includes("Session outdated")) {
          window.location.href = "/login?error=session_outdated";
        } else {
          window.location.href = "/login";
        }
      } else if (status === 403 && !isAuthRoute && (message.includes("suspended") || message.includes("university"))) {
        localStorage.removeItem("unison_token");
        window.location.href = "/login?error=suspended";
      }
    }

    return Promise.reject(error);
  }
);

export default api;