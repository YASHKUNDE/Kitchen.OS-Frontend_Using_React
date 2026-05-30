import { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import "./AddMenu.css";
import TopNav from '../../components/TopNav/TopNav.jsx';
import SideNav from '../../components/SideNav/SideNav.jsx';

/* ─────────────────────────────────────
   API BASE URL
───────────────────────────────────── */
const API = "http://localhost:8080/api";

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
const getMenuTypeCss = (type = "") => {
  const t = type.toLowerCase();
  if (t.includes("veg") && !t.includes("non")) return "type-veg";
  if (t.includes("non"))                        return "type-nonveg";
  return "type-default";
};

const getSectionCss = (section = "") => {
  const s = section.toLowerCase();
  if (s.includes("starter"))  return "section-starter";
  if (s.includes("main"))     return "section-main";
  if (s.includes("special"))  return "section-special";
  if (s.includes("desert"))   return "section-desert";
  if (s.includes("dish"))     return "section-dish";
  return "section-default";
};

const formatPrice = (n) => "₹" + Number(n).toLocaleString("en-IN");

/* ─────────────────────────────────────
   FIELD MAPPERS
   Backend fields: menuName, price, qtyType,
   menuSection, menuType, description,
   imageData (byte[]), imageType (String)
───────────────────────────────────── */
const mapToApi = (item) => {
  let imageData = null;
  let imageType = null;

  if (item.image && item.image.startsWith("data:")) {
    const parts = item.image.split(",");
    if (parts.length === 2) {
      imageType = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      imageData = parts[1];
    }
  }

  return {
    menuName:    item.name,
    price:       Number(item.price),
    qtyType:     item.quantityType,
    menuSection: item.menuSection,
    menuType:    item.menuType,
    description: item.description,
    ...(imageData && { imageData }),
    ...(imageType && { imageType }),
  };
};

const mapFromApi = (m) => ({
  id:           m.id,
  name:         m.menuName    ?? "",
  price:        m.price       ?? 0,
  quantityType: m.qtyType     ?? "",
  menuSection:  m.menuSection ?? "",
  menuType:     m.menuType    ?? "",
  description:  m.description ?? "",
  image:        m.imageData   ? `http://localhost:8080/api/menu_image/${m.id}` : "",
});

/* ══════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════ */

function ToastContainer({ toasts }) {
  return (
    <div className="a-toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`a-toast${t.error ? " error" : ""}`}>
          <i className={`fa-solid ${t.error ? "fa-circle-exclamation" : "fa-circle-check"}`} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function MenuTypeBadge({ menuType }) {
  return (
    <span className={`a-status-badge ${getMenuTypeCss(menuType)}`}>
      <span className="a-badge-dot" />
      {menuType}
    </span>
  );
}

function SectionPill({ menuSection }) {
  return (
    <span className={`a-role-pill ${getSectionCss(menuSection)}`}>
      {menuSection}
    </span>
  );
}

function MenuAvatar({ item, size = "table" }) {
  const cls = size === "card" ? "a-staff-card-avatar" : "a-staff-avatar";
  return (
    <div className={cls}>
      {item.image
        ? <img src={item.image} alt={item.name} />
        : <i className="fa-solid fa-bowl-food" />}
    </div>
  );
}

function UploadZone({ photoData, onChange }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image too large (max 5 MB)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  }, [onChange]);

  return (
    <div className="a-upload-zone">
      <div
        className={`a-upload-dropzone${dragging ? " drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f?.type.startsWith("image/")) handleFile(f);
        }}
      >
        <input ref={inputRef} type="file" accept="image/*"
          onChange={(e) => handleFile(e.target.files[0])} />
        {photoData ? (
          <>
            <img src={photoData} alt="Preview" className="a-preview-img" />
            <div className="a-overlay-edit">
              <i className="fa-solid fa-camera" /><span>Change Image</span>
            </div>
          </>
        ) : (
          <>
            <div className="a-upload-icon-wrap"><i className="fa-solid fa-cloud-arrow-up" /></div>
            <p className="a-upload-text">Click or drag<br />to upload</p>
            <span className="a-upload-hint">JPG, PNG up to 5 MB</span>
          </>
        )}
      </div>
      <span className="a-upload-formats">Menu Image</span>
    </div>
  );
}

function InputGroup({ label, required, icon, children, full }) {
  return (
    <div className={`a-input-group${full ? " full" : ""}`}>
      <label className="a-input-label">
        {label}{required && <span className="a-required">*</span>}
      </label>
      <div className="a-input-wrap">
        {icon && <i className={`${icon} a-input-icon`} />}
        {children}
      </div>
    </div>
  );
}

/* ─── ADD MENU FORM ─── */
function AddMenuForm({ onAdd, loading }) {
  const EMPTY = {
    name: "", price: "", quantityType: "",
    menuSection: "", menuType: "", description: "",
  };
  const [form, setForm]   = useState(EMPTY);
  const [image, setImage] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    const { name, price, menuSection } = form;
    if (!name.trim() || !price || !menuSection.trim()) {
      onAdd(null, "Please fill all required fields."); return;
    }
    onAdd({
      name:         name.trim(),
      price:        Number(price),
      quantityType: form.quantityType,
      menuSection:  form.menuSection.trim(),
      menuType:     form.menuType,
      description:  form.description,
      image,
    });
    setForm(EMPTY);
    setImage("");
  };

  return (
    <div className="a-card a-add-staff-card">
      <div className="a-form-card-header">
        <div className="a-header-icon"><i className="fa-solid fa-bowl-food" /></div>
        <div><h3>Add New Menu Item</h3></div>
      </div>
      <div className="a-form-body">
        <UploadZone photoData={image} onChange={setImage} />
        <div className="a-form-grid">

          <InputGroup label="Menu Name" required icon="fa-solid fa-utensils">
            <input className="a-input" type="text" placeholder="e.g. Paneer Tikka"
              value={form.name} onChange={set("name")} />
          </InputGroup>

          <InputGroup label="Price (INR)" required icon="fa-solid fa-indian-rupee-sign">
            <input className="a-input" type="number" placeholder="e.g. 200"
              value={form.price} onChange={set("price")} />
          </InputGroup>

          <InputGroup label="Quantity Type" icon="fa-solid fa-scale-balanced">
            <input className="a-input" list="a-qty" placeholder="Select QTY"
              value={form.quantityType} onChange={set("quantityType")} />
            <datalist id="a-qty">
              <option value="FULL" />
              <option value="Half" />
            </datalist>
          </InputGroup>

          <InputGroup label="Menu Section" required icon="fa-solid fa-layer-group">
            <input className="a-input" list="a-section" placeholder="Select Section"
              value={form.menuSection} onChange={set("menuSection")} />
            <datalist id="a-section">
              <option value="Starter" />
              <option value="Desert" />
              <option value="Dish" />
              <option value="Main Course" />
              <option value="Special Dish" />
            </datalist>
          </InputGroup>

          <InputGroup label="Menu Type" icon="fa-solid fa-tag">
            <input className="a-input" list="a-type" placeholder="Select Menu Type"
              value={form.menuType} onChange={set("menuType")} />
            <datalist id="a-type">
              <option value="VEG" />
              <option value="NON_VEG" />
            </datalist>
          </InputGroup>

          <InputGroup label="Description" icon="fa-solid fa-align-left">
            <input className="a-input" type="text" placeholder="Enter menu info"
              value={form.description} onChange={set("description")} />
          </InputGroup>

          <button className="a-btn-submit" onClick={handleSubmit} disabled={loading}>
            <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-plus"}`} />
            {loading ? "Saving..." : "ADD MENU"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── DESKTOP TABLE ROW ─── */
function TableRow({ item, onEdit, onDelete }) {
  return (
    <tr>
      <td><span className="a-staff-id">#{String(item.id).padStart(3, "0")}</span></td>
      <td><MenuAvatar item={item} /></td>
      <td><div className="a-staff-name">{item.name}</div></td>
      <td><span className="a-desc-cell">{item.description || "—"}</span></td>
      <td><span className="a-salary-cell">{formatPrice(item.price)} <span>/plate</span></span></td>
      <td><span className="a-qty-cell">{item.quantityType || "—"}</span></td>
      <td><SectionPill menuSection={item.menuSection} /></td>
      <td><MenuTypeBadge menuType={item.menuType} /></td>
      <td>
        <div className="a-actions-cell">
          <button className="a-btn-action a-btn-edit" title="Edit" onClick={() => onEdit(item)}>
            <i className="fa-solid fa-pen" />
          </button>
          <button className="a-btn-action a-btn-delete" title="Delete" onClick={() => onDelete(item.id)}>
            <i className="fa-solid fa-trash" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ─── MOBILE CARD ─── */
function MobileCard({ item, onEdit, onDelete }) {
  return (
    <div className="a-staff-card-item">
      <MenuAvatar item={item} size="card" />
      <div className="a-staff-card-body">
        <div className="a-staff-card-top">
          <div>
            <div className="a-staff-card-name">{item.name}</div>
            <div className="a-staff-card-id">#{String(item.id).padStart(3, "0")}</div>
          </div>
          <MenuTypeBadge menuType={item.menuType} />
        </div>
        <div className="a-staff-card-meta">
          <span className="a-meta-chip"><i className="fa-solid fa-indian-rupee-sign" />{formatPrice(item.price)}/plate</span>
          <span className="a-meta-chip"><i className="fa-solid fa-scale-balanced" />{item.quantityType || "—"}</span>
          <span className="a-meta-chip"><i className="fa-solid fa-layer-group" />{item.menuSection}</span>
        </div>
        <div className="a-staff-card-footer">
          <SectionPill menuSection={item.menuSection} />
          <div className="a-staff-card-actions">
            <button className="a-btn-action a-btn-edit" onClick={() => onEdit(item)}>
              <i className="fa-solid fa-pen" />
            </button>
            <button className="a-btn-action a-btn-delete" onClick={() => onDelete(item.id)}>
              <i className="fa-solid fa-trash" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── EDIT MODAL ─── */
function EditModal({ item, onClose, onSave, loading }) {
  const [form, setForm] = useState({
    name:         item.name,
    price:        item.price,
    quantityType: item.quantityType,
    menuSection:  item.menuSection,
    menuType:     item.menuType,
    description:  item.description,
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    onSave({ ...item, ...form, price: Number(form.price) });
  };

  return (
    <div className="a-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="a-modal">
        <div className="a-modal-header">
          <h3><i className="fa-solid fa-pen" /> Edit Menu Item</h3>
          <button className="a-modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="a-modal-body">
          <InputGroup label="Menu Name" required icon="fa-solid fa-utensils">
            <input className="a-input" value={form.name} onChange={set("name")} placeholder="Menu Name" />
          </InputGroup>

          <InputGroup label="Price (INR)" required icon="fa-solid fa-indian-rupee-sign">
            <input className="a-input" type="number" value={form.price} onChange={set("price")} />
          </InputGroup>

          <InputGroup label="Quantity Type" icon="fa-solid fa-scale-balanced">
            <input className="a-input" list="edit-a-qty" value={form.quantityType}
              onChange={set("quantityType")} placeholder="Select QTY" />
            <datalist id="edit-a-qty">
              <option value="FULL" /><option value="Half" />
            </datalist>
          </InputGroup>

          <InputGroup label="Menu Section" required icon="fa-solid fa-layer-group">
            <input className="a-input" list="edit-a-section" value={form.menuSection}
              onChange={set("menuSection")} placeholder="Select Section" />
            <datalist id="edit-a-section">
              <option value="Starter" /><option value="Desert" />
              <option value="Dish" /><option value="Main Course" /><option value="Special Dish" />
            </datalist>
          </InputGroup>

          <InputGroup label="Menu Type" icon="fa-solid fa-tag">
            <input className="a-input" list="edit-a-type" value={form.menuType}
              onChange={set("menuType")} placeholder="Select Menu Type" />
            <datalist id="edit-a-type">
              <option value="VEG" /><option value="NON_VEG" />
            </datalist>
          </InputGroup>

          <InputGroup label="Description" icon="fa-solid fa-align-left" full>
            <input className="a-input" value={form.description}
              onChange={set("description")} placeholder="Enter menu info" />
          </InputGroup>
        </div>

        <div className="a-modal-footer">
          <button className="a-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="a-btn-primary" onClick={handleSave} disabled={loading}>
            <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-floppy-disk"}`} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function AddMenu() {
  const [menuList,      setMenuList]      = useState([]);
  const [search,        setSearch]        = useState("");
  const [editTarget,    setEditTarget]    = useState(null);
  const [toasts,        setToasts]        = useState([]);
  const [pageLoading,   setPageLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = useCallback((msg, error = false) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, error }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  /* ── READ ── */
  useEffect(() => {
    axios.get(`${API}/view_menu`)
      .then((res) => {
        const list = res.data?.data ?? [];
        setMenuList(list.map(mapFromApi));
      })
      .catch((err) => {
        if (err.response?.status !== 404)
          showToast("Could not load menu. Is the server running?", true);
      })
      .finally(() => setPageLoading(false));
  }, [showToast]);

  /* ── CREATE ── */
  const handleAdd = async (newItem, errMsg) => {
    if (!newItem) { showToast(errMsg, true); return; }
    setActionLoading(true);
    try {
      const res  = await axios.post(`${API}/add_menu`, mapToApi(newItem));
      const saved = mapFromApi(res.data.data[0]);
      setMenuList((prev) => [...prev, saved]);
      showToast(`${saved.name} added successfully!`);
    } catch (err) {
      showToast(err.response?.data?.message ?? "Failed to add menu item.", true);
    } finally {
      setActionLoading(false);
    }
  };

  /* ── UPDATE ── */
  const handleSaveEdit = async (updated) => {
    setActionLoading(true);
    try {
      /* Send only clean fields – no stale base64 blob for edit-modal saves */
      const payload = {
        menuName:    updated.name,
        price:       Number(updated.price),
        qtyType:     updated.quantityType,
        menuSection: updated.menuSection,
        menuType:    updated.menuType,
        description: updated.description,
      };

      const res   = await axios.put(`${API}/update_menu/${updated.id}`, payload);
      const saved  = mapFromApi(res.data.data[0]);

      setMenuList((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
      setEditTarget(null);
      showToast(`${saved.name} updated successfully!`);
    } catch (err) {
      showToast(err.response?.data?.message ?? "Failed to update menu item.", true);
    } finally {
      setActionLoading(false);
    }
  };

  /* ── DELETE ── */
  const handleDelete = async (id) => {
    if (!window.confirm("Remove this menu item?")) return;
    const item = menuList.find((x) => x.id === id);
    setActionLoading(true);
    try {
      await axios.delete(`${API}/delete_menu/${id}`);
      setMenuList((prev) => prev.filter((x) => x.id !== id));
      showToast(`${item?.name} removed from menu.`);
    } catch (err) {
      showToast(err.response?.data?.message ?? "Failed to delete menu item.", true);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = menuList.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.menuSection.toLowerCase().includes(q) ||
      m.menuType.toLowerCase().includes(q) ||
      (m.description || "").toLowerCase().includes(q)
    );
  });

  /* ── PAGE LOADING ── */
  if (pageLoading) {
    return (
      <div className="staff-page">
        <SideNav />
        <main className="mains-contents">
          <TopNav />
          <div className="a-inner-content"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <div style={{ textAlign: "center", color: "var(--slate)" }}>
              <i className="fa-solid fa-spinner fa-spin"
                style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "var(--azure)" }} />
              <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>Loading menu data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="staff-page">
      <SideNav />
      <main className="mains-contents">
        <TopNav />
        <div className="a-inner-content">

          <div className="a-page-title-row">
            <div><h2>Menu <em>Inventory</em></h2></div>
          </div>

          <AddMenuForm onAdd={handleAdd} loading={actionLoading} />

          <div className="a-card a-table-card">
            <div className="a-table-card-header">
              <div className="a-table-card-header-left">
                <div className="a-header-icon sm"><i className="fa-solid fa-table-list" /></div>
                <div>
                  <h3>
                    Menu Inventory &nbsp;
                    <span className="a-count-badge">{filtered.length}</span>
                  </h3>
                </div>
              </div>
              <div className="a-table-search">
                <i className="fa-solid fa-magnifying-glass" />
                <input type="text" className="a-search-input" placeholder="Search menu..."
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            {/* DESKTOP TABLE */}
            <div className="a-table-wrapper">
              <table className="a-staff-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Image</th><th>Menu Name</th><th>Description</th>
                    <th>Price</th><th>Qty Type</th><th>Section</th><th>Type</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <TableRow key={item.id} item={item} onEdit={setEditTarget} onDelete={handleDelete} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="a-staff-cards">
              {filtered.map((item) => (
                <MobileCard key={item.id} item={item} onEdit={setEditTarget} onDelete={handleDelete} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="a-empty-state">
                <div className="a-empty-icon"><i className="fa-solid fa-bowl-food" /></div>
                <h4>No Menu Items Found</h4>
                <p>{search ? "Try a different search term." : "Add your first menu item using the form above."}</p>
              </div>
            )}
          </div>

        </div>
      </main>

      {editTarget && (
        <EditModal
          item={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
          loading={actionLoading}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}