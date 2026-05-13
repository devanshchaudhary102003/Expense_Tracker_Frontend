# SpendSmart — Expense Tracker Frontend

> A modern React frontend for the **SpendSmart** personal finance platform, built with **Vite + React 18 + TailwindCSS + Recharts**. Connects to an ASP.NET Core microservices backend via a **YARP API Gateway**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [Roles & Permissions](#roles--permissions)
- [Running Tests](#running-tests)
- [Known Issues](#known-issues)

---

## Features

| Area | Description |
|---|---|
| **Auth** | Email/password signup & login with centered card design; Google OAuth one-click sign-in |
| **Dashboard** | KPI cards (income, expense, net balance, savings rate), 6-month trend chart, category pie chart, over-budget alerts, recent expenses |
| **Expenses** | Full CRUD with filters (category, payment mode, search), recurring badge, modal form |
| **Incomes** | Full CRUD with source filtering and recurrence support |
| **Categories** | System defaults + custom categories; icon & color picker; activate/deactivate |
| **Budgets** | Per-category or overall budgets; progress bars with 80% warning and 100% over-limit color coding |
| **Reports** | Monthly summary, category breakdown pie, income-vs-expense trend, top 5 categories bar chart, yearly summary |
| **Notifications** | In-app inbox with mark-read, mark-all-read, delete; unread badge on topbar polled every 30 seconds |
| **Profile** | Edit name & currency, change password, deactivate account |
| **Admin Panel** | Admin-only: list all users, search/filter/delete, broadcast platform-wide notifications |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Routing | React Router 6 |
| Styling | TailwindCSS 3 (custom brand palette `#13935c`) |
| HTTP Client | Axios (with JWT interceptor) |
| Charts | Recharts |
| Icons | lucide-react |
| Toasts | react-hot-toast |
| Testing | Vitest + React Testing Library |

---

## Prerequisites

- **Node.js 18+** and **npm**
- **SpendSmart backend running** with all 8 services (ApiGateway + 7 microservices)
  - Default gateway URL: `http://localhost:5201`

---

## Getting Started

### Install & run in development

```bash
cd spendsmart-frontend

npm install

cp .env.example .env   # adjust VITE_API_BASE_URL if your gateway runs elsewhere

npm run dev
```

The app opens at **http://localhost:5173**.

### Build for production

```bash
npm run build      # outputs to dist/
npm run preview    # serves the production build locally
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_API_BASE_URL=http://localhost:5201     # YARP API Gateway base URL
VITE_AUTH_BASE_URL=http://localhost:5039    # AuthService direct URL (Google OAuth only)
```

> For Google OAuth to work, set a real `Authentication:Google:ClientSecret` in your backend `AuthService/appsettings.json` and register `http://localhost:5039/signin-google` as an authorised redirect URI in Google Cloud Console.

---

## Project Structure

```
spendsmart-frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/                    # Axios clients, one per microservice
│   │   ├── client.js           # Base Axios instance + JWT interceptors
│   │   ├── auth.js
│   │   ├── expenses.js
│   │   ├── incomes.js
│   │   ├── categories.js
│   │   ├── budgets.js
│   │   ├── notifications.js
│   │   └── reports.js
│   ├── components/             # Reusable UI components
│   │   ├── AppLayout.jsx       # Sidebar + Topbar shell (Outlet wrapper)
│   │   ├── Sidebar.jsx
│   │   ├── Topbar.jsx
│   │   ├── Logo.jsx
│   │   ├── Modal.jsx
│   │   ├── Feedback.jsx        # Spinner, PageLoader, EmptyState
│   │   └── ProtectedRoute.jsx  # Auth guard (optionally admin-only)
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state, JWT persistence, user profile
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── OAuthCallback.jsx   # Handles Google OAuth redirect
│   │   ├── Dashboard.jsx
│   │   ├── Expenses.jsx
│   │   ├── Incomes.jsx
│   │   ├── Categories.jsx
│   │   ├── Budgets.jsx
│   │   ├── Reports.jsx
│   │   ├── Notifications.jsx
│   │   ├── Profile.jsx
│   │   └── Admin.jsx
│   ├── test/
│   │   └── setup.js            # Vitest + jsdom global setup
│   ├── utils/
│   │   └── format.js           # Currency and date formatting helpers
│   ├── App.jsx                 # Route table
│   ├── main.jsx                # Entry point
│   └── index.css               # Tailwind directives + custom component styles
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## API Integration

All API calls are routed through the YARP API Gateway. The base URL is read from `VITE_API_BASE_URL` (defaults to `http://localhost:5201`).

| Service | Route Prefix |
|---|---|
| Auth | `/api/auth` |
| Expenses | `/api/expenses` |
| Incomes | `/api/incomes` |
| Categories | `/api/categories` |
| Budgets | `/api/budgets` |
| Reports | `/api/reports` |
| Notifications | `/api/notifications` |

The base Axios instance in `src/api/client.js` automatically attaches the JWT from `localStorage` (`ss_token`) to every request via a request interceptor. An expired or invalid token triggers an automatic logout and redirect to `/login`.

---

## Authentication

### Email / Password

Standard signup (`/signup`) and login (`/login`) flows using the `/api/auth` endpoints. JWT is stored in `localStorage` as `ss_token`.

### Google OAuth

The Google sign-in button redirects to:

```
GET {GATEWAY}/api/auth/google-login?returnUrl={FRONTEND}/oauth-callback
```

After the user completes Google sign-in, the backend redirects back to `/oauth-callback?token=<jwt>`. The frontend stores the token and fetches the user profile via `/api/auth/me`.

> The frontend calls AuthService **directly** for OAuth; this is configurable via `VITE_AUTH_BASE_URL`.

---

## Roles & Permissions

The backend assigns the `User` role by default on registration. To grant Admin access (required for the `/admin` panel), update the role directly in the database:

```sql
UPDATE "User" SET "Role" = 'Admin' WHERE "Email" = 'you@example.com';
```

Sign out and sign back in to refresh the JWT with the new role.

---

## Running Tests

```bash
npm run test        # run all tests in watch mode (Vitest)
npm run test:ui     # open the Vitest browser UI
```

Tests live alongside their components as `*.test.jsx` files inside `src/components/`.

---

## Known Issues

- **ExpenseService `/search` bug**: The backend `/search` endpoint returns recurring expenses instead of search hits. The frontend works around this by performing client-side filtering on the already-loaded expense list.
- **Background jobs**: `RecurringRemindersService` and `BudgetResetService` are backend background jobs — no frontend action is required for them.
- **CORS**: The frontend assumes the gateway has CORS open (`AllowAnyOrigin`), which is the default backend configuration.
