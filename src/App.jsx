import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';

import Menu      from './pages/Menu/Menu';
import Order     from './pages/Orders/Order';
import Dashboard from './pages/Dashboard/Dashboard';
import SetUp     from './pages/SetUp/SetUp';
import LiveOrder from './pages/LiveOrder/LiveOrder';
import Staff     from './pages/Staff/Staff';
import AddMenu   from './pages/AddMenu/AddMenu';
import Admin     from './pages/Admin/Admin';
import Login     from './Login';

// ── Allowed paths for staff role ─────────────────────────────
const STAFF_ALLOWED = ['/menu', '/order', '/liveorder'];

// FIX: getAuth now validates JSON parse to avoid corrupt-data crashes,
// and trims/lowercases the role to handle inconsistent backend casing.
const getAuth = () => {
  try {
    const token   = localStorage.getItem('kitchen_os_token');
    const userStr = localStorage.getItem('kitchen_os_user');
    if (!token || !userStr) return { isAuth: false, role: null };
    const user = JSON.parse(userStr);
    // FIX: Ensure role is always a clean lowercase string
    const role = typeof user.role === 'string' ? user.role.trim().toLowerCase() : 'staff';
    return { isAuth: true, role };
  } catch {
    // FIX: Remove corrupt auth data rather than leaving it in place
    localStorage.removeItem('kitchen_os_token');
    localStorage.removeItem('kitchen_os_user');
    return { isAuth: false, role: null };
  }
};

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const location = useLocation();
  const [auth, setAuth] = useState(getAuth);

  // Re-check when another tab logs out or logs in
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'kitchen_os_token' || e.key === 'kitchen_os_user') {
        setAuth(getAuth());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!auth.isAuth) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && auth.role !== 'admin') {
    return <Navigate to="/menu" replace />;
  }

  if (auth.role === 'staff') {
    const path    = location.pathname.toLowerCase();
    const allowed = STAFF_ALLOWED.some((p) => path === p || path.startsWith(p + '/'));
    if (!allowed) return <Navigate to="/menu" replace />;
  }

  return children;
};
// ─────────────────────────────────────────────────────────────

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />

      {/* Staff + Admin */}
      <Route path="/menu"      element={<ProtectedRoute><Menu      /></ProtectedRoute>} />
      <Route path="/order"     element={<ProtectedRoute><Order     /></ProtectedRoute>} />
      <Route path="/liveorder" element={<ProtectedRoute><LiveOrder /></ProtectedRoute>} />

      {/* Admin only */}
      <Route path="/reports" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
      <Route path="/staff"   element={<ProtectedRoute adminOnly><Staff     /></ProtectedRoute>} />
      <Route path="/addmenu" element={<ProtectedRoute adminOnly><AddMenu   /></ProtectedRoute>} />
      <Route path="/admin"   element={<ProtectedRoute adminOnly><Admin     /></ProtectedRoute>} />
      <Route path="/setup"   element={<ProtectedRoute adminOnly><SetUp     /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;