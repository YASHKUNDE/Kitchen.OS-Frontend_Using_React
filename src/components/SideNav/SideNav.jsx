import React, { useState } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './SideNav.css';

// adminOnly: true  →  hidden when role is 'staff'
const ALL_NAV_ITEMS = [
  { path: '/menu',      label: 'Menu',     icon: 'fa-utensils',       adminOnly: false },
  { path: '/order',     label: 'Order',    icon: 'fa-clipboard-list', adminOnly: false },
  { path: '/reports',   label: 'Reports',  icon: 'fa-chart-bar',      adminOnly: true  },
  { path: '/setup',     label: 'Setup',    icon: 'fa-sliders',        adminOnly: true  },
];

// Read role once from localStorage at initialisation — no useEffect needed
const getRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem('kitchen_os_user') || '{}');
    return (user.role || 'staff').toLowerCase();
  } catch {
    return 'staff';
  }
};

const SideNav = () => {
  const location          = useLocation();
  const navigate          = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [role]            = useState(getRole); // lazy initializer, runs once

  const navItems = ALL_NAV_ITEMS.filter(
    (item) => !item.adminOnly || role === 'admin'
  );

  const isActive = (path) =>
    location.pathname === path ? 'side-nav-item active' : 'side-nav-item';

  const handleNavClick = () => {
    if (window.innerWidth < 992) setExpanded(false);
  };

  const handleLogout = () => {
    ['kitchen_os_token', 'kitchen_os_user', 'kitchen_os_staff', 'theme', 'language']
      .forEach((k) => localStorage.removeItem(k));
    navigate('/', { replace: true });
  };

  return (
    <Navbar
      expand="lg"
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      className="side-nav-container"
    >
      <Container fluid className="flex-column">

        <Link to="/menu" className="side-nav-logo desktop-logo">
          DK
        </Link>

        <div className="mobile-header">
          <Link to="/menu" className="side-nav-logo">
            DK
          </Link>
          <Navbar.Toggle aria-controls="side-nav-collapse" className="mobile-toggle">
            <i className={`fa-solid ${expanded ? 'fa-xmark' : 'fa-bars'}`} />
          </Navbar.Toggle>
        </div>

        <Navbar.Collapse id="side-nav-collapse" className="w-100">
          <Nav className="flex-column w-100 side-nav-group">

            {navItems.map((item) => (
              <Nav.Link
                key={item.path}
                as={Link}
                to={item.path}
                className={isActive(item.path)}
                onClick={handleNavClick}
              >
                <i className={`fa-solid ${item.icon}`} />
                <span>{item.label}</span>
              </Nav.Link>
            ))}

            {/* Logout — only shown to staff (admin logs out from Setup page) */}
            {role === 'staff' && (
              <Nav.Link
                as="button"
                className="side-nav-item side-nav-logout"
                onClick={handleLogout}
              >
                <i className="fa-solid fa-right-from-bracket" />
                <span>Logout</span>
              </Nav.Link>
            )}

          </Nav>
        </Navbar.Collapse>

      </Container>
    </Navbar>
  );
};

export default SideNav;