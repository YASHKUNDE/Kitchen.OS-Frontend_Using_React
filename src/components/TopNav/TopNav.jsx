import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './TopNav.css';
import Header1 from '../Header/Header1';

const TopNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);
  const buttonRef = useRef(null);

  const navItems = [
    { id: 'reports',   label: 'Reports',       icon: 'fa-chart-bar',    path: '/reports'   },
    { id: 'orders',    label: 'Live Orders',    icon: 'fa-bell',         path: '/liveorder' },
    { id: 'staff',     label: 'Staff Info',     icon: 'fa-users',        path: '/staff'     },
    { id: 'inventory', label: 'Inventory',      icon: 'fa-boxes',        path: '/addmenu'   },
    { id: 'admin',     label: 'Admin Profile',  icon: 'fa-user-shield',  path: '/admin'     },
  ];

  const isActive = (path) => location.pathname === path;

  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  const handleNavClick = (path) => {
    navigate(path);
    if (window.innerWidth <= 768) setIsMenuOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isMenuOpen &&
        navRef.current &&
        !navRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape' && isMenuOpen) setIsMenuOpen(false); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // Close on resize to desktop
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 768 && isMenuOpen) setIsMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMenuOpen]);

  return (
    <header className="t-header">
      <div className="t-nav-container">

        <div className="t-brand-title">
          <Header1 />
        </div>

        <button
          ref={buttonRef}
          className={`t-mobile-menu-btn${isMenuOpen ? ' active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation"
          aria-expanded={isMenuOpen}
        >
          <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`} />
        </button>

        <nav
          ref={navRef}
          className={`t-nav-links${isMenuOpen ? ' show' : ''}`}
          role="navigation"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`t-nav-link${isActive(item.path) ? ' active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleNavClick(item.path); }}
            >
              <i className={`fa-solid ${item.icon}`} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

      </div>
    </header>
  );
};

export default TopNav;