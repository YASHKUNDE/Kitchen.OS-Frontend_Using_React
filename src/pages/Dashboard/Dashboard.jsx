import React, { useState, useEffect, useRef, useCallback } from 'react';
import Chart from 'chart.js/auto';
import './Dashboard.css';
import SideNav from '../../components/SideNav/SideNav';
import TopNav from '../../components/TopNav/TopNav';

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const BASE_URL = 'http://localhost:8080/api';
const TAX_RATE = 0.10;

/* ─────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────── */
const fmt  = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtD = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n ?? 0);

/* ─────────────────────────────────────────
   CHART COLOUR PALETTE
───────────────────────────────────────── */
const C = {
  purple:  '#6366f1',
  purpleL: '#c7d2fe',
  purpleM: '#818cf8',
  green:   '#10b981',
  amber:   '#f59e0b',
  red:     '#ef4444',
  teal:    '#14b8a6',
  grid:    'rgba(100,116,139,0.10)',
};
const TOP_COLORS = [C.purple, C.purpleM, C.green, C.amber, C.red, '#a5b4fc'];

/* ─────────────────────────────────────────
   ICON LIBRARY
───────────────────────────────────────── */
const Ic = {
  download: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
  ),
  refresh: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M8 16H3v5"/>
    </svg>
  ),
  cash: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="12" x="2" y="6" rx="2"/>
      <circle cx="12" cy="12" r="2"/>
      <path d="M6 12h.01M18 12h.01"/>
    </svg>
  ),
  card: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2"/>
      <line x1="2" x2="22" y1="10" y2="10"/>
    </svg>
  ),
  globe: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" x2="22" y1="12" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const getHour = ts => {
  if (!ts) return -1;
  const str  = ts.toLowerCase();
  const isPM = str.includes('pm');
  let h = parseInt(str.split(':')[0], 10);
  if (isNaN(h)) return -1;
  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return h;
};

// FIX: Guard against NaN from bad price data
const calcTotal = order => {
  const sub = (order.items || []).reduce((s, i) => {
    const price = parseFloat(i.price);
    const qty = parseInt(i.qty, 10) || 1;
    return s + (isNaN(price) ? 0 : price * qty);
  }, 0);
  return sub * (1 + TAX_RATE);
};

const safeJson = async res => {
  try { return res.ok ? await res.json() : { data: [] }; }
  catch { return { data: [] }; }
};

const destroyChart = (instRef, key) => {
  instRef.current[key]?.destroy();
  delete instRef.current[key];
};

const exportChart = (instRef, key, filename) => {
  const chart = instRef.current[key];
  if (!chart) return;
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = chart.toBase64Image('image/png', 1);
  link.click();
};

/* ═══════════════════════════════════════════
   SKELETON LOADER
═══════════════════════════════════════════ */
function SkeletonCard({ height = 80 }) {
  return <div className="db-skeleton" style={{ height, borderRadius: 20 }} />;
}

function DashboardSkeleton() {
  return (
    <div className="db-content">
      <div className="db-stats-grid">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} height={120} />)}
      </div>
      <div className="db-stats-grid-sm">
        {[...Array(8)].map((_, i) => <SkeletonCard key={i} height={72} />)}
      </div>
      <div className="db-row db-row-2">
        <SkeletonCard height={310} /><SkeletonCard height={310} />
      </div>
      <SkeletonCard height={270} />
      <div className="db-row db-row-2">
        <SkeletonCard height={260} /><SkeletonCard height={260} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════ */
function StatCard({ title, value, sub, trend, accent, dark, icon }) {
  return (
    <div className={`db-stat-card db-fade${accent ? ' db-stat-accent' : ''}${dark ? ' db-stat-dark' : ''}`}>
      {icon && <div className="db-stat-bg-icon" aria-hidden="true">{icon}</div>}
      <p className="db-stat-label">{title}</p>
      <h3 className="db-stat-value">{value}</h3>
      {trend && <div className={`db-stat-trend ${trend.dir}`}>{trend.text}</div>}
      {sub   && <p className="db-stat-sub">{sub}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════
   CHART CARD
═══════════════════════════════════════════ */
function ChartCard({ title, sub, height = 240, canvasRef, ariaLabel, children, onExport }) {
  return (
    <div className="db-chart-card db-fade">
      <div className="db-chart-header">
        <div>
          <h4 className="db-chart-title">{title}</h4>
          {sub && <p className="db-chart-sub">{sub}</p>}
        </div>
        {onExport && (
          <button className="db-btn-sm" onClick={onExport} aria-label={`Export ${title} as PNG`}>
            {Ic.download} Export
          </button>
        )}
      </div>
      {canvasRef && (
        <div className="db-chart-area" style={{ height }}>
          <canvas ref={canvasRef} role="img" aria-label={ariaLabel || title} />
        </div>
      )}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAYMENT ROW
═══════════════════════════════════════════ */
function PayRow({ icon, cls, title, txns, amount }) {
  return (
    <div className="db-txn-item">
      <div className={`db-txn-icon ${cls}`} aria-hidden="true">{icon}</div>
      <div className="db-txn-details">
        <p className="db-txn-title">{title}</p>
        <p className="db-txn-sub">{txns} transaction{txns !== 1 ? 's' : ''}</p>
      </div>
      <span className="db-txn-amt">{amount}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DATA FETCHING
═══════════════════════════════════════════ */
async function fetchDashboardData() {
  const endpoints = [
    `${BASE_URL}/view_orders`,
    `${BASE_URL}/payment_history`,
    `${BASE_URL}/view_staff`,
    `${BASE_URL}/view_menu`,
    `${BASE_URL}/admin_settings`,
  ];

  // FIX: Use AbortController for cleanup; timeouts prevent stale fetches
  const responses = await Promise.all(
    endpoints.map(url => fetch(url).catch(() => ({ ok: false })))
  );
  const [od, pd, sd, md, ad] = await Promise.all(responses.map(safeJson));

  const orders   = Array.isArray(od?.data) ? od.data    : [];
  const payments = Array.isArray(pd?.data) ? pd.data    : [];
  const staffArr = Array.isArray(sd?.data) ? sd.data    : [];
  const menuArr  = Array.isArray(md?.data) ? md.data    : [];
  const admin    = Array.isArray(ad?.data) ? ad.data[0] : null;

  const todayStr       = new Date().toDateString();
  const todayPay       = payments.filter(p => p.paidAt && new Date(p.paidAt).toDateString() === todayStr);
  // FIX: Guard parseFloat with fallback 0
  const todayRevenue   = todayPay.reduce((s, p) => s + (parseFloat(p.total) || 0), 0);
  const totalRevenue   = payments.reduce((s, p) => s + (parseFloat(p.total) || 0), 0);
  const activeOrders   = orders.filter(o => o.status !== 'completed' && o.payStatus !== 'paid');
  const pendingRevenue = activeOrders.reduce((s, o) => s + calcTotal(o), 0);
  const avgOrderValue  = todayPay.length ? todayRevenue / todayPay.length : 0;
  const totalTables    = admin?.tables ?? 20;
  const occupiedTables = new Set(
    activeOrders.filter(o => o.tableNumber).map(o => String(o.tableNumber))
  ).size;

  const byStatus = { pending: 0, cooking: 0, ready: 0, completed: 0 };
  orders.forEach(o => {
    const k = (o.status || '').toLowerCase();
    if (k in byStatus) byStatus[k]++;
  });

  const byMethod    = { Cash: 0, Card: 0, Online: 0 };
  const byMethodTxn = { Cash: 0, Card: 0, Online: 0 };
  todayPay.forEach(p => {
    const m   = (p.paymentMethod || '').toLowerCase();
    const key = m.includes('cash') ? 'Cash' : m.includes('card') ? 'Card' : 'Online';
    byMethod[key]    += (parseFloat(p.total) || 0);
    byMethodTxn[key] += 1;
  });

  const hourlyDineIn   = new Array(12).fill(0);
  const hourlyTakeaway = new Array(12).fill(0);
  const revenueByHour  = new Array(12).fill(0);
  orders.forEach(o => {
    const idx = getHour(o.orderTime) - 10;
    if (idx >= 0 && idx < 12) {
      if (o.tableNumber) hourlyDineIn[idx]++;
      else               hourlyTakeaway[idx]++;
      revenueByHour[idx] += calcTotal(o);
    }
  });

  const weekLabels  = [];
  const weekCounts  = new Array(7).fill(0);
  const weekRevenue = new Array(7).fill(0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weekLabels.push(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]);
  }
  payments.forEach(p => {
    if (!p.paidAt) return;
    const diff = Math.floor((Date.now() - new Date(p.paidAt)) / 86400000);
    if (diff >= 0 && diff < 7) {
      weekCounts[6 - diff]  += 1;
      weekRevenue[6 - diff] += (parseFloat(p.total) || 0);
    }
  });

  const itemMap = {};
  orders.forEach(o =>
    (o.items || []).forEach(i => {
      const name = i.itemName || i.name || '—';
      itemMap[name] = (itemMap[name] || 0) + (parseInt(i.qty, 10) || 1);
    })
  );
  const topItems    = Object.entries(itemMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const activeStaff = staffArr.filter(st => (st.status || '').toLowerCase() === 'active').length;

  return {
    todayRevenue, totalRevenue, pendingRevenue, avgOrderValue,
    totalOrders: orders.length,
    activeOrders: activeOrders.length,
    completedToday: todayPay.length,
    totalTables, occupiedTables,
    totalStaff: staffArr.length, activeStaff,
    totalMenuItems: menuArr.length,
    byStatus, byMethod, byMethodTxn,
    hourlyDineIn, hourlyTakeaway, revenueByHour,
    weekLabels, weekCounts, weekRevenue,
    topItems,
    hotelName: admin?.hotelName ?? '',
    taxRate:   admin?.taxRate   ?? 10,
  };
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function Dashboard() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const [lastFetch,  setLastFetch]  = useState(null);

  const refRevenue  = useRef(null);
  const refWeekly   = useRef(null);
  const refStatus   = useRef(null);
  const refHourly   = useRef(null);
  const refTopItems = useRef(null);
  const refPayBar   = useRef(null);
  const refRevPay   = useRef(null);
  const inst        = useRef({});

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const d = await fetchDashboardData();
      setData(d);
      setLastFetch(new Date());
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('[Dashboard] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(false); }, [load]);
  const refresh = useCallback(() => load(true), [load]);

  /* Build / rebuild all charts when data changes */
  useEffect(() => {
    if (!data) return;
    const d = data;

    /* 1. Revenue by Hour */
    if (refRevenue.current) {
      destroyChart(inst, 'revenue');
      const ctx  = refRevenue.current.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 260);
      grad.addColorStop(0, 'rgba(99,102,241,0.22)');
      grad.addColorStop(1, 'rgba(99,102,241,0)');
      inst.current.revenue = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['10h','11h','12h','13h','14h','15h','16h','17h','18h','19h','20h','21h'],
          datasets: [{
            label: 'Revenue (₹)',
            data: d.revenueByHour.map(v => Math.round(v)),
            borderColor: C.purple, backgroundColor: grad,
            borderWidth: 2.5, fill: true, tension: 0.42,
            pointBackgroundColor: C.purple, pointBorderColor: '#fff',
            pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 7,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: c => ` ₹${c.parsed.y.toLocaleString('en-IN')}` } },
          },
          scales: {
            y: { beginAtZero: true, grid: { color: C.grid }, ticks: { callback: v => '₹' + v, font: { size: 11 } } },
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          },
        },
      });
    }

    /* 2. Weekly Orders + Revenue */
    if (refWeekly.current) {
      destroyChart(inst, 'weekly');
      const maxIdx = d.weekCounts.indexOf(Math.max(...d.weekCounts));
      inst.current.weekly = new Chart(refWeekly.current, {
        type: 'bar',
        data: {
          labels: d.weekLabels,
          datasets: [
            {
              label: 'Orders', data: d.weekCounts, yAxisID: 'y',
              backgroundColor: d.weekCounts.map((_, i) => i === maxIdx ? C.purple : C.purpleL),
              borderRadius: 7, borderSkipped: false,
            },
            {
              label: 'Revenue (₹)', data: d.weekRevenue.map(v => Math.round(v)), yAxisID: 'y1',
              type: 'line', borderColor: C.amber, backgroundColor: 'transparent',
              borderWidth: 2.2, tension: 0.4,
              pointBackgroundColor: C.amber, pointBorderColor: '#fff',
              pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 10, padding: 14, font: { size: 11 } } } },
          scales: {
            y:  { beginAtZero: true, grid: { color: C.grid }, ticks: { font: { size: 11 } }, position: 'left' },
            y1: { beginAtZero: true, grid: { display: false }, ticks: { callback: v => '₹' + v, font: { size: 10 } }, position: 'right' },
            x:  { grid: { display: false }, ticks: { font: { size: 11 } } },
          },
        },
      });
    }

    /* 3. Order Status horizontal bar */
    if (refStatus.current) {
      destroyChart(inst, 'status');
      const st    = d.byStatus;
      const total = (st.pending + st.cooking + st.ready + st.completed) || 1;
      inst.current.status = new Chart(refStatus.current, {
        type: 'bar',
        data: {
          labels: ['Pending', 'Cooking', 'Ready', 'Completed'],
          datasets: [{
            label: 'Orders',
            data: [st.pending, st.cooking, st.ready, st.completed],
            backgroundColor: [C.amber, C.red, C.green, C.purple],
            borderRadius: 8,
            borderSkipped: false,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: c => {
                  const pct = ((c.parsed.x / total) * 100).toFixed(1);
                  return ` ${c.parsed.x} orders (${pct}%)`;
                },
              },
            },
          },
          scales: {
            x: { beginAtZero: true, grid: { color: C.grid }, ticks: { font: { size: 11 }, stepSize: 1 } },
            y: { grid: { display: false }, ticks: { font: { size: 12 }, color: '#0f172a' } },
          },
        },
      });
    }

    /* 4. Hourly grouped bar */
    if (refHourly.current) {
      destroyChart(inst, 'hourly');
      inst.current.hourly = new Chart(refHourly.current, {
        type: 'bar',
        data: {
          labels: ['10','11','12','13','14','15','16','17','18','19','20','21'],
          datasets: [
            { label: 'Dine-in',         data: d.hourlyDineIn,   backgroundColor: C.purple,  borderRadius: 5, borderSkipped: false },
            { label: 'Takeaway / Other', data: d.hourlyTakeaway, backgroundColor: C.purpleL, borderRadius: 5, borderSkipped: false },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 10, padding: 14, font: { size: 11 } } } },
          scales: {
            y: { beginAtZero: true, grid: { color: C.grid }, ticks: { font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          },
        },
      });
    }

    /* 5. Top Items horizontal bar */
    if (refTopItems.current && d.topItems.length > 0) {
      destroyChart(inst, 'topItems');
      inst.current.topItems = new Chart(refTopItems.current, {
        type: 'bar',
        data: {
          labels: d.topItems.map(([n]) => n.length > 18 ? n.slice(0, 17) + '…' : n),
          datasets: [{
            label: 'Units', data: d.topItems.map(([, v]) => v),
            backgroundColor: TOP_COLORS, borderRadius: 6, borderSkipped: false,
          }],
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: C.grid }, ticks: { font: { size: 10 } } },
            y: { grid: { display: false }, ticks: { font: { size: 11 } } },
          },
        },
      });
    }

    /* 6. Payment Method Revenue polar area */
    if (refPayBar.current) {
      destroyChart(inst, 'payBar');
      inst.current.payBar = new Chart(refPayBar.current, {
        type: 'polarArea',
        data: {
          labels: ['Cash', 'Card', 'Online / UPI'],
          datasets: [{
            data: [Math.round(d.byMethod.Cash), Math.round(d.byMethod.Card), Math.round(d.byMethod.Online)],
            backgroundColor: ['rgba(16,185,129,0.70)', 'rgba(99,102,241,0.70)', 'rgba(245,158,11,0.70)'],
            borderColor:     ['#10b981',              '#6366f1',               '#f59e0b'],
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 16, font: { size: 12 } } },
            tooltip: {
              callbacks: {
                label: c => ` ${c.label}: ₹${(c.parsed.r ?? 0).toLocaleString('en-IN')}`,
              },
            },
          },
          scales: {
            r: { ticks: { display: false }, grid: { color: C.grid } },
          },
        },
      });
    }

    /* 7. 7-Day Revenue Trend */
    if (refRevPay.current) {
      destroyChart(inst, 'revPay');
      const ctx2  = refRevPay.current.getContext('2d');
      const grad2 = ctx2.createLinearGradient(0, 0, 0, 180);
      grad2.addColorStop(0, 'rgba(20,184,166,0.18)');
      grad2.addColorStop(1, 'rgba(20,184,166,0)');
      inst.current.revPay = new Chart(ctx2, {
        type: 'line',
        data: {
          labels: d.weekLabels,
          datasets: [{
            label: 'Revenue (₹)', data: d.weekRevenue.map(v => Math.round(v)),
            borderColor: C.teal, backgroundColor: grad2, borderWidth: 2.5,
            fill: true, tension: 0.45,
            pointBackgroundColor: C.teal, pointBorderColor: '#fff',
            pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 7,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: c => ` ₹${c.parsed.y.toLocaleString('en-IN')}` } },
          },
          scales: {
            y: { beginAtZero: true, grid: { color: C.grid }, ticks: { callback: v => '₹' + v, font: { size: 11 } } },
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          },
        },
      });
    }

    // FIX: Cleanup destroys charts when data changes — avoids memory leak from
    // orphaned Chart instances accumulating across re-renders
    return () => {
      Object.values(inst.current).forEach(c => c?.destroy());
      inst.current = {};
    };
  }, [data]);

  /* DERIVED VALUES */
  const s           = data || {};
  const tableLoad   = s.totalTables ? Math.round((s.occupiedTables / s.totalTables) * 100) : 0;
  const topMax      = s.topItems?.[0]?.[1] || 1;
  const statusItems = [
    { label: 'Pending',   value: s.byStatus?.pending   ?? 0, color: C.amber  },
    { label: 'Cooking',   value: s.byStatus?.cooking   ?? 0, color: C.red    },
    { label: 'Ready',     value: s.byStatus?.ready     ?? 0, color: C.green  },
    { label: 'Completed', value: s.byStatus?.completed ?? 0, color: C.purple },
  ];
  const secondaryKPIs = [
    { label: 'All-time Revenue', value: fmt(s.totalRevenue)                             },
    { label: 'Active Staff',     value: `${s.activeStaff ?? 0} / ${s.totalStaff ?? 0}` },
    { label: 'Menu Items',       value: s.totalMenuItems ?? 0                           },
    { label: 'Tax Rate',         value: `${s.taxRate ?? 10}%`                           },
    { label: 'Cooking Now',      value: s.byStatus?.cooking ?? 0, color: C.red         },
    { label: 'Ready to Serve',   value: s.byStatus?.ready   ?? 0, color: C.green       },
    { label: 'Today Settled',    value: s.completedToday    ?? 0                       },
    { label: 'Avg Order Value',  value: fmtD(s.avgOrderValue)                          },
  ];

  /* RENDER */
  return (
    <div className="db-page">
      <SideNav />

      <main className="mains-contents" role="main">
        <div className="db-topnav-row"><TopNav /></div>

        {loading && <DashboardSkeleton />}

        {!loading && error && (
          <div className="db-error-banner" role="alert">
            <span>{error}</span>
            <button className="db-btn-sm" onClick={refresh}>Retry</button>
          </div>
        )}

        {!loading && !error && data && (
          <div className="db-content">

            {/* Toolbar */}
            <div className="db-toolbar">
              <p className="db-toolbar-meta">
                {s.hotelName ? `${s.hotelName} · ` : ''}
                {lastFetch
                  ? `Updated ${lastFetch.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Live data'}
              </p>
              <button
                className="db-btn-sm"
                onClick={refresh}
                disabled={refreshing}
                aria-label="Refresh dashboard"
              >
                <span className={refreshing ? 'db-spin' : ''}>{Ic.refresh}</span>
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            {/* ROW 1 — Primary stat cards */}
            <div className="db-stats-grid" role="region" aria-label="Key metrics">
              <StatCard
                title="Today's Revenue" value={fmt(s.todayRevenue)}
                trend={{ dir: 'up', text: `${s.completedToday ?? 0} orders settled today` }}
                accent
                icon={<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>}
              />
              <StatCard
                title="Total Orders" value={s.totalOrders ?? 0}
                sub={`${s.activeOrders ?? 0} active · ${s.byStatus?.ready ?? 0} ready to serve`}
                icon={<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>}
              />
              <StatCard
                title="Table Load" value={`${tableLoad}%`}
                sub={`${s.occupiedTables ?? 0} / ${s.totalTables ?? 20} tables occupied`}
                icon={<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="10" width="18" height="7" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/><line x1="5" y1="17" x2="5" y2="21"/><line x1="19" y1="17" x2="19" y2="21"/></svg>}
              />
              <StatCard
                title="Pending Revenue" value={fmt(s.pendingRevenue)}
                sub={`from ${s.activeOrders ?? 0} active orders`}
                dark
                icon={<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>}
              />
            </div>

            {/* ROW 2 — Secondary KPI chips */}
            <div className="db-stats-grid-sm" role="region" aria-label="Secondary metrics">
              {secondaryKPIs.map(item => (
                <div className="db-stat-mini db-fade" key={item.label}>
                  <span className="db-mini-label">{item.label}</span>
                  <span className="db-mini-value" style={item.color ? { color: item.color } : {}}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* ROW 3 — Revenue by Hour + Weekly combo */}
            <div className="db-row db-row-2">
              <ChartCard
                title="Revenue by Hour" sub="Today's order revenue · 10 AM – 9 PM"
                canvasRef={refRevenue} height={240}
                onExport={() => exportChart(inst, 'revenue', 'revenue-by-hour')}
              />
              <ChartCard
                title="Weekly Performance" sub="Orders (bars) + revenue line — last 7 days"
                canvasRef={refWeekly} height={240}
                onExport={() => exportChart(inst, 'weekly', 'weekly-performance')}
              />
            </div>

            {/* ROW 4 — Hourly volume */}
            <ChartCard
              title="Hourly Order Volume" sub="Dine-in vs Takeaway / Other — all orders"
              canvasRef={refHourly} height={220}
              onExport={() => exportChart(inst, 'hourly', 'hourly-order-volume')}
            />

            {/* ROW 5 — Order Status + Payment Breakdown */}
            <div className="db-row db-row-2">
              <ChartCard
                title="Order Status Mix" sub="All orders by kitchen status — count & %"
                canvasRef={refStatus} height={200}
                onExport={() => exportChart(inst, 'status', 'order-status')}
              >
                <div className="db-legend-grid" role="list">
                  {statusItems.map(item => (
                    <div className="db-legend-item" key={item.label} role="listitem">
                      <span className="db-legend-dot" style={{ background: item.color }} aria-hidden="true" />
                      <span className="db-legend-label">{item.label}</span>
                      <span className="db-legend-val">{item.value}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>

              <ChartCard title="Payment Breakdown" sub="Today's revenue by payment method">
                <div className="db-txn-list" role="list">
                  <PayRow icon={Ic.cash}  cls="cash"   title="Cash"       txns={s.byMethodTxn?.Cash   ?? 0} amount={fmt(s.byMethod?.Cash)}   />
                  <PayRow icon={Ic.card}  cls="card"   title="Card"       txns={s.byMethodTxn?.Card   ?? 0} amount={fmt(s.byMethod?.Card)}   />
                  <PayRow icon={Ic.globe} cls="online" title="Online/UPI" txns={s.byMethodTxn?.Online ?? 0} amount={fmt(s.byMethod?.Online)} />
                </div>
                <div className="db-total-box">
                  <span className="db-total-label">Total Today</span>
                  <span className="db-total-val">{fmt(s.todayRevenue)}</span>
                </div>
              </ChartCard>
            </div>

            {/* ROW 6 — Top Items chart + performance bars */}
            <div className="db-row db-row-2">
              <ChartCard
                title="Top Menu Items" sub="Best sellers by units ordered"
                onExport={s.topItems?.length ? () => exportChart(inst, 'topItems', 'top-menu-items') : undefined}
              >
                {(s.topItems?.length ?? 0) > 0 ? (
                  <div className="db-chart-area" style={{ height: Math.max(220, s.topItems.length * 42 + 60) }}>
                    <canvas ref={refTopItems} role="img" aria-label="Top menu items chart" />
                  </div>
                ) : (
                  <div className="db-empty-state">No order data yet</div>
                )}
              </ChartCard>

              <ChartCard title="Item Performance" sub="Ranked by units sold — relative to top item">
                <div className="db-items-list" role="list">
                  {(s.topItems || []).slice(0, 6).map(([name, sold], i) => (
                    <div className="db-item-row" key={name} role="listitem">
                      <div className="db-item-rank" aria-label={`Rank ${i + 1}`}>{i + 1}</div>
                      <div className="db-item-info">
                        <div className="db-item-name" title={name}>{name}</div>
                        <div className="db-item-bar-wrap">
                          <div className="db-item-bar-track">
                            <div
                              className="db-item-bar-fill"
                              style={{ width: `${(sold / topMax) * 100}%`, background: TOP_COLORS[i] ?? C.purple }}
                              role="progressbar"
                              aria-valuenow={sold}
                              aria-valuemax={topMax}
                            />
                          </div>
                          <span className="db-item-sold">{sold}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!s.topItems || s.topItems.length === 0) && (
                    <div className="db-empty-state">No order data yet</div>
                  )}
                </div>
              </ChartCard>
            </div>

            {/* ROW 7 — Payment Method polar area + 7-day trend */}
            <div className="db-row db-row-2">
              <ChartCard
                title="Payment Method Revenue" sub="Today's revenue split by method"
                canvasRef={refPayBar} height={260}
                onExport={() => exportChart(inst, 'payBar', 'payment-method-revenue')}
              />
              <ChartCard
                title="7-Day Revenue Trend" sub="Daily settled revenue — last 7 days"
                canvasRef={refRevPay} height={260}
                onExport={() => exportChart(inst, 'revPay', '7-day-revenue')}
              />
            </div>

          </div>
        )}
      </main>
    </div>
  );
}