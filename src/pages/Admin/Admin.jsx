import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Admin.css';
import SideNav from '../../components/SideNav/SideNav';
import TopNav from '../../components/TopNav/TopNav';

/* ─────────────────────────────────────
   API BASE URL
───────────────────────────────────── */
const API = 'http://localhost:8080/api';

/* ─────────────────────────────────────
   MAP API response → frontend state
───────────────────────────────────── */
const mapFromApi = (a) => ({
  hotel: {
    name:    a.hotelName    ?? 'Desi Kitchen',
    type:    a.hotelType    ?? 'Fine Dining Restaurant',
    contact: a.hotelContact ?? '',
    email:   a.hotelEmail   ?? '',
    address: a.hotelAddress ?? '',
    logo:    a.logoData     ? `${API}/admin_logo?t=${Date.now()}` : null,
  },
  owner: {
    name:        a.ownerName        ?? '',
    designation: a.ownerDesignation ?? '',
    contact:     a.ownerContact     ?? '',
    email:       a.ownerEmail       ?? '',
    address:     a.ownerAddress     ?? '',
  },
  bank: {
    accountHolder: a.accountHolder ?? '',
    bankName:      a.bankName      ?? '',
    accountType:   a.accountType   ?? '',
    accountNumber: a.accountNumber ?? '',
    ifsc:          a.ifsc          ?? '',
    branch:        a.branch        ?? '',
    upi:           a.upi           ?? '',
  },
  settings: {
    currency:   a.currency   ?? '₹ INR (Indian Rupee)',
    timezone:   a.timezone   ?? 'IST (UTC+5:30)',
    tables:     a.tables     ?? 24,
    taxRate:    a.taxRate    ?? 18,
    gstEnabled: a.gstEnabled ?? true,
    gstin:      a.gstin      ?? '',
  },
});

/* ══════════════════════════════════════
   TOAST
══════════════════════════════════════ */
function ToastContainer({ toasts }) {
  return (
    <div className="adm-toast-container" style={{
      position:'fixed', bottom:'1.5rem', right:'1.5rem',
      display:'flex', flexDirection:'column', gap:'0.5rem', zIndex:9999,
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: t.error ? '#fee2e2' : '#dcfce7',
          color:      t.error ? '#991b1b' : '#166534',
          border:     `1px solid ${t.error ? '#fca5a5' : '#86efac'}`,
          borderRadius:'0.75rem', padding:'0.75rem 1rem',
          display:'flex', alignItems:'center', gap:'0.5rem',
          fontSize:'0.85rem', fontWeight:600, boxShadow:'0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <i className={`fa-solid ${t.error ? 'fa-circle-exclamation' : 'fa-circle-check'}`} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
const Admin = () => {
  const [activeModal,   setActiveModal]   = useState(null);
  const [pageLoading,   setPageLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toasts,        setToasts]        = useState([]);

  // ── Display data ──
  const [hotelData,    setHotelData]    = useState({});
  const [ownerData,    setOwnerData]    = useState({});
  const [bankData,     setBankData]     = useState({});
  const [settingsData, setSettingsData] = useState({});

  // ── Form drafts ──
  const [hotelForm,    setHotelForm]    = useState({});
  const [ownerForm,    setOwnerForm]    = useState({});
  const [bankForm,     setBankForm]     = useState({});
  const [settingsForm, setSettingsForm] = useState({});

  const showToast = useCallback((msg, error = false) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, error }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  /* ── Load on mount ── */
  useEffect(() => {
    axios.get(`${API}/admin_settings`)
      .then((res) => {
        const d = res.data?.data?.[0];
        if (d) {
          const mapped = mapFromApi(d);
          setHotelData(mapped.hotel);
          setOwnerData(mapped.owner);
          setBankData(mapped.bank);
          setSettingsData(mapped.settings);
        }
      })
      .catch(() => showToast('Could not load settings. Is the server running?', true))
      .finally(() => setPageLoading(false));
  }, [showToast]);

  /* ── Keyboard / scroll lock ── */
  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') setActiveModal(null); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  useEffect(() => {
    document.body.style.overflow = activeModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activeModal]);

  /* ── Helpers ── */
  const openModal = (name) => {
    if (name === 'hotel')    setHotelForm({ ...hotelData });
    if (name === 'owner')    setOwnerForm({ ...ownerData });
    if (name === 'bank')     setBankForm({ ...bankData });
    if (name === 'settings') setSettingsForm({ ...settingsData });
    setActiveModal(name);
  };

  const closeModal = () => setActiveModal(null);

  const getInitials = (name = '') =>
    name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();

  const maskAccount = (num = '') => '•••• •••• ' + num.slice(-4);

  /* ─────────────────────────────────────
     SAVE HANDLERS
  ───────────────────────────────────── */

  /* Hotel */
  const saveHotelInfo = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        hotelName:    hotelForm.name,
        hotelType:    hotelForm.type,
        hotelContact: hotelForm.contact,
        hotelEmail:   hotelForm.email,
        hotelAddress: hotelForm.address,
      };

      // Attach new logo if the user picked one in the form
      if (hotelForm.logo && hotelForm.logo.startsWith('data:')) {
        const parts = hotelForm.logo.split(',');
        payload.logoData = parts[1];
        payload.logoType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      }

      await axios.put(`${API}/update_hotel`, payload);
      setHotelData({ ...hotelForm });
      showToast('Hotel information updated!');
      closeModal();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Failed to update hotel info.', true);
    } finally {
      setActionLoading(false);
    }
  };

  /* Owner */
  const saveOwnerInfo = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await axios.put(`${API}/update_owner`, {
        ownerName:        ownerForm.name,
        ownerDesignation: ownerForm.designation,
        ownerContact:     ownerForm.contact,
        ownerEmail:       ownerForm.email,
        ownerAddress:     ownerForm.address,
      });
      setOwnerData({ ...ownerForm });
      showToast('Owner information updated!');
      closeModal();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Failed to update owner info.', true);
    } finally {
      setActionLoading(false);
    }
  };

  /* Bank */
  const saveBankInfo = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await axios.put(`${API}/update_bank`, {
        accountHolder: bankForm.accountHolder,
        bankName:      bankForm.bankName,
        accountType:   bankForm.accountType,
        accountNumber: bankForm.accountNumber,
        ifsc:          bankForm.ifsc,
        branch:        bankForm.branch,
        upi:           bankForm.upi,
      });
      setBankData({ ...bankForm });
      showToast('Bank details updated!');
      closeModal();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Failed to update bank details.', true);
    } finally {
      setActionLoading(false);
    }
  };

  /* Settings */
  const saveSettingsInfo = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await axios.put(`${API}/update_admin_settings`, {
        currency:   settingsForm.currency,
        timezone:   settingsForm.timezone,
        tables:     settingsForm.tables,
        taxRate:    settingsForm.taxRate,
        gstEnabled: settingsForm.gstEnabled,
        gstin:      settingsForm.gstin,
      });
      setSettingsData({ ...settingsForm });
      showToast('System settings updated!');
      closeModal();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Failed to update settings.', true);
    } finally {
      setActionLoading(false);
    }
  };

  /* Logo — direct upload (card click, no modal) */
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      const parts   = dataUrl.split(',');
      const logoData = parts[1];
      const logoType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';

      // Optimistic UI update
      setHotelData((prev) => ({ ...prev, logo: dataUrl }));

      try {
        await axios.put(`${API}/update_hotel`, {
          hotelName:    hotelData.name,
          hotelType:    hotelData.type,
          hotelContact: hotelData.contact,
          hotelEmail:   hotelData.email,
          hotelAddress: hotelData.address,
          logoData,
          logoType,
        });
        showToast('Logo updated!');
      } catch {
        showToast('Failed to save logo.', true);
        setHotelData((prev) => ({ ...prev, logo: hotelData.logo }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleContactSubmit = (e) => { e.preventDefault(); e.target.reset(); };

  /* ── Page loading spinner ── */
  if (pageLoading) {
    return (
      <div className="adm-page">
        <SideNav />
        <main className="mains-contents">
          <TopNav />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
            <div style={{ textAlign:'center', color:'var(--slate)' }}>
              <i className="fa-solid fa-spinner fa-spin"
                style={{ fontSize:'2.5rem', marginBottom:'1rem', color:'var(--azure)' }} />
              <p style={{ fontSize:'0.9rem', fontWeight:600 }}>Loading settings...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  return (
    <div className="adm-page">
      <SideNav />

      <main className="mains-contents">
        <TopNav />

        <div className="adm-content">

          <div className="s-page-title-row">
            <div><h2> Admin <em> Profile </em></h2></div>
          </div>

          <div className="adm-grid">

            {/* ─── CARD 1 — Hotel Information ─── */}
            <div className="adm-card">
              <div className="adm-card-header">
                <div className="adm-header-left">
                  <div className="adm-icon-box adm-indigo">
                    <i className="fa-solid fa-hotel" />
                  </div>
                  <div>
                    <h3>Hotel Information</h3>
                    <p>Business details &amp; branding</p>
                  </div>
                </div>
                <button className="adm-edit-btn adm-indigo" onClick={() => openModal('hotel')}>
                  <i className="fa-solid fa-pen-to-square" /> Edit
                </button>
              </div>

              <div className="adm-card-body">
                <div
                  className="adm-logo-upload"
                  onClick={() => document.getElementById('adm-logoInput').click()}
                  title="Click to change logo"
                >
                  {hotelData.logo
                    ? <img src={hotelData.logo} alt="Hotel Logo" className="adm-logo-img" />
                    : <span className="adm-logo-initials">{getInitials(hotelData.name)}</span>
                  }
                  <div className="adm-upload-overlay">
                    <i className="fa-solid fa-camera" />
                  </div>
                  <input type="file" id="adm-logoInput" accept="image/*" hidden onChange={handleLogoUpload} />
                </div>

                <div className="adm-details-grid">
                  <div className="adm-info-item">
                    <span className="adm-label">Hotel Name</span>
                    <span className="adm-value">{hotelData.name}</span>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">Type</span>
                    <span className="adm-value">{hotelData.type}</span>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">Contact</span>
                    <span className="adm-value">{hotelData.contact}</span>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">Email</span>
                    <span className="adm-value adm-truncate">{hotelData.email}</span>
                  </div>
                  <div className="adm-info-item adm-full">
                    <span className="adm-label">Address</span>
                    <span className="adm-value">{hotelData.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── CARD 2 — Owner Information ─── */}
            <div className="adm-card">
              <div className="adm-card-header">
                <div className="adm-header-left">
                  <div className="adm-icon-box adm-emerald">
                    <i className="fa-solid fa-user-tie" />
                  </div>
                  <div>
                    <h3>Owner Information</h3>
                    <p>Personal &amp; contact details</p>
                  </div>
                </div>
                <button className="adm-edit-btn adm-emerald" onClick={() => openModal('owner')}>
                  <i className="fa-solid fa-pen-to-square" /> Edit
                </button>
              </div>

              <div className="adm-card-body">
                <div className="adm-avatar adm-emerald">{getInitials(ownerData.name)}</div>
                <div className="adm-details-grid">
                  <div className="adm-info-item">
                    <span className="adm-label">Full Name</span>
                    <span className="adm-value">{ownerData.name}</span>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">Designation</span>
                    <span className="adm-value">{ownerData.designation}</span>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">Contact</span>
                    <span className="adm-value">{ownerData.contact}</span>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">Email</span>
                    <span className="adm-value adm-truncate">{ownerData.email}</span>
                  </div>
                  <div className="adm-info-item adm-full">
                    <span className="adm-label">Address</span>
                    <span className="adm-value">{ownerData.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── CARD 3 — Bank Details ─── */}
            <div className="adm-card">
              <div className="adm-card-header">
                <div className="adm-header-left">
                  <div className="adm-icon-box adm-amber">
                    <i className="fa-solid fa-building-columns" />
                  </div>
                  <div>
                    <h3>Bank Details</h3>
                    <p>Payment &amp; account information</p>
                  </div>
                </div>
                <button className="adm-edit-btn adm-amber" onClick={() => openModal('bank')}>
                  <i className="fa-solid fa-pen-to-square" /> Edit
                </button>
              </div>

              <div className="adm-card-body adm-card-body-col">
                <div className="adm-details-grid adm-cols-3">
                  <div className="adm-info-item">
                    <span className="adm-label">Account Holder</span>
                    <span className="adm-value">{bankData.accountHolder}</span>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">Bank Name</span>
                    <span className="adm-value">{bankData.bankName}</span>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">Account Type</span>
                    <span className="adm-value">{bankData.accountType}</span>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">Account Number</span>
                    <span className="adm-value adm-mono">{maskAccount(bankData.accountNumber)}</span>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">IFSC Code</span>
                    <span className="adm-value adm-mono">{bankData.ifsc}</span>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">Branch</span>
                    <span className="adm-value">{bankData.branch}</span>
                  </div>
                  <div className="adm-info-item adm-full">
                    <span className="adm-label">UPI ID</span>
                    <span className="adm-value adm-mono adm-primary">{bankData.upi}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── CARD 4 — System Settings ─── */}
            <div className="adm-card">
              <div className="adm-card-header">
                <div className="adm-header-left">
                  <div className="adm-icon-box adm-purple">
                    <i className="fa-solid fa-sliders" />
                  </div>
                  <div>
                    <h3>System Settings</h3>
                    <p>Configuration &amp; preferences</p>
                  </div>
                </div>
                <button className="adm-edit-btn adm-purple" onClick={() => openModal('settings')}>
                  <i className="fa-solid fa-pen-to-square" /> Edit
                </button>
              </div>

              <div className="adm-card-body adm-card-body-col">
                <div className="adm-details-grid adm-cols-3">
                  <div className="adm-info-item">
                    <span className="adm-label">Currency</span>
                    <span className="adm-value">{settingsData.currency}</span>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">Timezone</span>
                    <span className="adm-value">{settingsData.timezone}</span>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">Tables</span>
                    <span className="adm-value">{settingsData.tables} Units</span>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">Tax Rate</span>
                    <span className="adm-value">{settingsData.taxRate}%</span>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">GST Status</span>
                    <div className="adm-status-badge">
                      <span className={`adm-status-dot${settingsData.gstEnabled ? ' adm-active' : ''}`} />
                      <span className="adm-status-text">
                        {settingsData.gstEnabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="adm-info-item">
                    <span className="adm-label">GSTIN</span>
                    <span className="adm-value adm-mono">{settingsData.gstin}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>{/* /adm-grid */}
        </div>{/* /adm-content */}

        {/* ══════════════════════════════════════
            MODALS
        ══════════════════════════════════════ */}

        {/* Hotel Modal */}
        {activeModal === 'hotel' && (
          <div className="adm-overlay" onClick={closeModal}>
            <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="adm-modal-header">
                <h3>Edit Hotel Information</h3>
                <button className="adm-close-btn" onClick={closeModal}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <form onSubmit={saveHotelInfo}>
                <div className="adm-form-group">
                  <label>Hotel Name</label>
                  <input type="text" value={hotelForm.name || ''} required
                    onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })} />
                </div>
                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label>Type</label>
                    <select value={hotelForm.type || ''}
                      onChange={(e) => setHotelForm({ ...hotelForm, type: e.target.value })}>
                      <option>Fine Dining Restaurant</option>
                      <option>Casual Dining</option>
                      <option>Quick Service</option>
                      <option>Cafe</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label>Contact</label>
                    <input type="tel" value={hotelForm.contact || ''}
                      onChange={(e) => setHotelForm({ ...hotelForm, contact: e.target.value })} />
                  </div>
                </div>
                <div className="adm-form-group">
                  <label>Email</label>
                  <input type="email" value={hotelForm.email || ''}
                    onChange={(e) => setHotelForm({ ...hotelForm, email: e.target.value })} />
                </div>
                <div className="adm-form-group">
                  <label>Address</label>
                  <textarea rows="2" value={hotelForm.address || ''}
                    onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })} />
                </div>
                <div className="adm-modal-actions">
                  <button type="button" className="adm-btn adm-btn-sec" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="adm-btn adm-btn-pri adm-indigo-btn" disabled={actionLoading}>
                    <i className={`fa-solid ${actionLoading ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`} />
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Owner Modal */}
        {activeModal === 'owner' && (
          <div className="adm-overlay" onClick={closeModal}>
            <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="adm-modal-header">
                <h3>Edit Owner Information</h3>
                <button className="adm-close-btn" onClick={closeModal}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <form onSubmit={saveOwnerInfo}>
                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label>Full Name</label>
                    <input type="text" value={ownerForm.name || ''}
                      onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })} />
                  </div>
                  <div className="adm-form-group">
                    <label>Designation</label>
                    <input type="text" value={ownerForm.designation || ''}
                      onChange={(e) => setOwnerForm({ ...ownerForm, designation: e.target.value })} />
                  </div>
                </div>
                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label>Contact</label>
                    <input type="tel" value={ownerForm.contact || ''}
                      onChange={(e) => setOwnerForm({ ...ownerForm, contact: e.target.value })} />
                  </div>
                  <div className="adm-form-group">
                    <label>Email</label>
                    <input type="email" value={ownerForm.email || ''}
                      onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })} />
                  </div>
                </div>
                <div className="adm-form-group">
                  <label>Address</label>
                  <textarea rows="2" value={ownerForm.address || ''}
                    onChange={(e) => setOwnerForm({ ...ownerForm, address: e.target.value })} />
                </div>
                <div className="adm-modal-actions">
                  <button type="button" className="adm-btn adm-btn-sec" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="adm-btn adm-btn-pri adm-emerald-btn" disabled={actionLoading}>
                    <i className={`fa-solid ${actionLoading ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`} />
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bank Modal */}
        {activeModal === 'bank' && (
          <div className="adm-overlay" onClick={closeModal}>
            <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="adm-modal-header">
                <h3>Edit Bank Details</h3>
                <button className="adm-close-btn" onClick={closeModal}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <form onSubmit={saveBankInfo}>
                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label>Account Holder</label>
                    <input type="text" value={bankForm.accountHolder || ''}
                      onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })} />
                  </div>
                  <div className="adm-form-group">
                    <label>Bank Name</label>
                    <input type="text" value={bankForm.bankName || ''}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} />
                  </div>
                </div>
                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label>Account Type</label>
                    <select value={bankForm.accountType || ''}
                      onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })}>
                      <option>Current Account</option>
                      <option>Savings Account</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label>Account Number</label>
                    <input type="text" value={bankForm.accountNumber || ''}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} />
                  </div>
                </div>
                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label>IFSC Code</label>
                    <input type="text" value={bankForm.ifsc || ''}
                      onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value })} />
                  </div>
                  <div className="adm-form-group">
                    <label>Branch</label>
                    <input type="text" value={bankForm.branch || ''}
                      onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })} />
                  </div>
                </div>
                <div className="adm-form-group">
                  <label>UPI ID</label>
                  <input type="text" value={bankForm.upi || ''}
                    onChange={(e) => setBankForm({ ...bankForm, upi: e.target.value })} />
                </div>
                <div className="adm-modal-actions">
                  <button type="button" className="adm-btn adm-btn-sec" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="adm-btn adm-btn-pri adm-amber-btn" disabled={actionLoading}>
                    <i className={`fa-solid ${actionLoading ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`} />
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {activeModal === 'settings' && (
          <div className="adm-overlay" onClick={closeModal}>
            <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="adm-modal-header">
                <h3>Edit System Settings</h3>
                <button className="adm-close-btn" onClick={closeModal}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <form onSubmit={saveSettingsInfo}>
                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label>Currency</label>
                    <select value={settingsForm.currency || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}>
                      <option>₹ INR (Indian Rupee)</option>
                      <option>$ USD (US Dollar)</option>
                      <option>€ EUR (Euro)</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label>Timezone</label>
                    <select value={settingsForm.timezone || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })}>
                      <option>IST (UTC+5:30)</option>
                      <option>GMT (UTC+0:00)</option>
                      <option>EST (UTC-5:00)</option>
                    </select>
                  </div>
                </div>
                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label>Number of Tables</label>
                    <input type="number" min="1" value={settingsForm.tables ?? 1}
                      onChange={(e) => setSettingsForm({ ...settingsForm, tables: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div className="adm-form-group">
                    <label>Tax Rate (%)</label>
                    <input type="number" min="0" max="100" value={settingsForm.taxRate ?? 0}
                      onChange={(e) => setSettingsForm({ ...settingsForm, taxRate: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="adm-toggle-wrap">
                  <div className="adm-toggle-info">
                    <span className="adm-toggle-title">GST Registration</span>
                    <span className="adm-toggle-desc">Enable GST calculation on invoices</span>
                  </div>
                  <label className="adm-toggle">
                    <input type="checkbox" checked={settingsForm.gstEnabled ?? false}
                      onChange={(e) => setSettingsForm({ ...settingsForm, gstEnabled: e.target.checked })} />
                    <span className="adm-slider" />
                  </label>
                </div>

                <div className="adm-form-group">
                  <label>GSTIN</label>
                  <input type="text" className="adm-mono-input" value={settingsForm.gstin || ''}
                    disabled={!settingsForm.gstEnabled}
                    onChange={(e) => setSettingsForm({ ...settingsForm, gstin: e.target.value })} />
                </div>

                <div className="adm-modal-actions">
                  <button type="button" className="adm-btn adm-btn-sec" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="adm-btn adm-btn-pri adm-purple-btn" disabled={actionLoading}>
                    <i className={`fa-solid ${actionLoading ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`} />
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            FOOTER  (unchanged)
        ══════════════════════════════════════ */}
        <div className="adm-footer-section">
          <footer className="adm-footer">
            <div className="adm-glow-top" />
            <div className="adm-glow-bottom" />

            <div className="adm-footer-grid">
              <div className="adm-footer-info">
                <div className="adm-brand-header">
                  <div className="adm-brand-logo">DK</div>
                  <div>
                    <h2 className="adm-brand-title">Kitchen.OS</h2>
                    <p className="adm-brand-subtitle">Operations Platform</p>
                  </div>
                </div>
                <h2 className="adm-contact-heading">Get In Touch</h2>
                <p className="adm-contact-desc">
                  Having trouble or need a custom integration? We're here to help 24/7.
                </p>
                <div className="adm-contact-links">
                  <a href="https://wa.me/7028292573" className="adm-contact-card" target="_blank" rel="noreferrer">
                    <div className="adm-contact-icon adm-whatsapp">
                      <i className="fa-brands fa-whatsapp" />
                    </div>
                    <p className="adm-contact-label">WhatsApp</p>
                    <p className="adm-contact-value">7028292573</p>
                  </a>
                  <a href="mailto:support@kitchenos.com" className="adm-contact-card">
                    <div className="adm-contact-icon adm-email">
                      <i className="fa-regular fa-envelope" />
                    </div>
                    <p className="adm-contact-label">Email</p>
                    <p className="adm-contact-value">support@kitchenos.com</p>
                  </a>
                </div>
              </div>

              <div className="adm-contact-form-wrap">
                <h3 className="adm-form-title">Send us a message</h3>
                <form className="adm-contact-form" onSubmit={handleContactSubmit}>
                  <div className="adm-form-row">
                    <input type="text"  name="name"  placeholder="Name"  required className="adm-f-input" />
                    <input type="email" name="email" placeholder="Email" required className="adm-f-input" />
                  </div>
                  <select name="subject" className="adm-f-select">
                    <option value="">Select Subject</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Issue</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea rows="4" name="message" placeholder="Your message..." required className="adm-f-textarea" />
                  <button type="submit" className="adm-submit-btn">
                    <span>Send Message</span>
                    <i className="fa-solid fa-paper-plane" />
                  </button>
                </form>
              </div>
            </div>

            <div className="adm-footer-bottom">
              <p>© 2024 Kitchen.OS. All rights reserved.</p>
              <nav className="adm-footer-nav">
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Support</a>
              </nav>
            </div>
          </footer>
        </div>

      </main>

      <ToastContainer toasts={toasts} />
    </div>
  );
};

export default Admin;