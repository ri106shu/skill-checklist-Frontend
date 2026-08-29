import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import CompanyLogo from "../components/CompanyLogo.jsx";
import CompanyMarquee from "../components/CompanyMarquee.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import api from "../api/client.js";

const BLANK = {
  name: "",
  type: "product",
  color: "#38bdf8",
  domain: "",
  logoUrl: "",
  officeUrl: "",
};

export default function ManageCompanies() {
  const confirm = useConfirm();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(BLANK);
  // inline editor for setting an existing company's office image
  const [editing, setEditing] = useState(null); // { id, name, officeUrl }

  function load() {
    api
      .get("/companies")
      .then((res) => setCompanies(res.data))
      .catch(() => setError("Could not load companies."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function addCompany() {
    if (!form.name.trim()) return;
    const payload = { ...form };
    // if no domain given, guess one from the name (e.g. "Google" -> google.com)
    if (!payload.domain.trim() && !payload.logoUrl.trim()) {
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      payload.domain = `${slug}.com`;
    }
    try {
      await api.post("/companies", payload);
      setForm(BLANK);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add company.");
    }
  }

  // save an office image URL onto an existing company
  async function saveOffice() {
    if (!editing) return;
    try {
      const res = await api.patch(`/companies/${editing.id}`, {
        officeUrl: editing.officeUrl.trim(),
      });
      setCompanies((prev) =>
        prev.map((c) => (c.id === editing.id ? res.data : c))
      );
      setEditing(null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save office image.");
    }
  }

  async function removeCompany(company) {
    const ok = await confirm({
      title: "Remove this company?",
      message: "It will be removed from the logo strip.",
      name: company.name,
      confirmText: "Remove",
    });
    if (!ok) return;
    try {
      await api.delete(`/companies/${company.id}`);
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
    } catch {
      setError("Could not remove company.");
    }
  }

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="app-page">
      <Navbar />

      <main className="container">
        <h1 className="admin-title">Manage companies</h1>
        <p className="admin-sub">
          Real logos load automatically from each company's website domain. Add
          an office image and it appears in the background when a user targets
          that company.
        </p>

        {error && <div className="error-banner">{error}</div>}

        {companies.length > 0 && (
          <div className="dash-marquee card" style={{ marginBottom: 22 }}>
            <span className="dash-marquee-label">Preview</span>
            <CompanyMarquee companies={companies} direction="left" speed={34} />
          </div>
        )}

        {/* office image editor — opens when you click "Office" on a tile below */}
        {editing && (
          <div className="new-track card" style={{ marginBottom: 22 }}>
            <label
              style={{ fontWeight: 600, marginBottom: 6, display: "block" }}
            >
              Office image URL for “{editing.name}”
            </label>
            <input
              placeholder="https://…/office.jpg"
              value={editing.officeUrl}
              onChange={(e) =>
                setEditing({ ...editing, officeUrl: e.target.value })
              }
            />
            {editing.officeUrl.trim() && (
              <img
                src={editing.officeUrl}
                alt=""
                style={{
                  width: "100%",
                  maxHeight: 170,
                  objectFit: "cover",
                  borderRadius: 10,
                  marginTop: 10,
                }}
              />
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={saveOffice}>
                Save office image
              </button>
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* add form */}
        <div className="new-track card">
          <div className="company-form-grid">
            <input
              placeholder="Company name (e.g. Google)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="product">Product-based</option>
              <option value="service">Service-based</option>
            </select>
            <input
              type="color"
              className="color-input"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              title="Fallback color"
            />
          </div>
          <input
            placeholder="Website domain for the logo (e.g. google.com)"
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
          />
          <input
            placeholder="Or paste a direct logo image URL (optional)"
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
          />
          <input
            placeholder="Office image URL — shown in the background when targeted (optional)"
            value={form.officeUrl}
            onChange={(e) => setForm({ ...form, officeUrl: e.target.value })}
          />
          <button className="btn btn-primary" onClick={addCompany}>
            + Add company
          </button>
        </div>

        {/* list */}
        <div className="company-grid">
          {companies.map((c) => (
            <div className="company-tile card" key={c.id}>
              <CompanyLogo company={c} size={40} />
              <div className="company-tile-meta">
                <strong>{c.name}</strong>
                <small className={`type-tag ${c.type}`}>{c.type}</small>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: "auto" }}
                title={c.officeUrl ? "Change office image" : "Add office image"}
                onClick={() =>
                  setEditing({
                    id: c.id,
                    name: c.name,
                    officeUrl: c.officeUrl || "",
                  })
                }
              >
                {c.officeUrl ? "🏢 Edit" : "🏢 Office"}
              </button>
              <button
                className="icon-btn danger"
                title="Remove"
                onClick={() => removeCompany(c)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}