import CompanyLogo from "./CompanyLogo.jsx";

// A continuously scrolling strip of company logos.
// The list is duplicated so the animation loops seamlessly.
// `direction` = "left" | "right", `filterType` optionally limits to
// "service" or "product" companies.
export default function CompanyMarquee({
  companies = [],
  direction = "left",
  speed = 32,
  filterType = null,
}) {
  const list = filterType
    ? companies.filter((c) => c.type === filterType)
    : companies;

  if (!list.length) return null;

  // duplicate for a seamless loop
  const doubled = [...list, ...list];

  return (
    <div className="marquee" aria-hidden="true">
      <div
        className={`marquee-track ${direction === "right" ? "reverse" : ""}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {doubled.map((c, idx) => (
          <div className="marquee-chip" key={`${c.id}-${idx}`}>
            <CompanyLogo company={c} size={28} />
            <span style={{ color: c.color }}>{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
