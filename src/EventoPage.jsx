import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./supabase";
import { registrarClic } from "./registrarClic";
import SEO from "./components/SEO"; // 👈 IMPORTACIÓN DEL COMPONENTE SEO
import { Calendar, Clock, MapPin, Banknote, User, Share2, CalendarPlus, Search, Star, PartyPopper, Drama, Heart } from "lucide-react";
import { translations } from "./translations";
import { getLangFromPath, getLangPrefix, getLocale } from "./lang";
import { CAT_LABEL_KEY } from "./categoryLabels";
import { LanguageSelectorCompact } from "./components/LanguageSelector";

const CAT_COLORS = {
  "Música": "#7C3AED", "Arte": "#EA580C", "Comedia": "#D97706",
  "Tech": "#2563EB", "Baile": "#DB2777", "Deportes": "#16A34A",
  "Teatro": "#DC2626", "Gastronomía": "#C2410C", "Bienestar": "#059669",
  "Académicos": "#0369A1",
};

const TAGS_CONFIG = {
  "Destacado":        { emoji: "⭐", color: "#C8860A" },
  "Últimas entradas": { emoji: "🎟️", color: "#DC2626" },
  "Agotado":          { emoji: "🔥", color: "#7C3AED" },
  "Nuevo":            { emoji: "🆕", color: "#059669" },
};

const slugify = (str) =>
  str?.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-")
    .slice(0, 80) || "";

const addToCalendar = (ev) => {
  const fechaReal = ev.fechaReal || ev.fecha_real;
  const fechaFin = ev.fechaFin || ev.fecha_fin;
  if (!fechaReal) return;
  const start = fechaReal.replace(/-/g, "");
  const end = fechaFin ? fechaFin.replace(/-/g, "") : start;
  const title = encodeURIComponent(ev.title || "");
  const place = encodeURIComponent(ev.place || "");
  const desc = encodeURIComponent(
    `${ev.desc || ev.description || ""}\n\n🎫 ${ev.price || ""}\n📍 ${ev.place || ""}\n\n👉 Ver en Medellín Vibra: https://www.medellinvibra.co/evento/${slugify(ev.title)}-${ev.id}`
  );
  const url = `https://calendar.google.com/calendar/event?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${place}&details=${desc}`;
  window.open(url, "_blank");
};

const StarRating = ({ value, onChange, readonly = false }) => (
  <div style={{display:'flex', gap:4}}>
    {[1,2,3,4,5].map(star => (
      <span key={star}
        onClick={() => !readonly && onChange && onChange(star)}
        style={{fontSize: readonly ? 16 : 28, cursor: readonly ? 'default' : 'pointer', color: star <= value ? '#C8860A' : '#ddd', transition:'color 0.15s'}}
      >★</span>
    ))}
  </div>
);

export default function EventoPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const lang = getLangFromPath(location.pathname);
  const langPrefix = getLangPrefix(lang);
  const t = translations[lang];
  const changeLang = (newLang) => navigate(`${getLangPrefix(newLang)}/evento/${slug}`);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [hotelRecomendado, setHotelRecomendado] = useState(null);
  const [interested, setInterested] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supabase.from("hoteles_recomendados").select("*").eq("activo", true).order("orden", { ascending: true }).limit(1)
      .then(({ data }) => { if (data && data.length > 0) setHotelRecomendado(data[0]); });
  }, []);

  const fetchReviews = async (eventId) => {
    const { data } = await supabase
      .from("reviews")
      .select("*, auth.users(email)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (data) setReviews(data);
  };

  const mapEvent = (e) => ({
    id: e.id, emoji: e.emoji, title: e.title, cat: e.category,
    date: e.date, time: e.time, place: e.place, comoLlegar: e.como_llegar, price: e.price,
    tag: e.tag, desc: e.description, ticketPlatform: e.ticket_platform,
    link: e.ticket_link, organizerName: e.organizer_name,
    organizerContact: e.organizer_contact, imageUrl: e.image_url,
    fechaReal: e.fecha_real, fechaFin: e.fecha_fin, createdAt: e.created_at, zona: e.zona,
    performer: e.performer,
  });

  useEffect(() => {
    const handleFoundRow = (data) => {
      if (!data || data.estado === "pendiente") { setNotFound(true); return; }
      if (data.estado === "archivado") {
        setEvent(mapEvent(data));
        setIsArchived(true);
        return;
      }
      setEvent(mapEvent(data));
      fetchReviews(data.id);
    };

    const fetchEvent = async () => {
      setLoading(true);
      const parts = slug.split("-");
      const id = parts[parts.length - 1];
      if (!isNaN(id) && id.length > 0) {
        const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
        if (error || !data) { setNotFound(true); } else { handleFoundRow(data); }
      } else {
        const { data: all } = await supabase.from("events").select("*");
        const match = all?.find(e => slugify(e.title) === slug || slug.endsWith(slugify(e.title)));
        handleFoundRow(match);
      }
      setLoading(false);
    };

    fetchEvent();
  }, [slug]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (!event) return;
    // <SEO> (Helmet) maneja title/og/twitter, pero no toca el <link rel="canonical">
    // que ya trae index.html — si Helmet agregara el suyo quedarían dos tags
    // compitiendo. Se reusa/actualiza el mismo nodo que las demás páginas.
    // Siempre en español, sin importar el idioma detectado en la URL: el
    // contenido del evento no se traduce, así que no hay variantes que indexar
    // por separado (decisión de Fase 2, sin HreflangTags en esta página).
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) { canonicalEl = document.createElement("link"); canonicalEl.setAttribute("rel", "canonical"); document.head.appendChild(canonicalEl); }
    canonicalEl.setAttribute("href", `https://www.medellinvibra.co/evento/${slugify(event.title)}-${event.id}`);
  }, [event]);

  useEffect(() => {
    if (user && event) {
      const mine = reviews.find(r => r.user_id === user.id);
      if (mine) { setMyReview(mine); setRating(mine.rating); setComment(mine.comment || ""); }
    }
  }, [user, reviews, event]);

  const handleSubmitReview = async () => {
    if (!rating) return;
    setReviewLoading(true);
    const payload = { event_id: event.id, user_id: user.id, rating, comment: comment.trim() || null };
    let error;
    if (myReview) {
      ({ error } = await supabase.from("reviews").update({ rating, comment: comment.trim() || null }).eq("id", myReview.id));
    } else {
      ({ error } = await supabase.from("reviews").insert(payload));
    }
    setReviewLoading(false);
    if (!error) { setReviewDone(true); fetchReviews(event.id); }
  };

  const handleDeleteReview = async () => {
    if (!myReview) return;
    await supabase.from("reviews").delete().eq("id", myReview.id);
    setMyReview(null); setRating(0); setComment(""); setReviewDone(false);
    fetchReviews(event.id);
  };

  // "Me interesa": conteo público vía la misma RPC agregada que usa el home
  // (get_favorites_counts — solo event_id/count, nunca user_id). Como esta
  // página solo muestra un evento, no hace falta filtrar el resultado server-side:
  // es una sola consulta igual, no un query pesado.
  useEffect(() => {
    if (!event) return;
    supabase.rpc("get_favorites_counts").then(({ data, error }) => {
      if (!error && data) {
        const row = data.find(r => r.event_id === event.id);
        setInterestedCount(row ? row.count : 0);
      }
    });
  }, [event]);

  useEffect(() => {
    if (!event || !user) { setInterested(false); return; }
    supabase.from("favorites").select("id").eq("event_id", event.id).then(({ data }) => {
      setInterested(!!(data && data.length > 0));
    });
  }, [event, user]);

  const toggleInterested = async () => {
    if (!user) { navigate("/"); return; }
    if (interested) {
      const { error } = await supabase.from("favorites").delete().eq("event_id", event.id);
      if (!error) {
        setInterested(false);
        setInterestedCount(n => Math.max(0, n - 1));
        showToast("Eliminado de guardados");
      }
    } else {
      const { error } = await supabase.from("favorites").insert({ event_id: event.id });
      if (!error) {
        setInterested(true);
        setInterestedCount(n => n + 1);
        showToast("✓ Marcado — le avisamos al organizador que te interesa");
      }
    }
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f3ef', fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}><div style={{marginBottom:16}}><Drama size={44} color="#C8860A" strokeWidth={1.5} /></div><div style={{color:'#888', fontSize:15}}>{t.eventoLoading}</div></div>
    </div>
  );

  if (notFound) { navigate("/", { replace: true }); return null; }

  const catColor = CAT_COLORS[event.cat] || "#C8860A";
  const tagCfg = event.tag ? TAGS_CONFIG[event.tag] : null;
  const canonicalUrl = `https://www.medellinvibra.co/evento/${slugify(event.title)}-${event.id}`;
  const eventImg = event.imageUrl || "https://pub-c5ba255ea192436da56e91e3ef3ecfa5.r2.dev/default-fallback-medellin";
  const eventDesc = event.desc ? event.desc.slice(0, 155) : `${event.cat} en ${event.place} · ${event.date} · ${event.price}`;

  // Estructura JSON-LD de Evento para Google Search
  const precioLower = (event.price || "").toLowerCase();
  const esGratis = precioLower.startsWith("gratis") || precioLower.startsWith("entrada libre");
  const priceMatch = (event.price || "").match(/[0-9][0-9.,]*/);
  const offerPrice = esGratis ? "0" : (priceMatch ? priceMatch[0].replace(/\./g, "").replace(/,/g, "") : undefined);
  const validFrom = event.createdAt ? new Date(event.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

  const jsonLdData = event.fechaReal ? {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.fechaReal,
    endDate: event.fechaFin || event.fechaReal,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: event.place, address: { "@type": "PostalAddress", addressLocality: "Medellín", addressRegion: "Antioquia", addressCountry: "CO" } },
    image: [eventImg],
    ...(event.desc ? { description: event.desc.slice(0, 300) } : {}),
    // performer viene de events.performer (texto libre, quien se presenta) —
    // distinto de organizer_name (promotor o venue). Se omite si no está
    // lleno, en vez de inventar o reutilizar organizer_name en su lugar.
    ...(event.performer ? { performer: { "@type": "Person", name: event.performer } } : {}),
    organizer: { "@type": "Organization", name: event.organizerName || "Medellín Vibra", url: event.organizerName ? `https://www.medellinvibra.co/organizador/${slugify(event.organizerName)}` : "https://www.medellinvibra.co" },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "COP",
      availability: "https://schema.org/InStock",
      validFrom,
      ...(offerPrice ? { price: offerPrice } : {}),
    },
    ...(esGratis ? { isAccessibleForFree: true } : {}),
  } : null;

  return (
    <div style={{minHeight:'100vh', background:'#f5f3ef', fontFamily:"'DM Sans', sans-serif"}}>
      {/* 🚀 COMPONENTE DE SEO DINÁMICO */}
      <SEO 
        title={`${event.title} — Medellín Vibra`}
        description={eventDesc}
        image={eventImg}
        url={canonicalUrl}
      />

      {/* Script JSON-LD inyectado para Rich Results de Google */}
      {jsonLdData && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLdData)}
        </script>
      )}

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      {isArchived && (
        <div style={{background:'#1a1a1a', color:'white', textAlign:'center', padding:'14px 20px', fontSize:14}}>
          📅 {t.eventoArchivedNotice.replace("{date}", event.date)} <a href="/" style={{color:'#C8860A', fontWeight:700, textDecoration:'none'}}>{t.eventoArchivedLink}</a>
        </div>
      )}

      {/* Header */}
      <div style={{background:'white', borderBottom:'1px solid #e5e1d8', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100}}>
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate(`${langPrefix}/`)} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:8, color:'#C8860A', fontWeight:700, fontSize:14, fontFamily:'inherit'}}>← {t.backLabel}</button>
        <span style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:20, color:'#C8860A', letterSpacing:1}}>MEDELLÍN VIBRA</span>
        <LanguageSelectorCompact lang={lang} onChange={changeLang} />
      </div>

      {/* Hero */}
      <div style={{height:280, background:`linear-gradient(135deg, ${catColor}22, ${catColor}44)`, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center'}}>
        {event.imageUrl ? (
          <><img src={event.imageUrl} alt="" aria-hidden="true" style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'blur(24px) brightness(0.55)', transform:'scale(1.12)'}} /><img src={event.imageUrl} alt={event.title} style={{position:'relative', maxWidth:'100%', maxHeight:'100%', objectFit:'contain', zIndex:1}} /><div style={{position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.30) 100%)', zIndex:1, pointerEvents:'none'}} /></>
        ) : (<span style={{fontSize:100, zIndex:1}}>{event.emoji || "🎭"}</span>)}
        {tagCfg && <div style={{position:'absolute', top:16, right:16, background:tagCfg.color, color:'white', padding:'5px 12px', borderRadius:100, fontSize:12, fontWeight:700, zIndex:2}}>{event.tag}</div>}
        {avgRating && <div style={{position:'absolute', bottom:16, right:16, background:'rgba(0,0,0,0.6)', color:'white', padding:'6px 12px', borderRadius:100, fontSize:13, fontWeight:700, zIndex:2, display:'flex', alignItems:'center', gap:4}}><span style={{color:'#C8860A'}}>★</span> {avgRating} <span style={{opacity:0.7, fontSize:11}}>({reviews.length})</span></div>}
      </div>

      {/* Contenido */}
      <div style={{maxWidth:680, margin:'0 auto', padding:'0 20px 60px', textAlign:'left'}}>
        <div style={{marginTop:24, marginBottom:8}}>
          <span style={{background:catColor, color:'white', padding:'4px 12px', borderRadius:100, fontSize:12, fontWeight:700}}>{t[CAT_LABEL_KEY[event.cat]] || event.cat}</span>
        </div>
        <h1 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:36, lineHeight:1.1, color:'#1a1a1a', margin:'8px 0 20px'}}>{event.title}</h1>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20}}>
          {[["date", t.date, event.date, Calendar],["time", t.time, event.time, Clock],["place", t.place, event.place, MapPin],["price", t.price, event.price, Banknote]]
            .filter(([, , value]) => value && value !== "Por confirmar")
            .map(([field, label, value, Icono]) => (
            <div key={field + label} style={{background:'white', border:'1px solid #e5e1d8', borderRadius:12, padding:'14px 16px'}}>
              <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4, display:'flex', alignItems:'center', gap:5}}><Icono size={12} />{label}</div>
              <div style={{fontSize:14, fontWeight:600, color: field === "price" && value === "Gratis" ? "#059669" : field === "price" ? "#C8860A" : "#1a1a1a"}}>{value}</div>
            </div>
          ))}
        </div>

        {event.desc && (
          <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:14, padding:'20px', marginBottom:16}}>
            <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10}}>{t.aboutEvent}</div>
            <p style={{fontSize:15, lineHeight:1.7, color:'#444', margin:0, whiteSpace:'pre-line'}}>{event.desc}</p>
          </div>
        )}

        <div style={{marginBottom:16}}>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.place)}`} target="_blank" rel="noopener noreferrer"
            style={{display:'flex', alignItems:'center', gap:8, background:'white', border:'1px solid #e5e1d8', borderRadius:12, padding:'14px 16px', textDecoration:'none', color:'#C8860A', fontWeight:600, fontSize:14}}>
            <MapPin size={15} style={{flexShrink:0}} />{t.viewOnMaps.replace("{place}", event.place)}
          </a>
        </div>

        {event.comoLlegar && (
          <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:14, padding:'16px 20px', marginBottom:16}}>
            <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8}}>📍 Cómo llegar</div>
            <p style={{fontSize:14, lineHeight:1.6, color:'#444', margin:0}}>{event.comoLlegar}</p>
          </div>
        )}

        {event.organizerName && (
          <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:14, padding:'16px 20px', marginBottom:16, display:'flex', gap:14, alignItems:'center'}}>
            <div style={{width:44, height:44, borderRadius:'50%', background:'#f5f3ef', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}><User size={20} color="#C8860A" /></div>
            <div>
              <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2}}>{t.organizer}</div>
              <div style={{fontWeight:700, fontSize:14}}>{event.organizerName}</div>
              {event.organizerContact && (event.organizerContact.startsWith("http")
                ? <a href={event.organizerContact} target="_blank" rel="noopener noreferrer" style={{fontSize:13, color:'#C8860A', textDecoration:'none'}}>{event.organizerContact} ↗</a>
                : <div style={{fontSize:13, color:'#C8860A'}}>{event.organizerContact}</div>)}
            </div>
          </div>
        )}

        {event.ticketPlatform && (
          <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:14, padding:'16px 20px', marginBottom:20, display:'flex', gap:14, alignItems:'center', cursor: event.link ? 'pointer' : 'default'}}
            onClick={() => event.link && registrarClic(event.id, event.link, "evento", event.title, event.cat)}>
            <div style={{width:44, height:44, borderRadius:'50%', background:'#f5f3ef', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8860A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg></div>
            <div>
              <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2}}>{t.ticketPlatformLabel}</div>
              <div style={{fontWeight:700, fontSize:14, color:'#C8860A'}}>{event.ticketPlatform} {event.link && "↗"}</div>
            </div>
          </div>
        )}

        <button onClick={() => event.link ? registrarClic(event.id, event.link, "evento", event.title, event.cat) : navigate("/")}
          style={{width:'100%', padding:'16px', background:'#C8860A', color:'white', border:'none', borderRadius:14, fontWeight:700, fontSize:16, cursor:'pointer', fontFamily:'inherit', marginBottom:12}}>
          {event.price === "Gratis" ? t.registerFree : event.link ? `${t.buy} · ${event.price} →` : t.seeMoreEventsBtn}
        </button>

        <button onClick={toggleInterested}
          style={{width:'100%', padding:'13px', background: interested ? '#fef2f2' : 'white', color: interested ? '#E8353A' : '#1a1a1a', border: `1px solid ${interested ? 'rgba(232,53,58,0.3)' : '#e5e1d8'}`, borderRadius:14, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
          <Heart size={15} fill={interested ? '#E8353A' : 'none'} />
          {(interested ? t.saved : t.save).replace('❤️ ','').replace('🤍 ','')}
          <span style={{opacity:0.65}}>· {interestedCount}</span>
        </button>

        <button onClick={() => { if (navigator.share) navigator.share({ title: event.title, url: canonicalUrl }); else navigator.clipboard.writeText(canonicalUrl); }}
          style={{width:'100%', padding:'13px', background:'white', color:'#1a1a1a', border:'1px solid #e5e1d8', borderRadius:14, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit', marginBottom:12}}>
          <Share2 size={15} style={{display:'inline', verticalAlign:'-2px', marginRight:6}} />{t.shareEventBtn}
        </button>

        <button onClick={() => addToCalendar(event)}
          style={{width:'100%', padding:'13px', background:'white', color:'#1a1a1a', border:'1px solid #e5e1d8', borderRadius:14, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit', marginBottom:32, display:'flex', alignItems:'center', justifyContent:'center', gap:6}}>
          <CalendarPlus size={15} />{t.addToCalendarBtn}
        </button>

        {/* SECCIÓN DE RESEÑAS */}
        <div style={{marginTop:8}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
            <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:26, color:'#1a1a1a'}}>
              {t.reviewsTitle} <span style={{color:'#C8860A'}}>{reviews.length > 0 ? `(${reviews.length})` : ''}</span>
            </div>
            {avgRating && (
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <StarRating value={Math.round(parseFloat(avgRating))} readonly />
                <span style={{fontWeight:700, fontSize:18, color:'#C8860A'}}>{avgRating}</span>
              </div>
            )}
          </div>

          {/* Formulario de reseña */}
          {!user ? (
            <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:14, padding:'20px', textAlign:'center', marginBottom:20}}>
              <div style={{marginBottom:8}}><Star size={30} color="#C8860A" /></div>
              <div style={{fontWeight:700, marginBottom:6}}>{t.reviewPrompt}</div>
              <div style={{color:'#888', fontSize:14, marginBottom:16}}>{t.reviewLoginPrompt}</div>
              <button onClick={() => navigate("/")} style={{background:'#C8860A', color:'white', border:'none', padding:'10px 24px', borderRadius:100, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:14}}>
                {t.login} →
              </button>
            </div>
          ) : reviewDone && !myReview ? (
            <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:14, padding:'16px 20px', marginBottom:20, textAlign:'center'}}>
              <div style={{marginBottom:4}}><PartyPopper size={22} color="#059669" /></div>
              <div style={{fontWeight:700, color:'#059669'}}>{t.reviewThanks}</div>
            </div>
          ) : (
            <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:14, padding:'20px', marginBottom:20}}>
              <div style={{fontSize:13, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12}}>
                {myReview ? t.myReviewTitle : t.writeReviewTitle}
              </div>
              <div style={{marginBottom:14}}>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder={t.reviewPlaceholder}
                style={{width:'100%', minHeight:80, padding:'12px', border:'1px solid #e5e1d8', borderRadius:10, fontFamily:'inherit', fontSize:14, resize:'vertical', outline:'none', boxSizing:'border-box', color:'#1a1a1a'}} />
              <div style={{display:'flex', gap:8, marginTop:10}}>
                <button onClick={handleSubmitReview} disabled={!rating || reviewLoading}
                  style={{flex:1, padding:'11px', background: rating ? '#C8860A' : '#ddd', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor: rating ? 'pointer' : 'default', fontFamily:'inherit', fontSize:14}}>
                  {reviewLoading ? t.savingBtn : myReview ? t.updateReviewBtn : t.publishReviewBtn}
                </button>
                {myReview && (
                  <button onClick={handleDeleteReview} style={{padding:'11px 16px', background:'white', color:'#C0392B', border:'1px solid rgba(192,57,43,0.3)', borderRadius:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:14}}>
                    {t.deleteBtn}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Lista de reseñas */}
          {reviews.length === 0 ? (
            <div style={{textAlign:'center', color:'#888', padding:'24px 0', fontSize:14}}>
              {t.noReviewsYet}
            </div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              {reviews.map(r => (
                <div key={r.id} style={{background:'white', border:'1px solid #e5e1d8', borderRadius:14, padding:'16px 20px'}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      <div style={{width:36, height:36, borderRadius:'50%', background:'#C8860A', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, flexShrink:0}}>
                        {(r.user_id === user?.id ? (user?.user_metadata?.full_name || user?.email || "U") : "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontWeight:700, fontSize:13}}>{r.user_id === user?.id ? (user?.user_metadata?.full_name || t.reviewerYou) : t.reviewerAnonymous}</div>
                        <div style={{fontSize:11, color:'#888'}}>{new Date(r.created_at).toLocaleDateString(getLocale(lang), {day:'numeric', month:'long', year:'numeric'})}</div>
                      </div>
                    </div>
                    <StarRating value={r.rating} readonly />
                  </div>
                  {r.comment && <p style={{margin:0, fontSize:14, color:'#444', lineHeight:1.6}}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {hotelRecomendado && (
        <div style={{maxWidth:720, margin:'0 auto', padding:'0 24px'}}>
          <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:14, padding:'18px 20px', marginTop:20, marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap'}}>
            <div>
              <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4}}>{t.hotelRecommendedLabel}</div>
              <div style={{fontWeight:700, fontSize:17}}>{hotelRecomendado.nombre}</div>
            </div>
            <a href={hotelRecomendado.link_reservas} target="_blank" rel="noopener noreferrer" style={{background:'#C8860A', color:'white', padding:'10px 22px', borderRadius:100, fontWeight:700, fontSize:14, textDecoration:'none', whiteSpace:'nowrap'}}>{t.reserveBtn}</a>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{background:'#1a1a1a', padding:'20px 24px', textAlign:'center', marginTop:32}}>
        <a href="/" style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:20, color:'#C8860A', textDecoration:'none', letterSpacing:1}}>MEDELLÍN VIBRA</a>
        <div style={{color:'#666', fontSize:12, marginTop:6}}>© {new Date().getFullYear()} medellinvibra.co</div>
      </div>

      {toast && (
        <div style={{position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#059669', color:'white', padding:'12px 24px', borderRadius:100, fontWeight:700, fontSize:14, zIndex:300, boxShadow:'0 4px 20px rgba(0,0,0,0.15)', whiteSpace:'nowrap'}}>
          {toast}
        </div>
      )}
    </div>
  );
}