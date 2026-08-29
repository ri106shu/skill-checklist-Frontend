import { Link } from "react-router-dom";

// small circular progress indicator
function Ring({ percent, accent }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="ring">
      <circle cx="32" cy="32" r={r} className="ring-track" />
      <circle
        cx="32"
        cy="32"
        r={r}
        className="ring-value"
        style={{
          stroke: accent,
          strokeDasharray: c,
          strokeDashoffset: offset,
        }}
      />
      <text x="32" y="37" textAnchor="middle" className="ring-label">
        {percent}%
      </text>
    </svg>
  );
}

// onDelete (optional): if provided, a delete button shows in the top corner.
export default function RoadmapCard({ roadmap, progress, onDelete }) {
  const percent = progress?.percent ?? 0;
  const completed = progress?.completed ?? 0;

  function handleDelete(e) {
    // the card is a link, so stop it from navigating when deleting
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(roadmap);
  }

  return (
    <Link
      to={`/roadmap/${roadmap.id}`}
      className="roadmap-card"
      style={{ "--accent": roadmap.accent }}
    >
      {onDelete && (
        <button
          className="card-del"
          title="Delete this track"
          onClick={handleDelete}
        >
          ×
        </button>
      )}

      <div className="roadmap-card-top">
        <div>
          <h3>{roadmap.title}</h3>
          <p className="roadmap-sub">{roadmap.subtitle}</p>
        </div>
        <Ring percent={percent} accent={roadmap.accent} />
      </div>

      <p className="roadmap-desc">{roadmap.description}</p>

      <div className="roadmap-card-bottom">
        <span className="count">
          {completed} / {roadmap.total} done
        </span>
        <span className="go">Open →</span>
      </div>

      <div className="bar">
        <span style={{ width: `${percent}%`, background: roadmap.accent }} />
      </div>
    </Link>
  );
}
