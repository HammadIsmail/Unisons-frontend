# Multi-Tenancy Frontend Integration Guide (`Unisons-frontend-main`)

This document explains how UNISON's multi-tenancy model impacts user flows in the client application.

---

## 1. Multi-Tenant Concepts in the Frontend

| Concept | Frontend Representation | Backend Mapping |
| :--- | :--- | :--- |
| **Tenant** | University or campus (e.g. FAST Islamabad, NUST) | MongoDB `Tenant` document |
| **Tenant ID** | UUID or ObjectId string (`tenant_id`) | `tenantId` in Neo4j User node and Mongo `UserAuth` |
| **Tenant Slug** | URL-safe identifier (e.g. `fast-isb`) | `slug` field in `Tenant` |
| **Allowed Domains**| Array of domain strings (e.g. `["nu.edu.pk"]`) | Restricts registration to verified emails |
| **Suspended State**| Global block on all campus users | `status: "suspended"` on `Tenant` |

---

## 2. University Onboarding & Registration Flow

1. **Fetching Active Institutions**:
   - [`lib/api/tenants.api.ts`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/lib/api/tenants.api.ts) calls:
     ```ts
     GET /api/tenants -> PublicTenant[]
     ```
   - Only active (non-suspended) universities are returned by this public endpoint.
2. **User Selection**:
   - User chooses their university from the select dropdown in [`StepRegister.tsx`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/components/features/auth/steps/StepRegister.tsx).
   - If the selected university defines `allowed_email_domains`, the email field displays domain guidance (e.g. `@nu.edu.pk`).
3. **Payload Submission**:
   - `tenant_id` is sent as a required field in the `multipart/form-data` payload in [`lib/api/auth.api.ts`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/lib/api/auth.api.ts).
   - Once submitted, student accounts are flagged `pending_approval` until verified by their campus administrator.

---

## 3. Dynamic Branding Architecture

When any authenticated user logs in:
1. Backend JWT validation returns:
   ```json
   {
     "token": "...",
     "role": "alumni",
     "tenant": {
       "id": "tenant-123",
       "slug": "fast-isb",
       "name": "FAST NUCES Islamabad",
       "logo_url": "https://.../logo.png"
     }
   }
   ```
2. Saved into `authStore.tenant`.
3. In [`Navbar.tsx`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/components/layout/Navbar.tsx):
   - Header displays the university logo and institutional name.
4. In [`SideBar.tsx`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/components/layout/SideBar.tsx):
   - Sidebar displays the active institution badge next to the user's avatar.

---

## 4. Multi-Tenant Error State Handling

When a university's status changes or JWT tokens are issued with missing tenant claims:
- **`session_outdated`**:
  - Intercepted by `api.ts`.
  - Clears `auth-storage` and redirects to `/login?error=session_outdated`.
  - `LoginForm.tsx` shows: *"Your session belongs to an older configuration. Please sign in again to sync your university context."*
- **`suspended`**:
  - Intercepted by `api.ts`.
  - Clears auth and redirects to `/login?error=suspended`.
  - `LoginForm.tsx` shows: *"Your university network is currently suspended by the platform administration. Please contact your campus administrator."*
