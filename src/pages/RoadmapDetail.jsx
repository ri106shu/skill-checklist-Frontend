import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import api from "../api/client.js";

export default function RoadmapDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirm = useConfirm();
  // Every user owns their own copy of each track, so everyone can edit it.
  const canEdit = true;

  const [roadmap, setRoadmap] = useState(null);
  const [completed, setCompleted] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(null);

  // add state
  const [newItem, setNewItem] = useState({});
  const [newItemId, setNewItemId] = useState({}); // optional LeetCode number
  const [newItemDiff, setNewItemDiff] = useState({}); // optional difficulty
  const [newSection, setNewSection] = useState("");

  // edit state
  const [editItem, setEditItem] = useState(null); // itemId being renamed
  const [editItemText, setEditItemText] = useState("");
  const [editSection, setEditSection] = useState(null); // sectionId being renamed
  const [editSectionText, setEditSectionText] = useState("");
  const [editTrack, setEditTrack] = useState(false);
  const [trackForm, setTrackForm] = useState({
    title: "",
    subtitle: "",
    description: "",
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/api/roadmaps/${id}`), api.get(`/progress/${id}`)])
      .then(([rmRes, prRes]) => {
        setRoadmap(rmRes.data);
        setCompleted(new Set(prRes.data.completedItems));
      })
      .catch(() => setError("Could not load this roadmap."))
      .finally(() => setLoading(false));
  }, [id]);

  const total = useMemo(
    () =>
      roadmap
        ? roadmap.sections.reduce((s, sec) => s + sec.items.length, 0)
        : 0,
    [roadmap]
  );
  const done = [...completed].filter((cid) =>
    roadmap?.sections.some((s) => s.items.some((i) => i.id === cid))
  ).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  // running serial number across the whole track (for the LeetCode problem list)
  const serialOf = useMemo(() => {
    const map = {};
    let n = 0;
    roadmap?.sections.forEach((s) =>
      s.items.forEach((it) => {
        n += 1;
        map[it.id] = n;
      })
    );
    return map;
  }, [roadmap]);

  // ---- progress ----
  async function toggle(itemId) {
    const next = new Set(completed);
    next.has(itemId) ? next.delete(itemId) : next.add(itemId);
    setCompleted(next);
    setSaving(itemId);
    try {
      const res = await api.patch(`/api/progress/${id}/toggle`, { itemId });
      setCompleted(new Set(res.data.completedItems));
    } catch {
      setCompleted(completed);
      setError("Could not save. Check your connection.");
    } finally {
      setSaving(null);
    }
  }

  async function resetAll() {
    const ok = await confirm({
      title: "Reset progress?",
      message: "This will uncheck every skill in this track.",
      name: roadmap.title,
      confirmText: "Reset",
    });
    if (!ok) return;
    try {
      await api.delete(`/api/progress/${id}`);
      setCompleted(new Set());
    } catch {
      setError("Could not reset progress.");
    }
  }

  // ---- track (title / subtitle / description) ----
  function startEditTrack() {
    setTrackForm({
      title: roadmap.title,
      subtitle: roadmap.subtitle || "",
      description: roadmap.description || "",
    });
    setEditTrack(true);
  }
  async function saveTrack() {
    if (!trackForm.title.trim()) return;
    try {
      const res = await api.patch(`/api/roadmaps/${id}`, trackForm);
      setRoadmap(res.data);
      setEditTrack(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save track.");
    }
  }
  async function deleteTrack() {
    const ok = await confirm({
      title: "Delete this track?",
      message: "The whole track and all its skills will be permanently deleted.",
      name: roadmap.title,
      confirmText: "Delete track",
    });
    if (!ok) return;
    try {
      await api.delete(`/api/roadmaps/${id}`);
      navigate("/dashboard");
    } catch {
      setError("Could not delete track.");
    }
  }

  // ---- sections ----
  async function addSectionFn() {
    const title = newSection.trim();
    if (!title) return;
    try {
      const res = await api.post(`/api/roadmaps/${id}/sections`, { title });
      setRoadmap(res.data);
      setNewSection("");
    } catch {
      setError("Could not add section.");
    }
  }
  function startEditSection(section) {
    setEditSection(section.id);
    setEditSectionText(section.title);
  }
  async function saveSection(sectionId) {
    if (!editSectionText.trim()) return;
    try {
      const res = await api.patch(`/api/roadmaps/${id}/sections/${sectionId}`, {
        title: editSectionText.trim(),
      });
      setRoadmap(res.data);
      setEditSection(null);
    } catch {
      setError("Could not rename section.");
    }
  }
  async function deleteSection(section) {
    const ok = await confirm({
      title: "Delete this section?",
      message: `The section and its ${section.items.length} skill(s) will be deleted.`,
      name: section.title,
      confirmText: "Delete section",
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/api/roadmaps/${id}/sections/${section.id}`);
      setRoadmap(res.data);
    } catch {
      setError("Could not delete section.");
    }
  }

  // ---- skills (items) ----
  const isLeetcode = /leetcode/i.test(roadmap?.title || "");

  async function addItemFn(sectionId) {
    const label = (newItem[sectionId] || "").trim();
    if (!label) return;
    const payload = { label };
    const lid = (newItemId[sectionId] || "").trim();
    if (lid) payload.leetId = lid;
    const diff = newItemDiff[sectionId] || "";
    if (diff) payload.difficulty = diff;
    try {
      const res = await api.post(
        `/api/roadmaps/${id}/sections/${sectionId}/items`,
        payload
      );
      setRoadmap(res.data);
      setNewItem({ ...newItem, [sectionId]: "" });
      setNewItemId({ ...newItemId, [sectionId]: "" });
      setNewItemDiff({ ...newItemDiff, [sectionId]: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Could not add skill.");
    }
  }
  function startEditItem(item) {
    setEditItem(item.id);
    setEditItemText(item.label);
  }
  async function saveItem(sectionId, itemId) {
    if (!editItemText.trim()) return;
    try {
      const res = await api.patch(
        `/api/roadmaps/${id}/sections/${sectionId}/items/${itemId}`,
        { label: editItemText.trim() }
      );
      setRoadmap(res.data);
      setEditItem(null);
    } catch {
      setError("Could not rename skill.");
    }
  }
  async function deleteItem(sectionId, item) {
    const ok = await confirm({
      title: "Delete this skill?",
      message: "This skill will be removed from the section.",
      name: item.label,
      confirmText: "Delete",
    });
    if (!ok) return;
    try {
      const res = await api.delete(
        `/api/roadmaps/${id}/sections/${sectionId}/items/${item.id}`
      );
      setRoadmap(res.data);
      const next = new Set(completed);
      next.delete(item.id);
      setCompleted(next);
    } catch {
      setError("Could not delete skill.");
    }
  }

  // click the difficulty badge to cycle Easy -> Medium -> Hard -> (none)
  async function cycleDifficulty(sectionId, item) {
    const order = ["", "Easy", "Medium", "Hard"];
    const nextDiff =
      order[(order.indexOf(item.difficulty || "") + 1) % order.length];
    try {
      const res = await api.patch(
        `/api/roadmaps/${id}/sections/${sectionId}/items/${item.id}`,
        { label: item.label, difficulty: nextDiff }
      );
      setRoadmap(res.data);
    } catch {
      setError("Could not update difficulty.");
    }
  }

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="app-page">
        <Navbar />
        <main className="container">
          <div className="error-banner">{error || "Roadmap not found."}</div>
          <Link to="/dashboard" className="btn btn-ghost">
            ← Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="app-page" style={{ "--accent": roadmap.accent }}>
      <Navbar />

      <main className="container">
        <Link to="/dashboard" className="back-link">
          ← All tracks
        </Link>

        <section className="detail-hero card">
          <div className="detail-hero-text">
            {editTrack ? (
              <div className="track-edit">
                <input
                  className="edit-input title"
                  value={trackForm.title}
                  onChange={(e) =>
                    setTrackForm({ ...trackForm, title: e.target.value })
                  }
                  placeholder="Track title"
                />
                <input
                  className="edit-input"
                  value={trackForm.subtitle}
                  onChange={(e) =>
                    setTrackForm({ ...trackForm, subtitle: e.target.value })
                  }
                  placeholder="Subtitle"
                />
                <textarea
                  className="edit-input"
                  rows={2}
                  value={trackForm.description}
                  onChange={(e) =>
                    setTrackForm({ ...trackForm, description: e.target.value })
                  }
                  placeholder="Description"
                />
                <div className="edit-actions">
                  <button className="btn btn-primary btn-sm" onClick={saveTrack}>
                    Save
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditTrack(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1>{roadmap.title}</h1>
                {roadmap.subtitle && (
                  <p className="detail-subtitle">{roadmap.subtitle}</p>
                )}
                <p>{roadmap.description}</p>
                <div className="detail-meta">
                  <span className="pill" style={{ borderColor: roadmap.accent }}>
                    {done} / {total} completed
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={resetAll}>
                    Reset progress
                  </button>
                  {canEdit && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={startEditTrack}
                    >
                      ✎ Edit details
                    </button>
                  )}
                  {canEdit && (
                    <button className="btn-remove" onClick={deleteTrack}>
                      Delete track
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="detail-progress">
            <div className="big-percent" style={{ color: roadmap.accent }}>
              {percent}%
            </div>
            <div className="bar big-bar">
              <span
                style={{ width: `${percent}%`, background: roadmap.accent }}
              />
            </div>
          </div>
        </section>

        {error && <div className="error-banner">{error}</div>}

        <div className="sections">
          {roadmap.sections.map((section) => {
            const secDone = section.items.filter((i) =>
              completed.has(i.id)
            ).length;
            return (
              <section key={section.id} className="section-block card">
                <header className="section-head">
                  {editSection === section.id ? (
                    <div className="edit-inline grow">
                      <input
                        className="edit-input"
                        autoFocus
                        value={editSectionText}
                        onChange={(e) => setEditSectionText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveSection(section.id);
                          if (e.key === "Escape") setEditSection(null);
                        }}
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => saveSection(section.id)}
                      >
                        Save
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => setEditSection(null)}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2>{section.title}</h2>
                      <div className="section-head-right">
                        <span className="section-count">
                          {secDone}/{section.items.length}
                        </span>
                        {canEdit && (
                          <button
                            className="icon-btn"
                            title="Rename section"
                            onClick={() => startEditSection(section)}
                          >
                            ✎
                          </button>
                        )}
                        {canEdit && (
                          <button
                            className="icon-btn danger"
                            title="Delete section"
                            onClick={() => deleteSection(section)}
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </header>

                <ul className="checklist">
                  {section.items.map((item) => {
                    const isDone = completed.has(item.id);
                    if (editItem === item.id) {
                      return (
                        <li key={item.id} className="check-item editing">
                          <div className="edit-inline grow">
                            <input
                              className="edit-input"
                              autoFocus
                              value={editItemText}
                              onChange={(e) => setEditItemText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  saveItem(section.id, item.id);
                                if (e.key === "Escape") setEditItem(null);
                              }}
                            />
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => saveItem(section.id, item.id)}
                            >
                              Save
                            </button>
                            <button
                              className="icon-btn"
                              onClick={() => setEditItem(null)}
                            >
                              ×
                            </button>
                          </div>
                        </li>
                      );
                    }
                    return (
                      <li
                        key={item.id}
                        className={`check-item ${isDone ? "done" : ""}`}
                      >
                        <div
                          className="check-hit"
                          onClick={() => toggle(item.id)}
                        >
                          <span className="checkbox" aria-hidden="true">
                            {isDone ? "✓" : ""}
                          </span>
                          <span className="check-label">
                            {isLeetcode && (
                              <span className="sl-no">
                                {serialOf[item.id]}.
                              </span>
                            )}
                            {item.leetId && (
                              <a
                                className="lc-badge"
                                href={
                                  item.url ||
                                  "https://leetcode.com/problemset/"
                                }
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Open on LeetCode"
                              >
                                #{item.leetId}
                              </a>
                            )}
                            <span className="prob-name">{item.label}</span>
                            {item.difficulty && (
                              <span
                                className={`diff-badge ${item.difficulty.toLowerCase()} ${
                                  canEdit ? "editable" : ""
                                }`}
                                onClick={(e) => {
                                  if (!canEdit) return;
                                  e.stopPropagation();
                                  cycleDifficulty(section.id, item);
                                }}
                                title={
                                  canEdit ? "Click to change difficulty" : ""
                                }
                              >
                                {item.difficulty}
                              </span>
                            )}
                            {!item.difficulty && isLeetcode && canEdit && (
                              <span
                                className="diff-badge set editable"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cycleDifficulty(section.id, item);
                                }}
                                title="Set difficulty"
                              >
                                + level
                              </span>
                            )}
                          </span>
                        </div>
                        {saving === item.id && <span className="saving-dot" />}
                        {canEdit && (
                          <button
                            className="icon-btn item-edit"
                            title="Rename skill"
                            onClick={() => startEditItem(item)}
                          >
                            ✎
                          </button>
                        )}
                        {canEdit && (
                          <button
                            className="icon-btn danger item-del"
                            title="Delete skill"
                            onClick={() => deleteItem(section.id, item)}
                          >
                            ×
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {canEdit && (
                  <div className="add-row">
                    {isLeetcode && (
                      <input
                        className="lc-num-input"
                        placeholder="LC #"
                        value={newItemId[section.id] || ""}
                        onChange={(e) =>
                          setNewItemId({
                            ...newItemId,
                            [section.id]: e.target.value,
                          })
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && addItemFn(section.id)
                        }
                      />
                    )}
                    <input
                      placeholder={
                        isLeetcode ? "Problem name…" : "Add a skill…"
                      }
                      value={newItem[section.id] || ""}
                      onChange={(e) =>
                        setNewItem({ ...newItem, [section.id]: e.target.value })
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && addItemFn(section.id)
                      }
                    />
                    {isLeetcode && (
                      <select
                        className="diff-select"
                        value={newItemDiff[section.id] || ""}
                        onChange={(e) =>
                          setNewItemDiff({
                            ...newItemDiff,
                            [section.id]: e.target.value,
                          })
                        }
                      >
                        <option value="">Level</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    )}
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => addItemFn(section.id)}
                    >
                      Add
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {canEdit && (
          <div className="add-section card">
            <input
              placeholder="New section title…"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSectionFn()}
            />
            <button className="btn btn-primary" onClick={addSectionFn}>
              + Add section
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
