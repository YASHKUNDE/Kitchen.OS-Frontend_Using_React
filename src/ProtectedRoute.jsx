import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Pages staff are allowed to visit
const STAFF_ALLOWED_PATHS = ['/menu', '/order', '/liveorder'];

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const location = useLocation();
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuth: false,
    role: null,
  });

  useEffect(() => {
    const check = () => {
      const token   = localStorage.getItem('kitchen_os_token');
      const userStr = localStorage.getItem('kitchen_os_user');

      if (!token || !userStr) {
        setAuthState({ isLoading: false, isAuth: false, role: null });
        return;
      }
      try {
        const user = JSON.parse(userStr);
        const role = (user.role || 'staff').toLowerCase();
        setAuthState({ isLoading: false, isAuth: true, role });
      } catch {
        setAuthState({ isLoading: false, isAuth: false, role: null });
      }
    };

    check();

    const onStorage = (e) => {
      if (e.key === 'kitchen_os_token' || e.key === 'kitchen_os_user') check();
    };
    const onVisible = () => { if (!document.hidden) check(); };

    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Show nothing while checking auth
  if (authState.isLoading) return null;

  // Not logged in → go to login
  if (!authState.isAuth) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  // Admin-only route but visitor is staff → back to menu
  if (adminOnly && authState.role !== 'admin') {
    return <Navigate to="/menu" replace />;
  }

  // Staff trying to visit a page outside their allowed list → back to menu
  if (authState.role === 'staff') {
    const path = location.pathname.toLowerCase();
    const allowed = STAFF_ALLOWED_PATHS.some(
      (p) => path === p || path.startsWith(p + '/')
    );
    if (!allowed) return <Navigate to="/menu" replace />;
  }

  return children;
};

export default ProtectedRoute;