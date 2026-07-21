import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { MapPin, Clock, ArrowLeft, Navigation, Share2 } from "lucide-react";

const CAT_EMOJI = {
  "Música": "🎵", "Arte": "🎨", "Comedia": "😂", "Tech": "💻",
  "Gastronomía": "🍽️", "Baile": "💃", "Deportes": "⚽",
  "Teatro": "🎭", "Bienestar": "🧘", "Académicos": "📚",
};

const CAT_COLORS = {
  "Música": "#7C3AED", "Arte": "#EA580C", "Comedia": "#D97706", "Tech": "#2563EB",
  "Baile": "#DB2777", "Deportes": "#16A34A", "Teatro": "#DC2626",
  "Gastronomía": "#C2410C", "Bienestar": "#059669", "Académicos": "#0369A1",
};

const ZONAS_ORDEN = ["Medellín", "Área Metropolitana", "Oriente Cercano"];

const slugify = (str) =>
  str?.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-")
    .slice(0, 80) || "";

const distanciaKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export default function EventosPorRangoPage({
  titulo = "Eventos",
  subtitulo = "",
  pageTitle = "Eventos — Medellín Vibra",
  metaDescription = "Eventos culturales en Medellín.",
  shareText = "Mira qué hay en Medellín 👇",
  fechaDesde,
  fechaHasta,
  timeMin = null,
  mensajeVacio = "No encontramos eventos para este período.",
}) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cercaDeMi, setCercaDeMi] = useState(false);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [radioKm, setRadioKm] = useState(20);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  useEffect(() => {
    document.title = pageTitle;
    const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.name = "description";
    meta.content = metaDescription;
    document.head.appendChild(meta);

    const cargar = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, category, zona, place, time, price, image_url, ticket_link, lat, lng, description, fecha_real, fecha_fin, organizer_name")
        .eq("estado", "aprobado")
        .lte("fecha_real", fechaHasta)
        .gte("fecha_fin", fechaDesde)
        .order("fecha_real", { ascending: true });
      if (!error && data) setEvents(data);
      setLoading(false);
    };
    cargar();
  }, [fechaDesde, fechaHasta, pageTitle, metaDescription]);

  const cumpleHoraMinima = (ev) => {
    if (!timeMin) return true;
    if (ev.fecha_real !== fechaDesde) return true;
    if (!ev.time) return true;
    return ev.time >= timeMin;
  };

  const activarCercaDeMi = () => {
    if (cercaDeMi) { setCercaDeMi(false); setMiUbicacion(null); return; }
    if (!navigator.geolocation) { showToast("Tu navegador no permite compartir ubicación"); return; }
    setBuscandoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMiUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setCercaDeMi(true);
        setBuscandoUbicacion(false);
      },
      () => {
        showToast("No pudimos acceder a tu ubicación. Revisa los permisos del navegador.");
        setBuscandoUbicacion(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const compartir = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: pageTitle, text: shareText, url }); }
      catch {}
    } else {
      try { await navigator.clipboard.writeText(url); showToast("Enlace copiado"); }
      catch { showToast("No se pudo copiar el enlace"); }
    }
  };

  const filtrados = events
    .filter(cumpleHoraMinima)
    .filter(e => {
      if (!cercaDeMi || !miUbicacion) return true;
      if (e.lat == null || e.lng == null) return false;
      return distanciaKm(miUbicacion.lat, miUbicacion.lng, e.lat, e.lng) <= radioKm;
    })
    .map(e => ({
      ...e,
      distancia: cercaDeMi && miUbicacion && e.lat != null && e.lng != null
        ? distanciaKm(miUbicacion.lat, miUbicacion.lng, e.lat, e.lng)
        : null,
    }));

  let porZona;
  if (cercaDeMi && miUbicacion) {
    porZona = { "Cerca de ti": [...filtrados].sort((a, b) => (a.distancia ?? 999) - (b.distancia ?? 999)) };
  } else {
    const porDia = {};
    for (const e of filtrados) {
      const dia = e.fecha_real;
      if (!porDia[dia]) porDia[dia] = {};
      const z = ZONAS_ORDEN.includes(e.zona) ? e.zona : "Medellín";
      if (!porDia[dia][z]) porDia[dia][z] = [];
      porDia[dia][z].push(e);
    }
    for (const dia of Object.keys(porDia)) {
      for (const z of Object.keys(porDia[dia])) {
        porDia[dia][z].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
      }
    }
    porZona = porDia;
  }

  const total = filtrados.length;

  const formatDia = (isoDate) => {
    const [y, m, d] = isoDate.split("-").map(Number);
    const fecha = new Date(y, m - 1, d);
    return fecha.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ef", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        .rp-nav { background: white; border-bottom: 1px solid #ece8dd; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
        .rp-back { background: none; border: none; display: flex; align-items: center; gap: 6px; color: #555; font-size: 14px; cursor: pointer; padding: 6px 10px; border-radius: 8px; }
        .rp-back:hover { background: #f5f3ef; color: #C8860A; }
        .rp-share { background: none; border: 1px solid #e5e1d8; border-radius: 100px; padding: 8px 14px; display: flex; align-items: center; gap: 6px; color: #555; font-size: 13px; cursor: pointer; }
        .rp-share:hover { border-color: #C8860A; color: #C8860A; }
        .rp-hero { padding: 32px 20px 24px; max-width: 900px; margin: 0 auto; text-align: center; }
        .rp-hero h1 { font-size: 38px; margin: 0 0 8px; color: #1a1a1a; letter-spacing: -0.5px; }
        .rp-hero p { color: #666; margin: 0; font-size: 16px; text-transform: capitalize; }
        .rp-count { display: inline-block; background: #C8860A; color: white; padding: 4px 14px; border-radius: 100px; font-size: 13px; font-weight: 700; margin-top: 12px; }
        .rp-filter-bar { max-width: 900px; margin: 0 auto; padding: 0 20px 24px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; }
        .rp-cerca-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 100px; border: 1px solid #C8860A; background: white; color: #C8860A; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; }
        .rp-cerca-btn.activo { background: #C8860A; color: white; box-shadow: 0 2px 8px rgba(200,134,10,0.3); }
        .rp-cerca-btn:hover:not(.activo) { background: #fff8ec; }
        .rp-cerca-btn:disabled { opacity: 0.6; cursor: wait; }
        .rp-radio-select { padding: 10px 14px; border-radius: 100px; border: 1px solid #C8860A; background: white; color: #C8860A; font-weight: 600; font-size: 14px; cursor: pointer; }
        .rp-main { max-width: 900px; margin: 0 auto; padding: 0 20px 60px; }
        .rp-dia-title { font-size: 20px; color: #1a1a1a; margin: 36px 0 4px; padding-bottom: 8px; border-bottom: 2px solid #C8860A; text-transform: capitalize; font-weight: 800; }
        .rp-zona-title { font-size: 16px; color: #555; margin: 18px 0 12px; font-weight: 600; padding-left: 10px; border-left: 3px solid #e5e1d8; }
        .rp-card { background: white; border-radius: 12px; overflow: hidden; margin-bottom: 14px; border: 1px solid #ece8dd; transition: box-shadow 0.15s; display: flex; }
        .rp-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.05); }
        .rp-card-img { width: 140px; min-width: 140px; height: 140px; object-fit: cover; background: #eee; }
        .rp-card-body { padding: 16px 18px; flex: 1; min-width: 0; }
        .rp-card-cat { font-size: 12px; color: #888; margin-bottom: 4px; }
        .rp-card-title { font-size: 17px; color: #1a1a1a; margin: 0 0 8px; font-weight: 700; line-height: 1.3; }
        .rp-card-meta { display: flex; align-items: center; gap: 6px; color: #555; font-size: 13px; margin: 3px 0; }
        .rp-card-price { display: inline-block; margin-top: 6px; font-weight: 700; font-size: 14px; }
        .rp-card-price.gratis { color: #059669; }
        .rp-card-price.pago { color: #C8860A; }
        .rp-card-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .rp-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 100px; font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; }
        .rp-btn-detalle { background: white; color: #555; border-color: #d8d3c5; }
        .rp-btn-detalle:hover { border-color: #C8860A; color: #C8860A; }
        .rp-btn-ticket { background: #C8860A; color: white; }
        .rp-btn-ticket:hover { background: #a06f08; }
        .rp-btn-organizer { background: #f5f3ef; color: #555; border-color: #ece8dd; }
        .rp-btn-organizer:hover { border-color: #C8860A; color: #C8860A; background: white; }
        .rp-empty { text-align: center; padding: 60px 20px; color: #888; }
        .rp-empty h2 { color: #555; margin: 0 0 8px; font-size: 22px; }
        .rp-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1a1a1a; color: white; padding: 12px 20px; border-radius: 12px; font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 100; }
        .rp-loading { text-align: center; padding: 80px 20px; color: #888; }
        @media (max-width: 600px) {
          .rp-card { flex-direction: column; }
          .rp-card-img { width: 100%; height: 180px; min-width: 0; }
          .rp-hero h1 { font-size: 28px; }
        }
      `}</style>

      <nav className="rp-nav">
        <button className="rp-back" onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")}>
          <ArrowLeft size={18} /> Volver
        </button>
        <button className="rp-share" onClick={compartir}>
          <Share2 size={14} /> Compartir
        </button>
      </nav>

      <div className="rp-hero">
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
        {!loading && <div className="rp-count">{total} {total === 1 ? "evento" : "eventos"}</div>}
      </div>

      <div className="rp-filter-bar">
        <button
          className={`rp-cerca-btn ${cercaDeMi ? "activo" : ""}`}
          onClick={activarCercaDeMi}
          disabled={buscandoUbicacion}
        >
          <Navigation size={16} />
          {buscandoUbicacion ? "Buscando..." : cercaDeMi ? "Ver todos" : "Cerca de mí"}
        </button>
        {cercaDeMi && (
          <select className="rp-radio-select" value={radioKm} onChange={(e) => setRadioKm(Number(e.target.value))}>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
            <option value={50}>50 km</option>
          </select>
        )}
      </div>

      <main className="rp-main">
        {loading && <div className="rp-loading">Cargando eventos…</div>}

        {!loading && total === 0 && (
          <div className="rp-empty">
            <h2>{cercaDeMi ? "Sin eventos cerca" : "Sin eventos por ahora"}</h2>
            <p>{cercaDeMi ? "Prueba a ampliar el radio o desactiva el filtro." : mensajeVacio}</p>
          </div>
        )}

        {!loading && cercaDeMi && miUbicacion && total > 0 && (
          <section>
            <h2 className="rp-zona-title">Cerca de ti</h2>
            {[...filtrados].sort((a, b) => (a.distancia ?? 999) - (b.distancia ?? 999)).map(ev => (
              <EventCard key={ev.id} ev={ev} navigate={navigate} />
            ))}
          </section>
        )}

        {!loading && !cercaDeMi && total > 0 && Object.entries(porZona).map(([dia, zonas]) => {
          const hayEventos = Object.values(zonas).some(evs => evs.length > 0);
          if (!hayEventos) return null;
          return (
            <section key={dia}>
              <h2 className="rp-dia-title">{formatDia(dia)}</h2>
              {ZONAS_ORDEN.map(zona => {
                const evs = zonas[zona];
                if (!evs || evs.length === 0) return null;
                return (
                  <div key={zona}>
                    <h3 className="rp-zona-title">{zona} <span style={{ fontSize: 13, color: "#aaa", fontWeight: 400 }}>({evs.length})</span></h3>
                    {evs.map(ev => <EventCard key={ev.id} ev={ev} navigate={navigate} />)}
                  </div>
                );
              })}
            </section>
          );
        })}
      </main>

      {toast && <div className="rp-toast">{toast}</div>}
    </div>
  );
}

function EventCard({ ev, navigate }) {
  return (
    <div className="rp-card">
      <img
        className="rp-card-img"
        src={ev.image_url || "https://pub-c5ba255ea192436da56e91e3ef3ecfa5.r2.dev/default-fallback-medellin"}
        alt={ev.title}
        loading="lazy"
      />
      <div className="rp-card-body">
        <div className="rp-card-cat" style={{ color: CAT_COLORS[ev.category] || "#888" }}>
          {CAT_EMOJI[ev.category] || "📅"} {ev.category}
        </div>
        <h3 className="rp-card-title">{ev.title}</h3>
        {ev.time && (
          <div className="rp-card-meta">
            <Clock size={13} /> {ev.time}
          </div>
        )}
        <div className="rp-card-meta">
          <MapPin size={13} /> {ev.place}
          {ev.distancia != null && (
            <span style={{ color: "#C8860A", fontWeight: 600, marginLeft: 6 }}>· {ev.distancia.toFixed(1)} km</span>
          )}
        </div>
        {ev.price && (
          <div className={`rp-card-price ${ev.price === "Gratis" ? "gratis" : "pago"}`}>
            {ev.price}
          </div>
        )}
        <div className="rp-card-actions">
          <button
            className="rp-btn rp-btn-detalle"
            onClick={() => navigate(`/evento/${slugify(ev.title)}-${ev.id}`)}
          >
            Ver detalle
          </button>
          {ev.ticket_link && (
            <a className="rp-btn rp-btn-ticket" href={ev.ticket_link} target="_blank" rel="noopener noreferrer">
              Comprar boleta
            </a>
          )}
          {ev.organizer_name && (
            <button
              className="rp-btn rp-btn-organizer"
              onClick={() => navigate(`/organizador/${slugify(ev.organizer_name)}`)}
            >
              {ev.organizer_name}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
