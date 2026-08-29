import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import RoadmapCard from "../components/RoadmapCard.jsx";
import CompanyMarquee from "../components/CompanyMarquee.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import api from "../api/client.js";

const ACCENTS = ["#38bdf8", "#60a5fa", "#3b82f6", "#0ea5e9", "#2563eb", "#1d4ed8"];

export default function Dashboard() {
  const { user } = useAuth();
  const confirm = useConfirm();
  // Everyone owns their own tracks, so everyone can create new ones.
  const canEdit = true;

  const [roadmaps, setRoadmaps] = useState([]);
  const [progress, setProgress] = useState({});
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // admin: new track form
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    accent: ACCENTS[0],
  });

  function load() {
    Promise.all([
      api.get("/roadmaps"),
      api.get("/progress"),
      api.get("/companies"),
    ])
      .then(([rmRes, prRes, coRes]) => {
        setRoadmaps(rmRes.data);
        const map = {};
        prRes.data.forEach((p) => (map[p.roadmapId] = p));
        setProgress(map);
        setCompanies(coRes.data);
      })
      .catch(() => setError("Could not load your dashboard."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const totals = Object.values(progress).reduce(
    (acc, p) => {
      acc.done += p.completed;
      acc.total += p.total;
      return acc;
    },
    { done: 0, total: 0 }
  );
  const overall = totals.total
    ? Math.round((totals.done / totals.total) * 100)
    : 0;

  // the company this user is targeting (so we can show its office behind the whole page)
  const targetCompany =
    user?.targetCompany && user.targetCompany !== "Any"
      ? companies.find((c) => c.name === user.targetCompany) || null
      : null;

  async function createTrack() {
    if (!form.title.trim()) return;
    try {
      await api.post("/roadmaps", form);
      setForm({ title: "", subtitle: "", description: "", accent: ACCENTS[0] });
      setShowNew(false);
      setLoading(true);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create track.");
    }
  }

  async function deleteTrack(roadmap) {
    const ok = await confirm({
      title: "Delete this track?",
      message: "The whole track and all its skills will be permanently deleted.",
      name: roadmap.title,
      confirmText: "Delete track",
    });
    if (!ok) return;
    try {
      await api.delete(`/roadmaps/${roadmap.id}`);
      setRoadmaps((prev) => prev.filter((r) => r.id !== roadmap.id));
      setProgress((prev) => {
        const next = { ...prev };
        delete next[roadmap.id];
        return next;
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete track.");
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
      <style>{`@keyframes dashBgFade{from{opacity:0}to{opacity:1}}`}</style>

      {/* full-screen office background for the targeted company */}
      {targetCompany?.officeUrl && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            overflow: "hidden",
            pointerEvents: "none",
            animation: "dashBgFade 600ms ease",
          }}
        >
          {/* blurred copy fills the edges so there are no empty bars */}
          <img
            src={targetCompany.officeUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(30px)",
              transform: "scale(1.12)",
            }}
          />
          {/* the whole image, fully visible (nothing cropped) */}
          <img
            src={targetCompany.officeUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
          {/* dark scrim so the cards and text stay readable across the whole page */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(2,6,23,0.82) 0%, rgba(2,6,23,0.60) 32%, rgba(2,6,23,0.64) 68%, rgba(2,6,23,0.84) 100%)",
            }}
          />
          {/* subtle brand-color wash */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.45,
              mixBlendMode: "screen",
              background: `radial-gradient(45% 55% at 82% 20%, ${
                targetCompany.color || "#38bdf8"
              }44 0%, transparent 70%)`,
            }}
          />
        </div>
      )}

      {/* all page content sits above the background */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />

        <main className="container">
          <section className="page-hero card">
            <div>
              <p className="hello">Hey {user?.name?.split(" ")[0]} 👋</p>
              <h1>Your learning checklist</h1>
              <p className="page-hero-sub">
                {totals.done} of {totals.total} skills checked off across{" "}
                {roadmaps.length} tracks. Keep the momentum.
              </p>
            </div>
            <div className="overall-badge">
              <span className="overall-num">{overall}%</span>
              <span className="overall-label">Overall</span>
            </div>
          </section>

          {companies.length > 0 && (
            <div className="dash-marquee card">
              <span className="dash-marquee-label">Targeting</span>
              <CompanyMarquee companies={companies} direction="left" speed={38} />
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}

          {canEdit && (
            <div className="admin-toolbar">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowNew((v) => !v)}
              >
                {showNew ? "Cancel" : "+ New track"}
              </button>
            </div>
          )}

          {canEdit && showNew && (
            <div className="new-track card">
              <div className="new-track-grid">
                <input
                  placeholder="Track title (e.g. DevOps)"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <input
                  placeholder="Subtitle"
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm({ ...form, subtitle: e.target.value })
                  }
                />
              </div>
              <input
                placeholder="Short description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <div className="accent-row">
                <span>Accent:</span>
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    className={`swatch ${form.accent === c ? "active" : ""}`}
                    style={{ background: c }}
                    onClick={() => setForm({ ...form, accent: c })}
                  />
                ))}
                <button className="btn btn-primary btn-sm" onClick={createTrack}>
                  Create
                </button>
              </div>
            </div>
          )}

          <div className="roadmap-grid">
            {roadmaps.map((rm) => (
              <RoadmapCard
                key={rm.id}
                roadmap={rm}
                progress={progress[rm.id]}
                onDelete={deleteTrack}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}