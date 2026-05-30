import { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import "./Staff.css";
import TopNav from '../../components/TopNav/TopNav.jsx';
import SideNav from '../../components/SideNav/SideNav.jsx';

/* ─────────────────────────────────────
   API BASE URL
───────────────────────────────────── */
const API = "http://localhost:8080/api";

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
const getRoleCss = (d = "") => {
  const r = d.toLowerCase();
  if (r.includes("chef"))    return "role-chef";
  if (r.includes("manager")) return "role-manager";
  if (r.includes("waiter"))  return "role-waiter";
  if (r.includes("clean"))   return "role-cleaner";
  if (r.includes("cashier")) return "role-cashier";
  return "role-default";
};

const getStatusCss = (s) => {
  if (s === "Active")   return "status-active";
  if (s === "Resigned") return "status-resigned";
  return "status-onleave";
};

const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

const formatSalary = (n) => "₹" + Number(n).toLocaleString("en-IN");

const normDate = (d) => {
  if (!d) return "";
  if (Array.isArray(d))
    return `${d[0]}-${String(d[1]).padStart(2,"0")}-${String(d[2]).padStart(2,"0")}`;
  if (typeof d === 'string' && d.includes('T')) return d.split('T')[0];
  return d.toString();
};

const formatDate = (d) => {
  const str = normDate(d);
  if (!str) return "—";
  const [y, m, day] = str.split("-");
  return `${day}/${m}/${y}`;
};

/* ─────────────────────────────────────
   FIELD MAPPERS - FIXED FOR BYTEA
───────────────────────────────────── */
const mapToApi = (staff) => {
  let imageData = null;
  let imageType = null;

  if (staff.photo && staff.photo.startsWith("data:")) {
  const parts = staff.photo.split(",");

  if (parts.length === 2) {
    imageType = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    imageData = parts[1];
  }
}


  return {
    name: staff.name,
    location: staff.location,
    salary: Number(staff.salary),
    joinDate: staff.joinDate,
    designation: staff.designation,
    status: staff.status,

    ...(imageData && { imageData }),
    ...(imageType && { imageType })
  };
};


const mapFromApi = (s) => ({
  id: s.id,
  name: s.name ?? "",
  location: s.location ?? "",
  salary: s.salary ?? 0,
  joinDate: normDate(s.joinDate),
  designation: s.designation ?? "",
  status: s.status ?? "Active",
  photo: s.imageData ? `http://localhost:8080/api/staff_image/${s.id}` : "",
});

/* ══════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════ */

function ToastContainer({ toasts }) {
  return (
    <div className="s-toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`s-toast${t.error ? " error" : ""}`}>
          <i className={`fa-solid ${t.error ? "fa-circle-exclamation" : "fa-circle-check"}`} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`s-status-badge ${getStatusCss(status)}`}>
      <span className="s-badge-dot" />{status}
    </span>
  );
}

function RolePill({ designation }) {
  return <span className={`s-role-pill ${getRoleCss(designation)}`}>{designation}</span>;
}

function Avatar({ staff, size = "table" }) {
  const cls = size === "card" ? "s-staff-card-avatar" : "s-staff-avatar";
  return (
    <div className={cls}>
      {staff.photo ? <img src={staff.photo} alt={staff.name} /> : getInitials(staff.name)}
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
    <div className="s-upload-zone">
      <div
        className={`s-upload-dropzone${dragging ? " drag-over" : ""}`}
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
            <img src={photoData} alt="Preview" className="s-preview-img" />
            <div className="s-overlay-edit">
              <i className="fa-solid fa-camera" /><span>Change Photo</span>
            </div>
          </>
        ) : (
          <>
            <div className="s-upload-icon-wrap"><i className="fa-solid fa-cloud-arrow-up" /></div>
            <p className="s-upload-text">Click or drag<br />to upload</p>
            <span className="s-upload-hint">JPG, PNG up to 5 MB</span>
          </>
        )}
      </div>
      <span className="s-upload-formats">Profile Photo</span>
    </div>
  );
}

function InputGroup({ label, required, icon, children, full }) {
  return (
    <div className={`s-input-group${full ? " full" : ""}`}>
      <label className="s-input-label">
        {label}{required && <span className="s-required">*</span>}
      </label>
      <div className="s-input-wrap">
        {icon && <i className={`${icon} s-input-icon`} />}
        {children}
      </div>
    </div>
  );
}

const ROLES = ["Manager","Head Chef","Junior Chef","Waiter","Supervisor","Cleaner","Cashier","Support"];

/* ─── ADD STAFF FORM ─── */
function AddStaffForm({ onAdd, loading }) {
  const EMPTY = { fullName:"", location:"", salary:"", joinDate:"", designation:"", status:"Active" };
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    const { fullName, location, salary, joinDate, designation } = form;
    if (!fullName.trim() || !location.trim() || !salary || !joinDate || !designation) {
      onAdd(null, "Please fill all required fields."); return;
    }
    onAdd({ name:fullName.trim(), location:location.trim(), salary:Number(salary),
            joinDate, designation, status:form.status, photo });
    setForm(EMPTY); setPhoto("");
  };

  return (
    <div className="s-card s-add-staff-card">
      <div className="s-form-card-header">
        <div className="s-header-icon"><i className="fa-solid fa-user-plus" /></div>
        <div><h3>Add New Staff Member</h3></div>
      </div>
      <div className="s-form-body">
        <UploadZone photoData={photo} onChange={setPhoto} />
        <div className="s-form-grid">
          <InputGroup label="Full Name" required icon="fa-solid fa-user">
            <input className="s-input" type="text" placeholder="e.g. John Wick"
              value={form.fullName} onChange={set("fullName")} />
          </InputGroup>
          <InputGroup label="Current Location" required icon="fa-solid fa-location-dot">
            <input className="s-input" type="text" placeholder="e.g. Mumbai, India"
              value={form.location} onChange={set("location")} />
          </InputGroup>
          <InputGroup label="Monthly Salary (INR)" required icon="fa-solid fa-indian-rupee-sign">
            <input className="s-input" type="number" placeholder="e.g. 45000"
              value={form.salary} onChange={set("salary")} />
          </InputGroup>
          <InputGroup label="Joined Date" required icon="fa-solid fa-calendar">
            <input className="s-input" type="date" value={form.joinDate} onChange={set("joinDate")} />
          </InputGroup>
          <InputGroup label="Designation" required icon="fa-solid fa-briefcase">
            <select className="s-input s-select" value={form.designation} onChange={set("designation")}>
              <option value="" disabled>Select role</option>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </InputGroup>
          <InputGroup label="Status" icon="fa-solid fa-circle-dot">
            <select className="s-input s-select" value={form.status} onChange={set("status")}>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Resigned">Resigned</option>
            </select>
          </InputGroup>
          <button className="s-btn-submit" onClick={handleSubmit} disabled={loading}>
            <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-user-plus"}`} />
            {loading ? "Saving..." : "Add Staff Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── DESKTOP TABLE ROW ─── */
function TableRow({ staff, onEdit, onDelete }) {
  return (
    <tr>
      <td><span className="s-staff-id">#{String(staff.id).padStart(3,"0")}</span></td>
      <td>
        <div className="s-staff-name-cell">
          <Avatar staff={staff} />
          <div>
            <div className="s-staff-name">{staff.name}</div>
            <div className="s-staff-role-sub">{staff.designation}</div>
          </div>
        </div>
      </td>
      <td><span className="s-location-cell"><i className="fa-solid fa-location-dot" />{staff.location}</span></td>
      <td><span className="s-salary-cell">{formatSalary(staff.salary)} <span>/mo</span></span></td>
      <td className="s-date-cell">{formatDate(staff.joinDate)}</td>
      <td><RolePill designation={staff.designation} /></td>
      <td><StatusBadge status={staff.status} /></td>
      <td>
        <div className="s-actions-cell">
          <button className="s-btn-action s-btn-edit" title="Edit" onClick={() => onEdit(staff)}>
            <i className="fa-solid fa-pen" />
          </button>
          <button className="s-btn-action s-btn-delete" title="Delete" onClick={() => onDelete(staff.id)}>
            <i className="fa-solid fa-trash" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ─── MOBILE CARD ─── */
function MobileCard({ staff, onEdit, onDelete }) {
  return (
    <div className="s-staff-card-item">
      <Avatar staff={staff} size="card" />
      <div className="s-staff-card-body">
        <div className="s-staff-card-top">
          <div>
            <div className="s-staff-card-name">{staff.name}</div>
            <div className="s-staff-card-id">#{String(staff.id).padStart(3,"0")}</div>
          </div>
          <StatusBadge status={staff.status} />
        </div>
        <div className="s-staff-card-meta">
          <span className="s-meta-chip"><i className="fa-solid fa-location-dot" />{staff.location}</span>
          <span className="s-meta-chip"><i className="fa-solid fa-calendar" />{formatDate(staff.joinDate)}</span>
          <span className="s-meta-chip"><i className="fa-solid fa-indian-rupee-sign" />{formatSalary(staff.salary)}/mo</span>
        </div>
        <div className="s-staff-card-footer">
          <RolePill designation={staff.designation} />
          <div className="s-staff-card-actions">
            <button className="s-btn-action s-btn-edit" onClick={() => onEdit(staff)}>
              <i className="fa-solid fa-pen" />
            </button>
            <button className="s-btn-action s-btn-delete" onClick={() => onDelete(staff.id)}>
              <i className="fa-solid fa-trash" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({ staff, onClose, onSave, loading }) {
  const [form, setForm] = useState({
    name: staff.name,
    location: staff.location,
    salary: staff.salary,
    joinDate: staff.joinDate,
    designation: staff.designation,
    status: staff.status,
  });

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    onSave({ ...staff, ...form, salary: Number(form.salary) });
  };

  return (
    <div className="s-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="s-modal">

        <div className="s-modal-header">
          <h3><i className="fa-solid fa-pen" /> Edit Staff Member</h3>
          <button className="s-modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="s-modal-body">

          <InputGroup label="Full Name" icon="fa-solid fa-user">
            <input className="s-input" value={form.name} onChange={set("name")} />
          </InputGroup>

          <InputGroup label="Location" icon="fa-solid fa-location-dot">
            <input className="s-input" value={form.location} onChange={set("location")} />
          </InputGroup>

          <InputGroup label="Salary" icon="fa-solid fa-indian-rupee-sign">
            <input className="s-input" type="number" value={form.salary} onChange={set("salary")} />
          </InputGroup>

          <InputGroup label="Join Date" icon="fa-solid fa-calendar">
            <input className="s-input" type="date" value={form.joinDate} onChange={set("joinDate")} />
          </InputGroup>

          <InputGroup label="Designation" icon="fa-solid fa-briefcase">
            <select className="s-input" value={form.designation} onChange={set("designation")}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </InputGroup>

          <InputGroup label="Status" icon="fa-solid fa-circle-dot">
            <select className="s-input" value={form.status} onChange={set("status")}>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Resigned">Resigned</option>
            </select>
          </InputGroup>

        </div>

        <div className="s-modal-footer">
          <button className="s-btn-secondary" onClick={onClose}>Cancel</button>

          <button className="s-btn-primary" onClick={handleSave} disabled={loading}>
            <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-floppy-disk"}`} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN STAFF COMPONENT
══════════════════════════════════════ */
export default function Staff() {
  const [staffList,     setStaffList]     = useState([]);
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

  /* READ */
  useEffect(() => {
    axios.get(`${API}/view_staff`)
      .then((res) => {
        const list = res.data?.data ?? [];
        setStaffList(list.map(mapFromApi));
      })
      .catch((err) => {
        if (err.response?.status !== 404)
          showToast("Could not load staff. Is the server running?", true);
      })
      .finally(() => setPageLoading(false));
  }, [showToast]);

  /* CREATE */
  const handleAdd = async (newStaff, errMsg) => {
    if (!newStaff) { showToast(errMsg, true); return; }
    setActionLoading(true);
    try {
      const res = await axios.post(`${API}/add_staff`, mapToApi(newStaff));
      const saved = mapFromApi(res.data.data[0]);
      setStaffList((prev) => [...prev, saved]);
      showToast(`${saved.name} added successfully!`);
    } catch (err) {
      showToast(err.response?.data?.message ?? "Failed to add staff.", true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (updated) => {
  setActionLoading(true);
  try {
    const cleanData = {
      id: updated.id,
      name: updated.name,
      location: updated.location,
      salary: Number(updated.salary),
      joinDate: updated.joinDate,
      designation: updated.designation,
      status: updated.status
    };

    const res = await axios.put(
      `${API}/update_staff/${updated.id}`,
      cleanData  
    );

    const saved = mapFromApi(res.data.data[0]);

    setStaffList((prev) =>
      prev.map((x) => (x.id === saved.id ? saved : x))
    );

    setEditTarget(null);
    showToast(`${saved.name}'s details updated!`);

  } catch (err) {
    showToast(err.response?.data?.message ?? "Failed to update staff.", true);
  } finally {
    setActionLoading(false);
  }
};


  /* DELETE */
  const handleDelete = async (id) => {
    if (!window.confirm("Remove this staff member?")) return;
    const member = staffList.find((x) => x.id === id);
    setActionLoading(true);
    try {
      await axios.delete(`${API}/delete_staff/${id}`);
      setStaffList((prev) => prev.filter((x) => x.id !== id));
      showToast(`${member?.name} removed from directory.`);
    } catch (err) {
      showToast(err.response?.data?.message ?? "Failed to delete staff.", true);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = staffList.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) ||
      s.designation.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  });

  if (pageLoading) {
    return (
      <div className="staff-page">
        <SideNav />
        <main className="mains-contents">
          <TopNav />
          <div className="s-inner-content"
            style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
            <div style={{ textAlign:"center", color:"var(--slate)" }}>
              <i className="fa-solid fa-spinner fa-spin"
                style={{ fontSize:"2.5rem", marginBottom:"1rem", color:"var(--azure)" }} />
              <p style={{ fontSize:"0.9rem", fontWeight:600 }}>Loading staff data...</p>
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
        <div className="s-inner-content">

          <div className="s-page-title-row">
            <div><h2>Staff <em>Directory</em></h2></div>
          </div>

          <AddStaffForm onAdd={handleAdd} loading={actionLoading} />

          <div className="s-card s-table-card">
            <div className="s-table-card-header">
              <div className="s-table-card-header-left">
                <div className="s-header-icon sm"><i className="fa-solid fa-table-list" /></div>
                <div>
                  <h3>
                    Staff Directory &nbsp;
                    <span className="s-count-badge">{filtered.length}</span>
                  </h3>
                </div>
              </div>
              <div className="s-table-search">
                <i className="fa-solid fa-magnifying-glass" />
                <input type="text" className="s-search-input" placeholder="Search staff..."
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            {/* DESKTOP TABLE */}
            <div className="s-table-wrapper">
              <table className="s-staff-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Staff Member</th><th>Location</th>
                    <th>Salary</th><th>Joined</th><th>Role</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <TableRow key={s.id} staff={s} onEdit={setEditTarget} onDelete={handleDelete} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="s-staff-cards">
              {filtered.map((s) => (
                <MobileCard key={s.id} staff={s} onEdit={setEditTarget} onDelete={handleDelete} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="s-empty-state">
                <div className="s-empty-icon"><i className="fa-solid fa-user-slash" /></div>
                <h4>No staff found</h4>
                <p>{search ? "Try a different search term." : "Add your first team member using the form above."}</p>
              </div>
            )}
          </div>

        </div>
      </main>

      {editTarget && (
        <EditModal
          staff={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
          loading={actionLoading}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}