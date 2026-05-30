import React, { useState, useEffect } from 'react';
import './Header1.css';

const Header1 = () => {
  const [dateTime, setDateTime] = useState({ date: '', time: '' });

  useEffect(() => {
    const updateDateTime = () => {
      const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
      const now = new Date();

      const dateStr = now.toLocaleDateString('en-US', dateOptions);
      const hours   = String(now.getHours()).padStart(2, '0');
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
    <header className="h-headers">
      <div className="h-headers-lefts">
        <h1 className="h-pages-titles">KITCHEN.OS</h1>
        <div className="h-headers-metas">
          <div className="h-status-indicators">
            <span className="h-pulse-dots"></span>
            <span className="h-pulse-dot-cores"></span>
          </div>
          <p className="h-metas-texts">System Online</p>
          <span className="h-metas-separators">•</span>
          <p className="h-meta-text">{dateTime.date}</p>
          <span className="h-metas-separators">•</span>
          <p className="h-metas-texts">{dateTime.time}</p>
        </div>
      </div>
    </header>
  );
};

export default Header1;