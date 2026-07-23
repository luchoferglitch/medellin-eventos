import { MapPin } from "lucide-react";

const NACIMIENTO = new Date("2026-05-13");

function diasVivos() {
  const hoy = new Date();
  const diff = Math.floor((hoy - NACIMIENTO) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function HeroBanner({ search, setSearch, stats, t, lang }) {
  const dias = diasVivos();

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
          <span>Nacimos el <strong style={{ color: "#F5A623" }}>13 de mayo de 2026</strong> — {dias} días cambiando cómo Medellín descubre sus eventos</span>
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
