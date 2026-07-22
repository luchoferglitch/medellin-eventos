import { MapPin } from "lucide-react";

export default function HeroBanner({ search, setSearch, stats, t, lang }) {
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
          Medellín, Colombia
        </a>
        <h1 className="hero-title">
          DESCUBRE<br />
          <span className="accent">LO QUE</span><br />
          <span className="accent-red">VIBRA</span>
        </h1>
        <p className="hero-sub">
          Los mejores eventos de la ciudad de la eterna primavera. Música, arte, gastronomía y mucho más.{" "}
          <strong style={{ color: "#F5A623" }}>Tu agenda cultural, actualizada cada semana.</strong>
        </p>
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
