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

export default function EventoPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      // Extraer el ID del slug (formato: titulo-del-evento-ID)
      const parts = slug.split("-");
      const id = parts[parts.length - 1];

      let query;
      if (!isNaN(id) && id.length > 0) {
        // Si el último segmento es un número, buscar por ID
        query = supabase.from("events").select("*").eq("id", id).eq("estado", "aprobado").single();
      } else {
        // Buscar por title slugificado
        const { data: all } = await supabase.from("events").select("*").eq("estado", "aprobado");
        const match = all?.find(e => slugify(e.title) === slug || slug.endsWith(slugify(e.title)));
        if (match) {
          setEvent(mapEvent(match));
          updateMetaTags(match);
          setLoading(false);
          return;
        }
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data, error } = await query;
      if (error || !data) {
        setNotFound(true);
      } else {
        setEvent(mapEvent(data));
        updateMetaTags(data);
      }
      setLoading(false);
    };

    fetchEvent();
  }, [slug]);

  const mapEvent = (e) => ({
    id: e.id,
    emoji: e.emoji,
    title: e.title,
    cat: e.category,
    date: e.date,
    time: e.time,
    place: e.place,
    price: e.price,
    tag: e.tag,
    desc: e.description,
    ticketPlatform: e.ticket_platform,
    link: e.ticket_link,
    organizerName: e.organizer_name,
    organizerContact: e.organizer_contact,
    imageUrl: e.image_url,
    fechaReal: e.fecha_real,
    zona: e.zona,
  });

  const updateMetaTags = (e) => {
    // Título
    document.title = `${e.title} — Medellín Vibra`;

    // Helpers
    const setMeta = (sel, content) => {
      let el = document.querySelector(sel);
      if (!el) { el = document.createElement("meta"); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };

    const url = window.location.href;
    const img = e.image_url || "https://www.medellinvibra.co/og-default.jpg";
    const desc = e.description
      ? e.description.slice(0, 155)
      : `${e.category} en ${e.place} · ${e.date} · ${e.price}`;

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
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:48, marginBottom:16}}>🎭</div>
        <div style={{color:'#888', fontSize:15}}>Cargando evento…</div>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f3ef', fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:64, marginBottom:16}}>🔍</div>
        <div style={{fontWeight:700, fontSize:22, marginBottom:8}}>Evento no encontrado</div>
        <div style={{color:'#888', marginBottom:24}}>Este evento no existe o ya fue archivado.</div>
        <button onClick={() => navigate("/")} style={{background:'#C8860A', color:'white', border:'none', padding:'12px 24px', borderRadius:100, fontWeight:700, cursor:'pointer', fontSize:15}}>
          Ver todos los eventos →
        </button>
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
        <button onClick={() => navigate("/")} style={{background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:8, color:'#C8860A', fontWeight:700, fontSize:14, fontFamily:'inherit'}}>
          ← Volver
        </button>
        <span style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:20, color:'#C8860A', letterSpacing:1}}>MEDELLÍN VIBRA</span>
        <div style={{width:60}} />
      </div>

      {/* Hero imagen */}
      <div style={{height:280, background:`linear-gradient(135deg, ${catColor}22, ${catColor}44)`, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center'}}>
        {event.imageUrl ? (
          <>
            <img src={event.imageUrl} alt={event.title} style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover'}} />
            <div style={{position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.7) 100%)'}} />
          </>
        ) : (
          <span style={{fontSize:100, zIndex:1}}>{event.emoji || "🎭"}</span>
        )}
        {tagCfg && (
          <div style={{position:'absolute', top:16, right:16, background:tagCfg.color, color:'white', padding:'5px 12px', borderRadius:100, fontSize:12, fontWeight:700, zIndex:2}}>
            {tagCfg.emoji} {event.tag}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div style={{maxWidth:680, margin:'0 auto', padding:'0 20px 60px'}}>

        {/* Categoría + título */}
        <div style={{marginTop:24, marginBottom:8}}>
          <span style={{background:catColor, color:'white', padding:'4px 12px', borderRadius:100, fontSize:12, fontWeight:700}}>{event.cat}</span>
        </div>
        <h1 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:36, lineHeight:1.1, color:'#1a1a1a', margin:'8px 0 20px'}}>{event.title}</h1>

        {/* Info grid */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20}}>
          {[
            ["📅 Fecha", event.date],
            ["⏰ Hora", event.time || "Por confirmar"],
            ["📍 Lugar", event.place],
            ["💰 Precio", event.price],
          ].map(([label, value]) => (
            <div key={label} style={{background:'white', border:'1px solid #e5e1d8', borderRadius:12, padding:'14px 16px'}}>
              <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4}}>{label}</div>
              <div style={{fontSize:14, fontWeight:600, color: label.includes("Precio") && value === "Gratis" ? "#059669" : label.includes("Precio") ? "#C8860A" : "#1a1a1a'"}}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Descripción */}
        {event.desc && (
          <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:14, padding:'20px', marginBottom:16}}>
            <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10}}>Acerca del evento</div>
            <p style={{fontSize:15, lineHeight:1.7, color:'#444', margin:0, whiteSpace:'pre-line'}}>{event.desc}</p>
          </div>
        )}

        {/* Mapa */}
        <div style={{marginBottom:16}}>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.place)}`} target="_blank" rel="noopener noreferrer"
            style={{display:'flex', alignItems:'center', gap:8, background:'white', border:'1px solid #e5e1d8', borderRadius:12, padding:'14px 16px', textDecoration:'none', color:'#C8860A', fontWeight:600, fontSize:14}}>
            📍 Ver ubicación en Google Maps · {event.place} ↗
          </a>
        </div>

        {/* Organizador */}
        {event.organizerName && (
          <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:14, padding:'16px 20px', marginBottom:16, display:'flex', gap:14, alignItems:'center'}}>
            <div style={{width:44, height:44, borderRadius:'50%', background:'#f5f3ef', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0}}>👤</div>
            <div>
              <div style={{fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2}}>Organizador</div>
              <div style={{fontWeight:700, fontSize:14}}>{event.organizerName}</div>
              {event.organizerContact && (
                event.organizerContact.startsWith("http")
                  ? <a href={event.organizerContact} target="_blank" rel="noopener noreferrer" style={{fontSize:13, color:'#C8860A', textDecoration:'none'}}>{event.organizerContact} ↗</a>
                  : <div style={{fontSize:13, color:'#C8860A'}}>{event.organizerContact}</div>
              )}
            </div>
          </div>
        )}

        {/* Plataforma de tickets */}
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

        {/* CTA principal */}
        <button
          onClick={() => event.link ? window.open(event.link, "_blank") : navigate("/")}
          style={{width:'100%', padding:'16px', background:'#C8860A', color:'white', border:'none', borderRadius:14, fontWeight:700, fontSize:16, cursor:'pointer', fontFamily:'inherit', marginBottom:12}}
        >
          {event.price === "Gratis" ? "🎟️ Registro gratuito" : event.link ? `Comprar entradas · ${event.price} →` : "Ver más eventos →"}
        </button>

        {/* Compartir */}
        <button
          onClick={() => {
            const text = `${event.title} — ${event.date} en ${event.place}\n${canonicalUrl}`;
            if (navigator.share) navigator.share({ title: event.title, url: canonicalUrl });
            else { navigator.clipboard.writeText(text); }
          }}
          style={{width:'100%', padding:'13px', background:'white', color:'#1a1a1a', border:'1px solid #e5e1d8', borderRadius:14, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit'}}
        >
          📤 Compartir evento
        </button>
      </div>

      {/* Footer */}
      <div style={{background:'#1a1a1a', padding:'20px 24px', textAlign:'center'}}>
        <a href="/" style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:20, color:'#C8860A', textDecoration:'none', letterSpacing:1}}>MEDELLÍN VIBRA</a>
        <div style={{color:'#666', fontSize:12, marginTop:6}}>© {new Date().getFullYear()} medellinvibra.co</div>
      </div>
    </div>
  );
}
