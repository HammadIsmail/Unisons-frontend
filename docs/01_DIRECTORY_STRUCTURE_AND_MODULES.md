# Directory Structure & Module Guide (`Unisons-frontend-main`)

This document details the code organization across the frontend repository so any developer or AI assistant can quickly locate and modify specific features.

---

## 1. Directory Tree Overview

```
Unisons-frontend-main/
├── app/                        # Next.js App Router (pages and layouts)
│   ├── chat/                   # Messaging & DM channels
│   ├── events/                 # Alumni/student event discovery & RSVPs
│   ├── feed/                   # Social timeline, posts, interactions
│   ├── forgot-password/        # Password recovery flow
│   ├── login/                  # Authentication entry point
│   ├── network/                # Connection requests & alumni directory
│   ├── notifications/          # Notification inbox
│   ├── opportunities/          # Job board, internships, postings
│   ├── pending/                # Verification waiting screen for new accounts
│   ├── post-opportunity/       # Create job/internship form
│   ├── profile/                # User profile views (me & other users)
│   ├── register/               # Multi-step student/alumni registration
│   ├── search/                 # Cross-platform member/skill search
│   ├── layout.tsx              # Root HTML layout (theme, fonts, toast providers)
│   └── page.tsx                # Landing / marketing homepage
├── components/                 # React UI components
│   ├── features/               # Domain-specific components
│   │   ├── auth/               # LoginForm, RegisterForm, step wizards
│   │   ├── chat/               # Chat window, message bubbles, active threads
│   │   ├── events/             # EventCard, EventDetails, RSVP modal
│   │   ├── feed/               # PostCard, CreatePostModal, Comments
│   │   ├── network/            # ConnectionCard, RecommendationList
│   │   ├── opportunities/      # JobCard, ApplicationModal
│   │   └── profile/            # ProfileHeader, EducationSection, Skills
│   ├── layout/                 # Layout chrome
│   │   ├── Navbar.tsx          # Main header with tenant branding, search, notifications
│   │   ├── SideBar.tsx         # Sidebar navigation with active tenant university crest
│   │   └── ProtectedRoute.tsx  # Client-side route guard wrapper
│   └── ui/                     # Generic design system primitives (button, input, modal, badge)
├── docs/                       # Architectural and developer context documentation
├── hooks/                      # Custom React hooks (useSocket, useDebounce, etc.)
├── lib/                        # Core utilities & API integration
│   ├── api.ts                  # Axios instance, Bearer token interceptor, 401/403 handlers
│   ├── api/                    # Modular API client methods
│   │   ├── alumni.api.ts       # Alumni profile, education, experience endpoints
│   │   ├── auth.api.ts         # Login, register, logout, OTP endpoints
│   │   ├── chat.api.ts         # Conversations, messages, attachments
│   │   ├── connections.api.ts  # Follow, connect, accept/reject requests
│   │   ├── events.api.ts       # Events list, RSVP, create community events
│   │   ├── feed.api.ts         # Posts, likes, comments
│   │   ├── network.api.ts      # Student/alumni networking trends
│   │   ├── notifications.api.ts# Notification list, mark as read
│   │   ├── opportunities.api.ts# Job postings, applications
│   │   ├── profiles.api.ts     # Generic profile lookups
│   │   ├── search.api.ts       # Search alumni and students
│   │   ├── student.api.ts      # Student profile endpoints
│   │   └── tenants.api.ts      # Public universities listing (GET /api/tenants)
│   └── utils.ts                # Date formatting, class names merging (cn)
├── schemas/                    # Zod validation schemas
│   └── auth.schemas.ts         # Registration & login form schemas (requires tenant_id)
├── store/                      # Zustand state management
│   ├── authStore.ts            # Global authentication & tenant branding state
│   └── registrationStore.ts    # Multi-step registration flow state & selectedTenant
├── types/                      # TypeScript definitions
│   ├── api.types.ts            # API payloads, profiles, PublicTenant, TenantSettings
│   └── auth.types.ts           # UserRole, AuthState, Session types
├── middleware.ts / proxy.ts    # Next.js route protection & role redirection proxy
└── tsconfig.json               # Path alias mapping (@/* -> ./*)
```

---

## 2. Key Modules & Where to Make Changes

### If modifying Authentication or University Registration:
- Form inputs & validation: [`schemas/auth.schemas.ts`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/schemas/auth.schemas.ts).
- Multi-step registration wizard: [`components/features/auth/steps/StepRegister.tsx`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/components/features/auth/steps/StepRegister.tsx).
- Registration state: [`store/registrationStore.ts`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/store/registrationStore.ts).
- University picker API: [`lib/api/tenants.api.ts`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/lib/api/tenants.api.ts).

### If modifying User Profile or Layout:
- University branding display: [`components/layout/Navbar.tsx`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/components/layout/Navbar.tsx) and [`components/layout/SideBar.tsx`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/components/layout/SideBar.tsx).
- Profile edit & display: [`components/features/profile/`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/components/features/profile) and [`app/profile/me/page.tsx`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/app/profile/me/page.tsx).

### If modifying Networking, Jobs, or Events:
- Jobs / Opportunities: [`app/opportunities/`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/app/opportunities) & [`lib/api/opportunities.api.ts`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/lib/api/opportunities.api.ts).
- Events & RSVPs: [`app/events/`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/app/events) & [`lib/api/events.api.ts`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/lib/api/events.api.ts).
- Chat & Messaging: [`app/chat/`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/app/chat) & [`lib/api/chat.api.ts`](file:///c:/Users/ranah/Desktop/Unison/Unisons-frontend-main/lib/api/chat.api.ts).
