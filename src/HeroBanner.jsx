import { MapPin } from "lucide-react";

const NACIMIENTO = new Date("2026-05-13");

function diasVivos() {
  const hoy = new Date();
  const diff = Math.floor((hoy - NACIMIENTO) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function HeroBanner({ search, setSearch, stats, t, lang, heroTitle, heroSubtitle }) {
  const dias = diasVivos();

  const [titleLine1, titleLine2, titleLine3] = (t.heroDefaultTitle || "").split("|");
  const defaultTitle = (
    <>
      {titleLine1}<br />
      <span className="accent">{titleLine2}</span><br />
      <span className="accent-red">{titleLine3}</span>
    </>
  );

  const [subtitleBefore, subtitleAfter] = (t.heroDefaultSubtitle || "").split("|");
  const defaultSubtitle = (
    <>
      {subtitleBefore}{" "}
      <strong style={{ color: "#F5A623" }}>{subtitleAfter}</strong>
    </>
  );

  const [bornBefore, bornDate, bornAfter] = (t.heroBornLine || "").split("|");

  return (
    <div className="hero">
      <div className="hero-bg" />
      <div className="hero-content">
        <a
          href="https://www.google.com/maps/place/Medell%C3%ADn,+Antioquia/@6.2441988,-75.6357583,12z"
          target="_blank"
          rel="noopener noreferrer"
          className="hero-tag"
          style={{ textDecoration: "none" }}
        >
          <MapPin size={12} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />
          {t.heroBreadcrumb}
        </a>
        <h1 className="hero-title">
          {heroTitle || defaultTitle}
        </h1>
        <p className="hero-sub">
          {heroSubtitle || defaultSubtitle}
        </p>

        {/* Fecha de nacimiento */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 100,
          padding: "6px 16px",
          marginBottom: 24,
          fontSize: 13,
          color: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(4px)",
        }}>
          <span style={{ fontSize: 15 }}>🚀</span>
          <span>{bornBefore} <strong style={{ color: "#F5A623" }}>{bornDate}</strong> {(bornAfter || "").replace("{days}", dias)}</span>
        </div>

        <div className="search-bar">
          <input
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button>{t.searchBtn}</button>
        </div>
        <div className="stats">
          <div>
            <div className="stat-num">{stats.eventos}</div>
            <div className="stat-label">{t.statEvents}</div>
          </div>
          <div>
            <div className="stat-num">{stats.promocionados}</div>
            <div className="stat-label">
              {lang === "es" ? "Promocionados" : lang === "en" ? "Promoted" : lang === "pt" ? "Promovidos" : "Promus"}
            </div>
          </div>
          <div>
            <div className="stat-num">{stats.usuarios || 0}</div>
            <div className="stat-label">
              {lang === "es" ? "Visitas" : lang === "en" ? "Visits" : lang === "pt" ? "Visitas" : "Visites"}
            </div>
          </div>
          <div>
            <div className="stat-num">{stats.organizadores}</div>
            <div className="stat-label">{t.statOrganizers}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
