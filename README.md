# Unisons Frontend (Alumni Network Platform)

A modern, real-time web application built with Next.js 15 (App Router) serving as the frontend for the Unisons alumni network platform.

## 🚀 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching:** [React Query (@tanstack/react-query)](https://tanstack.com/query/latest) & Axios
- **Form Handling & Validation:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Real-time Communication:** [Socket.io Client](https://socket.io/)
- **Rich Text Editor:** [Tiptap](https://tiptap.dev/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)

## ✨ Key Features

- **Authentication:** Login, Registration, and Password Recovery flows.
- **Interactive Dashboard:** Protected routes for authenticated users.
- **Real-time Chat:** Seamless, instantaneous messaging powered by Socket.io.
- **Rich Text Editing:** Advanced text inputs for posts or messages using Tiptap.
- **Dark/Light Mode:** Full theme support via `next-themes`.
- **Responsive Design:** Fully responsive UI built with Tailwind CSS and Framer Motion for smooth interactions.

## 📦 Project Structure

```text
├── app/
│   ├── (dashboard)/       # Protected dashboard routes (e.g., chat)
│   ├── login/             # User authentication (Login)
│   ├── register/          # User authentication (Registration)
│   ├── forgot-password/   # Password recovery
│   └── globals.css        # Global Tailwind CSS styles
├── components/            # Reusable UI components (shadcn, etc.)
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and library configurations
├── store/                 # Zustand global state stores
├── schemas/               # Zod validation schemas
└── types/                 # TypeScript type definitions
```

## 🛠️ Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Unisons-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and configure your environment variables (e.g., API URLs, Socket endpoint).
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
   ```
   *(Check `.env` or configuration files for exact variables required)*

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📜 Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality issues.
