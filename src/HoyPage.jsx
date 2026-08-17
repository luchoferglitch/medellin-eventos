import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./supabase";
import { registrarClic } from "./registrarClic";
import { MapPin, Clock, ArrowLeft, Navigation, Share2 } from "lucide-react";
import { translations } from "./translations";
import { getLangFromPath, getLangPrefix, getLocale } from "./lang";
import { CAT_LABEL_KEY } from "./categoryLabels";
import HreflangTags from "./components/HreflangTags";

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

export default function HoyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const lang = getLangFromPath(location.pathname);
  const langPrefix = getLangPrefix(lang);
  const t = translations[lang];
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cercaDeMi, setCercaDeMi] = useState(false);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [radioKm, setRadioKm] = useState(20);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [toast, setToast] = useState("");
  const mainRef = useRef(null);
  const isFirstFilterRender = useRef(true);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  useEffect(() => {
    document.title = t.hoyDocTitle;
    document.documentElement.lang = lang;
    const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.name = "description";
    meta.content = t.hoyMetaDescription;
    document.head.appendChild(meta);

    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) { canonicalEl = document.createElement("link"); canonicalEl.setAttribute("rel", "canonical"); document.head.appendChild(canonicalEl); }
    canonicalEl.setAttribute("href", `https://www.medellinvibra.co${langPrefix}/hoy`);

    const cargar = async () => {
      const hoy = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("events")
        .select("id, title, category, zona, place, time, price, image_url, ticket_link, lat, lng, description, fecha_real, fecha_fin, organizer_name")
        .eq("estado", "aprobado")
        .lte("fecha_real", hoy)
        .gte("fecha_fin", hoy);
      if (!error && data) setEvents(data);
      setLoading(false);
    };
    cargar();
  }, []);

  const activarCercaDeMi = () => {
    if (cercaDeMi) { setCercaDeMi(false); setMiUbicacion(null); return; }
    if (!navigator.geolocation) { showToast(t.geoNotSupported); return; }
    setBuscandoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMiUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setCercaDeMi(true);
        setBuscandoUbicacion(false);
        if (typeof window.gtag === "function") {
          window.gtag("event", "usar_cerca_de_mi", { radio_km: radioKm });
        }
      },
      () => {
        showToast(t.geoPermissionError);
        setBuscandoUbicacion(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (isFirstFilterRender.current) { isFirstFilterRender.current = false; return; }
    mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [cercaDeMi]);

  const compartir = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: t.hoyShareTitle, text: t.hoyShareText, url }); }
      catch {}
    } else {
      try { await navigator.clipboard.writeText(url); showToast(t.linkCopied); }
      catch { showToast(t.linkCopyError); }
    }
  };

  const filtrados = events
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
    porZona = { [t.nearYouLabel]: filtrados.sort((a, b) => (a.distancia ?? 999) - (b.distancia ?? 999)) };
  } else {
    porZona = {};
    for (const z of ZONAS_ORDEN) porZona[z] = [];
    for (const e of filtrados) {
      const z = ZONAS_ORDEN.includes(e.zona) ? e.zona : "Medellín";
      porZona[z].push(e);
    }
    for (const z of Object.keys(porZona)) {
      porZona[z].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    }
  }

  const total = filtrados.length;
  const hoyStr = new Date().toLocaleDateString(getLocale(lang), { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{minHeight:"100vh", background:"#f5f3ef", fontFamily:"system-ui, -apple-system, sans-serif"}}>
      <style>{`
        .hoy-nav { background: white; border-bottom: 1px solid #ece8dd; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
        .hoy-back { background: none; border: none; display: flex; align-items: center; gap: 6px; color: #555; font-size: 14px; cursor: pointer; padding: 6px 10px; border-radius: 8px; }
        .hoy-back:hover { background: #f5f3ef; color: #C8860A; }
        .hoy-share { background: none; border: 1px solid #e5e1d8; border-radius: 100px; padding: 8px 14px; display: flex; align-items: center; gap: 6px; color: #555; font-size: 13px; cursor: pointer; }
        .hoy-share:hover { border-color: #C8860A; color: #C8860A; }
        .hoy-hero { padding: 32px 20px 24px; max-width: 900px; margin: 0 auto; text-align: center; }
        .hoy-hero h1 { font-size: 38px; margin: 0 0 8px; color: #1a1a1a; letter-spacing: -0.5px; }
        .hoy-hero p { color: #666; margin: 0; font-size: 16px; text-transform: capitalize; }
        .hoy-count { display: inline-block; background: #C8860A; color: white; padding: 4px 14px; border-radius: 100px; font-size: 13px; font-weight: 700; margin-top: 12px; }
        .hoy-filter-bar { max-width: 900px; margin: 0 auto; padding: 0 20px 24px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; }
        .hoy-cerca-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 100px; border: 1px solid #C8860A; background: white; color: #C8860A; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; }
        .hoy-cerca-btn.activo { background: #C8860A; color: white; box-shadow: 0 2px 8px rgba(200,134,10,0.3); }
        .hoy-cerca-btn:hover:not(.activo) { background: #fff8ec; }
        .hoy-cerca-btn:disabled { opacity: 0.6; cursor: wait; }
        .hoy-radio-select { padding: 10px 14px; border-radius: 100px; border: 1px solid #C8860A; background: white; color: #C8860A; font-weight: 600; font-size: 14px; cursor: pointer; }
        .hoy-main { max-width: 900px; margin: 0 auto; padding: 0 20px 60px; scroll-margin-top: 70px; }
        .hoy-results-count { color: #888; font-size: 13px; font-weight: 600; padding-top: 20px; }
        .hoy-zona-title { font-size: 22px; color: #1a1a1a; margin: 32px 0 16px; border-left: 4px solid #C8860A; padding-left: 12px; }
        .hoy-card { background: white; border-radius: 12px; overflow: hidden; margin-bottom: 16px; border: 1px solid #ece8dd; transition: box-shadow 0.15s; display: flex; }
        .hoy-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.05); }
        .hoy-card-img { width: 140px; min-width: 140px; height: 140px; object-fit: cover; background: #eee; }
        .hoy-card-body { padding: 16px 18px; flex: 1; min-width: 0; }
        .hoy-card-cat { font-size: 12px; color: #888; margin-bottom: 4px; }
        .hoy-card-title { font-size: 17px; color: #1a1a1a; margin: 0 0 8px; font-weight: 700; line-height: 1.3; }
        .hoy-card-meta { display: flex; align-items: flex-start; gap: 6px; color: #555; font-size: 13px; margin: 3px 0; }
        .hoy-card-price { display: inline-block; margin-top: 6px; font-weight: 700; font-size: 14px; }
        .hoy-card-price.gratis { color: #059669; }
        .hoy-card-price.pago { color: #C8860A; }
        .hoy-card-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .hoy-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 100px; font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; }
        .hoy-btn-detalle { background: white; color: #555; border-color: #d8d3c5; }
        .hoy-btn-detalle:hover { border-color: #C8860A; color: #C8860A; }
        .hoy-btn-ticket { background: #C8860A; color: white; }
        .hoy-btn-ticket:hover { background: #a06f08; }
        .hoy-btn-organizer { background: #f5f3ef; color: #555; border-color: #ece8dd; }
        .hoy-btn-organizer:hover { border-color: #C8860A; color: #C8860A; background: white; }
        .hoy-empty { text-align: center; padding: 60px 20px; color: #888; }
        .hoy-empty h2 { color: #555; margin: 0 0 8px; font-size: 22px; }
        .hoy-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1a1a1a; color: white; padding: 12px 20px; border-radius: 12px; font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 100; }
        .hoy-loading { text-align: center; padding: 80px 20px; color: #888; }
        @media (max-width: 600px) {
          .hoy-card { flex-direction: column; }
          .hoy-card-img { width: 100%; height: 180px; min-width: 0; }
          .hoy-hero h1 { font-size: 30px; }
        }
      `}</style>

      <HreflangTags basePath="/hoy" />

      <nav className="hoy-nav">
        <button className="hoy-back" onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")}>
          <ArrowLeft size={18} /> {t.backLabel}
        </button>
        <button className="hoy-share" onClick={compartir}>
          <Share2 size={14} /> {t.shareLabel}
        </button>
      </nav>

      <div className="hoy-hero">
        <h1>{t.hoyPageTitle}</h1>
        <p>{hoyStr}</p>
        {!loading && (
          <div className="hoy-count">
            {(total === 1 ? t.hoyHeroCountSingular : t.hoyHeroCountPlural).replace("{N}", total)}
          </div>
        )}
      </div>

      <div className="hoy-filter-bar">
        <button
          className={`hoy-cerca-btn ${cercaDeMi ? "activo" : ""}`}
          onClick={activarCercaDeMi}
          disabled={buscandoUbicacion}
        >
          <Navigation size={16} />
          {buscandoUbicacion ? t.cercaDeMiLoading : cercaDeMi ? t.cercaDeMiActive : t.cercaDeMiDefault}
        </button>
        {cercaDeMi && (
          <select
            className="hoy-radio-select"
            value={radioKm}
            onChange={(e) => setRadioKm(Number(e.target.value))}
          >
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
            <option value={50}>50 km</option>
          </select>
        )}
      </div>

      <main className="hoy-main" ref={mainRef}>
        {loading && <div className="hoy-loading">{t.loading}</div>}

        {!loading && total > 0 && (
          <div className="hoy-results-count">
            {(total !== 1 ? t.eventsFoundPlural : t.eventsFoundSingular).replace("{N}", total)}
          </div>
        )}

        {!loading && total === 0 && (
          <div className="hoy-empty">
            <h2>{cercaDeMi ? t.hoyEmptyCercaTitle : t.hoyEmptyTitle}</h2>
            <p>{cercaDeMi ? t.hoyEmptyCercaText : t.hoyEmptyText}</p>
          </div>
        )}

        {!loading && Object.entries(porZona).map(([zona, evs]) => {
          if (evs.length === 0) return null;
          return (
            <section key={zona}>
              <h2 className="hoy-zona-title">{zona} <span style={{fontSize:14, color:"#888", fontWeight:400}}>({evs.length})</span></h2>
              {evs.map(ev => (
                <div
                  key={ev.id}
                  className="hoy-card"
                >
                  <img
                    className="hoy-card-img"
                    src={ev.image_url || "https://pub-c5ba255ea192436da56e91e3ef3ecfa5.r2.dev/default-fallback-medellin"}
                    alt={ev.title}
                    loading="lazy"
                  />
                  <div className="hoy-card-body">
                    <div className="hoy-card-cat" style={{color: CAT_COLORS[ev.category] || "#888"}}>
                      {CAT_EMOJI[ev.category] || "📅"} {t[CAT_LABEL_KEY[ev.category]] || ev.category}
                    </div>
                    <h3 className="hoy-card-title">{ev.title}</h3>
                    {ev.time && (
                      <div className="hoy-card-meta">
                        <Clock size={13} /> {ev.time}
                      </div>
                    )}
                    <div className="hoy-card-meta">
                      <MapPin size={13} /> {ev.place}
                      {ev.distancia != null && <span style={{color:"#C8860A", fontWeight:600, marginLeft:6}}>· {ev.distancia.toFixed(1)} km</span>}
                    </div>
                    {ev.price && (
                      <div className={`hoy-card-price ${ev.price === "Gratis" ? "gratis" : "pago"}`}>
                        {ev.price}
                      </div>
                    )}
                    <div className="hoy-card-actions">
                      <button
                        className="hoy-btn hoy-btn-detalle"
                        onClick={() => navigate(`${langPrefix}/evento/${slugify(ev.title)}-${ev.id}`)}
                      >
                        {t.viewDetail}
                      </button>
                      {ev.ticket_link && (
                        <button
                          className="hoy-btn hoy-btn-ticket"
                          onClick={() => registrarClic(ev.id, ev.ticket_link, "hoy", ev.title, ev.category)}
                        >
                          {t.buyTicketBtn}
                        </button>
                      )}
                      {ev.organizer_name && (
                        <button
                          className="hoy-btn hoy-btn-organizer"
                          onClick={() => navigate(`${langPrefix}/organizador/${slugify(ev.organizer_name)}`)}
                        >
                          {ev.organizer_name}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          );
        })}
      </main>

      {toast && <div className="hoy-toast">{toast}</div>}
    </div>
  );
}
