import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const slugify = (str) =>
  str?.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
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

// Umbral de "contenido suficiente" para justificar una página de categoría (ver
// CLAUDE.md, sección SEO). Por debajo de esto la página quedaría con muy pocas
// tarjetas — mismo criterio de contenido delgado que ya se resolvió en organizador,
// solo que aquí en vez de mostrar la página vacía, directamente no se genera.
// Mantener sincronizado con MIN_EVENTS_FOR_CATEGORY_PAGE en api/sitemap.js.
const MIN_EVENTS_FOR_CATEGORY_PAGE = 15;

// Copy propio por categoría — título, meta description e intro mencionan venues
// reales sacados de consulta a la tabla (los más repetidos entre los eventos
// aprobados de cada categoría), no inventados. Evita que estas páginas se lean
// como una plantilla con el nombre de la categoría insertado a la fuerza, que es
// justo lo que las haría ver "casi duplicadas" entre sí para Google.
const CATEGORY_CONTENT = {
  "Música": {
    title: "Conciertos y música en vivo en Medellín — Medellín Vibra",
    metaDescription: "Agenda de conciertos y música en vivo en Medellín: del Teatro Metropolitano y el Pablo Tobón Uribe a DAVIarena en Sabaneta. Filtra por fecha, género y precio.",
    heading: "Música en Medellín",
    intro: "La agenda de conciertos y música en vivo de la ciudad: desde las temporadas del Teatro Metropolitano José Gutiérrez Gómez y el Teatro Pablo Tobón Uribe hasta los shows grandes en DAVIarena, en Sabaneta. Hay jazz, rock, música popular, clásica y electrónica — filtra por fecha o precio para encontrar el concierto que te queda mejor esta semana.",
  },
  "Comedia": {
    title: "Stand-up y comedia en Medellín — Medellín Vibra",
    metaDescription: "Shows de stand-up y comedia en Medellín: La Korte en Laureles, Teatro Acción Impro en El Poblado y más escenarios. Agenda actualizada cada semana.",
    heading: "Comedia en Medellín",
    intro: "La agenda de stand-up, improvisación y comedia en vivo: de las noches fijas en La Korte, en Laureles, a los shows de improvisación en Teatro Acción Impro y Mero Bar, en El Poblado. Un plan para reírte esta semana sin necesariamente pagar boleta de teatro grande.",
  },
  "Académicos": {
    title: "Charlas, talleres y eventos académicos en Medellín — Medellín Vibra",
    metaDescription: "Conferencias, talleres y charlas en Medellín: Planetario de Medellín, Parque Explora y más espacios académicos. Agenda actualizada.",
    heading: "Eventos académicos en Medellín",
    intro: "Charlas, talleres, conferencias y actividades de divulgación científica y educativa — el Planetario de Medellín y el Parque Explora concentran buena parte de la agenda, junto con universidades y cámaras de comercio de la ciudad. Un plan distinto si buscas aprender algo nuevo, no solo entretenerte.",
  },
  "Teatro": {
    title: "Obras de teatro en Medellín — Medellín Vibra",
    metaDescription: "Cartelera de teatro en Medellín: Teatro Metropolitano, Teatro Comfama Alfonso Restrepo Moreno y otros escenarios. Agenda de obras actualizada cada semana.",
    heading: "Teatro en Medellín",
    intro: "La cartelera de teatro de la ciudad: obras en el Teatro Metropolitano José Gutiérrez Gómez, el Teatro Comfama Alfonso Restrepo Moreno y salas más pequeñas como Mero Bar. Desde clásicos hasta montajes independientes — filtra por fecha para ver qué se está presentando esta semana.",
  },
  "Arte": {
    title: "Arte, exposiciones y galerías en Medellín — Medellín Vibra",
    metaDescription: "Exposiciones, muestras y eventos de arte en Medellín: Parque Explora, Plaza Mayor y galerías del Barrio Colombia. Agenda actualizada.",
    heading: "Arte en Medellín",
    intro: "Exposiciones, muestras y actividades de arte en espacios como Parque Explora, Plaza Mayor y galerías del Barrio Colombia, como El Coleccionista. Planes culturales más allá del concierto o la obra de teatro.",
  },
  "Baile": {
    title: "Eventos de baile y danza en Medellín — Medellín Vibra",
    metaDescription: "Talleres, socials y eventos de baile en Medellín: Claustro Comfama y otros escenarios. Agenda de salsa, bachata y danza actualizada.",
    heading: "Baile en Medellín",
    intro: "Talleres, socials y presentaciones de baile — el Claustro Comfama concentra buena parte de la agenda de la ciudad, desde salsa y bachata hasta danza contemporánea. Filtra por fecha si buscas dónde bailar este fin de semana.",
  },
};

const SLUG_TO_CATEGORY = Object.fromEntries(
  Object.keys(CATEGORY_CONTENT).map((cat) => [slugify(cat), cat])
);

export default function CategoriaPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchCategoryEvents = async () => {
      setLoading(true);
      const catName = SLUG_TO_CATEGORY[slug];

      // Sin conteo por categoría precalculado en la base, se trae el listado completo
      // de aprobados (misma tabla liviana que ya consultan organizador y sitemap) y se
      // cuenta en cliente. El umbral decide en vivo si la página existe, así que una
      // categoría que hoy no califica empieza a generarse sola en cuanto cruce las 15.
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("estado", "aprobado")
        .order("fecha_real", { ascending: true });

      if (!catName || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const matched = data.filter((e) => e.category === catName);
      if (matched.length < MIN_EVENTS_FOR_CATEGORY_PAGE) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setEvents(matched);
      setCategoryName(catName);

      const content = CATEGORY_CONTENT[catName];
      const canonicalUrl = `https://www.medellinvibra.co/categoria/${slug}`;

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
    fetchCategoryEvents();
  }, [slug]);

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f3ef', fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:48, marginBottom:16}}>🎟️</div>
        <div style={{color:'#888', fontSize:15}}>Cargando eventos…</div>
      </div>
    </div>
  );

  // Categorías sin página propia (bajo el umbral) o slugs inexistentes se van al
  // home en vez de un 404 — mismo criterio que EventoPage con eventos inexistentes.
  if (notFound) { navigate("/", { replace: true }); return null; }

  const content = CATEGORY_CONTENT[categoryName];

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
        </div>
        <div style={{padding:'14px 16px'}}>
          <div style={{fontWeight:700, fontSize:14, color:'#1a1a1a', marginBottom:6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{ev.title}</div>
          <div style={{fontSize:12, color:'#888', marginBottom:3}}>📅 {ev.date}{ev.time ? ` · ${ev.time}` : ''}</div>
          <div style={{fontSize:12, color:'#888', marginBottom:8}}>📍 {ev.place}</div>
          {ev.description && (
            <div style={{fontSize:12, color:'#666', lineHeight:1.5, marginBottom:8}}>{truncateDesc(ev.description)}</div>
          )}
          <div style={{fontWeight:700, fontSize:13, color: ev.price === 'Gratis' ? '#059669' : '#C8860A'}}>{ev.price}</div>
        </div>
      </div>
    );
  };

  // ItemList de Event: señal estructurada de que esta URL es una colección de
  // eventos de esta categoría, no solo un listado visual. Cada Event ya referencia
  // su propia página (con su propio schema completo), así que esto no la duplica,
  // la envuelve.
  const categoriaJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Eventos de ${categoryName} en Medellín`,
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
      <script type="application/ld+json">{JSON.stringify(categoriaJsonLd)}</script>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{background:'white', borderBottom:'1px solid #e5e1d8', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100}}>
        <button onClick={() => navigate('/')} style={{background:'none', border:'none', cursor:'pointer', color:'#C8860A', fontWeight:700, fontSize:14, fontFamily:'inherit'}}>
          ← Volver
        </button>
        <span style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:20, color:'#C8860A', letterSpacing:1}}>MEDELLÍN VIBRA</span>
        <span style={{width:60}} />
      </div>

      <div style={{background:'linear-gradient(135deg, #1a1a1a, #2a2a2a)', padding:'40px 24px', textAlign:'center'}}>
        <span style={{display:'inline-block', background:CAT_COLORS[categoryName] || '#C8860A', color:'white', padding:'4px 14px', borderRadius:100, fontSize:12, fontWeight:700, marginBottom:16}}>
          {categoryName}
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
