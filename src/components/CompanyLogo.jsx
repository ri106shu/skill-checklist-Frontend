import { useMemo, useState } from "react";

// Builds the list of logo image URLs to try, in order:
//   1. an explicit logoUrl the admin set
//   2. Clearbit's real full-color logo for the domain
//   3. Google's favicon service for the domain (always works)
// If all fail, we render a colored monogram badge instead.
function buildSources(company) {
  const srcs = [];
  if (company.logoUrl) srcs.push(company.logoUrl);
  if (company.domain) {
    srcs.push(`https://logo.clearbit.com/${company.domain}`);
    srcs.push(
      `https://www.google.com/s2/favicons?domain=${company.domain}&sz=128`
    );
  }
  return srcs;
}

export default function CompanyLogo({ company, size = 34 }) {
  const sources = useMemo(() => buildSources(company), [company]);
  const [idx, setIdx] = useState(0);

  const src = sources[idx];

  if (src) {
    return (
      <img
        className="company-logo-img"
        src={src}
        alt={company.name}
        width={size}
        height={size}
        loading="lazy"
        // on failure, advance to the next candidate source
        onError={() => setIdx((i) => i + 1)}
      />
    );
  }

  // final fallback: colored monogram
  const initials = company.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className="company-logo-fallback"
      style={{
        width: size,
        height: size,
        color: company.color,
        borderColor: company.color,
        background: `${company.color}1a`,
      }}
      aria-label={company.name}
    >
      {initials}
    </span>
  );
}
