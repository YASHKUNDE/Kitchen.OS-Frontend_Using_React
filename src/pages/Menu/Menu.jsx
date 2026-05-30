import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import './Menu.css';
import SideNav from '../../components/SideNav/SideNav';
import Header1 from '../../components/Header/Header1';

const BASE_URL = 'http://localhost:8080/api';

const sectionToCategory = (section = '') => {
  const s = section.toLowerCase();
  if (s.includes('starter')) return 'starters';
  if (s.includes('burger')) return 'burgers';
  if (s.includes('beverage') || s.includes('drink')) return 'beverages';
  if (s.includes('desert') || s.includes('dessert')) return 'desserts';
  if (s.includes('main') || s.includes('course') ||
    s.includes('dish') || s.includes('special')) return 'main';
  return 'main';
};

const normalizeType = (menuType = '') =>
  menuType.toLowerCase().includes('non') ? 'nonveg' : 'veg';

const emojiMap = {
  starters: '🥗',
  main: '🍽️',
  burgers: '🍔',
  beverages: '🥤',
  desserts: '🍰',
};

const categories = [
  { id: 'all', label: 'All Items', icon: 'fa-grip' },
  { id: 'starters', label: 'Starters', icon: 'fa-seedling' },
  { id: 'main', label: 'Main Course', icon: 'fa-plate-wheat' },
  { id: 'burgers', label: 'Burgers', icon: 'fa-burger' },
  { id: 'beverages', label: 'Beverages', icon: 'fa-mug-hot' },
  { id: 'desserts', label: 'Desserts', icon: 'fa-ice-cream' },
];

const tableOptions = [
  { id: 'takeaway', label: 'T/A', subLabel: 'Takeaway' },
  { id: 'parsal', label: 'Parsal', subLabel: 'Parsal' },
  { id: 'vip', label: 'VIP', subLabel: 'VIP' },
  ...Array.from({ length: 20 }, (_, i) => ({
    id: String(i + 1), label: String(i + 1), subLabel: 'Table',
  })),
];

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('1');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);

  const tabsRef = useRef(null);
  const selectedTableIdRef = useRef(selectedTableId);
  useEffect(() => { selectedTableIdRef.current = selectedTableId; }, [selectedTableId]);

  // Return data instead of calling setState inside
  const fetchActiveOrders = useCallback(async () => {
    const res = await fetch(`${BASE_URL}/view_orders`);
    const data = await res.json();
    const list = data?.data;
    return Array.isArray(list)
      ? list.filter(o => o.status !== 'completed' && o.payStatus !== 'paid')
      : [];
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    fetchActiveOrders()
      .then(list => { if (!cancelled) setActiveOrders(list); })
      .catch(err => console.error('Failed to load active orders:', err));
    return () => { cancelled = true; };
  }, [fetchActiveOrders]);

  // Poll every 30s
  useEffect(() => {
    const iv = setInterval(() => {
      fetchActiveOrders()
        .then(list => setActiveOrders(list))
        .catch(console.error);
    }, 30_000);
    return () => clearInterval(iv);
  }, [fetchActiveOrders]);

  const occupiedTableIds = useMemo(() => {
    const set = new Set();
    activeOrders.forEach(o => {
      if (o.tableNumber != null) set.add(String(o.tableNumber));
      const loc = (o.location || '').toLowerCase();
      if (loc === 'takeaway') set.add('takeaway');
      if (loc === 'parsal') set.add('parsal');
      if (loc === 'vip') set.add('vip');
    });
    return set;
  }, [activeOrders]);

  // Fetch menu ONCE on mount — menu items don't change during service
  useEffect(() => {
    fetch(`${BASE_URL}/view_menu`)
      .then(res => res.json())
      .then(data => {
        const list = data?.data;
        if (Array.isArray(list)) {
          setMenuItems(list.map(item => {
            const cat = sectionToCategory(item.menuSection);
            return {
              id: item.id,
              name: item.menuName ?? '',
              price: parseFloat(item.price) || 0,
              category: cat,
              type: normalizeType(item.menuType),
              rating: 4.5,
              bestseller: false,
              desc: item.description ?? '',
              emoji: emojiMap[cat] ?? '🍽️',
              image: `${BASE_URL}/menu_image/${item.id}`,
            };
          }));
        }
      })
      .catch(err => console.error('Failed to load menu:', err))
      .finally(() => setLoading(false));
  }, []); // ← empty dep: runs once only



  useEffect(() => {
    if (!occupiedTableIds.has(selectedTableIdRef.current)) return;
    const firstFree = tableOptions.find(t => !occupiedTableIds.has(t.id));
    if (!firstFree) return;
    // Defer setState out of the effect body to avoid cascading render warning
    const t = setTimeout(() => setSelectedTableId(firstFree.id), 0);
    return () => clearTimeout(t);
  }, [occupiedTableIds]);


  const filteredItems = useMemo(() => {
    if (currentCategory === 'all') return menuItems;
    return menuItems.filter(i => i.category === currentCategory);
  }, [currentCategory, menuItems]);

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = subtotal * 0.10;
    const total = subtotal + tax;
    const totalItems = cart.reduce((s, i) => s + i.qty, 0);
    return { subtotal, tax, total, totalItems };
  }, [cart]);

  const addToCart = (itemId) => {
    const menuItem = menuItems.find(i => i.id === itemId);
    if (!menuItem) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing) return prev.map(i => i.id === itemId ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...menuItem, qty: 1 }];
    });
    if (window.innerWidth <= 768) setIsCartOpen(true);
  };

  const updateQty = (itemId, change) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    const newQty = item.qty + change;
    if (newQty <= 0) {
      setRemovingItemId(itemId);
      setTimeout(() => {
        setCart(prev => prev.filter(i => i.id !== itemId));
        setRemovingItemId(null);
      }, 300);
    } else {
      setCart(prev => prev.map(i => i.id === itemId ? { ...i, qty: newQty } : i));
    }
  };

  const clearCart = () => setCart([]);

  const getLocationLabel = (tableId = selectedTableId) => {
    if (tableId === 'takeaway') return 'Takeaway';
    if (tableId === 'parsal') return 'Parsal';
    if (tableId === 'vip') return 'VIP';
    return `Table ${tableId}`;
  };

  const handleTableSelect = (tableId) => {
    if (occupiedTableIds.has(tableId)) return;
    setSelectedTableId(tableId);
    setIsTableDropdownOpen(false);
  };

  const processOrder = async () => {
    if (cart.length === 0) return;
    if (occupiedTableIds.has(selectedTableId)) {
      alert(`${getLocationLabel()} is currently occupied. Please select another table.`);
      setIsTableDropdownOpen(true);
      return;
    }

    const placedTableId = selectedTableId;
    const payload = {
      tableNumber: isNaN(parseInt(placedTableId)) ? null : parseInt(placedTableId),
      location: getLocationLabel(placedTableId),
      status: 'pending',
      payStatus: 'unpaid',
      orderTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: cart.map(item => ({
        itemName: item.name,
        price: item.price,
        qty: item.qty,
        emoji: item.emoji,
        menuId: item.id,
      })),
    };

    let orderSuccess = false;
    try {
      const res = await fetch(`${BASE_URL}/add_order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        orderSuccess = true;
      } else {
        console.error('Order failed:', res.status);
        alert('Failed to place order. Please try again.');
      }
    } catch (err) {
      console.error('Network error:', err);
      orderSuccess = true;
    }

    if (orderSuccess) {
      setLastOrder({
        items: [...cart],
        totals: { ...cartTotals },
        location: getLocationLabel(placedTableId),
        tableId: placedTableId,
        time: new Date(),
      });
      setIsModalOpen(true);
      setCart([]);
      setIsCartOpen(false);
      const fresh = await fetchActiveOrders();
      setActiveOrders(fresh);
      const nowOccupied = new Set([...occupiedTableIds, placedTableId]);
      const firstFree = tableOptions.find(t => !nowOccupied.has(t.id));
      if (firstFree) setSelectedTableId(firstFree.id);
    }
  };

  const handleCategoryChange = (catId) => {
    setCurrentCategory(catId);
    if (tabsRef.current) {
      const activeBtn = tabsRef.current.querySelector('.cats-tab.active');
      if (activeBtn)
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  return (
    <div className="kitchen-os">
      <div className="sideNav"><SideNav /></div>

      <main className="main-content">
        <div className="headers-rights"><Header1 /></div>

        <div className="tabs-wrapper">
          <div className="categorys-tabs" ref={tabsRef}>
            {categories.map(cat => {
              const count = cat.id === 'all'
                ? menuItems.length
                : menuItems.filter(i => i.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  className={`cats-tab${currentCategory === cat.id ? ' active' : ''}`}
                  onClick={() => handleCategoryChange(cat.id)}
                  aria-pressed={currentCategory === cat.id}
                >
                  <span className="tab-icon"><i className={`fa-solid ${cat.icon}`} /></span>
                  <span className="tab-label">{cat.label}</span>
                  <span className="tab-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="menu-scroll-area">
          {loading ? (
            <div className="no-results">
              <i className="fa-solid fa-spinner fa-spin" />
              <h4>Loading menu...</h4>
            </div>
          ) : (
            <div className="menus-grids">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  className="menus-cards animate-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="cards-images-wrapper">
                    <img
                      src={item.image}
                      className="cards-images"
                      alt={item.name}
                      loading="lazy"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <div className="cards-overlay">
                      <button className="adds-btn-overlay" onClick={() => addToCart(item.id)}>
                        <i className="fa-solid fa-plus" />
                        <span>Add to Order</span>
                      </button>
                    </div>
                    <div className="badges-top">
                      {item.bestseller && <span className="badge badge-bestseller">* Best</span>}
                      <span className={`badge badge-${item.type}`}>
                        {item.type === 'veg' ? 'VEG' : 'NV'}
                      </span>
                    </div>
                  </div>
                  <div className="cards-contents">
                    <div className="items-name">{item.name}</div>
                    <div className="items-desc">{item.desc}</div>
                    <div className="card-footer">
                      <div className="item-price">Rs.{item.price.toFixed(2)}</div>
                      <div className="item-rating">
                        <i className="fa-solid fa-star" />
                        <span>{item.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && filteredItems.length === 0 && (
            <div className="no-results">
              <i className="fa-solid fa-face-sad-tear" />
              <h4>No items found</h4>
              <p>Try adjusting your filter</p>
            </div>
          )}
        </div>
      </main>

      <aside className={`cart-sidebar${isCartOpen ? ' mobile-open' : ''}`}>
        <button
          className="mobile-cart-toggle"
          onClick={() => setIsCartOpen(!isCartOpen)}
          aria-expanded={isCartOpen}
          aria-label="Toggle cart"
        >
          <div className="toggle-handle-bar" />
          <div className="toggle-inner">
            <div className="toggle-left">
              <div className="toggle-icon-wrap">
                <i className="fa-solid fa-basket-shopping" />
                {cartTotals.totalItems > 0 && (
                  <span className="toggle-badge">{cartTotals.totalItems}</span>
                )}
              </div>
              <div className="toggle-text">
                <span className="toggle-title">Your Order</span>
                <span className="toggle-subtitle">{getLocationLabel()}</span>
              </div>
            </div>
            <div className="toggle-right">
              <span className="toggle-total">Rs.{cartTotals.total.toFixed(2)}</span>
              <i className={`fa-solid fa-chevron-up toggle-chevron${isCartOpen ? ' rotated' : ''}`} />
            </div>
          </div>
        </button>

        <div className={`cart-panel${isCartOpen ? ' panel-open' : ''}`}>
          <div className="table-section">
            <button
              className={`table-select-btn${isTableDropdownOpen ? ' open' : ''}`}
              onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
              aria-expanded={isTableDropdownOpen}
            >
              <div className="table-btn-left">
                <div className="table-icon-box"><i className="fa-solid fa-chair" /></div>
                <div className="table-text">
                  <span className="table-label">Order Type</span>
                  <span className="table-value">{getLocationLabel()}</span>
                </div>
              </div>
              <i className={`fa-solid fa-chevron-down table-arrow${isTableDropdownOpen ? ' open' : ''}`} />
            </button>

            <div className={`table-dropdown${isTableDropdownOpen ? ' show' : ''}`}>
              <div className="table-grid">
                {tableOptions.map(table => {
                  const isOccupied = occupiedTableIds.has(table.id);
                  const isSelected = selectedTableId === table.id;
                  const chipClass = ['table-chip', isSelected ? 'selected' : '', isOccupied ? 'occupied' : '']
                    .filter(Boolean).join(' ');
                  return (
                    <button
                      key={table.id}
                      className={chipClass}
                      onClick={() => handleTableSelect(table.id)}
                      aria-selected={isSelected}
                      disabled={isOccupied}
                      title={isOccupied ? `${getLocationLabel(table.id)} is currently occupied` : ''}
                      style={{ position: 'relative' }}
                    >
                      <span className="chip-num">{table.label}</span>
                      <span className="chip-txt">{isOccupied ? 'Busy' : table.subLabel}</span>
                      {isOccupied && (
                        <span style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: '#e24b4a',
                          display: 'block',
                          pointerEvents: 'none',
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '12px', padding: '8px 4px 2px', fontSize: '11px', color: 'var(--color-text-secondary)', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1d9e75', display: 'inline-block' }} />
                  Available
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e24b4a', display: 'inline-block' }} />
                  Occupied
                </span>
              </div>
            </div>
          </div>

          <div className="cart-header">
            <div className="cart-header-left">
              <i className="fa-solid fa-receipt" />
              <span>Current Order</span>
              {cartTotals.totalItems > 0 && (
                <span className="item-badge">{cartTotals.totalItems}</span>
              )}
            </div>
            {cart.length > 0 && (
              <button className="clear-btn" onClick={clearCart}>
                <i className="fa-solid fa-trash" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="cart-items-container">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-icon-wrap">
                  <i className="fa-solid fa-basket-shopping" />
                </div>
                <h4>Cart is empty</h4>
                <p>Add items from the menu to get started</p>
              </div>
            ) : (
              <div className="cart-list">
                {cart.map((item, index) => (
                  <div
                    key={item.id}
                    className={`cart-item${removingItemId === item.id ? ' removing' : ''}`}
                    style={{ animationDelay: `${index * 0.04}s` }}
                  >
                    <div className="qty-col">
                      <button className="qty-btn plus" onClick={() => updateQty(item.id, 1)}>
                        <i className="fa-solid fa-plus" />
                      </button>
                      <span className="qty-num">{item.qty}</span>
                      <button className="qty-btn minus" onClick={() => updateQty(item.id, -1)}>
                        <i className="fa-solid fa-minus" />
                      </button>
                    </div>
                    <div className="cart-info">
                      <span className="cart-name">{item.name}</span>
                      <span className="cart-unit">Rs.{item.price.toFixed(2)} x {item.qty}</span>
                    </div>
                    <span className="cart-line-total">Rs.{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cart-footer">
            {occupiedTableIds.has(selectedTableId) && (
              <div style={{ backgroundColor: '#fcebeb', border: '1px solid #f7c1c1', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', fontSize: '12px', color: '#a32d2d', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <i className="fa-solid fa-circle-exclamation" />
                {getLocationLabel()} is occupied. Select another table.
              </div>
            )}
            <div className="bill-rows">
              <div className="bill-row">
                <span>Subtotal</span><span>Rs.{cartTotals.subtotal.toFixed(2)}</span>
              </div>
              <div className="bill-row">
                <span>Tax (10%)</span><span>Rs.{cartTotals.tax.toFixed(2)}</span>
              </div>
              <div className="bill-row bill-total">
                <span>Total</span><span>Rs.{cartTotals.total.toFixed(2)}</span>
              </div>
            </div>
            <button
              className="btn-checkout"
              onClick={processOrder}
              disabled={cart.length === 0 || occupiedTableIds.has(selectedTableId)}
            >
              <i className="fa-solid fa-credit-card" />
              <span className="checkout-label">
                {cart.length > 0 ? `Charge ${getLocationLabel()}` : 'Charge Order'}
              </span>
              {cart.length > 0 && (
                <span className="checkout-price">Rs.{cartTotals.total.toFixed(2)}</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {isModalOpen && lastOrder && (
        <div
          className="modal-overlay show"
          onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="modal-box">
            <div className="modal-check"><i className="fa-solid fa-check" /></div>
            <h2>Order Confirmed!</h2>
            <p>Your order has been sent to the kitchen</p>
            <div className="modal-details">
              <div className="modal-row">
                <span>Location</span><strong>{lastOrder.location}</strong>
              </div>
              <div className="modal-row">
                <span>Time</span>
                <strong>
                  {lastOrder.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </strong>
              </div>
              <div className="modal-row">
                <span>Items</span><strong>{lastOrder.totals.totalItems}</strong>
              </div>
              <div className="modal-row modal-row-total">
                <span>Total</span><strong>Rs.{lastOrder.totals.total.toFixed(2)}</strong>
              </div>
            </div>
            <button className="modal-btn" onClick={() => setIsModalOpen(false)}>
              Start New Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;