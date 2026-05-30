import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './LiveOrder.css';
import SideNav from '../../components/SideNav/SideNav';
import TopNav from '../../components/TopNav/TopNav';

const BASE_URL = 'http://localhost:8080/api';
const TAX_RATE = 0.10;

const formatCurrency = n =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

const calcTotals = order => {
  const subtotal = (order.items || []).reduce(
    (s, i) => s + parseFloat(i.price) * i.qty, 0
  );
  const tax = subtotal * TAX_RATE;
  return { subtotal, tax, total: subtotal + tax };
};

const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

const normalise = order => ({
  ...order,
  displayId: `ORD-${order.id}`,
  table: order.tableNumber,
  time: order.orderTime || '--',
  items: (order.items || []).map(i => ({
    ...i,
    name: i.itemName,
    price: parseFloat(i.price),
    emoji: i.emoji || '🍽️',
  })),
});

function StatusBadge({ status }) {
  return (
    <span className={`lo-status-pill lo-pill-${status}`}>
      <i className="fa-solid fa-circle" />
      {status === 'pending' ? 'Pending'
        : status === 'cooking' ? 'Cooking'
          : status === 'ready' ? 'Ready'
            : status === 'completed' ? 'Completed'
              : status === 'paid' ? 'Paid'
                : status === 'unpaid' ? 'Unpaid'
                  : capitalize(status)}
    </span>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const icon = type === 'success' ? 'fa-circle-check'
    : type === 'warning' ? 'fa-circle-exclamation'
      : 'fa-circle-xmark';

  return (
    <div className={`lo-toast lo-toast-${type}`}>
      <i className={`fa-solid ${icon}`} />{message}
    </div>
  );
}

function BillingModal({ order, onClose, onUpdateOrder, onSettle, onShowToast }) {
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  if (!order) return null;

  const { subtotal, tax, total } = calcTotals(order);
  const totalItems = order.items.reduce((s, i) => s + i.qty, 0);
  const isAlreadySettled = order.status === 'completed' || order.payStatus === 'paid';

  const handleQtyChange = (idx, delta) => {
    const newItems = [...order.items];
    const nq = newItems[idx].qty + delta;
    if (nq >= 1) {
      newItems[idx] = { ...newItems[idx], qty: nq };
      onUpdateOrder({ ...order, items: newItems });
    }
  };

  // FIX 3: toast BEFORE onClose — parent must still be mounted to queue it
  const handleRemoveItem = (idx) => {
    const newItems = order.items.filter((_, i) => i !== idx);
    if (newItems.length === 0) {
      onShowToast('All items removed — save changes to update order', 'warning');
      onClose();
    } else {
      onUpdateOrder({ ...order, items: newItems });
    }
  };

  const handleSaveChanges = async () => {
    try {
      const payload = {
        tableNumber: order.tableNumber ?? order.table,
        location: order.location,
        status: order.status,
        payStatus: order.payStatus,
        orderTime: order.time,
        items: order.items.map(i => ({
          id: i.id,
          itemName: i.name ?? i.itemName,
          price: i.price,
          qty: i.qty,
          emoji: i.emoji,
          menuId: i.menuId ?? null,
        })),
      };
      const res = await fetch(`${BASE_URL}/update_order/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) onShowToast('Order updated', 'success');
      else onShowToast('Save failed', 'error');
    } catch (err) {
      console.error('Save error:', err);
      onShowToast('Save failed', 'error');
    }
  };

  const handleSettle = async () => {
    if (!selectedPayment) {
      onShowToast('Please select a payment method', 'warning');
      return;
    }
    try {
      const res = await fetch(
        `${BASE_URL}/settle_order/${order.id}?paymentMethod=${encodeURIComponent(selectedPayment)}`,
        { method: 'POST' }
      );
      if (res.ok) {
        const data = await res.json();
        const updatedOrder = data?.data?.[0];
        onSettle(
          order.id,
          updatedOrder ? normalise(updatedOrder) : { ...order, status: 'completed', payStatus: 'paid' }
        );
        onShowToast(`Payment via ${selectedPayment} successful! ${order.location} is now free.`, 'success');
        onClose();
      } else {
        onShowToast('Failed to settle order', 'error');
      }
    } catch (err) {
      console.error('Settle error:', err);
      onSettle(order.id, { ...order, status: 'completed', payStatus: 'paid' });
      onShowToast(`Payment recorded (offline). ${order.location} marked as paid.`, 'warning');
      onClose();
    }
  };

  const handlePrint = () => onShowToast(`Printing receipt for ${order.displayId}...`, 'success');

  return (
    <div className="lo-modal-overlay lo-modal-show" onClick={onClose}>
      <div className="lo-modal" onClick={e => e.stopPropagation()}>

        <div className="lo-modal-head">
          <div className="lo-modal-head-inner">
            <div className="lo-modal-head-left">
              <div className="lo-modal-seat-icon">🪑</div>
              <div className="lo-modal-head-info">
                <h2>{order.location || `Table ${order.table}`}</h2>
                <div className="lo-modal-meta">
                  <span className="lo-modal-oid">{order.displayId}</span>
                  <span className="lo-meta-dot" />
                  <span>{order.time}</span>
                </div>
                <div className="lo-modal-head-badges">
                  <span className={`lo-mh-badge lo-mhb-kitchen lo-mhb-${order.status}`}>{capitalize(order.status)}</span>
                  <span className={`lo-mh-badge lo-mhb-pay lo-mhb-${order.payStatus}`}>{capitalize(order.payStatus)}</span>
                </div>
              </div>
            </div>
            <button className="lo-modal-close-btn" onClick={onClose}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <div className="lo-modal-body">
          <div className="lo-modal-left">
            <div className="lo-items-header">
              <span className="lo-items-header-title">
                <i className="fa-solid fa-basket-shopping" /> Order Items
              </span>
              <span className="lo-items-count-badge">{totalItems}</span>
            </div>

            <div className="lo-items-scroll">
              {/* FIX 4: stable key = item.id (falls back to idx only if id missing) */}
              {order.items.map((item, idx) => (
                <div className="lo-item-card" key={item.id ?? idx}>
                  <div className="lo-item-emoji-box">{item.emoji}</div>
                  <div className="lo-item-details">
                    <div className="lo-item-name">{item.name}</div>
                    <div className="lo-item-unit-price">{formatCurrency(item.price)} each</div>
                  </div>
                  {isAlreadySettled ? (
                    <div className="lo-item-qty-controls">
                      <span className="lo-qty-value" style={{ padding: '0 10px' }}>x{item.qty}</span>
                    </div>
                  ) : (
                    <div className="lo-item-qty-controls">
                      <button className="lo-qty-btn" onClick={() => handleQtyChange(idx, -1)}>−</button>
                      <span className="lo-qty-value">{item.qty}</span>
                      <button className="lo-qty-btn" onClick={() => handleQtyChange(idx, +1)}>+</button>
                    </div>
                  )}
                  <div className="lo-item-line-total">{formatCurrency(item.price * item.qty)}</div>
                  {!isAlreadySettled && (
                    <button className="lo-item-delete" onClick={() => handleRemoveItem(idx)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!isAlreadySettled ? (
              <button
                className="lo-action-btn lo-action-primary"
                style={{ marginTop: '10px', width: '100%' }}
                onClick={handleSaveChanges}
              >
                <i className="fa-solid fa-floppy-disk" /> Save Changes
              </button>
            ) : (
              <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--color-background-success)', border: '1px solid var(--color-border-success)', borderRadius: '8px', fontSize: '13px', color: 'var(--color-text-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-circle-check" />
                Order settled — {order.location} is now free
              </div>
            )}
          </div>

          <div className="lo-modal-right">
            <div className="lo-bill-section">
              <div className="lo-bill-section-title">
                <i className="fa-solid fa-file-invoice-dollar" /> Bill Summary
              </div>
              <div className="lo-bill-card">
                <div className="lo-bill-row">
                  <div className="lo-bill-label"><div className="lo-bill-icon-box"><i className="fa-solid fa-receipt" /></div>Subtotal</div>
                  <div className="lo-bill-val">{formatCurrency(subtotal)}</div>
                </div>
                <div className="lo-bill-row">
                  <div className="lo-bill-label"><div className="lo-bill-icon-box"><i className="fa-solid fa-percent" /></div>Tax (10%)</div>
                  <div className="lo-bill-val">{formatCurrency(tax)}</div>
                </div>
                <div className="lo-bill-divider" />
                <div className="lo-bill-row lo-bill-row-total">
                  <div className="lo-bill-label"><div className="lo-bill-icon-box lo-bill-icon-dark"><i className="fa-solid fa-coins" /></div>Total</div>
                  <div className="lo-bill-val-total">{formatCurrency(total)}</div>
                </div>
              </div>
            </div>

            {!isAlreadySettled ? (
              <div className="lo-pay-section">
                <div className="lo-pay-title">Payment Method</div>
                <div className="lo-pay-grid">
                  {[
                    { id: 'Cash', icon: 'fa-money-bill-wave', label: 'Cash' },
                    { id: 'Card', icon: 'fa-credit-card', label: 'Card' },
                    { id: 'Online', icon: 'fa-mobile-screen', label: 'UPI' },
                  ].map(m => (
                    <button
                      key={m.id}
                      className={`lo-pay-btn${selectedPayment === m.id ? ' lo-pay-selected' : ''}`}
                      onClick={() => setSelectedPayment(m.id)}
                    >
                      <i className={`fa-solid ${m.icon}`} /><span>{m.label}</span>
                    </button>
                  ))}
                </div>
                <div className="lo-modal-actions">
                  <button className="lo-btn-print" onClick={handlePrint}>
                    <i className="fa-solid fa-print" /> Print
                  </button>
                  <button className="lo-btn-settle" onClick={handleSettle}>
                    <i className="fa-solid fa-circle-check" />
                    Settle
                    <span className="lo-settle-amount">{formatCurrency(total)}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="lo-pay-section">
                <button className="lo-btn-print" onClick={handlePrint} style={{ width: '100%' }}>
                  <i className="fa-solid fa-print" /> Print Receipt
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveOrder() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Return data instead of calling setState inside
  const fetchOrders = useCallback(async () => {
    const res = await fetch(`${BASE_URL}/view_orders`);
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data.map(normalise) : [];
  }, []);

  // Initial load — setState is in .then(), not in effect body
  useEffect(() => {
    let cancelled = false;
    fetchOrders()
      .then(list => { if (!cancelled) setOrders(list); })
      .catch(err => console.error('Failed to load orders:', err));
    return () => { cancelled = true; };
  }, [fetchOrders]);

  // Poll every 30s — pause on hidden tab
  useEffect(() => {
    let iv = setInterval(() => {
      fetchOrders()
        .then(list => setOrders(list))
        .catch(console.error);
    }, 30_000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(iv);
      } else {
        fetchOrders()
          .then(list => setOrders(list))
          .catch(console.error);
        iv = setInterval(() => {
          fetchOrders()
            .then(list => setOrders(list))
            .catch(console.error);
        }, 30_000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchOrders]);

  const stats = useMemo(() => ({
    active: orders.filter(o => o.status !== 'completed' && o.payStatus !== 'paid').length,
    ready: orders.filter(o => o.status === 'ready').length,
    cooking: orders.filter(o => o.status === 'cooking').length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: orders.filter(o => o.payStatus !== 'paid').reduce((acc, o) => acc + calcTotals(o).total, 0),
    all: orders.length,
    unpaid: orders.filter(o => o.payStatus === 'unpaid').length,
  }), [orders]);

  const filteredOrders = useMemo(() =>
    orders.filter(o => {
      const matchFilter = filter === 'all' || o.status === filter || o.payStatus === filter;
      const q = search.toLowerCase();
      const matchSearch =
        (o.displayId || '').toLowerCase().includes(q) ||
        String(o.table || '').includes(q) ||
        (o.location || '').toLowerCase().includes(q) ||
        (o.items || []).some(i => (i.name || '').toLowerCase().includes(q));
      return matchFilter && matchSearch;
    }), [orders, filter, search]);

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
  }, []);
  const removeToast = useCallback(id =>
    setToasts(prev => prev.filter(t => t.id !== id)), []);

  const markReady = useCallback(async (id) => {
    try {
      await fetch(`${BASE_URL}/update_order_status/${id}?status=ready`, { method: 'PATCH' });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'ready' } : o));
      addToast(`ORD-${id} marked as ready!`, 'success');
    } catch (err) { console.error('markReady error:', err); }
  }, [addToast]);

  const handleSettle = useCallback((id, updatedOrder) => {
    setOrders(prev =>
      prev.map(o => o.id !== id ? o : (updatedOrder ?? { ...o, status: 'completed', payStatus: 'paid' }))
    );
    setSelectedOrder(null);
  }, []);

  const handleUpdateOrder = useCallback((updated) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    setSelectedOrder(updated);
  }, []);

  const refreshOrders = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const list = await fetchOrders();
      setOrders(list);
      addToast('Orders refreshed', 'success');
    } catch (err) {
      console.error('Refresh error:', err);
      addToast('Refresh failed', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchOrders, addToast]);

  const getTableCardClass = status => ({
    pending: 'lo-tc-pending', cooking: 'lo-tc-cooking',
    ready: 'lo-tc-ready', completed: 'lo-tc-paid', paid: 'lo-tc-paid',
  }[status] || 'lo-tc-available');

  const activeOrdersByTable = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      if (o.table != null && o.status !== 'completed' && o.payStatus !== 'paid') {
        map[o.table] = o;
      }
    });
    return map;
  }, [orders]);

  return (
    <div className="lo-page">
      <SideNav />
      <main className="mains-contents">
        <TopNav />
        <div className="lo-content">

          <div className="s-page-title-row">
            <div><h2> Live <em> Orders </em></h2></div>
          </div>

          <div className="lo-stats-grid">
            <div className="lo-stat-card lo-stat-primary">
              <div className="lo-stat-accent" /><div className="lo-stat-bg" />
              <p className="lo-stat-label">Active Orders</p>
              <h3 className="lo-stat-value">{stats.active}</h3>
              <p className="lo-stat-sub">of 20 tables</p>
            </div>
            <div className="lo-stat-card">
              <p className="lo-stat-label">Ready to Serve</p>
              <h3 className="lo-stat-value lo-val-success">{stats.ready}</h3>
              <p className="lo-stat-sub">orders cooked</p>
            </div>
            <div className="lo-stat-card">
              <p className="lo-stat-label">In Progress</p>
              <h3 className="lo-stat-value lo-val-warning">{stats.cooking + stats.pending}</h3>
              <p className="lo-stat-sub">{stats.cooking} cooking, {stats.pending} pending</p>
            </div>
            <div className="lo-stat-card lo-stat-dark">
              <p className="lo-stat-label lo-stat-label-light">Pending Revenue</p>
              <h3 className="lo-stat-value lo-val-light">{formatCurrency(stats.revenue)}</h3>
              <p className="lo-stat-sub lo-stat-sub-light">incl. tax (10%)</p>
            </div>
          </div>

          <div className="lo-tables-panel">
            <div className="lo-panel-header"><h2 className="lo-panel-title">Table Overview</h2></div>
            <div className="lo-legend">
              {[['lo-dot-available', 'Available'], ['lo-dot-pending', 'Pending'], ['lo-dot-cooking', 'Cooking'], ['lo-dot-ready', 'Ready'], ['lo-dot-paid', 'Completed']].map(([cls, label]) => (
                <div className="lo-legend-item" key={label}><span className={`lo-legend-dot ${cls}`} />{label}</div>
              ))}
            </div>
            <div className="lo-tables-grid">
              {Array.from({ length: 20 }).map((_, i) => {
                const tableNum = i + 1;
                const order = activeOrdersByTable[tableNum];
                return (
                  <div
                    key={tableNum}
                    className={`lo-table-card ${order ? getTableCardClass(order.status) : 'lo-tc-available'}`}
                    onClick={() => order && setSelectedOrder(order)}
                    style={{ cursor: order ? 'pointer' : 'default' }}
                  >
                    {order?.status === 'cooking' && (
                      <span className="lo-pulse-wrap"><span className="lo-pulse-ring" /><span className="lo-pulse-dot" /></span>
                    )}
                    <div className="lo-table-top">
                      <span className="lo-table-num">{tableNum}</span>
                      {order && (
                        <span className="lo-table-icon-wrap">
                          {order.status === 'pending' && <i className="fa-solid fa-clock" />}
                          {order.status === 'cooking' && <i className="fa-solid fa-fire lo-orange" />}
                          {order.status === 'ready' && <i className="fa-solid fa-circle-check lo-green" />}
                          {order.status === 'completed' && <i className="fa-solid fa-check-double lo-green" />}
                        </span>
                      )}
                    </div>
                    <div className="lo-table-bottom">
                      {order ? (
                        <>
                          <div className="lo-table-status-text">
                            {order.status === 'pending' ? 'Order Placed' : order.status === 'completed' ? 'Completed' : capitalize(order.status)}
                          </div>
                          <div className="lo-table-amount">{formatCurrency(calcTotals(order).total)}</div>
                          <div className="lo-table-items">{(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}</div>
                        </>
                      ) : (
                        <div className="lo-table-available-text">Available</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lo-orders-panel">
            <div className="lo-orders-header">
              <div>
                <h3 className="lo-orders-title">
                  <i className="fa-solid fa-list-check" />Orders
                  <span className="lo-orders-count-badge">{filteredOrders.length}</span>
                </h3>
              </div>
              <div className="lo-filter-bar">
                <div className="lo-search-box">
                  <i className="fa-solid fa-magnifying-glass" />
                  <input type="text" placeholder="Search orders, tables..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="lo-filter-tabs">
                  {['all', 'pending', 'cooking', 'ready', 'completed', 'unpaid'].map(f => (
                    <button key={f} className={`lo-filter-tab${filter === f ? ' lo-filter-active' : ''}`} onClick={() => setFilter(f)}>
                      {capitalize(f)}
                      <span className="lo-tab-count">{f === 'all' ? stats.all : f === 'unpaid' ? stats.unpaid : f === 'completed' ? stats.completed : stats[f] ?? 0}</span>
                    </button>
                  ))}
                </div>
                <button className={`lo-refresh-btn${isRefreshing ? ' lo-spinning' : ''}`} onClick={refreshOrders}>
                  <i className="fa-solid fa-rotate" /><span>Refresh</span>
                </button>
              </div>
            </div>

            <div className="lo-orders-table-wrap lo-desktop-only">
              <table className="lo-orders-table">
                <thead>
                  <tr><th>Order ID</th><th>Location</th><th>Items</th><th>Amount</th><th>Kitchen</th><th>Payment</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? filteredOrders.map(order => {
                    const preview = order.items.slice(0, 2);
                    const moreCount = order.items.length - 2;
                    const isSettled = order.status === 'completed' || order.payStatus === 'paid';
                    return (
                      <tr key={order.id}>
                        <td><span className="lo-oid-cell">{order.displayId}</span></td>
                        <td>
                          <div className="lo-tbl-info">
                            <div className="lo-tbl-icon">🪑</div>
                            <div><div className="lo-tbl-num">{order.location}</div><div className="lo-tbl-time">{order.time}</div></div>
                          </div>
                        </td>
                        <td>
                          <div className="lo-items-preview">
                            {/* FIX 4: stable key */}
                            {preview.map(item => (
                              <span key={item.id} className="lo-preview-item">{item.emoji} {item.name} x{item.qty}</span>
                            ))}
                            {moreCount > 0 && <span className="lo-preview-more">+{moreCount} more</span>}
                          </div>
                        </td>
                        <td><span className="lo-order-amount">{formatCurrency(calcTotals(order).total)}</span></td>
                        <td><StatusBadge status={order.status} /></td>
                        <td><StatusBadge status={order.payStatus} /></td>
                        <td>
                          <div className="lo-action-btns">
                            {!isSettled && order.status !== 'ready' && (
                              <button className="lo-action-btn lo-action-success" onClick={() => markReady(order.id)}>
                                <i className="fa-solid fa-check" /> Ready
                              </button>
                            )}
                            <button className="lo-action-btn lo-action-primary" onClick={() => setSelectedOrder(order)}>
                              <i className="fa-solid fa-eye" />{isSettled ? 'View' : 'View Bill'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="7">
                      <div className="lo-empty-state">
                        <i className="fa-solid fa-circle-check" /><h4>All caught up!</h4><p>No orders match your criteria</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="lo-mobile-cards lo-mobile-only">
              {filteredOrders.length > 0 ? filteredOrders.map(order => {
                const preview = order.items.slice(0, 2);
                const moreCount = order.items.length - 2;
                const isSettled = order.status === 'completed' || order.payStatus === 'paid';
                return (
                  <div className="lo-order-card" key={order.id}>
                    <div className="lo-order-card-header">
                      <span className="lo-order-card-id">{order.displayId}</span>
                      <span className="lo-order-card-time">{order.time}</span>
                    </div>
                    <div className="lo-order-card-body">
                      <div className="lo-order-card-table"><div className="lo-tbl-icon">🪑</div><span className="lo-tbl-num">{order.location}</span></div>
                      <div className="lo-order-card-items">
                        {preview.map(item => <span key={item.id} className="lo-item-tag">{item.emoji} {item.name}</span>)}
                        {moreCount > 0 && <span className="lo-more-tag">+{moreCount}</span>}
                      </div>
                      <div className="lo-order-card-amount">{formatCurrency(calcTotals(order).total)}</div>
                    </div>
                    <div className="lo-order-card-status">
                      <StatusBadge status={order.status} /><StatusBadge status={order.payStatus} />
                    </div>
                    <div className="lo-order-card-actions">
                      {!isSettled && order.status !== 'ready' && (
                        <button className="lo-action-btn lo-action-success" onClick={() => markReady(order.id)}>
                          <i className="fa-solid fa-check" /> Ready
                        </button>
                      )}
                      <button className="lo-action-btn lo-action-primary" onClick={() => setSelectedOrder(order)}>
                        <i className="fa-solid fa-eye" />{isSettled ? 'View' : 'View Bill'}
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <div className="lo-empty-state lo-empty-mobile">
                  <i className="fa-solid fa-circle-check" /><h4>All caught up!</h4><p>No orders match your criteria</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {selectedOrder && (
        <BillingModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateOrder={handleUpdateOrder}
          onSettle={handleSettle}
          onShowToast={addToast}
        />
      )}

      <div className="lo-toast-container">
        {toasts.map(t => (
          <Toast key={t.id} message={t.msg} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  );
}