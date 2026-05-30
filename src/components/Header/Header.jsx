import React, { useState, useEffect } from 'react';
import './Header.css';

const Header = () => {
  const [dateTime, setDateTime] = useState({ date: '', time: '' });

  useEffect(() => {
    const updateDateTime = () => {
      const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
      const now = new Date();
      
      const dateStr = now.toLocaleDateString('en-US', dateOptions);
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}:${seconds}`;

      setDateTime({ date: dateStr, time: timeStr });
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="page-title">KITCHEN.OS</h1>
        <div className="header-meta">
          <div className="status-indicator">
            <span className="pulse-dot"></span>
            <span className="pulse-dot-core"></span>
          </div>
          <p className="meta-text">System Online</p>
          <span className="meta-separator">•</span>
          <p className="meta-text">{dateTime.date}</p>
          <span className="meta-separator">•</span>
          <p className="meta-text">{dateTime.time}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;