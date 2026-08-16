import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const slugify = (str) =>
  str?.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-")
    .slice(0, 80) || "";

const CAT_COLORS = {
  "Música": "#7C3AED", "Arte": "#EA580C", "Comedia": "#D97706",
  "Tech": "#2563EB", "Baile": "#DB2777", "Deportes": "#16A34A",
  "Teatro": "#DC2626", "Gastronomía": "#C2410C", "Bienestar": "#059669",
  "Académicos": "#0369A1",
};

export default function OrganizadorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [organizerName, setOrganizerName] = useState("");

  useEffect(() => {
    const fetchOrgEvents = async () => {
      setLoading(true);
      // Traer eventos aprobados y archivados (no pendientes) y filtrar por slug del
      // organizador. Incluir archivados evita que un organizador cuyo único evento ya
      // pasó caiga en el bloque "no encontrado": conserva su nombre y su historial en
      // "Eventos pasados", mismo criterio que ya aplicamos en EventoPage con "Ya finalizó".
      const { data } = await supabase
        .from("events")
        .select("*")
        .in("estado", ["aprobado", "archivado"])
        .order("fecha_real", { ascending: true });

      if (data) {
        const matched = data.filter(e => e.organizer_name && slugify(e.organizer_name) === slug);
        setEvents(matched);
        const name = matched.length > 0 ? matched[0].organizer_name : "";
        setOrganizerName(name);

        // El canonical debe apuntar siempre a la página propia del organizador,
        // exista o no un evento activo para mostrar (si no, queda con el canonical
        // de la página anterior y Search Console lo marca como duplicado).
        document.title = name ? `${name} — Medellín Vibra` : "Organizador — Medellín Vibra";
        let canonicalEl = document.querySelector('link[rel="canonical"]');
        if (!canonicalEl) { canonicalEl = document.createElement("link"); canonicalEl.setAttribute("rel", "canonical"); document.head.appendChild(canonicalEl); }
        const canonicalUrl = `https://www.medellinvibra.co/organizador/${slug}`;
        canonicalEl.setAttribute("href", canonicalUrl);
        let ogUrl = document.querySelector('meta[property="og:url"]'); if (!ogUrl) { ogUrl = document.createElement("meta"); ogUrl.setAttribute("property","og:url"); document.head.appendChild(ogUrl); } ogUrl.setAttribute("content", canonicalUrl);
        let ogTitle = document.querySelector('meta[property="og:title"]'); if (!ogTitle) { ogTitle = document.createElement("meta"); ogTitle.setAttribute("property","og:title"); document.head.appendChild(ogTitle); } ogTitle.setAttribute("content", name ? `${name} — Medellín Vibra` : "Organizador — Medellín Vibra");
        let ogDesc = document.querySelector('meta[property="og:description"]'); if (!ogDesc) { ogDesc = document.createElement("meta"); ogDesc.setAttribute("property","og:description"); document.head.appendChild(ogDesc); } ogDesc.setAttribute("content", name ? `Eventos de ${name} en Medellín Vibra — la agenda cultural de Medellín y la región.` : "Página de organizador en Medellín Vibra — la agenda cultural de Medellín y la región.");
      }
      setLoading(false);
    };
    fetchOrgEvents();
  }, [slug]);

  const upcoming = events.filter(e => !e.fecha_real || new Date(e.fecha_real) >= new Date());
  const past = events.filter(e => e.fecha_real && new Date(e.fecha_real) < new Date());

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f3ef', fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:48, marginBottom:16}}>👤</div>
        <div style={{color:'#888', fontSize:15}}>Cargando organizador…</div>
      </div>
    </div>
  );

  // Con la query trayendo aprobados + archivados, este bloque solo se alcanza para
  // slugs que nunca tuvieron ningún evento (caso genuino de "no encontrado"). Un
  // organizador con historial, aunque esté todo archivado, sigue de largo hacia el
  // perfil normal y aparece en "Eventos pasados".
  if (events.length === 0) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f3ef', fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:64, marginBottom:16}}>🔍</div>
        <div style={{fontWeight:700, fontSize:22, marginBottom:8}}>Organizador no encontrado</div>
        <div style={{color:'#888', marginBottom:24}}>Este organizador no tiene eventos registrados en Medellín Vibra.</div>
        <button onClick={() => navigate("/")} style={{background:'#C8860A', color:'white', border:'none', padding:'12px 24px', borderRadius:100, fontWeight:700, cursor:'pointer', fontSize:15}}>
          Ver todos los eventos →
        </button>
      </div>
    </div>
  );

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
          <div style={{fontWeight:700, fontSize:13, color: ev.price === 'Gratis' ? '#059669' : '#C8860A'}}>{ev.price}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{minHeight:'100vh', background:'#f5f3ef', fontFamily:"'DM Sans', sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{background:'white', borderBottom:'1px solid #e5e1d8', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100}}>
        <button onClick={() => navigate("/")} style={{background:'none', border:'none', cursor:'pointer', color:'#C8860A', fontWeight:700, fontSize:14, fontFamily:'inherit'}}>
          ← Volver
        </button>
        <span style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:20, color:'#C8860A', letterSpacing:1}}>MEDELLÍN VIBRA</span>
        <div style={{width:60}} />
      </div>

      {/* Hero del organizador */}
      <div style={{background:'linear-gradient(135deg, #1a1a1a, #2a2a2a)', padding:'40px 24px', textAlign:'center'}}>
        <div style={{width:80, height:80, borderRadius:'50%', background:'#C8860A', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontWeight:700, margin:'0 auto 16px', fontFamily:"'Bebas Neue', sans-serif"}}>
          {organizerName[0]?.toUpperCase()}
        </div>
        <h1 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:32, color:'white', margin:'0 0 8px', letterSpacing:1}}>{organizerName}</h1>
        <div style={{color:'rgba(255,255,255,0.6)', fontSize:14}}>
          {events.length} evento{events.length !== 1 ? 's' : ''} publicado{events.length !== 1 ? 's' : ''} en Medellín Vibra
        </div>
        <div style={{display:'flex', gap:16, justifyContent:'center', marginTop:16}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:28, color:'#C8860A'}}>{upcoming.length}</div>
            <div style={{color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:600}}>PRÓXIMOS</div>
          </div>
          <div style={{width:1, background:'rgba(255,255,255,0.1)'}} />
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:28, color:'#888'}}>{past.length}</div>
            <div style={{color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:600}}>PASADOS</div>
          </div>
        </div>
      </div>

      {/* Eventos próximos */}
      <div style={{maxWidth:680, margin:'0 auto', padding:'24px 20px 60px'}}>
        {upcoming.length > 0 && (
          <>
            <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:22, color:'#1a1a1a', marginBottom:16}}>
              Próximos eventos
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:32}}>
              {upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}
            </div>
          </>
        )}

        {past.length > 0 && (
          <>
            <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:22, color:'#888', marginBottom:16}}>
              Eventos pasados
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, opacity:0.7}}>
              {past.map(ev => <EventCard key={ev.id} ev={ev} />)}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{background:'#1a1a1a', padding:'20px 24px', textAlign:'center'}}>
        <a href="/" style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:20, color:'#C8860A', textDecoration:'none', letterSpacing:1}}>MEDELLÍN VIBRA</a>
        <div style={{color:'#666', fontSize:12, marginTop:6}}>© {new Date().getFullYear()} medellinvibra.co</div>
      </div>
    </div>
  );
}
