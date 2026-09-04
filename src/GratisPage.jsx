import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "./supabase";
import { trackEvent } from "./analytics";
import { esGratis } from "./priceLabel";

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

const CAT_COLORS = {
  "Música": "#7C3AED", "Arte": "#EA580C", "Comedia": "#D97706",
  "Tech": "#2563EB", "Baile": "#DB2777", "Deportes": "#16A34A",
  "Teatro": "#DC2626", "Gastronomía": "#C2410C", "Bienestar": "#059669",
  "Académicos": "#0369A1",
};

// Mismo criterio que MIN_EVENTS_FOR_CATEGORY_PAGE en CategoriaPage.jsx — hoy
// hay ~138 eventos gratis (49% del catálogo), muy por encima de esto, pero se
// deja el guardrail por si algún día el catálogo gratuito se reduce mucho.
const MIN_EVENTS_FOR_GRATIS_PAGE = 10;

const META_DESCRIPTION = "Eventos gratis en Medellín, el Área Metropolitana y el Oriente Cercano: charlas y talleres del Parque Explora, actividades del Jardín Botánico, agenda cultural de alcaldías municipales y más. Entrada libre, sin boletería.";
const INTRO = "La mitad de los eventos publicados en Medellín Vibra son gratuitos: desde la programación científica del Parque Explora y el Planetario de Medellín, hasta las actividades culturales del Jardín Botánico Joaquín Antonio Uribe y la agenda de alcaldías municipales como Marinilla. Todos con entrada libre confirmada, sin boletería de por medio.";

export default function GratisPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchGratisEvents = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("estado", "aprobado")
        .order("fecha_real", { ascending: true });

      if (!data) { setNotFound(true); setLoading(false); return; }

      const matched = data.filter((e) => esGratis(e.price));
      if (matched.length < MIN_EVENTS_FOR_GRATIS_PAGE) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setEvents(matched);

      const canonicalUrl = "https://www.medellinvibra.co/gratis";
      document.documentElement.lang = "es";
      document.title = "Eventos gratis en Medellín — Medellín Vibra";

      let canonicalEl = document.querySelector('link[rel="canonical"]');
      if (!canonicalEl) { canonicalEl = document.createElement("link"); canonicalEl.setAttribute("rel", "canonical"); document.head.appendChild(canonicalEl); }
      canonicalEl.setAttribute("href", canonicalUrl);

      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.setAttribute("name", "description"); document.head.appendChild(metaDesc); }
      metaDesc.setAttribute("content", META_DESCRIPTION);

      let ogUrl = document.querySelector('meta[property="og:url"]'); if (!ogUrl) { ogUrl = document.createElement("meta"); ogUrl.setAttribute("property", "og:url"); document.head.appendChild(ogUrl); } ogUrl.setAttribute("content", canonicalUrl);
      let ogTitle = document.querySelector('meta[property="og:title"]'); if (!ogTitle) { ogTitle = document.createElement("meta"); ogTitle.setAttribute("property", "og:title"); document.head.appendChild(ogTitle); } ogTitle.setAttribute("content", "Eventos gratis en Medellín — Medellín Vibra");
      let ogDesc = document.querySelector('meta[property="og:description"]'); if (!ogDesc) { ogDesc = document.createElement("meta"); ogDesc.setAttribute("property", "og:description"); document.head.appendChild(ogDesc); } ogDesc.setAttribute("content", META_DESCRIPTION);

      setLoading(false);
    };
    fetchGratisEvents();
  }, []);

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f3ef', fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:48, marginBottom:16}}>🎟️</div>
        <div style={{color:'#888', fontSize:15}}>Cargando eventos…</div>
      </div>
    </div>
  );

  // Bajo el umbral (o sin datos): mismo criterio que CategoriaPage.jsx — al
  // home en vez de un 404.
  if (notFound) { navigate("/", { replace: true }); return null; }

  const EventCard = ({ ev }) => {
    const color = CAT_COLORS[ev.category] || '#C8860A';
    return (
      <div onClick={() => navigate(`/evento/${slugify(ev.title)}-${ev.id}`)}
        style={{background:'white', border:'1px solid #e5e1d8', borderRadius:16, overflow:'hidden', cursor:'pointer', transition:'transform 0.2s, box-shadow 0.2s'}}
        onMouseOver={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'; }}
        onMouseOut={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
      >
        <div style={{height:140, background:`linear-gradient(135deg, ${color}22, ${color}44)`, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center'}}>
          {ev.image_url
            ? <img src={ev.image_url} alt={ev.title} style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover'}} />
            : <span style={{fontSize:56}}>{ev.emoji || '📅'}</span>
          }
          <div style={{position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 100%)'}} />
          <span style={{position:'absolute', top:10, left:10, background:color, color:'white', padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:700}}>{ev.category}</span>
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
          <div style={{fontWeight:700, fontSize:13, color:'#059669'}}>Gratis</div>
        </div>
      </div>
    );
  };

  // ItemList de Event — mismo patrón que CategoriaPage.jsx: señal estructurada
  // de que esta URL es una colección, sin duplicar el schema Event propio de
  // cada página individual.
  const gratisJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Eventos gratis en Medellín",
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
        isAccessibleForFree: true,
        ...(ev.description ? { description: ev.description.slice(0, 300) } : {}),
        ...(ev.place ? { location: { "@type": "Place", name: ev.place, address: { "@type": "PostalAddress", addressLocality: "Medellín", addressRegion: "Antioquia", addressCountry: "CO" } } } : {}),
      },
    })),
  };

  return (
    <div style={{minHeight:'100vh', background:'#f5f3ef', fontFamily:"'DM Sans', sans-serif"}}>
      <script type="application/ld+json">{JSON.stringify(gratisJsonLd)}</script>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{background:'white', borderBottom:'1px solid #e5e1d8', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100}}>
        <button onClick={() => navigate('/')} style={{background:'none', border:'none', cursor:'pointer', color:'#C8860A', fontWeight:700, fontSize:14, fontFamily:'inherit'}}>
          ← Volver
        </button>
        <span style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:20, color:'#C8860A', letterSpacing:1}}>MEDELLÍN VIBRA</span>
        <span style={{width:60}} />
      </div>

      <div style={{background:'linear-gradient(135deg, #1a1a1a, #2a2a2a)', padding:'40px 24px', textAlign:'center'}}>
        <span style={{display:'inline-block', background:'#059669', color:'white', padding:'4px 14px', borderRadius:100, fontSize:12, fontWeight:700, marginBottom:16}}>
          Entrada libre
        </span>
        <h1 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:32, color:'white', margin:'0 0 12px', letterSpacing:1}}>Eventos gratis en Medellín</h1>
        <p style={{color:'rgba(255,255,255,0.7)', fontSize:14, lineHeight:1.6, maxWidth:560, margin:'0 auto'}}>{INTRO}</p>
        <div style={{color:'#059669', fontSize:13, fontWeight:700, marginTop:16}}>{events.length} eventos</div>
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
