import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import api from "../api/client.js";

export default function AdminDashboard() {
  const confirm = useConfirm();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([api.get("/api/admin/stats"), api.get("/api//admin/users")])
      .then(([sRes, uRes]) => {
        setStats(sRes.data);
        setUsers(uRes.data);
      })
      .catch(() => setError("Could not load admin data."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function removeUser(u) {
    const ok = await confirm({
      title: "Remove this user?",
      message: "Their account, progress, and tracks will be deleted.",
      name: u.name,
      confirmText: "Remove user",
    });
    if (!ok) return;
    try {
      await api.delete(`/api/admin/users/${u.id}`);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove user.");
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
        <h1 className="admin-title">Admin portal</h1>
        <p className="admin-sub">Overview of everyone using the checklist.</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="stat-grid">
          <div className="stat-card card">
            <span className="stat-num">{stats?.totalUsers ?? 0}</span>
            <span className="stat-label">Total users</span>
          </div>
          <div className="stat-card card">
            <span className="stat-num">{stats?.learners ?? 0}</span>
            <span className="stat-label">Learners</span>
          </div>
          <div className="stat-card card">
            <span className="stat-num">{stats?.admins ?? 0}</span>
            <span className="stat-label">Admins</span>
          </div>
          <div className="stat-card card">
            <span className="stat-num">
              {stats?.targets?.[0]?.company ?? "—"}
            </span>
            <span className="stat-label">Top target</span>
          </div>
        </div>

        <section className="card table-card">
          <header className="table-head">
            <h2>Users</h2>
            <button className="btn btn-ghost btn-sm" onClick={load}>
              Refresh
            </button>
          </header>
          <div className="table-scroll">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Target</th>
                  <th>Role</th>
                  <th>Progress</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td className="dim">{u.email}</td>
                    <td>{u.targetCompany}</td>
                    <td>
                      <span className={`role-badge ${u.role}`}>{u.role}</span>
                    </td>
                    <td>
                      <div className="mini-bar">
                        <span style={{ width: `${u.percent}%` }} />
                      </div>
                      <small className="dim">{u.percent}%</small>
                    </td>
                    <td>
                      {u.role !== "admin" && (
                        <button
                          className="btn-remove"
                          onClick={() => removeUser(u)}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
