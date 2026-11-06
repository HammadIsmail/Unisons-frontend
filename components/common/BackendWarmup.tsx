"use client";

import { useEffect, useRef } from "react";

/**
 * BackendWarmup
 * Fire-and-forget background ping to the backend /health endpoint.
 * This runs completely silently without blocking UI, state, or user interaction.
 * Wakes up Render free instance cold-starts while the user is viewing landing, login, or register pages.
 */
export default function BackendWarmup() {
  const hasWarmedUp = useRef(false);

  useEffect(() => {
    // Only fire once per browser session lifecycle
    if (hasWarmedUp.current) return;
    hasWarmedUp.current = true;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const healthUrl = `${baseUrl.replace(/\/+$/, "")}/health`;

      // Non-blocking fetch with no UI impact
      fetch(healthUrl, {
        method: "GET",
        mode: "no-cors", // Works even with strict CORS/preflight during spin-up
        cache: "no-store",
        keepalive: true,
      }).catch(() => {
        // Silently ignore any errors, server cold start will still begin waking up
      });
    } catch {
      // Intentionally silent
    }
  }, []);

  return null;
}

