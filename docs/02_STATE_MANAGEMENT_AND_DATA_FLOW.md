# State Management & Data Flow (`Unisons-frontend-main`)

This document explains the data architecture, state management stores, and HTTP request lifecycles.

---

## 1. Global State Management (Zustand)

### 1.1 `authStore.ts` ([store/authStore.ts](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/store/authStore.ts))
Controls authentication state and active tenant metadata.

```typescript
interface AuthState {
  user: UserProfile | null;
  token: string | null;
  role: UserRole | null;
  tenant: PublicTenant | null; // Multi-tenant university information
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: UserProfile, token: string, role: UserRole, tenant?: PublicTenant | null) => void;
  setTenant: (tenant: PublicTenant | null) => void;
  updateUser: (user: Partial<UserProfile>) => void;
  clearAuth: () => void;
}
```

- **Persistence**: Persisted into `localStorage` under `auth-storage` using Zustand's `persist` middleware.
- **Cookies**: Sets client cookies (`token`, `role`) for server-side Next.js proxy/middleware authorization checks.
- **Multi-Tenant Context**: `tenant` holds `{ id, slug, name, logo_url }` returned by backend login.

---

### 1.2 `registrationStore.ts` ([store/registrationStore.ts](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/store/registrationStore.ts))
Manages multi-step student/alumni registration flow:
- `currentStep`: `1 | 2 | 3`
- `role`: `"alumni" | "student" | "partner"`
- `tenant_id`: Selected university ID.
- `selectedTenant`: Complete `PublicTenant` object (used to display logo and validate email domains).
- `formData`: Aggregates personal info, student verification card upload, degree, graduation year, etc.

---

## 2. API Communication Layer ([lib/api.ts](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/lib/api.ts))

All HTTP requests pass through an Axios singleton (`apiClient`):
1. **Base URL**: Defaults to `http://localhost:5000` or `process.env.NEXT_PUBLIC_API_URL`.
2. **Request Interceptor**: Reads token from `localStorage` (`auth-storage`) or cookies and injects `Authorization: Bearer <token>`.
3. **Response Interceptor**:
   - Handles standard response unwrapping.
   - Intercepts `401 Unauthorized`:
     - If `error === "TENANT_SESSION_OUTDATED"` or token is invalid: clears `localStorage`, removes cookies, redirects to `/login?error=session_outdated`.
   - Intercepts `403 Forbidden`:
     - If `error === "TENANT_SUSPENDED"`: clears state and redirects to `/login?error=suspended`.

---

## 3. Real-Time WebSocket Communication ([hooks/useSocket.ts](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/hooks/useSocket.ts))
- Connects to backend Socket.IO gateway (`ws://localhost:5000`).
- Authenticates with JWT Bearer token on handshake.
- Scoped to tenant rooms in backend: notifications and chats arrive filtered for the user's institution.
