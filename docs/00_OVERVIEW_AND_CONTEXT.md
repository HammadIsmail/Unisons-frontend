# UNISON Frontend (`Unisons-frontend-main`) — System Overview & Context

## 1. Purpose & Domain Scope
`Unisons-frontend-main` is the public-facing university alumni and student engagement platform for UNISON. 
It caters exclusively to:
- **Alumni**: Career networking, mentorship, event participation, posting/applying for opportunities, directory lookups.
- **Students**: University onboarding, discovering alumni mentors, internships, event RSVPs.
- **Corporate / Hiring Partners**: Sponsoring opportunities, hiring graduates.

> **CRITICAL ARCHITECTURAL BOUNDARY**:
> **NO Admin or Super-Admin APIs or pages exist in this application.** 
> All institutional administration and platform oversight tasks are isolated within [`unison-admin-dashboard-main`](file:///c:/Users/ranah/Desktop/Unison/unison-admin-dashboard-main).

---

## 2. Technology Stack
- **Framework**: Next.js 16.4.2 (App Router with Turbopack).
- **Language**: TypeScript 5.x with strict type checking.
- **Styling**: TailwindCSS 3.4.x, Vanilla CSS utilities, Lucide React icons.
- **State Management**: Zustand 5.x (`authStore.ts`, `registrationStore.ts`) with `localStorage` persistence.
- **Data Validation & Forms**: React Hook Form 7.x + Zod 3.24.x schemas.
- **HTTP Client**: Axios with centralized request/response interceptors in [`lib/api.ts`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/lib/api.ts).
- **Real-Time Communications**: Socket.IO client for messaging and instant notifications.

---

## 3. Multi-Tenancy Architecture (Frontend Role)
UNISON operates as a multi-tenant university platform where each institution (e.g. FAST NUCES, UET, NUST) is an isolated tenant identified by a `tenant_id` and unique `slug`.

### Key Multi-Tenant Behaviors in Frontend:
1. **University Registration**:
   - Registration step 1 (`StepRegister.tsx`) fetches all active universities via `GET /api/tenants` using [`lib/api/tenants.api.ts`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/lib/api/tenants.api.ts).
   - The user selects their university from a dropdown. The selected `tenant_id` is validated against allowed domains (or open domain policy) and submitted in the multipart registration form.
2. **Tenant Branding**:
   - On successful login, the backend returns the user's university branding (`tenant: { id, name, slug, logo_url }`).
   - Stored in Zustand (`authStore.tenant`).
   - Dynamically rendered in [`Navbar.tsx`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/components/layout/Navbar.tsx) and [`SideBar.tsx`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/components/layout/SideBar.tsx), displaying the institution's official crest/logo and name.
3. **Session Outdated (401) & Suspension (403) Handling**:
   - Centralized Axios interceptor in [`lib/api.ts`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/lib/api.ts) detects:
     - `401 Unauthorized` with `TENANT_SESSION_OUTDATED`: clears auth cookies/storage and redirects to `/login?error=session_outdated`.
     - `403 Forbidden` with `TENANT_SUSPENDED`: clears auth cookies/storage and redirects to `/login?error=suspended`.
   - [`LoginForm.tsx`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/components/features/auth/LoginForm.tsx) listens for these URL query parameters in a client-side `useEffect` and surfaces clear, user-friendly toast alerts.

---

## 4. Environment Configuration
Create or configure `.env.local` in the project root:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```
- Default backend port: `5000` (NestJS REST + WebSocket server in `Unison-backend-main`).
- Default frontend port: `3000` (`http://localhost:3000`).

---

## 5. Development & Build Commands
```bash
# Run local development server with Turbopack
npm run dev

# Compile production bundle and type-check
npm run build

# Start production server
npm run start
```
