<<<<<<< HEAD
# Kitchen.OS-Frontend_Using_React
Kitchen.OS is a modern restaurant management system built with a React.js frontend, designed to simplify restaurant operations with a clean and responsive user interface. Completed in 2026.
=======
# Kitchen.OS — Frontend_Using_React


# 🍽️ Kitchen.OS — Frontend

> **Kitchen.OS is a full-featured restaurant operations platform built with React. Designed to streamline kitchen and front-of-house workflows, it delivers real-time order tracking, menu management, staff administration, and business analytics — all within a modern, role-aware single-page application. Completed and production-ready as of 2026.**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
  - [Building for Production](#building-for-production)
- [Environment & API Configuration](#environment--api-configuration)
- [Pages & Components](#pages--components)
- [Authentication & Role-Based Access](#authentication--role-based-access)
- [Scripts](#scripts)
- [Dependencies](#dependencies)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Kitchen.OS is a React-based frontend that connects to a Spring Boot backend running on port `8080`. It provides two distinct user experiences based on role:

- **Admin** — Full access to all modules: menu management, live orders, reports/analytics, staff management, and system setup.
- **Staff** — Restricted access to menu browsing, order placement, and live order monitoring.

The application uses JWT-style token authentication stored in `localStorage`, with clean session handling and automatic redirect on logout or session corruption.

---

## ✨ Features

### 🔐 Authentication
- Dual login modes: **User (Admin)** and **Staff** login flows on a single screen
- Animated flip-card login / register UI
- Forgot password flow with **email OTP verification** (3-step: email → OTP → new password)
- Client-side validation with inline error messages and auto-dismissal
- Corrupt session detection — automatically clears invalid `localStorage` data
- Cross-tab logout sync via the `storage` event listener

### 📋 Menu Management
- Browse full menu with category filters: All, Starters, Main Course, Burgers, Beverages, Desserts
- Veg / Non-Veg filter toggle
- Add new menu items (Admin only)
- Table or Takeaway order selection

### 📦 Order Management
- Place and track customer orders
- Table number assignment or Takeaway flag
- Order history and status display

### 🔴 Live Orders
- Real-time order monitoring for kitchen staff
- Status tracking: **Pending → Cooking → Ready**
- Per-order item breakdown with quantity, price, emoji identifiers
- Tax calculation (10% GST) with subtotal and total breakdown
- Status badge color-coding (pill indicators)

### 📊 Reports & Analytics (Admin Only)
- Interactive **Chart.js** charts — revenue trends, order volumes, top-selling items
- INR currency formatting with `Intl.NumberFormat` (Indian locale)
- Downloadable reports
- Refresh controls for live data reload

### 👥 Staff Management (Admin Only)
- View, add, and manage kitchen and front-of-house staff
- Staff UID-based login credential management

### ⚙️ Setup (Admin Only)
- System-wide configuration for the restaurant
- Restaurant info, preferences, and operational settings

### 🖥️ UI / UX
- Responsive layout with collapsible **SideNav** and **TopNav**
- Font Awesome 6 icon set throughout
- Bootstrap 5 + React-Bootstrap for layout primitives
- Lucide React icons for action controls
- CSS Modules per component for style isolation
- Mobile-friendly navigation (hamburger menu collapses at `< 992px`)

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | React 19 |
| Routing | React Router DOM v7 |
| Build Tool | Vite 7 |
| HTTP Client | Axios |
| UI Library | Bootstrap 5 + React-Bootstrap |
| Charts | Chart.js 4 |
| Icons | React Icons 5, Lucide React, Font Awesome 6 |
| Linting | ESLint 9 with React Hooks plugin |
| Language | JavaScript (JSX) |
| Node | ≥ 18 recommended |

---

## 📁 Project Structure

```
Kitchen.OS/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── Header/
│   │   │   ├── Header.jsx       # Primary header
│   │   │   ├── Header.css
│   │   │   ├── Header1.jsx      # Alternate header variant (used in Menu)
│   │   │   └── Header1.css
│   │   ├── SideNav/
│   │   │   ├── SideNav.jsx      # Role-aware collapsible sidebar navigation
│   │   │   └── SideNav.css
│   │   └── TopNav/
│   │       ├── TopNav.jsx       # Top navigation bar
│   │       └── TopNav.css
│   ├── pages/
│   │   ├── AddMenu/             # Add new menu item (Admin)
│   │   ├── Admin/               # Admin control panel
│   │   ├── Dashboard/           # Reports & analytics with Chart.js
│   │   ├── Information/         # Restaurant information
│   │   ├── LiveOrder/           # Real-time kitchen order view
│   │   ├── Menu/                # Menu browser + order placement
│   │   ├── Orders/              # Order history and management
│   │   ├── SetUp/               # System configuration (Admin)
│   │   └── Staff/               # Staff directory (Admin)
│   ├── App.jsx                  # Root router with role-based route guards
│   ├── App.css
│   ├── Login.jsx                # Login, Register & Forgot Password
│   ├── Login.css
│   ├── ProtectedRoute.jsx       # HOC for auth and role enforcement
│   ├── main.jsx                 # React DOM entry point
│   └── index.css
├── index.html                   # Vite HTML shell (includes Font Awesome CDN)
├── vite.config.js
├── eslint.config.js
├── package.json
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

Ensure the following are installed on your machine:

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Kitchen.OS Backend** (Spring Boot) running on `http://localhost:8080`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/Kitchen.OS.git
   cd Kitchen.OS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Running the App

Start the development server:

```bash
npm run dev
```

The app will be available at **http://localhost:5173** (Vite default).

> ⚠️ Make sure the Spring Boot backend is running on port `8080` before logging in. Without it, all API calls will fail with a network error.

### Building for Production

```bash
npm run build
```

Output is placed in the `dist/` folder. Preview the production build locally:

```bash
npm run preview
```

---

## 🌐 Environment & API Configuration

The frontend targets the backend API at:

```
http://localhost:8080/api
```

This is configured directly in the source files (e.g., `Login.jsx`, `Dashboard.jsx`, `LiveOrder.jsx`) as `BASE_URL`. To change the backend URL for a different environment (staging, production), do a project-wide find-and-replace on:

```
http://localhost:8080/api
```

Or refactor to a single `src/config/api.js` constants file for cleaner management:

```js
// src/config/api.js
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

Then set `VITE_API_URL` in a `.env` file:

```env
VITE_API_URL=https://your-production-api.com/api
```

---

## 📄 Pages & Components

### Pages

| Route | Page | Access |
|---|---|---|
| `/` | Login | Public |
| `/menu` | Menu Browser | Staff + Admin |
| `/order` | Order Management | Staff + Admin |
| `/liveorder` | Live Order Monitor | Staff + Admin |
| `/reports` | Analytics Dashboard | Admin only |
| `/staff` | Staff Management | Admin only |
| `/addmenu` | Add Menu Item | Admin only |
| `/admin` | Admin Panel | Admin only |
| `/setup` | System Setup | Admin only |

### Key Components

**`SideNav`** — Role-aware sidebar. Admin sees all nav items (Menu, Order, Reports, Setup). Staff only sees Menu and Order. Includes logout handler that clears all session keys.

**`TopNav`** — Top navigation bar displayed across all authenticated pages.

**`Header` / `Header1`** — Two header variants used across different page layouts.

**`ProtectedRoute`** — Wraps authenticated routes, enforces role restrictions, and syncs auth state across browser tabs using the `storage` event.

---

## 🔐 Authentication & Role-Based Access

Kitchen.OS uses a localStorage-based authentication strategy:

| Key | Value |
|---|---|
| `kitchen_os_token` | Opaque base64 token (identifier + timestamp + random entropy) |
| `kitchen_os_user` | JSON object with `userName`, `email`, `role` (`"admin"` or `"staff"`) |

### Auth Flow

1. User submits credentials → POST to `/api/login` or `/api/staff_login`
2. On success, token and user object are stored in `localStorage`
3. `ProtectedRoute` reads and validates this data on every navigation
4. Corrupt or missing data is automatically cleared, redirecting to Login
5. Logout clears all session keys and redirects to `/`

### Role Enforcement

- **`adminOnly` routes** redirect Staff users to `/menu`
- **Staff users** are limited to `/menu`, `/order`, and `/liveorder` — any other route redirects to `/menu`
- Role string is normalized (trimmed + lowercased) to handle inconsistent backend casing

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server with HMR |
| `npm run build` | Build optimized production bundle to `dist/` |
| `npm run preview` | Serve the production build locally for testing |
| `npm run lint` | Run ESLint across all source files |

---

## 📦 Dependencies

### Runtime

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.0 | UI framework |
| `react-dom` | ^19.2.0 | DOM rendering |
| `react-router-dom` | ^7.13.0 | Client-side routing |
| `axios` | ^1.13.6 | HTTP client for API calls |
| `bootstrap` | ^5.3.8 | CSS framework |
| `react-bootstrap` | ^2.10.10 | Bootstrap React components |
| `chart.js` | ^4.5.1 | Charts and data visualization |
| `lucide-react` | ^0.577.0 | Icon library |
| `react-icons` | ^5.5.0 | Extended icon set (Font Awesome, etc.) |

### Dev

| Package | Version | Purpose |
|---|---|---|
| `vite` | ^7.3.1 | Build tool and dev server |
| `@vitejs/plugin-react` | ^5.1.1 | React Fast Refresh for Vite |
| `eslint` | ^9.39.1 | Code linting |
| `eslint-plugin-react-hooks` | ^7.0.1 | React Hooks lint rules |
| `eslint-plugin-react-refresh` | ^0.4.24 | React Refresh lint rules |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow the existing code style and run `npm run lint` before submitting.

---

## 📄 License

This project is proprietary software. All rights reserved © 2026 Kitchen.OS.

---

> Built with ❤️ using React + Vite — Kitchen.OS Frontend, 2026
>>>>>>> f5c0f25 (Initial commit)
