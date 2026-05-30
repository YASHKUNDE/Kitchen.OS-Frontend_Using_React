import React, { useState, useEffect } from 'react';
import './SetUp.css';
import SideNav from '../../components/SideNav/SideNav';

const API = 'http://localhost:8080/api';

const SetUp = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [staffId,     setStaffId]     = useState('');
  const [staffPass,   setStaffPass]   = useState('');
  const [savedStaff,  setSavedStaff]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('kitchen_os_staff')) || null; }
    catch { return null; }
  });
  const [theme,    setTheme]    = useState(() => localStorage.getItem('theme')    || 'system');
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'English');
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kitchen_os_user')) || {}; }
    catch { return {}; }
  });

  // ── Auth guard ─────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('kitchen_os_token');
    if (!token) window.location.replace('/');
  }, []);

  // ── ESC closes modal ───────────────────────────────────────
  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') setIsModalOpen(false); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  // ── Body scroll lock ───────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  // ── Apply theme ────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark')        root.setAttribute('data-theme', 'dark');
    else if (theme === 'light')  root.setAttribute('data-theme', 'light');
    else                         root.removeAttribute('data-theme');
  }, [theme]);

  // ── Toast notification ─────────────────────────────────────
  const showNotification = (message) => {
    document.querySelector('.toast-notification')?.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 30px)',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      background: 'rgba(17, 24, 39, 0.95)',
      backdropFilter: 'blur(8px)',
      color: 'white',
      padding: '14px 28px',
      borderRadius: '30px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      opacity: '0',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: '9999',
      pointerEvents: 'none',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      maxWidth: 'min(90vw, 360px)',
      textAlign: 'center',
      whiteSpace: 'nowrap',
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const handleNavigation = (dest) => showNotification(`Opening ${dest}`);

  // ── Theme / Language ───────────────────────────────────────
  const handleThemeChange = (val) => {
    setTheme(val);
    localStorage.setItem('theme', val);
    showNotification(`Theme: ${val}`);
  };

  const handleLanguageChange = (val) => {
    setLanguage(val);
    localStorage.setItem('language', val);
    showNotification(`Language: ${val}`);
  };

  // ── Logout ─────────────────────────────────────────────────
  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    showNotification('Logging out…');
    try {
      const token = localStorage.getItem('kitchen_os_token');
      await fetch(`${API}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* proceed even if offline */ }
    ['kitchen_os_token', 'kitchen_os_user', 'kitchen_os_staff', 'theme', 'language']
      .forEach((k) => localStorage.removeItem(k));
    setTimeout(() => window.location.replace('/'), 800);
  };

  // ── Staff credentials ──────────────────────────────────────
  // Saves to both localStorage (for quick display) and backend Staff_Login table
  const submitStaffCredentials = async () => {
    if (!staffId.trim() || !staffPass.trim()) {
      showNotification('Please enter both Staff ID and Password');
      return;
    }

    const creds = { id: staffId.trim(), password: staffPass };

    // ── 1. Persist locally ─────────────────────────────────
    setSavedStaff(creds);
    localStorage.setItem('kitchen_os_staff', JSON.stringify(creds));

    // ── 2. Sync to backend Staff_Login table ────────────────
    try {
      const payload = { staffUid: staffId.trim(), staffPass: staffPass };

      // Try to create; if UID already exists the backend returns 400
      const res = await fetch(`${API}/staff_login_save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showNotification('✅ Staff credentials saved');
      } else if (res.status === 400) {
        // Already exists — update instead
        const putRes = await fetch(`${API}/staff_login_update`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        showNotification(putRes.ok ? '✅ Staff credentials updated' : '✅ Saved locally (backend sync failed)');
      } else {
        showNotification('✅ Saved locally (backend sync failed)');
      }
    } catch {
      showNotification('✅ Saved locally (server unreachable)');
    }

    setStaffId('');
    setStaffPass('');
    setIsStaffOpen(false);
  };

  const editStaffCredentials = () => {
    if (!savedStaff) return;
    setStaffId(savedStaff.id);
    setStaffPass(savedStaff.password);
    setSavedStaff(null);
    localStorage.removeItem('kitchen_os_staff');
    setIsStaffOpen(true);
  };

  // ── Danger zone ────────────────────────────────────────────
  const handleDeleteAction = (type) => {
    if (!window.confirm(`⚠️ Delete ${type}\n\nThis is permanent and cannot be undone.\n\nContinue?`))
      return;
    const confirmed = window.prompt(`Type "${type.toUpperCase()}" to confirm:`);
    if (confirmed === type.toUpperCase()) {
      showNotification(`🗑️ ${type} deletion initiated…`);
      setTimeout(() =>
        alert(`✅ ${type} scheduled for deletion.\n\nYou'll receive a confirmation email within 30 days.`),
        1000
      );
    } else if (confirmed !== null) {
      showNotification('❌ Deletion cancelled — text did not match');
    } else {
      showNotification('Deletion cancelled');
    }
  };

  // ── Modal save ─────────────────────────────────────────────
  const handleSaveChanges = () => {
    showNotification('Changes saved');
    setTimeout(() => setIsModalOpen(false), 500);
  };

  // ── Derived values ─────────────────────────────────────────
  const displayName = user.userName || user.name || 'User';
  const initials = displayName
    .split(' ')
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join('');

  const dangerItems = [
    { type: 'Personal Account', icon: 'fa-user-xmark',       desc: 'Remove your profile and data' },
    { type: 'Hotel Account',    icon: 'fa-hotel',             desc: 'Remove hotel listings and bookings' },
    { type: 'Owner Account',    icon: 'fa-id-card',           desc: 'Remove ownership privileges' },
    { type: 'Bank Account',     icon: 'fa-building-columns',  desc: 'Remove payment methods' },
  ];

  // ──────────────────────────────────────────────────────────
  return (
    <div className="setup-containers">
      <SideNav />

      <main className="main-contents">
        <div className="containers">

          <div className="page-header">
            <h1 className="page-title">Settings</h1>
          </div>

          {/* Profile Card */}
          <div
            className="card profile-card"
            onClick={() => setIsModalOpen(true)}
            role="button" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
          >
            <div className="profile-inner">
              <div className="profile-content">
                <div className="avatar">{initials || '?'}</div>
                <div className="profile-info">
                  <span className="profile-name">{displayName}</span>
                  <span className="profile-email">Manage account</span>
                </div>
              </div>
              <svg className="chevron" width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>

          {/* General */}
          <div className="section">
            <h2 className="sections-titles">General</h2>
            <div className="card">
              <div className="setting-item">
                <div className="setting-left">
                  <div className="icon theme-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                  </div>
                  <span className="setting-label">Theme</span>
                </div>
                <div className="dropdown">
                  <select value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                  <svg className="chevron-small" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>

              <div className="divider" />

              <div className="setting-item">
                <div className="setting-left">
                  <div className="icon language-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <span className="setting-label">Language</span>
                </div>
                <div className="dropdown">
                  <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                  <svg className="chevron-small" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Manage */}
          <div className="section">
            <h2 className="sections-titles">Manage</h2>
            <div className="card">
              <div className="setting-link" onClick={() => handleNavigation('Subscription')} role="button" tabIndex={0}>
                <div className="setting-left">
                  <div className="icon subscription-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <span className="setting-label">Subscription</span>
                </div>
                <svg className="chevron" width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Storage */}
          <div className="section">
            <h2 className="sections-titles">Storage</h2>
            <div className="card">
              <div className="setting-link" onClick={() => handleNavigation('Memory Space')} role="button" tabIndex={0}>
                <div className="setting-left">
                  <div className="icon memory-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                  <span className="setting-label">Memory Space</span>
                </div>
                <svg className="chevron" width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Support & Legal */}
          <div className="section">
            <h2 className="sections-titles">Support & Legal</h2>
            <div className="card">
              {[
                { label: 'Terms of Service', iconClass: 'terms-icon',    icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /> },
                { label: 'Privacy Policy',   iconClass: 'privacy-icon',  icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
                { label: 'Features',         iconClass: 'features-icon', icon: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></> },
              ].map(({ label, iconClass, icon }, i, arr) => (
                <React.Fragment key={label}>
                  <div className="setting-link" onClick={() => handleNavigation(label)} role="button" tabIndex={0}>
                    <div className="setting-left">
                      <div className={`icon ${iconClass}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {icon}
                        </svg>
                      </div>
                      <span className="setting-label">{label}</span>
                    </div>
                    <svg className="chevron" width="20" height="20" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                  {i < arr.length - 1 && <div className="divider" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Logout */}
          <div className="logout-container">
            <button className="logout-btn" onClick={handleLogout}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </main>

      {/* ── Modal ────────────────────────────────────────────── */}
      {isModalOpen && (
        <div
          className="modals-overlay active"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          role="dialog" aria-modal="true" aria-label="Account Management"
        >
          <div className="modals-content">

            <div className="modals-header">
              <div className="modals-header-content">
                <div className="modals-icon"><i className="fa-solid fa-user-shield" /></div>
                <div className="modals-title-group">
                  <h2 className="modals-title">Account Management</h2>
                  <span className="modals-subtitle">Manage your account settings</span>
                </div>
              </div>
              <button className="modals-close" onClick={() => setIsModalOpen(false)} aria-label="Close">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="modals-body">

              {/* Account Info */}
              <div className="modals-section">
                <div className="sections-header">
                  <div className="sections-icon"><i className="fa-solid fa-circle-info" /></div>
                  <span className="sections-label">Account Information</span>
                </div>

                <div className="accounts-info-grid">
                  {[
                    { icon: 'fa-user',     label: 'Username',      value: user.userName || '—' },
                    { icon: 'fa-envelope', label: 'Email Address', value: user.email    || '—' },
                  ].map(({ icon, label, value }) => (
                    <div className="infos-card" key={label}>
                      <div className="infos-icon"><i className={`fa-solid ${icon}`} /></div>
                      <div className="infos-content">
                        <div className="infos-label">{label}</div>
                        <div className="infos-value">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Staff Credentials (admin sets these for staff) ── */}
                <div className="staffs-auth-section">
                  <div className="staffs-auth-header-row">
                    <button
                      className={`staffs-toggle-btn ${isStaffOpen ? 'active' : ''}`}
                      onClick={() => setIsStaffOpen(!isStaffOpen)}
                    >
                      <span>
                        <i className="fa-solid fa-id-card" style={{ marginRight: 8, color: 'var(--accent-primary)' }} />
                        Staff Credentials
                      </span>
                      <i className="fa-solid fa-chevron-down" />
                    </button>
                  </div>

                  <div className={`staffs-form-container ${isStaffOpen ? 'active' : ''}`}>
                    <div className="s-staffs-input-group">
                      <div className="s-staffs-input-wrapper">
                        <i className="fa-solid fa-user-tag" />
                        <input
                          type="text"
                          className="s-staffs-input"
                          placeholder="Enter Staff ID"
                          value={staffId}
                          onChange={(e) => setStaffId(e.target.value)}
                        />
                      </div>
                      <div className="s-staffs-input-wrapper">
                        <i className="fa-solid fa-lock" />
                        <input
                          type="password"
                          className="s-staffs-input"
                          placeholder="Enter Password"
                          value={staffPass}
                          onChange={(e) => setStaffPass(e.target.value)}
                        />
                      </div>
                      <button className="staffs-submit-btn" onClick={submitStaffCredentials}>
                        <i className="fa-solid fa-check" />
                        Save Credentials
                      </button>
                    </div>
                  </div>

                  {savedStaff && !isStaffOpen && (
                    <div className="staffs-credentials-display active">
                      <div className="credential-row">
                        <span className="credential-label">Staff ID</span>
                        <span className="credential-value">{savedStaff.id}</span>
                      </div>
                      <div className="credential-row">
                        <span className="credential-label">Password</span>
                        <span className="credential-value">{'•'.repeat(savedStaff.password.length)}</span>
                      </div>
                      <button className="edit-credentials-btn" onClick={editStaffCredentials}>
                        <i className="fa-solid fa-pen-to-square" />
                        Edit Credentials
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="modals-section">
                <div className="danger-zone">
                  <div className="danger-header">
                    <div className="danger-icon"><i className="fa-solid fa-triangle-exclamation" /></div>
                    <span className="danger-title">Danger Zone</span>
                  </div>
                  <p className="danger-desc">
                    These actions are irreversible. All associated data will be permanently removed.
                    Please proceed with extreme caution.
                  </p>
                  <div className="danger-actions">
                    {dangerItems.map(({ type, icon, desc }) => (
                      <div
                        key={type}
                        className="danger-item"
                        onClick={() => handleDeleteAction(type)}
                        role="button" tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleDeleteAction(type)}
                      >
                        <div className="danger-item-left">
                          <div className="danger-item-icon"><i className={`fa-solid ${icon}`} /></div>
                          <div className="danger-item-text">
                            <span className="danger-item-title">Delete {type}</span>
                            <span className="danger-item-desc">{desc}</span>
                          </div>
                        </div>
                        <i className="fa-solid fa-chevron-right danger-item-arrow" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveChanges}>
                <i className="fa-solid fa-check" style={{ marginRight: 6 }} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetUp;