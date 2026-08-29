import { useEffect, useState } from "react";
import api from "../api/client.js";
import CompanyMarquee from "./CompanyMarquee.jsx";

const MINDSET = ["Discipline", "Consistency", "Patience"];
const OUTCOME = ["Strategy", "Hard Work", "Success"];

// Left-side hero for Login & Signup.
// When a target company is selected (on the Signup page), that company's office
// image fills the background so you can "see" where you're aiming — and it
// swaps whenever you change the target. `activeCompany` is the full company
// object (or null for "Any"). Companies without an office image fall back to a
// glow in the company's brand color.
export default function AuthHero({ activeCompany = null }) {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    api
      .get("/companies")
      .then((res) => setCompanies(res.data))
      .catch(() => setCompanies([])); // marquee just hides if none
  }, []);

  const office = activeCompany?.officeUrl;
  const brand = activeCompany?.color || "#38bdf8";

  return (
    <div className="auth-hero">
      {/* one-time keyframe for the backdrop fade-in */}
      <style>{`@keyframes authHeroFade{from{opacity:0}to{opacity:1}}`}</style>

      {/* target-company backdrop. keyed on the id so it re-plays the fade
          each time you pick a different company. */}
      {activeCompany && (
        <div
          key={activeCompany.id}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            overflow: "hidden",
            pointerEvents: "none",
            animation: "authHeroFade 500ms ease",
          }}
        >
          {office ? (
            <>
              {/* the company's office / building photo */}
              <img
                src={office}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              {/* darken it so the text on top stays readable */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(2,6,23,0.55) 0%, rgba(2,6,23,0.78) 100%)",
                }}
              />
              {/* subtle brand-color wash */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.5,
                  mixBlendMode: "screen",
                  background: `radial-gradient(60% 60% at 72% 28%, ${brand}66 0%, transparent 65%)`,
                }}
              />
            </>
          ) : (
            // no office image yet -> just a glow in the brand color
            <div
              style={{
                position: "absolute",
                inset: "-25%",
                opacity: 0.32,
                filter: "blur(26px)",
                background: `radial-gradient(55% 55% at 72% 32%, ${brand} 0%, transparent 62%)`,
              }}
            />
          )}
        </div>
      )}

      {/* decorative skyline — hidden when a real office photo is showing */}
      <div
        className="skyline"
        aria-hidden="true"
        style={office ? { zIndex: 1, opacity: 0 } : { zIndex: 1 }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className={`tower t${i}`} />
        ))}
        <span className="sun" />
      </div>

      <div
        className="auth-hero-content"
        style={{ position: "relative", zIndex: 2 }}
      >
        <p className="eyebrow">Your career, one checkbox at a time</p>
        <h1 className="hero-title">
          Target the <span className="grad">companies</span> you want.
          <br />
          Build the skills to get there.
        </h1>

        {/* moving logo strips: service-based then product-based */}
        <div className="marquee-stack">
          <CompanyMarquee
            companies={companies}
            filterType="service"
            direction="left"
            speed={30}
          />
          <CompanyMarquee
            companies={companies}
            filterType="product"
            direction="right"
            speed={34}
          />
        </div>

        <div className="pillar-row">
          <div className="pillar">
            <span className="pillar-head">Mindset</span>
            <ul>
              {MINDSET.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          <div className="pillar">
            <span className="pillar-head">Outcome</span>
            <ul>
              {OUTCOME.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="motto">
          <span>Focus</span>
          <i />
          <span>Learn</span>
          <i />
          <span>Improve</span>
        </div>
      </div>
    </div>
  );
}