import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "./supabase";
import { trackEvent } from "./analytics";
import { esGratis, formatPriceLabel } from "./priceLabel";

const slugify = (str) =>
  str?.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-")
    .slice(0, 80) || "";

const truncateDesc = (text, max = 140) => {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
};

// Umbral de "contenido suficiente" para justificar una página de barrio — mismo
// criterio y mismo número que MIN_EVENTS_FOR_CATEGORY_PAGE en CategoriaPage.jsx.
// Por debajo de esto la página no se genera (Laureles/Centro/Envigado hoy no
// califican, ver CLAUDE.md). Mantener sincronizado con api/sitemap.js.
const MIN_EVENTS_FOR_BARRIO_PAGE = 15;

// Copy propio por barrio — venues reales sacados de consulta a la tabla, no
// inventados (mismo criterio que CATEGORY_CONTENT en CategoriaPage.jsx). Solo
// El Poblado tiene contenido hoy — los demás barrios se agregan aquí cuando
// crucen el umbral (Envigado, cuando llegue, es "municipio", no "barrio").
const BARRIO_CONTENT = {
  "El Poblado": {
    title: "Planes y eventos en El Poblado, Medellín — Medellín Vibra",
    metaDescription: "Agenda de eventos en El Poblado, Medellín: comedia en Teatro Acción Impro y Mero Bar, shows en Teatro El Tesoro, música en vivo en Trilogía Bar. Filtra por fecha y precio.",
    heading: "Planes en El Poblado",
    intro: "La agenda de El Poblado: comedia y stand-up en Teatro Acción Impro y Mero Bar, música en vivo en Trilogía Bar, funciones en Teatro El Tesoro y charlas o eventos corporativos en espacios como el Auditorio La Enseñanza. Filtra por fecha o precio para ver qué hay esta semana cerca de ti.",
  },
};

const SLUG_TO_BARRIO = Object.fromEntries(
  Object.keys(BARRIO_CONTENT).map((b) => [slugify(b), b])
);

export default function BarrioPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [barrioName, setBarrioName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchBarrioEvents = async () => {
      setLoading(true);
      const bName = SLUG_TO_BARRIO[slug];

      // Sin conteo por barrio precalculado, se trae el listado completo de
      // aprobados y se filtra en cliente — mismo patrón que CategoriaPage.jsx.
      // El umbral decide en vivo si la página existe: un barrio que hoy no
      // califica (Laureles, Centro, Envigado) empieza a generarse solo en
      // cuanto cruce las 15.
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("estado", "aprobado")
        .order("fecha_real", { ascending: true });

      if (!bName || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const matched = data.filter((e) => e.barrio === bName);
      if (matched.length < MIN_EVENTS_FOR_BARRIO_PAGE) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setEvents(matched);
      setBarrioName(bName);

      const content = BARRIO_CONTENT[bName];
      const canonicalUrl = `https://www.medellinvibra.co/barrio/${slug}`;

      document.documentElement.lang = "es";
      document.title = content.title;

      let canonicalEl = document.querySelector('link[rel="canonical"]');
      if (!canonicalEl) { canonicalEl = document.createElement("link"); canonicalEl.setAttribute("rel", "canonical"); document.head.appendChild(canonicalEl); }
      canonicalEl.setAttribute("href", canonicalUrl);

      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.setAttribute("name", "description"); document.head.appendChild(metaDesc); }
      metaDesc.setAttribute("content", content.metaDescription);

      let ogUrl = document.querySelector('meta[property="og:url"]'); if (!ogUrl) { ogUrl = document.createElement("meta"); ogUrl.setAttribute("property", "og:url"); document.head.appendChild(ogUrl); } ogUrl.setAttribute("content", canonicalUrl);
      let ogTitle = document.querySelector('meta[property="og:title"]'); if (!ogTitle) { ogTitle = document.createElement("meta"); ogTitle.setAttribute("property", "og:title"); document.head.appendChild(ogTitle); } ogTitle.setAttribute("content", content.title);
      let ogDesc = document.querySelector('meta[property="og:description"]'); if (!ogDesc) { ogDesc = document.createElement("meta"); ogDesc.setAttribute("property", "og:description"); document.head.appendChild(ogDesc); } ogDesc.setAttribute("content", content.metaDescription);

      setLoading(false);
    };
    fetchBarrioEvents();
  }, [slug]);

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f3ef', fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:48, marginBottom:16}}>📍</div>
        <div style={{color:'#888', fontSize:15}}>Cargando eventos…</div>
      </div>
    </div>
  );

  // Barrios sin página propia (bajo el umbral) o slugs inexistentes se van al
  // home en vez de un 404 — mismo criterio que CategoriaPage.jsx.
  if (notFound) { navigate("/", { replace: true }); return null; }

  const content = BARRIO_CONTENT[barrioName];

  const EventCard = ({ ev }) => (
    <div onClick={() => navigate(`/evento/${slugify(ev.title)}-${ev.id}`)}
      style={{background:'white', border:'1px solid #e5e1d8', borderRadius:16, overflow:'hidden', cursor:'pointer', transition:'transform 0.2s, box-shadow 0.2s'}}
      onMouseOver={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'; }}
      onMouseOut={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
    >
      <div style={{height:140, background:'linear-gradient(135deg, #C8860A22, #C8860A44)', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center'}}>
        {ev.image_url
          ? <img src={ev.image_url} alt={ev.title} style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover'}} />
          : <span style={{fontSize:56}}>{ev.emoji || '📅'}</span>
        }
        <div style={{position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 100%)'}} />
      </div>
      <div style={{padding:'14px 16px'}}>
        <div style={{fontWeight:700, fontSize:14, color:'#1a1a1a', marginBottom:6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{ev.title}</div>
        <div style={{fontSize:12, color:'#888', marginBottom:3}}>📅 {ev.date}{ev.time ? ` · ${ev.time}` : ''}</div>
        <div style={{fontSize:12, color:'#888', marginBottom:8}}>📍 {ev.place}</div>
        {ev.description && (
          <div style={{fontSize:12, color:'#666', lineHeight:1.5, marginBottom:8}}>{truncateDesc(ev.description)}</div>
        )}
        {ev.organizer_name && (
          <Link to={`/organizador/${slugify(ev.organizer_name)}`} style={{display:'block', fontSize:12, color:'#888', textDecoration:'none', marginBottom:8}}
            onClick={e => { e.stopPropagation(); trackEvent({ action: "click_organizador", category: "Navegacion", label: ev.organizer_name }); }}>
            Por {ev.organizer_name}
          </Link>
        )}
        <div style={{fontWeight:700, fontSize:13, color: esGratis(ev.price) ? '#059669' : '#C8860A'}}>{formatPriceLabel(ev.price)}</div>
      </div>
    </div>
  );

  // ItemList de Event — mismo patrón que CategoriaPage.jsx: señal estructurada
  // de que esta URL es una colección de eventos de este barrio.
  const barrioJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Eventos en ${barrioName}, Medellín`,
    itemListElement: events.map((ev, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Event",
        name: ev.title,
        startDate: ev.fecha_real || undefined,
        endDate: ev.fecha_fin || ev.fecha_real || undefined,
        eventStatus: "https://schema.org/EventScheduled",
        url: `https://www.medellinvibra.co/evento/${slugify(ev.title)}-${ev.id}`,
        image: [ev.image_url || "https://pub-c5ba255ea192436da56e91e3ef3ecfa5.r2.dev/default-fallback-medellin"],
        ...(ev.description ? { description: ev.description.slice(0, 300) } : {}),
        ...(ev.place ? { location: { "@type": "Place", name: ev.place, address: { "@type": "PostalAddress", addressLocality: "Medellín", addressRegion: "Antioquia", addressCountry: "CO" } } } : {}),
      },
    })),
  };

  return (
    <div style={{minHeight:'100vh', background:'#f5f3ef', fontFamily:"'DM Sans', sans-serif"}}>
      <script type="application/ld+json">{JSON.stringify(barrioJsonLd)}</script>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{background:'white', borderBottom:'1px solid #e5e1d8', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100}}>
        <button onClick={() => navigate('/')} style={{background:'none', border:'none', cursor:'pointer', color:'#C8860A', fontWeight:700, fontSize:14, fontFamily:'inherit'}}>
          ← Volver
        </button>
        <span style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:20, color:'#C8860A', letterSpacing:1}}>MEDELLÍN VIBRA</span>
        <span style={{width:60}} />
      </div>

      <div style={{background:'linear-gradient(135deg, #1a1a1a, #2a2a2a)', padding:'40px 24px', textAlign:'center'}}>
        <span style={{display:'inline-block', background:'#C8860A', color:'white', padding:'4px 14px', borderRadius:100, fontSize:12, fontWeight:700, marginBottom:16}}>
          📍 {barrioName}
        </span>
        <h1 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:32, color:'white', margin:'0 0 12px', letterSpacing:1}}>{content.heading}</h1>
        <p style={{color:'rgba(255,255,255,0.7)', fontSize:14, lineHeight:1.6, maxWidth:560, margin:'0 auto'}}>{content.intro}</p>
        <div style={{color:'#C8860A', fontSize:13, fontWeight:700, marginTop:16}}>{events.length} eventos</div>
      </div>

      <div style={{maxWidth:680, margin:'0 auto', padding:'24px 20px 60px'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          {events.map(ev => <EventCard key={ev.id} ev={ev} />)}
        </div>
      </div>

      <div style={{background:'#1a1a1a', padding:'20px 24px', textAlign:'center'}}>
        <a href="/" style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:20, color:'#C8860A', textDecoration:'none', letterSpacing:1}}>MEDELLÍN VIBRA</a>
        <div style={{color:'#666', fontSize:12, marginTop:6}}>© {new Date().getFullYear()} medellinvibra.co</div>
      </div>
    </div>
  );
}
