import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthHero from "../components/AuthHero.jsx";
import api from "../api/client.js";

// small inline eye icons so we don't need an icon library
const EyeIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.7 5.1A9.9 9.9 0 0 1 12 5c6.5 0 10 7 10 7a13.4 13.4 0 0 1-2.2 2.96M6.5 6.6A13.4 13.4 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 4.2-.95" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="m2 2 20 20" />
  </svg>
);

// keeps the eye button pinned to the right edge of the input
const toggleStyle = {
  position: "absolute",
  top: 0,
  right: 0,
  height: "100%",
  width: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  padding: 0,
  color: "#cbd5e1",
  cursor: "pointer",
};

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    targetCompany: "Any",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  // full company objects (name + color + domain) so the hero can theme itself
  const [companies, setCompanies] = useState([]);

  // pull the managed company list for the target dropdown
  useEffect(() => {
    api
      .get("/companies")
      .then((res) => setCompanies(res.data))
      .catch(() => setCompanies([]));
  }, []);

  // the company the user is currently targeting (null when "Any")
  const activeCompany =
    form.targetCompany === "Any"
      ? null
      : companies.find((c) => c.name === form.targetCompany) || null;

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      {/* selecting a target company below washes it into this hero */}
      <AuthHero activeCompany={activeCompany} />

      <div className="auth-panel">
        <div className="auth-form-wrap">
          <p className="form-eyebrow">Start your journey</p>
          <h2 className="form-title">Create your account</h2>
          <p className="form-sub">
            Pick the company you're aiming for and start tracking your prep.
          </p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Rishu Kumar"
                value={form.name}
                onChange={update}
                autoComplete="name"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update}
                autoComplete="email"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={update}
                  autoComplete="new-password"
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  title={showPw ? "Hide password" : "Show password"}
                  style={toggleStyle}
                >
                  {showPw ? EyeOffIcon : EyeIcon}
                </button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="targetCompany">Target company</label>
              <select
                id="targetCompany"
                name="targetCompany"
                value={form.targetCompany}
                onChange={update}
              >
                <option value="Any">Any</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="form-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}