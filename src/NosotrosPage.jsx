import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { CalendarDays, Users, Globe, Store } from "lucide-react";

export default function NosotrosPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark-mode"));

    document.documentElement.lang = "es";
    document.title = "Quiénes somos — Medellín Vibra";

    const canonicalUrl = "https://www.medellinvibra.co/nosotros";
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) { canonicalEl = document.createElement("link"); canonicalEl.setAttribute("rel", "canonical"); document.head.appendChild(canonicalEl); }
    canonicalEl.setAttribute("href", canonicalUrl);

    const metaDescription = "Medellín Vibra es la agenda cultural digital de Medellín, el Área Metropolitana y el Oriente Cercano: agenda de eventos y directorio de proveedores para eventos, en un solo lugar.";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.setAttribute("name", "description"); document.head.appendChild(metaDesc); }
    metaDesc.setAttribute("content", metaDescription);

    let ogUrl = document.querySelector('meta[property="og:url"]'); if (!ogUrl) { ogUrl = document.createElement("meta"); ogUrl.setAttribute("property", "og:url"); document.head.appendChild(ogUrl); } ogUrl.setAttribute("content", canonicalUrl);
    let ogTitle = document.querySelector('meta[property="og:title"]'); if (!ogTitle) { ogTitle = document.createElement("meta"); ogTitle.setAttribute("property", "og:title"); document.head.appendChild(ogTitle); } ogTitle.setAttribute("content", document.title);
    let ogDesc = document.querySelector('meta[property="og:description"]'); if (!ogDesc) { ogDesc = document.createElement("meta"); ogDesc.setAttribute("property", "og:description"); document.head.appendChild(ogDesc); } ogDesc.setAttribute("content", metaDescription);

    // Misma fuente y mismas consultas exactas que usa /para-organizadores
    // (OrganizadoresLanding.jsx) para que el número nunca diverja entre páginas:
    // "eventos" sí filtra por estado='aprobado', pero "organizadores" se cuenta
    // sobre todos los eventos sin filtrar estado, igual que allá.
    const fetchStats = async () => {
      try {
        const { count: eventos } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("estado", "aprobado");
        const { data: orgs } = await supabase.from("events").select("organizer_name");
        const organizadores = new Set(orgs?.filter(e => e.organizer_name).map(e => e.organizer_name)).size;
        setStats({ eventos, organizadores });
      } catch (err) { console.log("Stats error:", err); }
    };
    fetchStats();
  }, []);

  const c = dark
    ? { bg: "#141414", surface: "#1e1e1e", surface2: "#2a2a2a", border: "rgba(255,255,255,0.08)", text: "#f0f0f0", muted: "#999" }
    : { bg: "#f5f3ef", surface: "#ffffff", surface2: "#f5f3ef", border: "#e5e1d8", text: "#1a1a1a", muted: "#888" };
  const gold = "#C8860A";

  return (
    <div style={{ minHeight: "100vh", background: c.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ background: c.surface, borderBottom: `1px solid ${c.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", color: gold, fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>← Volver</button>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: gold, letterSpacing: 1 }}>MEDELLÍN VIBRA</span>
        <span style={{ width: 60 }} />
      </div>

      <div style={{ background: "linear-gradient(135deg, #1a1a1a, #2a1500)", padding: "40px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "white", margin: "0 0 12px", letterSpacing: 1 }}>Quiénes somos</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.6, maxWidth: 620, margin: "0 auto" }}>
          Medellín Vibra nació el 13 de mayo de 2026 como una agenda cultural digital para Medellín, el Área
          Metropolitana y el Oriente Cercano. Cada semana reunimos conciertos, festivales, ferias, obras de teatro
          y experiencias de toda la región en un solo lugar, para que solo te preocupes por disfrutar. Hoy el
          proyecto tiene dos frentes: la agenda de eventos que ves cada semana, y un directorio de proveedores de
          servicios para quienes los organizan.
        </p>
      </div>

      <div style={{ background: c.surface, borderBottom: `1px solid ${c.border}`, padding: "40px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 20, textAlign: "center" }}>
          {[
            [stats?.eventos, "Eventos activos", CalendarDays],
            [stats?.organizadores, "Organizadores", Users],
            [4, "Idiomas", Globe],
          ].map(([num, label, Icono]) => (
            <div key={label}>
              <div style={{ marginBottom: 6, display: "flex", justifyContent: "center" }}><Icono size={18} color={gold} /></div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: gold }}>{num == null ? "…" : num.toLocaleString("es-CO")}</div>
              <div style={{ fontSize: 13, color: c.muted, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        <button
          onClick={() => navigate("/")}
          style={{ textAlign: "left", cursor: "pointer", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: "32px 24px", fontFamily: "inherit" }}
        >
          <div style={{ marginBottom: 14 }}><CalendarDays size={32} color={gold} strokeWidth={1.5} /></div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: c.text, marginBottom: 8, letterSpacing: 0.5 }}>Agenda de Eventos</div>
          <div style={{ fontSize: 13, color: c.muted, lineHeight: 1.6 }}>
            Conciertos, festivales, teatro, comedia y mucho más — todo lo que pasa esta semana en Medellín y la región.
          </div>
          <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: gold }}>Ver la agenda →</div>
        </button>

        <button
          onClick={() => navigate("/proveedores")}
          style={{ textAlign: "left", cursor: "pointer", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: "32px 24px", fontFamily: "inherit" }}
        >
          <div style={{ marginBottom: 14 }}><Store size={32} color={gold} strokeWidth={1.5} /></div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: c.text, marginBottom: 8, letterSpacing: 0.5 }}>Directorio de Proveedores</div>
          <div style={{ fontSize: 13, color: c.muted, lineHeight: 1.6 }}>
            Sillas, sonido, carpas, catering y más — servicios para quienes organizan eventos en la región.
          </div>
          <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: gold }}>Ver directorio →</div>
        </button>
      </div>
    </div>
  );
}
