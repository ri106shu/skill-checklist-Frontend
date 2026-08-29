import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import CompanyLogo from "./CompanyLogo.jsx";
import api from "../api/client.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);

  // load companies so we can show the target company's real logo
  useEffect(() => {
    api
      .get("/companies")
      .then((res) => setCompanies(res.data))
      .catch(() => setCompanies([]));
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  // the full company object for the user's target (null for "Any" / not found)
  const target =
    user?.targetCompany && user.targetCompany !== "Any"
      ? companies.find((c) => c.name === user.targetCompany) || null
      : null;

  return (
    <header
      className="navbar"
      style={{ position: "sticky", top: 0, zIndex: 50 }}
    >
      <Link to="/dashboard" className="brand">
        <span className="brand-mark">✓</span>
        <span className="brand-text">
          Skill<span>Checklist</span>
        </span>
      </Link>

      {/* targeting indicator — centered in the navbar, with the company logo */}
      {user?.targetCompany && (
        <Link
          to="/profile"
          title="Change target company"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 14px",
            borderRadius: 999,
            background: "rgba(56, 189, 248, 0.08)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#94a3b8",
            }}
          >
            Targeting
          </span>
          {target && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <CompanyLogo company={target} size={20} />
            </span>
          )}
          <strong style={{ fontSize: 14, color: "#38bdf8" }}>
            {user.targetCompany}
          </strong>
        </Link>
      )}

      <nav className="nav-links">
        {user?.role === "admin" && (
          <>
            <Link to="/admin" className="nav-link">
              Admin
            </Link>
            <Link to="/admin/companies" className="nav-link">
              Companies
            </Link>
          </>
        )}
        <Link to="/profile" className="nav-user" title="Edit profile">
          <span className="nav-avatar">{user?.name?.[0]?.toUpperCase()}</span>
          <div className="nav-user-meta">
            <strong>{user?.name}</strong>
          </div>
        </Link>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Log out
        </button>
      </nav>
    </header>
  );
}