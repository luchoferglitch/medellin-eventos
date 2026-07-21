import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { Calendar, Clock, MapPin, Banknote, User, Share2, CalendarPlus, Search, Star, PartyPopper, Drama } from "lucide-react";

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, [])

  useEffect(() => {
    supabase.from("hoteles_recomendados").select("*").eq("activo", true).order("orden", { ascending: true }).limit(1)
      .then(({ data }) => { if (data && data.length > 0) setHotelRecomendado(data[0]); });
  }, []);;

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
    date: e.date, time: e.time, place: e.place, price: e.price,
    tag: e.tag, desc: e.description, ticketPlatform: e.ticket_platform,
    link: e.ticket_link, organizerName: e.organizer_name,
    organizerContact: e.organizer_contact, imageUrl: e.image_url,
    fechaReal: e.fecha_real, zona: e.zona,
  });

  const updateMetaTags = (e) => {
    document.title = `${e.title} — Medellín Vibra`;
    const setMeta = (sel, content) => {
      let el = document.querySelector(sel);
      if (!el) { el = document.createElement("meta"); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    const url = window.location.href;
    const img = e.image_url || "https://pub-c5ba255ea192436da56e91e3ef3ecfa5.r2.dev/default-fallback-medellin";
    const desc = e.description ? e.description.slice(0, 155) : `${e.category} en ${e.place} · ${e.date} · ${e.price}`;
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', `${e.title} — Medellín Vibra`);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[property="og:image"]', img);
    setMeta('meta[property="og:url"]', url);
    setMeta('meta[property="og:type"]', "event");
    setMeta('meta[name="twitter:card"]', "summary_large_image");
    setMeta('meta[name="twitter:title"]', `${e.title} — Medellín Vibra`);
    setMeta('meta[name="twitter:description"]', desc);
    setMeta('meta[name="twitter:image"]', img);

    // Canonical dinamico: cada evento debe apuntar a su propia URL, no al home
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) { canonicalEl = document.createElement("link"); canonicalEl.setAttribute("rel", "canonical"); document.head.appendChild(canonicalEl); }
    canonicalEl.setAttribute("href", url);

    // JSON-LD Event (schema.org) — habilita resultados enriquecidos de eventos en Google
    const oldLd = document.getElementById("event-jsonld");
    if (oldLd) oldLd.remove();
    if (e.fecha_real) {
      const organizerName = e.organizer_name || "Medellín Vibra";
      const organizerUrl = e.organizer_name
        ? `https://www.medellinvibra.co/organizador/${slugify(e.organizer_name)}`
        : "https://www.medellinvibra.co";
      const esGratis = (e.price || "").toLowerCase().startsWith("gratis");
      const priceMatch = (e.price || "").match(/[0-9][0-9.,]*/);
      const offerPrice = esGratis ? "0" : (priceMatch ? priceMatch[0].replace(/\./g, "").replace(/,/g, "") : undefined);
      const validFrom = e.created_at ? new Date(e.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
      const ld = {
        "@context": "https://schema.org",
        "@type": "Event",
        name: e.title,
        startDate: e.fecha_real,
        endDate: e.fecha_fin || e.fecha_real,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: { "@type": "Place", name: e.place, address: { "@type": "PostalAddress", addressLocality: "Medellín", addressRegion: "Antioquia", addressCountry: "CO" } },
        ...(e.image_url ? { image: [e.image_url] } : {}),
        ...(e.description ? { description: e.description.slice(0, 300) } : {}),
        performer: { "@type": "PerformingGroup", name: organizerName },
        organizer: { "@type": "Organization", name: organizerName, url: organizerUrl },
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "COP",
          availability: "https://schema.org/InStock",
          validFrom,
          ...(offerPrice ? { price: offerPrice } : {}),
        },
        ...(esGratis ? { isAccessibleForFree: true } : {}),
      };
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.id = "event-jsonld";
      s.textContent = JSON.stringify(ld);
      document.head.appendChild(s);
    }
  };

  useEffect(() => {
    const handleFoundRow = (data) => {
      if (!data || data.estado === "pendiente") { setNotFound(true); return; }
      if (data.estado === "archivado") {
        setEvent(mapEvent(data));
        setIsArchived(true);
        updateMetaTags(data);
        return;
      }
      setEvent(mapEvent(data));
      updateMetaTags(data);
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

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f3ef', fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}><div style={{marginBottom:16}}><Drama size={44} color="#C8860A" strokeWidth={1.5} /></div><div style={{color:'#888', fontSize:15}}>Cargando evento…</div></div>
    </div>
  );

  if (notFound) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f3ef', fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{marginBottom:16}}><Search size={56} color="#bbb" strokeWidth={1.5} /></div>
        <div style={{fontWeight:700, fontSize:22, marginBottom:8}}>Evento no encontrado</div>
        <div style={{color:'#888', marginBottom:24}}>Este evento no existe o ya fue archivado.</div>
        <button onClick={() => navigate("/")} style={{background:'#C8860A', color:'white', border:'none', padding:'12px 24px', borderRadius:100, fontWeight:700, cursor:'pointer', fontSize:15}}>Ver todos los eventos →</button>
      </div>
    </div>
  );

  const catColor = CAT_COLORS[event.cat] || "#C8860A";
  const tagCfg = event.tag ? TAGS_CONFIG[event.tag] : null;
  const canonicalUrl = `https://www.medellinvibra.co/evento/${slugify(event.title)}-${event.id}`;

  return (
    <div style={{minHeight:'100vh', background:'#f5f3ef', fontFamily:"'DM Sans', sans-serif"}}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      {isArchived && (
        <div style={{background:'#1a1a1a', color:'white', textAlign:'center', padding:'14px 20px', fontSize:14}}>
          📅 Este evento ya finalizó ({event.date}). <a href="/" style={{color:'#C8860A', fontWeight:700, textDecoration:'none'}}>Descubre los próximos eventos en Medellín →</a>
        </div>
      )}

      {/* Header */}
      <div style={{background:'white', borderBottom:'1px solid #e5e1d8', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100}}>
        <button onClick={() => navigate("/")} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:8, color:'#C8860A', fontWeight:700, fontSize:14, fontFamily:'inherit'}}>← Volver</button>
        <span style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:20, color:'#C8860A', letterSpacing:1}}>MEDELLÍN VIBRA</span>
        <div style={{width:60}} />
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
          <span style={{background:catColor, color:'white', padding:'4px 12px', borderRadius:100, fontSize:12, fontWeight:700}}>{event.cat}</span>
        </div>
        <h1 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:36, lineHeight:1.1, color:'#1a1a1a', margin:'8px 0 20px'}}>{event.title}</h1>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20}}>
          {[["Fecha", event.date, Calendar],["Hora", event.time, Clock],["Lugar", event.place, MapPin],["Precio", event.price, Banknote]]
            .filter(([, value]) => value && value !== "Por confirmar")
            .map(([label, value, Icono]) => (
            <div key={label} style={{background:'white', border:'1px solid #e5e1d8', borderRadius:12, padding:'14px 16px'}}>
              <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4, display:'flex', alignItems:'center', gap:5}}><Icono size={12} />{label}</div>
              <div style={{fontSize:14, fontWeight:600, color: label === "Precio" && value === "Gratis" ? "#059669" : label === "Precio" ? "#C8860A" : "#1a1a1a"}}>{value}</div>
            </div>
          ))}
        </div>

        {event.desc && (
          <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:14, padding:'20px', marginBottom:16}}>
            <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10}}>Acerca del evento</div>
            <p style={{fontSize:15, lineHeight:1.7, color:'#444', margin:0, whiteSpace:'pre-line'}}>{event.desc}</p>
          </div>
        )}

        <div style={{marginBottom:16}}>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.place)}`} target="_blank" rel="noopener noreferrer"
            style={{display:'flex', alignItems:'center', gap:8, background:'white', border:'1px solid #e5e1d8', borderRadius:12, padding:'14px 16px', textDecoration:'none', color:'#C8860A', fontWeight:600, fontSize:14}}>
            <MapPin size={15} style={{flexShrink:0}} />Ver ubicación en Google Maps · {event.place} ↗
          </a>
        </div>

        {event.organizerName && (
          <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:14, padding:'16px 20px', marginBottom:16, display:'flex', gap:14, alignItems:'center'}}>
            <div style={{width:44, height:44, borderRadius:'50%', background:'#f5f3ef', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}><User size={20} color="#C8860A" /></div>
            <div>
              <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2}}>Organizador</div>
              <div style={{fontWeight:700, fontSize:14}}>{event.organizerName}</div>
              {event.organizerContact && (event.organizerContact.startsWith("http")
                ? <a href={event.organizerContact} target="_blank" rel="noopener noreferrer" style={{fontSize:13, color:'#C8860A', textDecoration:'none'}}>{event.organizerContact} ↗</a>
                : <div style={{fontSize:13, color:'#C8860A'}}>{event.organizerContact}</div>)}
            </div>
          </div>
        )}

        {event.ticketPlatform && (
          <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:14, padding:'16px 20px', marginBottom:20, display:'flex', gap:14, alignItems:'center', cursor: event.link ? 'pointer' : 'default'}}
            onClick={() => event.link && window.open(event.link, "_blank")}>
            <div style={{width:44, height:44, borderRadius:'50%', background:'#f5f3ef', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8860A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg></div>
            <div>
              <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2}}>Plataforma de tickets</div>
              <div style={{fontWeight:700, fontSize:14, color:'#C8860A'}}>{event.ticketPlatform} {event.link && "↗"}</div>
            </div>
          </div>
        )}

        <button onClick={() => event.link ? window.open(event.link, "_blank") : navigate("/")}
          style={{width:'100%', padding:'16px', background:'#C8860A', color:'white', border:'none', borderRadius:14, fontWeight:700, fontSize:16, cursor:'pointer', fontFamily:'inherit', marginBottom:12}}>
          {event.price === "Gratis" ? "Registro gratuito →" : event.link ? `Comprar entradas · ${event.price} →` : "Ver más eventos →"}
        </button>

        <button onClick={() => { const text = `${event.title} — ${event.date} en ${event.place}\n${canonicalUrl}`; if (navigator.share) navigator.share({ title: event.title, url: canonicalUrl }); else navigator.clipboard.writeText(text); }}
          style={{width:'100%', padding:'13px', background:'white', color:'#1a1a1a', border:'1px solid #e5e1d8', borderRadius:14, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit', marginBottom:12}}>
          <Share2 size={15} style={{display:'inline', verticalAlign:'-2px', marginRight:6}} />Compartir evento
        </button>

        <button onClick={() => addToCalendar(event)}
          style={{width:'100%', padding:'13px', background:'white', color:'#1a1a1a', border:'1px solid #e5e1d8', borderRadius:14, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit', marginBottom:32, display:'flex', alignItems:'center', justifyContent:'center', gap:6}}>
          <CalendarPlus size={15} />Agregar al calendario
        </button>

        {/* SECCIÓN DE RESEÑAS */}
        <div style={{marginTop:8}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
            <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:26, color:'#1a1a1a'}}>
              Reseñas <span style={{color:'#C8860A'}}>{reviews.length > 0 ? `(${reviews.length})` : ''}</span>
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
              <div style={{fontWeight:700, marginBottom:6}}>¿Fuiste a este evento?</div>
              <div style={{color:'#888', fontSize:14, marginBottom:16}}>Inicia sesión para dejar tu reseña</div>
              <button onClick={() => navigate("/")} style={{background:'#C8860A', color:'white', border:'none', padding:'10px 24px', borderRadius:100, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:14}}>
                Iniciar sesión →
              </button>
            </div>
          ) : reviewDone && !myReview ? (
            <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:14, padding:'16px 20px', marginBottom:20, textAlign:'center'}}>
              <div style={{marginBottom:4}}><PartyPopper size={22} color="#059669" /></div>
              <div style={{fontWeight:700, color:'#059669'}}>¡Gracias por tu reseña!</div>
            </div>
          ) : (
            <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:14, padding:'20px', marginBottom:20}}>
              <div style={{fontSize:13, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12}}>
                {myReview ? "Tu reseña" : "Deja tu reseña"}
              </div>
              <div style={{marginBottom:14}}>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Cuéntanos cómo estuvo el evento (opcional)"
                style={{width:'100%', minHeight:80, padding:'12px', border:'1px solid #e5e1d8', borderRadius:10, fontFamily:'inherit', fontSize:14, resize:'vertical', outline:'none', boxSizing:'border-box', color:'#1a1a1a'}} />
              <div style={{display:'flex', gap:8, marginTop:10}}>
                <button onClick={handleSubmitReview} disabled={!rating || reviewLoading}
                  style={{flex:1, padding:'11px', background: rating ? '#C8860A' : '#ddd', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor: rating ? 'pointer' : 'default', fontFamily:'inherit', fontSize:14}}>
                  {reviewLoading ? "Guardando…" : myReview ? "Actualizar reseña" : "Publicar reseña"}
                </button>
                {myReview && (
                  <button onClick={handleDeleteReview} style={{padding:'11px 16px', background:'white', color:'#C0392B', border:'1px solid rgba(192,57,43,0.3)', borderRadius:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:14}}>
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Lista de reseñas */}
          {reviews.length === 0 ? (
            <div style={{textAlign:'center', color:'#888', padding:'24px 0', fontSize:14}}>
              Aún no hay reseñas. ¡Sé el primero en opinar!
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
                        <div style={{fontWeight:700, fontSize:13}}>{r.user_id === user?.id ? (user?.user_metadata?.full_name || "Tú") : "Usuario"}</div>
                        <div style={{fontSize:11, color:'#888'}}>{new Date(r.created_at).toLocaleDateString('es-CO', {day:'numeric', month:'long', year:'numeric'})}</div>
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
              <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4}}>Hotel recomendado en Medellín</div>
              <div style={{fontWeight:700, fontSize:17}}>{hotelRecomendado.nombre}</div>
            </div>
            <a href={hotelRecomendado.link_reservas} target="_blank" rel="noopener noreferrer" style={{background:'#C8860A', color:'white', padding:'10px 22px', borderRadius:100, fontWeight:700, fontSize:14, textDecoration:'none', whiteSpace:'nowrap'}}>Reservar →</a>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{background:'#1a1a1a', padding:'20px 24px', textAlign:'center', marginTop:32}}>
        <a href="/" style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:20, color:'#C8860A', textDecoration:'none', letterSpacing:1}}>MEDELLÍN VIBRA</a>
        <div style={{color:'#666', fontSize:12, marginTop:6}}>© {new Date().getFullYear()} medellinvibra.co</div>
      </div>
    </div>
  );
}


