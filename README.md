# Kitchen.OS-Frontend_Using_React

Kitchen.OS is a modern restaurant management system built with a React.js frontend, designed to simplify restaurant operations with a clean and responsive user interface. Completed in 2026.

<br/>

<div align="center">

# 🍽️ Kitchen.OS — Frontend

### A full-stack restaurant operations platform built with React + Vite

*Real-time orders · Menu management · Staff control · Business analytics*

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-JSX-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Year](https://img.shields.io/badge/Completed-2026-success?style=for-the-badge)

</div>

<br/>

---

## 👋 About This Project

**Kitchen.OS** is my first large-scale project — a complete restaurant operating system built entirely from scratch using React. It manages everything a real restaurant needs on a daily basis: displaying the menu, taking orders, tracking cooking status in the kitchen, generating reports, and managing staff accounts.

This wasn't a tutorial project or a clone. Every page, every component, and every API integration was designed and written by me. It took real problem-solving — figuring out role-based access, multi-step password resets, real-time order status updates, and Chart.js analytics. Building this project taught me how a professional React application is actually structured from the ground up.

The frontend connects to a **Spring Boot backend** on port `8080`. Together they form a complete, deployable restaurant management system.

---

## 📋 Table of Contents

- [About This Project](#-about-this-project)
- [Live Demo & Screenshots](#-live-demo--screenshots)
- [Features](#-features)
- [How It Works — User Roles](#-how-it-works--user-roles)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
  - [Building for Production](#building-for-production)
- [Environment & API Configuration](#-environment--api-configuration)
- [All API Endpoints](#-all-api-endpoints)
- [Pages & Components — Deep Dive](#-pages--components--deep-dive)
- [Authentication & Role-Based Access](#-authentication--role-based-access)
- [Folder Structure Explained](#-folder-structure-explained)
- [Available Scripts](#-available-scripts)
- [Dependencies Explained](#-dependencies-explained)
- [What I Learned Building This](#-what-i-learned-building-this)
- [Challenges I Faced](#-challenges-i-faced)
- [Known Issues & Limitations](#-known-issues--limitations)
- [Future Plans](#-future-plans)
- [Contributing](#-contributing)
- [Author](#-author)
- [License](#-license)

---

## 📸 Live Demo & Screenshots

> Add your screenshots here once the project is running. Place images in a `/screenshots` folder and reference them like this:

```md
![Login Page](./screenshots/login.png)
![Menu Page](./screenshots/menu.png)
![Live Orders](./screenshots/liveorder.png)
![Dashboard](./screenshots/dashboard.png)
```

**To run locally and see it yourself → jump to [Getting Started](#-getting-started)**

---

## ✨ Features

### 🔐 Authentication System
- **Dual login screen** — switch between Admin (User) login and Staff login with a toggle button
- **Animated flip-card UI** — the sign-in and register panels slide with a CSS transition
- **Register new admin accounts** with username, email, and password validation
- **Forgot password with OTP** — a 3-step flow: enter email → verify 6-digit OTP → set new password
- **Auto-redirect** — if you are already logged in and visit `/`, you go straight to `/menu`
- **Corrupt session protection** — if `localStorage` data is broken or tampered with, it is cleared automatically and you are redirected to login
- **Cross-tab logout** — logging out in one browser tab logs out all other open tabs instantly, via the `storage` event

### 🍽️ Menu Browser
- View the full restaurant menu fetched live from the backend
- Filter by **category**: All · Starters · Main Course · Burgers · Beverages · Desserts
- Filter by **type**: Veg 🥦 / Non-Veg 🍗
- Menu item images loaded from the API
- Select **table number** (1–24) or mark as **Takeaway**
- Add items to cart and place orders directly

### 📦 Order Management
- View all placed orders with their current status
- Order status pipeline: **Pending → Cooking → Ready → Completed → Paid/Unpaid**
- Update order status in real time
- **Settle orders** with payment method selection
- View itemized breakdown with quantities and prices
- 10% GST applied automatically to all orders
- Formatted in **Indian Rupees (₹)** with `Intl.NumberFormat`

### 🔴 Live Order Monitor
- Dedicated kitchen-facing view showing all active orders at a glance
- Color-coded **status pills**: pending (yellow), cooking (orange), ready (green)
- Per-order item list with emoji icons, quantity, and price
- Tax + subtotal + total calculated per order
- Built for kitchen staff who only need to see and update live orders

### 📊 Reports & Analytics *(Admin only)*
- Multiple **Chart.js** charts: revenue trends, daily order counts, top-selling items
- Summary cards: total revenue, total orders, average order value
- Refresh button for pulling fresh data
- Download/export option for report data
- All monetary values in ₹ INR with Indian number formatting

### 👥 Staff Management *(Admin only)*
- View all staff members in a table
- **Add new staff** with Staff ID and password
- **Edit** existing staff credentials
- **Delete** staff accounts
- Staff IDs are used for the staff login flow

### 🏨 Admin Settings *(Admin only)*
- **Hotel info**: name, type, contact, email, address, logo upload
- **Owner info**: name, designation, contact, email, address
- **Bank details**: account holder, bank name, account type, account number, IFSC, branch, UPI
- **System settings**: currency, timezone, number of tables, tax rate, GST toggle, GSTIN

### ⚙️ Setup *(Admin only)*
- System-level configuration for operational preferences

### 🖥️ UI / UX
- **Fully responsive** — works on desktop, tablet, and mobile
- Collapsible **SideNav** that hides at screen widths below 992px with a hamburger menu
- **TopNav** bar on every authenticated page
- Font Awesome 6 icons loaded via CDN
- Lucide React icons for action buttons
- React Icons for form field icons
- Per-component CSS files for clean style isolation
- Consistent color palette: purple (`#6366f1`), green (`#10b981`), amber (`#f59e0b`)

---

## 👤 How It Works — User Roles

Kitchen.OS has two roles. What you can see and do depends entirely on your role:

| Feature | Staff 👷 | Admin 👑 |
|---|:---:|:---:|
| View Menu | ✅ | ✅ |
| Place Orders | ✅ | ✅ |
| Live Order Monitor | ✅ | ✅ |
| Reports & Analytics | ❌ | ✅ |
| Add / Edit Menu Items | ❌ | ✅ |
| Manage Staff | ❌ | ✅ |
| Admin Settings | ❌ | ✅ |
| System Setup | ❌ | ✅ |

**Staff login** uses a Staff ID + Password set by the admin.
**Admin login** uses email/username + password with full registration support.

If a Staff user tries to access an admin-only URL directly in the browser, they are automatically redirected back to `/menu`. There is no way to bypass this on the frontend.

---

## 🛠️ Tech Stack

| Category | Technology | Why I Used It |
|---|---|---|
| **Framework** | React 19 | Component-based UI, fast re-renders, huge ecosystem |
| **Build Tool** | Vite 7 | Lightning-fast HMR (Hot Module Replacement) in dev |
| **Routing** | React Router DOM v7 | Declarative, nested routes and navigation guards |
| **HTTP Client** | Axios | Cleaner API calls than `fetch`, timeout + error handling |
| **UI Components** | Bootstrap 5 + React-Bootstrap | Responsive grid, navbar, modal, and utility classes |
| **Charts** | Chart.js 4 | Powerful, flexible charts for the analytics dashboard |
| **Icons (Forms)** | React Icons 5 | Font Awesome icons as React components |
| **Icons (Actions)** | Lucide React | Clean, consistent SVG icon set |
| **Icons (Global)** | Font Awesome 6 CDN | Used for sidebar navigation icons via class names |
| **Linting** | ESLint 9 | Catches bugs and enforces code consistency |
| **Language** | JavaScript (JSX) | Standard React, no TypeScript added complexity for v1 |
| **Backend** | Spring Boot (separate repo) | REST API running on `localhost:8080` |

---

## 📁 Project Structure

```
Kitchen.OS/
│
├── public/
│   └── vite.svg                        # Browser tab favicon
│
├── src/
│   │
│   ├── assets/
│   │   └── react.svg                   # Default React logo asset
│   │
│   ├── components/                     # Reusable UI pieces shared across pages
│   │   ├── Header/
│   │   │   ├── Header.jsx              # Main page header component
│   │   │   ├── Header.css
│   │   │   ├── Header1.jsx             # Alternate header used on Menu & Order pages
│   │   │   └── Header1.css
│   │   │
│   │   ├── SideNav/
│   │   │   ├── SideNav.jsx             # Role-aware collapsible sidebar navigation + logout
│   │   │   └── SideNav.css
│   │   │
│   │   └── TopNav/
│   │       ├── TopNav.jsx              # Top bar shown on all authenticated pages
│   │       └── TopNav.css
│   │
│   ├── pages/                          # One folder per full page/screen
│   │   ├── AddMenu/
│   │   │   ├── AddMenu.jsx             # Form to add new menu items (Admin)
│   │   │   └── AddMenu.css
│   │   │
│   │   ├── Admin/
│   │   │   ├── Admin.jsx               # Hotel, owner, bank, and settings forms (Admin)
│   │   │   └── Admin.css
│   │   │
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx           # Chart.js analytics and revenue reports (Admin)
│   │   │   └── Dashboard.css
│   │   │
│   │   ├── Information/
│   │   │   ├── Information.jsx         # Restaurant info display
│   │   │   └── Information.css
│   │   │
│   │   ├── LiveOrder/
│   │   │   ├── LiveOrder.jsx           # Real-time kitchen order tracking
│   │   │   └── LiveOrder.css
│   │   │
│   │   ├── Menu/
│   │   │   ├── Menu.jsx                # Menu browser with filters and order placement
│   │   │   └── Menu.css
│   │   │
│   │   ├── Orders/
│   │   │   ├── Order.jsx               # Order history, status updates, settlement
│   │   │   └── Order.css
│   │   │
│   │   ├── SetUp/
│   │   │   ├── SetUp.jsx               # System setup and configuration (Admin)
│   │   │   └── SetUp.css
│   │   │
│   │   └── Staff/
│   │       ├── Staff.jsx               # Staff CRUD management (Admin)
│   │       └── Staff.css
│   │
│   ├── App.jsx                         # Root component — all routes defined here
│   ├── App.css
│   ├── Login.jsx                       # Login + Register + Forgot Password screen
│   ├── Login.css
│   ├── ProtectedRoute.jsx              # Auth guard HOC — protects every route
│   ├── main.jsx                        # Entry point — renders App into the DOM
│   └── index.css                       # Global base styles
│
├── index.html                          # Vite HTML shell + Font Awesome CDN link
├── vite.config.js                      # Vite configuration
├── eslint.config.js                    # ESLint rules
├── package.json                        # Dependencies and scripts
├── package-lock.json                   # Locked dependency tree
└── .gitignore                          # Files excluded from Git
```

### Why This Structure?

- **`components/`** holds pieces that appear on *multiple* pages (SideNav, TopNav, Header)
- **`pages/`** holds everything that is its own full screen — one folder per page keeps JSX + CSS together
- **`App.jsx`** is the single source of truth for all routes — you can see every URL the app supports in one file
- **`ProtectedRoute.jsx`** wraps protected routes so auth logic lives in one place, not scattered across every page

---

## 🚀 Getting Started

### Prerequisites

Before you run this project, make sure you have:

| Requirement | Version | Check with |
|---|---|---|
| Node.js | v18 or higher | `node --version` |
| npm | v9 or higher | `npm --version` |
| Kitchen.OS Backend | Spring Boot running | Visit `http://localhost:8080/api` |

> **Don't have Node.js?** Download it from [nodejs.org](https://nodejs.org). The LTS version is recommended.

> **Backend not set up?** You need the Spring Boot backend running first. The frontend will load but all API calls will fail until the backend is online.

---

### Installation

**Step 1 — Get the code**

```bash
# Clone the repository
git clone https://github.com/your-username/Kitchen.OS.git

# Move into the project folder
cd Kitchen.OS
```

**Step 2 — Install all dependencies**

```bash
npm install
```

This reads `package.json` and downloads everything into a `node_modules/` folder. It may take 1–2 minutes the first time.

---

### Running the App

**Start the development server:**

```bash
npm run dev
```

You will see output like:

```
  VITE v7.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Open **http://localhost:5173** in your browser. The page hot-reloads automatically whenever you save a file — no manual refresh needed.

> ⚠️ **Important:** Make sure the Spring Boot backend is already running on `http://localhost:8080` before you try to log in. If it's not running, you'll see a "Cannot connect to server" error message on the login screen.

---

### Building for Production

When you're ready to deploy, create an optimized build:

```bash
npm run build
```

This creates a `dist/` folder with minified, production-ready files. To preview it locally before deploying:

```bash
npm run preview
```

The preview server runs at **http://localhost:4173**.

To deploy, you can upload the `dist/` folder to any static hosting service — Netlify, Vercel, GitHub Pages, or an Nginx server.

---

## 🌐 Environment & API Configuration

The app is hardcoded to talk to the backend at:

```
http://localhost:8080/api
```

This `BASE_URL` constant appears in several files:

```
src/Login.jsx
src/pages/Dashboard/Dashboard.jsx
src/pages/LiveOrder/LiveOrder.jsx
src/pages/Menu/Menu.jsx
src/pages/Orders/Order.jsx
src/pages/Admin/Admin.jsx
src/pages/Staff/Staff.jsx
```

**For a real deployment**, you should centralize this into one config file:

```js
// src/config/api.js  (create this file)
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

Then create a `.env` file in the project root:

```env
# .env
VITE_API_URL=https://your-production-server.com/api
```

> Vite only exposes environment variables that start with `VITE_`. Never put secret keys in frontend env files — they are visible to anyone who opens your app.

---

## 🔌 All API Endpoints

These are all the backend endpoints this frontend calls. Your Spring Boot backend must implement all of these:

### Auth

| Method | Endpoint | Used In | Description |
|---|---|---|---|
| `POST` | `/api/login` | Login.jsx | Admin/user login with username or email |
| `POST` | `/api/staff_login` | Login.jsx | Staff login with Staff ID and password |
| `POST` | `/api/add_users` | Login.jsx | Register a new admin user |
| `POST` | `/api/forgot-password` | Login.jsx | Send OTP to email for password reset |
| `POST` | `/api/verify-otp` | Login.jsx | Verify the 6-digit OTP |
| `POST` | `/api/reset-password` | Login.jsx | Set new password after OTP verified |

### Menu

| Method | Endpoint | Used In | Description |
|---|---|---|---|
| `GET` | `/api/view_menu` | Menu.jsx, Order.jsx | Fetch all menu items |
| `GET` | `/api/menu_image/:id` | Menu.jsx | Load image for a menu item by ID |

### Orders

| Method | Endpoint | Used In | Description |
|---|---|---|---|
| `GET` | `/api/view_orders` | Order.jsx, LiveOrder.jsx, Dashboard.jsx | Fetch all orders |
| `POST` | `/api/add_order` | Menu.jsx | Place a new order |
| `PUT` | `/api/update_order/:id` | Order.jsx, LiveOrder.jsx | Update order details |
| `PATCH` | `/api/update_order_status/:id?status=ready` | LiveOrder.jsx | Update status of an order |
| `POST` | `/api/settle_order/:id?paymentMethod=...` | Order.jsx | Mark order as paid |
| `GET` | `/api/payment_history` | Dashboard.jsx | Get payment/revenue history |

### Staff

| Method | Endpoint | Used In | Description |
|---|---|---|---|
| `GET` | `/api/view_staff` | Staff.jsx, SideNav.jsx | Fetch all staff records |
| `POST` | `/api/add_staff` | Staff.jsx | Add a new staff member |
| `PUT` | `/api/update_staff/:id` | Staff.jsx | Update staff details |
| `DELETE` | `/api/delete_staff/:id` | Staff.jsx | Remove a staff member |

### Admin Settings

| Method | Endpoint | Used In | Description |
|---|---|---|---|
| `GET` | `/api/admin_settings` | Admin.jsx, Dashboard.jsx | Fetch all admin/restaurant settings |
| `POST` | `/api/update_hotel` | Admin.jsx | Save hotel info |
| `POST` | `/api/update_owner` | Admin.jsx | Save owner info |
| `POST` | `/api/update_bank` | Admin.jsx | Save bank details |
| `POST` | `/api/update_admin_settings` | Admin.jsx | Save system settings (tax, tables, GST) |
| `GET` | `/api/admin_logo` | Admin.jsx | Fetch restaurant logo image |

---

## 📄 Pages & Components — Deep Dive

### Pages

| Route | Component | Access | What It Does |
|---|---|---|---|
| `/` | `Login.jsx` | Public | Login, register, forgot password — the entry point |
| `/menu` | `Menu.jsx` | Staff + Admin | Browse menu, apply filters, select table, place orders |
| `/order` | `Order.jsx` | Staff + Admin | View all orders, update status, settle payment |
| `/liveorder` | `LiveOrder.jsx` | Staff + Admin | Kitchen display — live view of active orders |
| `/reports` | `Dashboard.jsx` | Admin only | Revenue charts, order analytics, payment history |
| `/addmenu` | `AddMenu.jsx` | Admin only | Add new items to the restaurant menu |
| `/admin` | `Admin.jsx` | Admin only | Manage hotel, owner, bank info, and system settings |
| `/staff` | `Staff.jsx` | Admin only | Add, edit, and remove staff accounts |
| `/setup` | `SetUp.jsx` | Admin only | System-level configuration |

Any unmatched URL (like `/random-page`) automatically redirects to `/` — no 404 pages needed.

---

### Key Components Explained

#### `ProtectedRoute.jsx`
This is a **Higher Order Component (HOC)** — it wraps every private route. Before rendering the page, it checks:
1. Is there a valid token in `localStorage`? If not → redirect to `/`
2. Does the user's role allow this route? If not → redirect to `/menu`
3. Is the data corrupt or unparseable? → Clear it and redirect to `/`

It also listens for `localStorage` changes via the `storage` event, so if you log out in Tab A, Tab B also logs out instantly.

#### `SideNav.jsx`
The sidebar reads the user's role from `localStorage` once on load. It then filters the nav items array, showing only the items the current role is allowed to see. Admins see: Menu, Order, Reports, Setup. Staff see only: Menu, Order. Logout clears all session keys and navigates to `/`.

#### `TopNav.jsx`
A simple top navigation bar rendered on every authenticated page, above the main content.

#### `Header.jsx` / `Header1.jsx`
Two header variants used on different pages. `Header1` is used on the Menu and Order pages and includes page-specific controls.

---

## 🔐 Authentication & Role-Based Access

### What Gets Stored in `localStorage`

When login succeeds, two keys are written:

| Key | What's Stored | Example |
|---|---|---|
| `kitchen_os_token` | A base64-encoded opaque string (identifier + timestamp + random value) | `"dXNlcjoxNzE3MDAwMDAwOmFiYzEyMw=="` |
| `kitchen_os_user` | A JSON string with the user's info | `{"userName":"john","email":"john@test.com","role":"admin"}` |

### The Auth Flow, Step by Step

```
User opens the app
        ↓
ProtectedRoute checks localStorage
        ↓
   Token found?  ──No──→  Redirect to /login
        ↓ Yes
   User data valid JSON?  ──No──→  Clear storage, redirect to /login
        ↓ Yes
   Role === 'admin'?
        ↓ No (staff)
   Is this route adminOnly?  ──Yes──→  Redirect to /menu
        ↓ No
   Is this path in STAFF_ALLOWED?  ──No──→  Redirect to /menu
        ↓ Yes
        ✅ Render the page
```

### Role Normalization

The backend sometimes returns roles like `"Admin"`, `"ADMIN"`, or `"admin"`. The code handles this by always doing:

```js
const role = user.role.trim().toLowerCase();  // "admin" every time
```

### Logout

When the user logs out (via SideNav), these keys are removed:

```js
['kitchen_os_token', 'kitchen_os_user', 'kitchen_os_staff', 'theme', 'language']
  .forEach(key => localStorage.removeItem(key));
```

---

## 📜 Available Scripts

Run these from the project root (`Kitchen.OS/`) in your terminal:

| Command | What It Does |
|---|---|
| `npm run dev` | Starts the Vite dev server at `localhost:5173` with hot reload |
| `npm run build` | Compiles and bundles the app into `dist/` for production |
| `npm run preview` | Serves the production `dist/` build locally at `localhost:4173` |
| `npm run lint` | Runs ESLint to check for code errors and style issues |

---

## 📦 Dependencies Explained

Understanding why each package is in the project:

### Runtime Dependencies

| Package | What It Does |
|---|---|
| `react` `^19.2.0` | The core React library — creates and manages UI components |
| `react-dom` `^19.2.0` | Connects React to the actual browser DOM |
| `react-router-dom` `^7.13.0` | Handles page navigation without full browser reloads |
| `axios` `^1.13.6` | Makes HTTP requests to the Spring Boot backend — cleaner than raw `fetch` |
| `bootstrap` `^5.3.8` | CSS framework providing layout grid, responsive utilities, and base styles |
| `react-bootstrap` `^2.10.10` | Bootstrap components (Navbar, Container, Nav) written as React components |
| `chart.js` `^4.5.1` | Draws the bar charts, line charts, and doughnut charts on the Dashboard |
| `lucide-react` `^0.577.0` | Clean SVG icon components used for action buttons |
| `react-icons` `^5.5.0` | Provides Font Awesome icons (FaUser, FaLock, etc.) as React components |

### Dev Dependencies

| Package | What It Does |
|---|---|
| `vite` `^7.3.1` | The build tool and dev server — much faster than webpack |
| `@vitejs/plugin-react` `^5.1.1` | Enables React Fast Refresh so the page updates instantly on save |
| `eslint` `^9.39.1` | Scans your code for bugs and style violations before you run it |
| `eslint-plugin-react-hooks` `^7.0.1` | ESLint rules specific to React Hooks (warns about missing `useEffect` dependencies) |
| `eslint-plugin-react-refresh` `^0.4.24` | ESLint rules for Vite's Fast Refresh compatibility |

---

## 🎓 What I Learned Building This

This project pushed me through many real-world React concepts that tutorials never fully cover:

**React Fundamentals**
- Using `useState`, `useEffect`, `useRef`, `useCallback`, and `useMemo` in real contexts — not toy examples
- Understanding when components re-render and how to avoid unnecessary re-renders with `useCallback` and `useMemo`
- Managing complex local state (form data, loading states, error messages, modal open/close) all at once

**React Router**
- Setting up a full route configuration with `<Routes>` and `<Route>` in one central file
- Building a `ProtectedRoute` HOC that wraps routes with auth and role logic
- Using `useNavigate` and `<Navigate>` for programmatic redirects
- Using `useLocation` to track where the user is and redirect them after login

**API Integration**
- Connecting a React frontend to a real REST backend using Axios
- Handling loading states, success responses, and error responses consistently
- Extracting shared error-handling logic into a single `handleAxiosError` function
- Working with template literal URLs (`${BASE_URL}/endpoint`) across many pages

**Authentication**
- Implementing a complete login/logout/register flow from scratch
- Understanding `localStorage` for session persistence
- Synchronizing auth state across browser tabs using the `window.storage` event
- Safely handling corrupt JSON in `localStorage` with try/catch

**Forms & Validation**
- Building multi-step forms (the OTP password reset flow has 3 steps)
- OTP input handling — auto-focus to the next box, backspace going back
- Client-side validation with descriptive error messages before making any API call

**Data Display**
- Integrating Chart.js 4 with React using `useRef` for the canvas and `useEffect` for initialization
- Formatting INR currency properly using `Intl.NumberFormat` with locale `en-IN`
- Building filtered, searchable lists with `useMemo` so filtering is fast

**Component Design**
- Splitting a large app into reusable components (SideNav, TopNav, Header) shared across pages
- Using per-component CSS files so styles don't leak between components
- Writing role-aware components that show different content based on the logged-in user's role

---

## 😤 Challenges I Faced

These were the hardest problems I solved during this project:

**1. Role-based routing**
The trickiest part was preventing staff users from accessing admin URLs by typing them in the browser. I solved it by building `ProtectedRoute` as a wrapper component that checks the role every time the route renders, not just on first load.

**2. Corrupt localStorage crashing the app**
Early on, if `localStorage` had invalid JSON (from a failed write or a browser extension), `JSON.parse` would throw and the entire app would crash on load. I added try/catch around all `localStorage` reads and auto-clear any corrupted data, so the user just gets redirected to login instead of seeing a broken white screen.

**3. Cross-tab logout**
After implementing login/logout, I realized that if you had the app open in two tabs and logged out in one, the other still showed you as logged in. I fixed this by adding a `window.addEventListener('storage', ...)` listener in `ProtectedRoute` that re-checks auth whenever any `localStorage` key changes.

**4. Chart.js memory leaks**
Each time the Dashboard component re-mounted, it created a new Chart.js instance on the same canvas without destroying the old one. This caused the "Canvas already in use" error. I fixed it by keeping a `useRef` to the chart instance and calling `chart.destroy()` in the `useEffect` cleanup function before creating a new one.

**5. OTP input focus management**
The 6-box OTP input needed auto-focus behavior — when you type a digit, focus moves to the next box; when you backspace on an empty box, focus goes back. I used `useRef` with an array of input refs and attached custom `onChange` and `onKeyDown` handlers to each box.

**6. API response inconsistency**
The backend sometimes returned role as `"Admin"`, `"ADMIN"`, or `"admin"` depending on how the user was created. I solved this by always normalizing the role with `.trim().toLowerCase()` after reading it from the API response.

---

## ⚠️ Known Issues & Limitations

These are things I'm aware of and plan to fix in future versions:

- **`BASE_URL` is hardcoded** in multiple files instead of living in one config file or `.env` — this makes changing the backend URL tedious
- **No real token validation** — the frontend generates its own opaque base64 token rather than using a JWT signed by the backend. A proper implementation would validate the token server-side on every protected request
- **No token expiry** — sessions never expire. A user who logged in 6 months ago with a saved `localStorage` session is still considered logged in
- **Charts don't auto-refresh** — the Dashboard charts show data from the last page load. You have to click the Refresh button to see new data
- **No loading skeleton UI** — while data is fetching, pages show blank space. Skeleton loaders would be a better UX
- **Axios timeout is 10 seconds** (login) — some other pages don't have explicit timeouts set
- **`node_modules` included in the RAR archive** — this should be excluded via `.gitignore` when sharing code (only source files should be committed)

---

## 🔮 Future Plans

Features and improvements I want to add next:

- [ ] **Move `BASE_URL` to a `.env` file** — centralize all config in one place
- [ ] **Real JWT authentication** — backend issues a signed JWT, frontend sends it in `Authorization: Bearer` headers on every API call
- [ ] **Token expiry & auto-refresh** — implement refresh token flow so sessions expire gracefully
- [ ] **WebSocket / polling for live orders** — instead of manual refresh, live orders update automatically every few seconds
- [ ] **Dark mode** — system-aware dark theme using CSS variables
- [ ] **Search and filter on Orders page** — filter by date range, status, or table number
- [ ] **Print receipts** — generate a printable bill/invoice from the order detail view
- [ ] **TypeScript migration** — add type safety to catch more bugs at compile time
- [ ] **Unit tests with Vitest** — write tests for ProtectedRoute logic, form validation, and auth flows
- [ ] **PWA support** — make the app installable as a Progressive Web App for tablet-based kitchen displays
- [ ] **Multi-language support** — add i18n for Hindi and other regional languages

---

## 🤝 Contributing

Contributions, suggestions, and bug reports are all welcome! This is my first big project so feedback is especially appreciated.

**To contribute:**

1. **Fork** this repository on GitHub
2. **Create** a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and commit with a clear message:
   ```bash
   git commit -m "feat: add dark mode toggle"
   ```
4. **Push** your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request** on GitHub and describe what you changed and why

**Before submitting, please:**
- Run `npm run lint` and fix any errors
- Test your changes in both Admin and Staff roles
- Make sure the app builds without errors: `npm run build`

**Found a bug?** Open a GitHub Issue with:
- What you were doing when it happened
- What you expected to happen
- What actually happened
- Your browser and OS

---

## 👨‍💻 Author

**[Suyash Kunde]**

- GitHub: [@my-username](https://github.com/YASHKUNDE)
- LinkedIn: [@my-linkedin](https://linkedin.com/in/suyashkunde)

> *Kitchen.OS is my first large-scale React project, built entirely from scratch in 2026. It represents months of learning, debugging, and problem-solving. If you find it useful or have feedback, I'd love to hear from you.*


<div align="center">

**Built Web Application · React 19 + Vite 7 · Kitchen.OS Frontend · 2026**

*If this project helped you or you learned something from reading it, please give it a ⭐ on GitHub!*

</div>