# Developer Cheat Sheet & Workflows (`Unisons-frontend-main`)

Quick recipes for common development tasks in the frontend.

---

## 1. Adding a New Page / Route

1. Create a folder in `app/<route-name>/page.tsx`.
2. Wrap with `<ProtectedRoute>` if the page requires authentication:
   ```tsx
   "use client";
   import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

   export default function MyNewPage() {
     return (
       <ProtectedRoute>
         <div className="container mx-auto py-6">
           <h1 className="text-2xl font-bold">New Feature</h1>
         </div>
       </ProtectedRoute>
     );
   }
   ```
3. If the page is restricted by role, check `proxy.ts` (Next.js middleware) and add the path to the appropriate role table (e.g. `ALUMNI_ONLY` or `STUDENT_ONLY`).

---

## 2. Adding a New API Client Function

1. Locate or create the domain client file in [`lib/api/<feature>.api.ts`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/lib/api).
2. Use the centralized `apiClient` instance:
   ```typescript
   import apiClient from "@/lib/api";
   import { MyDataType } from "@/types/api.types";

   export const getFeatureData = async (param: string): Promise<MyDataType> => {
     const response = await apiClient.get<MyDataType>(`/api/my-feature/${param}`);
     return response.data;
   };
   ```
3. Declare any new interfaces or types in [`types/api.types.ts`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/types/api.types.ts).

---

## 3. Important Gotchas in Next.js 16 App Router

- **`useSearchParams()` Warning**:
  - Never call `useSearchParams()` directly in a component rendered in the root tree without a `<Suspense>` boundary, or Next.js static prerendering will fail during `next build`.
  - Prefer reading search params inside a `useEffect` using `window.location.search` (as done in [`LoginForm.tsx`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/components/features/auth/LoginForm.tsx)) or wrapping the component in `<Suspense>`.
- **Admin Endpoints**:
  - Do NOT create admin or super-admin management APIs or screens here. All institutional and platform admin code belongs in `unison-admin-dashboard-main`.

---

## 4. Testing & Verification

```bash
# Verify build succeeds with zero errors
npm run build

# Run linter
npm run lint
```
