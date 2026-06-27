import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

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
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      const parts = slug.split("-");
      const id = parts[parts.length - 1];
      let query;
      if (!isNaN(id) && id.length > 0) {
        query = supabase.from("events").select("*").eq("id", id).eq("estado", "aprobado").single();
      } else {
        const { data: all } = await supabase.from("events").select("*").eq("estado", "aprobado");
        const match = all?.find(e => slugify(e.title) === slug || slug.endsWith(slugify(e.title)));
        if (match) { setEvent(mapEvent(match)); updateMetaTags(match); setLoading(false); return; }
        setNotFound(true); setLoading(false); return;
      }
      const { data, error } = await query;
      if (error || !data) { setNotFound(true); }
      else { setEvent(mapEvent(data)); updateMetaTags(data); fetchReviews(data.id); }
      setLoading(false);
    };
    fetchEvent();
  }, [slug]);

  const fetchReviews = async (eventId) => {
    const { data } = await supabase
      .from("reviews")
      .select("*, auth.users(email)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (data) setReviews(data);
  };

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
    const img = e.image_url || "https://i.imgur.com/gcIvQUD.jpg";
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
  };

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f3ef', fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}><div style={{fontSize:48, marginBottom:16}}>🎭</div><div style={{color:'#888', fontSize:15}}>Cargando evento…</div></div>
    </div>
  );

  if (notFound) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f3ef', fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:64, marginBottom:16}}>🔍</div>
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

      {/* Header */}
      <div style={{background:'white', borderBottom:'1px solid #e5e1d8', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100}}>
        <button onClick={() => navigate("/")} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:8, color:'#C8860A', fontWeight:700, fontSize:14, fontFamily:'inherit'}}>← Volver</button>
        <span style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:20, color:'#C8860A', letterSpacing:1}}>MEDELLÍN VIBRA</span>
        <div style={{width:60}} />
      </div>

      {/* Hero */}
      <div style={{height:280, background:`linear-gradient(135deg, ${catColor}22, ${catColor}44)`, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center'}}>
        {event.imageUrl ? (
          <><img src={event.imageUrl} alt={event.title} style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover'}} /><div style={{position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.7) 100%)'}} /></>
        ) : (<span style={{fontSize:100, zIndex:1}}>{event.emoji || "🎭"}</span>)}
        {tagCfg && <div style={{position:'absolute', top:16, right:16, background:tagCfg.color, color:'white', padding:'5px 12px', borderRadius:100, fontSize:12, fontWeight:700, zIndex:2}}>{tagCfg.emoji} {event.tag}</div>}
        {avgRating && <div style={{position:'absolute', bottom:16, right:16, background:'rgba(0,0,0,0.6)', color:'white', padding:'6px 12px', borderRadius:100, fontSize:13, fontWeight:700, zIndex:2, display:'flex', alignItems:'center', gap:4}}><span style={{color:'#C8860A'}}>★</span> {avgRating} <span style={{opacity:0.7, fontSize:11}}>({reviews.length})</span></div>}
      </div>

      {/* Contenido */}
      <div style={{maxWidth:680, margin:'0 auto', padding:'0 20px 60px'}}>
        <div style={{marginTop:24, marginBottom:8}}>
          <span style={{background:catColor, color:'white', padding:'4px 12px', borderRadius:100, fontSize:12, fontWeight:700}}>{event.cat}</span>
        </div>
        <h1 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:36, lineHeight:1.1, color:'#1a1a1a', margin:'8px 0 20px'}}>{event.title}</h1>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20}}>
          {[["📅 Fecha", event.date],["⏰ Hora", event.time || "Por confirmar"],["📍 Lugar", event.place],["💰 Precio", event.price]].map(([label, value]) => (
            <div key={label} style={{background:'white', border:'1px solid #e5e1d8', borderRadius:12, padding:'14px 16px'}}>
              <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4}}>{label}</div>
              <div style={{fontSize:14, fontWeight:600, color: label.includes("Precio") && value === "Gratis" ? "#059669" : label.includes("Precio") ? "#C8860A" : "#1a1a1a"}}>{value}</div>
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
            📍 Ver ubicación en Google Maps · {event.place} ↗
          </a>
        </div>

        {event.organizerName && (
          <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:14, padding:'16px 20px', marginBottom:16, display:'flex', gap:14, alignItems:'center'}}>
            <div style={{width:44, height:44, borderRadius:'50%', background:'#f5f3ef', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0}}>👤</div>
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
            <div style={{width:44, height:44, borderRadius:'50%', background:'#f5f3ef', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0}}>🎟️</div>
            <div>
              <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2}}>Plataforma de tickets</div>
              <div style={{fontWeight:700, fontSize:14, color:'#C8860A'}}>{event.ticketPlatform} {event.link && "↗"}</div>
            </div>
          </div>
        )}

        <button onClick={() => event.link ? window.open(event.link, "_blank") : navigate("/")}
          style={{width:'100%', padding:'16px', background:'#C8860A', color:'white', border:'none', borderRadius:14, fontWeight:700, fontSize:16, cursor:'pointer', fontFamily:'inherit', marginBottom:12}}>
          {event.price === "Gratis" ? "🎟️ Registro gratuito" : event.link ? `Comprar entradas · ${event.price} →` : "Ver más eventos →"}
        </button>

        <button onClick={() => { const text = `${event.title} — ${event.date} en ${event.place}\n${canonicalUrl}`; if (navigator.share) navigator.share({ title: event.title, url: canonicalUrl }); else navigator.clipboard.writeText(text); }}
          style={{width:'100%', padding:'13px', background:'white', color:'#1a1a1a', border:'1px solid #e5e1d8', borderRadius:14, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit', marginBottom:32}}>
          📤 Compartir evento
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
              <div style={{fontSize:32, marginBottom:8}}>⭐</div>
              <div style={{fontWeight:700, marginBottom:6}}>¿Fuiste a este evento?</div>
              <div style={{color:'#888', fontSize:14, marginBottom:16}}>Inicia sesión para dejar tu reseña</div>
              <button onClick={() => navigate("/")} style={{background:'#C8860A', color:'white', border:'none', padding:'10px 24px', borderRadius:100, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:14}}>
                Iniciar sesión →
              </button>
            </div>
          ) : reviewDone && !myReview ? (
            <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:14, padding:'16px 20px', marginBottom:20, textAlign:'center'}}>
              <div style={{fontSize:24, marginBottom:4}}>🎉</div>
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

      {/* Footer */}
      <div style={{background:'#1a1a1a', padding:'20px 24px', textAlign:'center', marginTop:32}}>
        <a href="/" style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:20, color:'#C8860A', textDecoration:'none', letterSpacing:1}}>MEDELLÍN VIBRA</a>
        <div style={{color:'#666', fontSize:12, marginTop:6}}>© {new Date().getFullYear()} medellinvibra.co</div>
      </div>
    </div>
  );
}


