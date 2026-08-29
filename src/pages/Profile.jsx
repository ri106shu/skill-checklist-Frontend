import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    targetCompany: user?.targetCompany || "Any",
  });
  const [companies, setCompanies] = useState(["Any"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // pull the managed company list for the dropdown
  useEffect(() => {
    api
      .get("/companies")
      .then((res) => {
        const names = res.data.map((c) => c.name);
        // keep the user's current target even if it isn't in the list
        const set = ["Any", ...names];
        if (user?.targetCompany && !set.includes(user.targetCompany)) {
          set.push(user.targetCompany);
        }
        setCompanies(set);
      })
      .catch(() => setCompanies(["Any"]));
  }, [user]);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  }

  async function handleSave(e) {
    e?.preventDefault?.();
    setError("");
    if (!form.name.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(form);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-page">
      <Navbar />

      <main className="container">
        <h1 className="admin-title">Edit profile</h1>
        <p className="admin-sub">Update your name and the company you're aiming for.</p>

        <div className="profile-card card">
          <div className="profile-head">
            <span className="profile-avatar">
              {user?.name?.[0]?.toUpperCase()}
            </span>
            <div>
              <strong>{user?.email}</strong>
              <small className="dim">Role: {user?.role}</small>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}
          {saved && <div className="success-banner">Profile updated ✓</div>}

          <form onSubmit={handleSave}>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={update}
                placeholder="Your name"
              />
            </div>

            <div className="field">
              <label htmlFor="targetCompany">Target company</label>
              <select
                id="targetCompany"
                name="targetCompany"
                value={form.targetCompany}
                onChange={update}
              >
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
