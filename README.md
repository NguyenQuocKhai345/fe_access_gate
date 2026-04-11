# React + TypeScript + Shadcn UI Production Starter

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/ghostshreyash/vite-react-shadcn-template)](https://github.com/ghostshreyash/vite-react-shadcn-template/commits/main)
[![GitHub Stars](https://img.shields.io/github/stars/ghostshreyash/vite-react-shadcn-template?style=social)](https://github.com/ghostshreyash/vite-react-shadcn-template/stargazers)

A production-oriented Vite starter with React 19, TypeScript, Shadcn UI, React Query, React Router v7, auth boilerplate, dark mode, Zustand, i18n, and CI/pre-commit quality checks — everything you need to skip setup and start shipping.

---

## Why this template?

Plain Vite scaffolds give you a blank canvas. This gives you a production foundation.

| Feature                                   | `create vite` | This template |
| ----------------------------------------- | :-----------: | :-----------: |
| Routing with guarded routes               |       ✗       |       ✓       |
| Auth scaffolding (login, register, token) |       ✗       |       ✓       |
| Global error boundary + 404 page          |       ✗       |       ✓       |
| Dark / light / system theme toggle        |       ✗       |       ✓       |
| State management (Zustand)                |       ✗       |       ✓       |
| i18n skeleton (en + hi)                   |       ✗       |       ✓       |
| CI + pre-commit quality gates             |       ✗       |       ✓       |
| Shadcn UI + Tailwind v4                   |       ✗       |       ✓       |
| TanStack Query setup                      |       ✗       |       ✓       |
| Axios with interceptors                   |       ✗       |       ✓       |

---

## Stack

| Layer         | Library                     |
| ------------- | --------------------------- |
| Framework     | React 19 + Vite             |
| Language      | TypeScript (strict)         |
| UI            | Shadcn UI + Tailwind CSS v4 |
| Routing       | React Router v7             |
| Data Fetching | TanStack Query v5           |
| HTTP          | Axios                       |
| State         | Zustand                     |
| i18n          | react-i18next               |
| Theme         | next-themes                 |

---

## Features

- ⚡ **Vite + React 19** — instant dev server, fast HMR
- 🎨 **Shadcn UI + Tailwind CSS v4** — accessible, customisable components
- 🔀 **React Router v7** — app routing with protected routes
- 🔐 **Auth boilerplate** — login/register pages, token persistence, Axios auth header injection
- 🛡 **Global Error Boundary** — catches runtime errors gracefully
- 🚫 **Custom 404 page** — no dead ends for users
- 🌙 **Theme toggle** — light / dark / system via `next-themes`
- 🐻 **Zustand store** — lightweight state management with an auth store example
- 🌍 **i18n skeleton** — `en` and `hi` locales via `react-i18next`, ready to extend
- 🔄 **TanStack Query** — `QueryClientProvider` configured and ready
- 🔗 **Axios service** — centralised instance with request/response interceptors
- ✅ **GitHub Actions CI** — lint + type-check on every PR and push to `main`
- 🪝 **Husky + lint-staged + Prettier** — pre-commit formatting and linting
- 🧩 **TypeScript strict mode** — better code quality out of the box

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# 1. Clone
git clone https://github.com/ghostshreyash/vite-react-shadcn-template.git my-app
cd my-app

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL

# 4. Start dev server
npm run dev
```

### Environment variables

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## Scripts

| Command              | Description              |
| -------------------- | ------------------------ |
| `npm run dev`        | Start local dev server   |
| `npm run build`      | Build for production     |
| `npm run preview`    | Preview production build |
| `npm run lint`       | Run ESLint               |
| `npm run type-check` | Run TypeScript check     |

---

## Project Structure

```
src/
├── app/                  # Router setup and route definitions
├── components/
│   ├── auth/             # Route guards (ProtectedRoute, GuestRoute)
│   ├── error/            # Global error boundary
│   ├── layout/           # Shared app layout (header, sidebar)
│   ├── theme/            # Theme provider + toggle button
│   └── ui/               # Shadcn UI primitives
├── pages/                # Route-level page components
├── services/             # Axios instance + API helpers
│   ├── api.ts            # Central Axios instance with interceptors
│   └── auth.api.ts       # Auth service (login, register, refresh)
├── store/                # Zustand stores
│   └── auth-store.ts     # Auth state (user, token, actions)
├── i18n.ts               # react-i18next initialisation
├── App.tsx               # Provider composition root
└── main.tsx              # App bootstrap entry point
```

---

## Data Fetching

The app uses a centralised Axios instance (`src/services/api.ts`) with:

- **Base URL** from `VITE_API_BASE_URL` env variable
- **Request interceptor** — ready for Authorization header injection
- **Response interceptor** — global error logging and 401 handling

Combine it with TanStack Query hooks for full server state management:

```ts
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/services/auth.api";

const { data, isLoading, error } = useQuery({
  queryKey: ["profile"],
  queryFn: getProfile,
});
```

---

## Adding Shadcn UI Components

Components are copied directly into your project — you own them completely:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add form
```

Components land in `src/components/ui/` and can be customised freely.

---

## Quality & Automation

- **Pre-commit hook** — `lint-staged` runs ESLint autofix + Prettier on staged files
- **CI** — GitHub Actions runs lint and type-check on PRs and pushes to `main`
- **Strict TypeScript** — `noUncheckedIndexedAccess`, `strictNullChecks`, and more enabled

---

## Roadmap

- [ ] Form validation examples with Zod + React Hook Form
- [ ] Role-based access control (RBAC) example
- [ ] Reusable API error toast + retry pattern
- [ ] Storybook integration for UI components

---

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for how to get started.

## License

MIT — see [LICENSE](./LICENSE).
