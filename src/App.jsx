import { useState } from "react";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --gold: #F5A623;
    --red: #E8353A;
    --green: #00C48C;
    --dark: #0D0D0D;
    --surface: #161616;
    --surface2: #1F1F1F;
    --border: rgba(255,255,255,0.08);
    --text: #F0EDE8;
    --muted: #888;
    --font-display: 'Bebas Neue', sans-serif;
    --font-body: 'DM Sans', sans-serif;
  }

  body { background: var(--dark); color: var(--text); font-family: var(--font-body); }

  .app { min-height: 100vh; display: flex; flex-direction: column; }

  /* NAV */
  .nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(13,13,13,0.92); backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
    padding: 0 24px;
    display: flex; align-items: center; justify-content: space-between;
    height: 60px;
  }
  .nav-logo { font-family: var(--font-display); font-size: 26px; letter-spacing: 1px; color: var(--gold); }
  .nav-logo span { color: var(--red); }
  .nav-actions { display: flex; gap: 10px; align-items: center; }
  .btn-ghost {
    background: none; border: 1px solid var(--border); color: var(--text);
    padding: 8px 16px; border-radius: 8px; cursor: pointer;
    font-family: var(--font-body); font-size: 13px;
    transition: all 0.2s;
  }
  .btn-ghost:hover { border-color: var(--gold); color: var(--gold); }
  .btn-primary {
    background: var(--gold); color: var(--dark); border: none;
    padding: 8px 18px; border-radius: 8px; cursor: pointer;
    font-family: var(--font-body); font-size: 13px; font-weight: 700;
    transition: all 0.2s;
  }
  .btn-primary:hover { background: #ffc042; transform: translateY(-1px); }

  /* HERO */
  .hero {
    position: relative; overflow: hidden;
    padding: 80px 24px 60px;
    background: linear-gradient(135deg, #0D0D0D 0%, #1a0a00 50%, #0D0D0D 100%);
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 20% 50%, rgba(245,166,35,0.15) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(232,53,58,0.1) 0%, transparent 50%);
  }
  .hero-grid-overlay {
    position: absolute; inset: 0; opacity: 0.04;
    background-image: linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .hero-content { position: relative; max-width: 640px; }
  .hero-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(245,166,35,0.12); border: 1px solid rgba(245,166,35,0.3);
    color: var(--gold); padding: 4px 12px; border-radius: 100px;
    font-size: 12px; font-weight: 500; letter-spacing: 0.5px;
    margin-bottom: 20px;
  }
  .hero-tag::before { content: '●'; font-size: 8px; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .hero-title {
    font-family: var(--font-display); font-size: clamp(52px, 8vw, 88px);
    line-height: 0.95; color: var(--text); margin-bottom: 16px;
  }
  .hero-title .accent { color: var(--gold); }
  .hero-title .accent-red { color: var(--red); }
  .hero-sub { color: var(--muted); font-size: 16px; line-height: 1.6; margin-bottom: 32px; max-width: 480px; }

  /* SEARCH BAR */
  .search-bar {
    display: flex; gap: 0; background: var(--surface2);
    border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
    max-width: 560px;
  }
  .search-bar input {
    flex: 1; background: none; border: none; color: var(--text);
    padding: 14px 18px; font-family: var(--font-body); font-size: 15px; outline: none;
  }
  .search-bar input::placeholder { color: var(--muted); }
  .search-bar button {
    background: var(--gold); color: var(--dark); border: none;
    padding: 14px 24px; cursor: pointer; font-weight: 700;
    font-family: var(--font-body); font-size: 14px;
    transition: background 0.2s;
  }
  .search-bar button:hover { background: #ffc042; }

  /* STATS */
  .stats {
    display: flex; gap: 32px; margin-top: 40px;
  }
  .stat-item { }
  .stat-num { font-family: var(--font-display); font-size: 32px; color: var(--gold); }
  .stat-label { font-size: 12px; color: var(--muted); }

  /* FILTERS */
  .filters-bar {
    padding: 20px 24px;
    display: flex; gap: 8px; overflow-x: auto;
    border-bottom: 1px solid var(--border);
  }
  .filters-bar::-webkit-scrollbar { display: none; }
  .filter-chip {
    flex-shrink: 0; padding: 8px 16px; border-radius: 100px;
    background: var(--surface); border: 1px solid var(--border);
    color: var(--muted); font-size: 13px; cursor: pointer;
    transition: all 0.2s; white-space: nowrap;
  }
  .filter-chip.active {
    background: var(--gold); color: var(--dark);
    border-color: var(--gold); font-weight: 600;
  }
  .filter-chip:hover:not(.active) { border-color: rgba(255,255,255,0.2); color: var(--text); }

  /* MAIN */
  .main { flex: 1; padding: 32px 24px; max-width: 1200px; margin: 0 auto; width: 100%; }

  /* SECTION */
  .section-header {
    display: flex; justify-content: space-between; align-items: flex-end;
    margin-bottom: 20px;
  }
  .section-title { font-family: var(--font-display); font-size: 28px; letter-spacing: 0.5px; }
  .section-title span { color: var(--gold); }
  .section-link { color: var(--gold); font-size: 13px; cursor: pointer; text-decoration: underline; }

  /* FEATURED EVENT */
  .featured-card {
    position: relative; border-radius: 20px; overflow: hidden;
    height: 340px; cursor: pointer; margin-bottom: 40px;
    transition: transform 0.3s;
  }
  .featured-card:hover { transform: scale(1.005); }
  .featured-bg {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, #1a0030, #3d0020, #1a0a00);
    display: flex; align-items: center; justify-content: center;
    font-size: 160px; opacity: 0.15;
  }
  .featured-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to right, rgba(0,0,0,0.85) 50%, transparent 100%);
  }
  .featured-content {
    position: absolute; inset: 0; padding: 40px;
    display: flex; flex-direction: column; justify-content: flex-end;
  }
  .featured-badge {
    display: inline-block; background: var(--red); color: white;
    padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700;
    letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; align-self: flex-start;
  }
  .featured-title { font-family: var(--font-display); font-size: 42px; line-height: 1; margin-bottom: 8px; }
  .featured-meta { color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 20px; }
  .featured-actions { display: flex; gap: 12px; align-items: center; }
  .featured-price {
    background: var(--gold); color: var(--dark);
    padding: 10px 22px; border-radius: 10px; font-weight: 700; font-size: 15px;
    cursor: pointer; border: none; font-family: var(--font-body);
    transition: all 0.2s;
  }
  .featured-price:hover { background: #ffc042; transform: translateY(-1px); }
  .featured-save {
    background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2);
    padding: 10px 18px; border-radius: 10px; cursor: pointer;
    font-family: var(--font-body); font-size: 14px; backdrop-filter: blur(8px);
    transition: all 0.2s;
  }
  .featured-save:hover { background: rgba(255,255,255,0.18); }

  /* EVENTS GRID */
  .events-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px; margin-bottom: 48px;
  }

  .event-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; overflow: hidden; cursor: pointer;
    transition: all 0.25s; position: relative;
  }
  .event-card:hover { transform: translateY(-4px); border-color: rgba(245,166,35,0.3); box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
  .event-card-img {
    height: 160px; position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    font-size: 72px;
  }
  .event-card-cat {
    position: absolute; top: 12px; left: 12px;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
    padding: 4px 10px; border-radius: 100px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .event-card-body { padding: 16px; }
  .event-card-title { font-weight: 600; font-size: 15px; margin-bottom: 8px; line-height: 1.3; }
  .event-card-info { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
  .event-card-info-row { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); }
  .event-card-footer { display: flex; justify-content: space-between; align-items: center; }
  .event-card-price { font-weight: 700; font-size: 15px; color: var(--gold); }
  .event-card-price.free { color: var(--green); }
  .btn-reserve {
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); padding: 7px 14px; border-radius: 8px;
    font-size: 12px; font-weight: 600; cursor: pointer;
    font-family: var(--font-body); transition: all 0.2s;
  }
  .btn-reserve:hover { background: var(--gold); color: var(--dark); border-color: var(--gold); }

  /* DETAIL VIEW */
  .detail-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
    display: flex; align-items: flex-end; justify-content: center;
    animation: fadeIn 0.2s;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .detail-panel {
    background: var(--surface); border-radius: 24px 24px 0 0;
    width: 100%; max-width: 700px; max-height: 92vh; overflow-y: auto;
    animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
  .detail-header {
    height: 220px; position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    font-size: 100px;
  }
  .detail-header-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 30%, var(--surface) 100%);
  }
  .detail-close {
    position: absolute; top: 16px; right: 16px;
    background: rgba(0,0,0,0.5); border: none; color: white;
    width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 18px;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(8px);
  }
  .detail-body { padding: 0 24px 40px; }
  .detail-badge {
    display: inline-block; padding: 4px 12px; border-radius: 100px;
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
    margin-bottom: 10px;
  }
  .detail-title { font-family: var(--font-display); font-size: 36px; line-height: 1; margin-bottom: 16px; }
  .detail-info-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;
  }
  .detail-info-item {
    background: var(--surface2); border-radius: 12px; padding: 14px;
    border: 1px solid var(--border);
  }
  .detail-info-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .detail-info-value { font-weight: 600; font-size: 14px; }
  .detail-desc { color: rgba(255,255,255,0.65); font-size: 15px; line-height: 1.7; margin-bottom: 28px; }
  .detail-map {
    height: 140px; border-radius: 14px; overflow: hidden; margin-bottom: 28px;
    background: var(--surface2); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); font-size: 13px; gap: 8px;
  }
  .detail-actions { display: flex; gap: 12px; }
  .btn-buy {
    flex: 1; background: var(--gold); color: var(--dark); border: none;
    padding: 16px; border-radius: 12px; font-weight: 700; font-size: 16px;
    cursor: pointer; font-family: var(--font-body); transition: all 0.2s;
  }
  .btn-buy:hover { background: #ffc042; transform: translateY(-1px); }
  .btn-share {
    background: var(--surface2); color: var(--text); border: 1px solid var(--border);
    padding: 16px 20px; border-radius: 12px; cursor: pointer; font-size: 18px;
    transition: all 0.2s;
  }
  .btn-share:hover { border-color: var(--gold); }

  /* CREATE FORM */
  .create-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; animation: fadeIn 0.2s;
  }
  .create-panel {
    background: var(--surface); border-radius: 20px;
    width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto;
    padding: 32px; animation: scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes scaleIn { from{transform:scale(0.9);opacity:0} to{transform:scale(1);opacity:1} }
  .create-title { font-family: var(--font-display); font-size: 30px; margin-bottom: 24px; }
  .create-title span { color: var(--gold); }
  .form-group { margin-bottom: 18px; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: block; }
  .form-input, .form-select, .form-textarea {
    width: 100%; background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); padding: 12px 14px; border-radius: 10px;
    font-family: var(--font-body); font-size: 14px; outline: none;
    transition: border-color 0.2s;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--gold); }
  .form-input::placeholder, .form-textarea::placeholder { color: var(--muted); }
  .form-select option { background: var(--surface2); }
  .form-textarea { resize: vertical; min-height: 100px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-actions { display: flex; gap: 12px; margin-top: 8px; }
  .btn-cancel {
    flex: 0; padding: 14px 20px; border-radius: 10px;
    background: none; border: 1px solid var(--border); color: var(--muted);
    cursor: pointer; font-family: var(--font-body); font-size: 14px; transition: all 0.2s;
  }
  .btn-cancel:hover { color: var(--text); border-color: rgba(255,255,255,0.2); }
  .btn-submit {
    flex: 1; padding: 14px; border-radius: 10px;
    background: var(--gold); color: var(--dark); border: none;
    font-weight: 700; font-size: 15px; cursor: pointer;
    font-family: var(--font-body); transition: all 0.2s;
  }
  .btn-submit:hover { background: #ffc042; }

  /* BOTTOM NAV */
  .bottom-nav {
    position: sticky; bottom: 0;
    background: rgba(13,13,13,0.95); backdrop-filter: blur(16px);
    border-top: 1px solid var(--border);
    display: flex; justify-content: space-around; padding: 10px 0 16px;
  }
  .bottom-nav-item {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    color: var(--muted); font-size: 11px; cursor: pointer; padding: 4px 16px;
    transition: color 0.2s; background: none; border: none; font-family: var(--font-body);
  }
  .bottom-nav-item.active { color: var(--gold); }
  .bottom-nav-item span:first-child { font-size: 20px; }

  /* TOAST */
  .toast {
    position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
    background: var(--green); color: #0D0D0D; padding: 12px 24px; border-radius: 100px;
    font-weight: 700; font-size: 14px; z-index: 300;
    animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes toastIn { from{transform:translateX(-50%) translateY(20px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
`;

const EVENTS = [
  {
    id:1, emoji:"🌞", title:"La Solar Festival 2026", cat:"Música",
    date:"Sáb 2 May", time:"2:00 PM", place:"Parque Norte, Medellín",
    price:"Desde $300.000", color:"linear-gradient(135deg,#1a0a00,#3d2000)",
    tag:"ESTA SEMANA",
    desc:"La Solar es el festival más caliente de Medellín. Música, perreo, flow y energía en un solo día. DJ Snake, Porter Robinson, Yandel, Danny Ocean, SOFI TUKKER y más. Tardeo desde las 2 PM · Anytime · VIP Familiar disponible.",
    attendees:"18.000", capacity:"22.000",
    ticketPlatform:"TuBoleta",
    link:"https://web.tuboleta.com/images/Eventos/La-Solar-2026/home.html"
  },
  {
    id:2, emoji:"🎸", title:"Audiciones Altavoz 2026", cat:"Música",
    date:"Mayo 2026", time:"Por confirmar", place:"Varios escenarios, Medellín",
    price:"Gratis", color:"linear-gradient(135deg,#0a1a00,#1a3d00)",
    tag:"CONVOCATORIA",
    desc:"Altavoz, el festival de rock y música independiente más importante de Colombia, abre sus audiciones en mayo. Bandas emergentes de todo el país compiten por un cupo en el festival. Entrada libre para el público.",
    attendees:"1.200", capacity:"5.000",
    ticketPlatform:"Alcaldía de Medellín",
    link:"https://www.medellin.gov.co/es/eventos/"
  },
  {
    id:3, emoji:"🩰", title:"Ballet: Coppélia", cat:"Arte",
    date:"Sáb 2 May", time:"3:00 PM", place:"Teatro Universidad de Medellín",
    price:"En La Tiquetera", color:"linear-gradient(135deg,#1a001a,#3d003d)",
    tag:null,
    desc:"Coppélia es un ballet en tres actos, con coreografía original de Arthur Saint-Léon y música de Léo Delibes. Basado en una historia clásica europea, es uno de los ballets más encantadores del repertorio universal. Apertura de puertas 1 hora antes.",
    attendees:"420", capacity:"600",
    ticketPlatform:"La Tiquetera",
    link:"https://latiquetera.com/events/search?search=coppelia+medellin"
  },
  {
    id:4, emoji:"😂", title:"Stand-Up: Saliendo del Closet", cat:"Comedia",
    date:"Próxima semana", time:"Por confirmar", place:"Medellín",
    price:"En La Tiquetera", color:"linear-gradient(135deg,#001a1a,#003d3a)",
    tag:null,
    desc:"Un show de stand-up donde, a través de la risa, se quitan prejuicios, miedos y barreras mentales. Una experiencia que hace reír y reflexionar al mismo tiempo.",
    attendees:"280", capacity:"400",
    ticketPlatform:"La Tiquetera",
    link:"https://latiquetera.com/events/search?search=saliendo+del+closet"
  },
  {
    id:5, emoji:"🤖", title:"AI Summit 2026", cat:"Tech",
    date:"Jue 7 – Vie 8 May", time:"9:00 AM", place:"Bogotá (evento nacional)",
    price:"En La Tiquetera", color:"linear-gradient(135deg,#00102a,#001f50)",
    tag:"NACIONAL",
    desc:"Encuentro internacional de alto nivel enfocado en inteligencia artificial. Dos días con keynotes, talleres y networking con CEOs, founders y tomadores de decisión de América Latina. Incluye almuerzo + cóctel el primer día.",
    attendees:"1.500", capacity:"2.000",
    ticketPlatform:"La Tiquetera",
    link:"https://latiquetera.com/event/ai-summit-bogota"
  },
  {
    id:6, emoji:"🎻", title:"Orquesta Filarmónica de Medellín", cat:"Música",
    date:"8 May", time:"Por confirmar", place:"Teatro Pablo Tobón Uribe, Medellín",
    price:"En La Tiquetera", color:"linear-gradient(135deg,#1a0a00,#2a1500)",
    tag:null,
    desc:"La Orquesta Filarmónica de Medellín presenta su temporada 2026 junto a la inigualable voz de Verónica Lin, en víspera del Día de la Madre. Un concierto cargado de emoción, nostalgia y gratitud.",
    attendees:"650", capacity:"900",
    ticketPlatform:"La Tiquetera",
    link:"https://latiquetera.com/events/search?search=filarmonica+medellin+2026"
  },
];

const CATS = ["Todos","Música","Arte","Comedia","Tech","Gastronomía","Baile","Deportes","Teatro","Bienestar"];

export default function App() {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [saved, setSaved] = useState([]);
  const [search, setSearch] = useState("");

  const filtered = EVENTS.filter(e => {
    const matchCat = activeFilter === "Todos" || e.cat === activeFilter;
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.place.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const toggleSave = (id) => {
    setSaved(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id]);
    showToast(saved.includes(id) ? "Eliminado de guardados" : "✓ Guardado en tu lista");
  };

  const handleReserve = () => {
    setSelectedEvent(null);
    showToast("✓ ¡Reserva confirmada! Revisa tu correo");
  };

  const handleCreateSubmit = () => {
    setShowCreate(false);
    showToast("✓ ¡Evento publicado exitosamente!");
  };

  const featuredEvent = EVENTS[0];

  return (
    <>
      <style>{style}</style>
      <div className="app">
        {/* NAV */}
        <nav className="nav">
          <div className="nav-logo">MEDE<span>LLÍ</span>N EVENTOS</div>
          <div className="nav-actions">
            <button className="btn-ghost">Iniciar sesión</button>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Crear evento</button>
          </div>
        </nav>

        {activeTab === "home" && (
          <>
            {/* HERO */}
            <div className="hero">
              <div className="hero-grid-overlay" />
              <div className="hero-content">
                <div className="hero-tag">📍 Medellín, Colombia</div>
                <h1 className="hero-title">
                  DESCUBRE<br/>
                  <span className="accent">LO QUE</span><br/>
                  <span className="accent-red">VIBRA</span>
                </h1>
                <p className="hero-sub">Los mejores eventos de la ciudad de la eterna primavera. Música, arte, gastronomía y mucho más.</p>
                <div className="search-bar">
                  <input
                    placeholder="Busca eventos, lugares o artistas..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <button>Buscar</button>
                </div>
                <div className="stats">
                  <div className="stat-item"><div className="stat-num">240+</div><div className="stat-label">Eventos este mes</div></div>
                  <div className="stat-item"><div className="stat-num">48K</div><div className="stat-label">Asistentes</div></div>
                  <div className="stat-item"><div className="stat-num">120+</div><div className="stat-label">Organizadores</div></div>
                </div>
              </div>
            </div>

            {/* FILTERS */}
            <div className="filters-bar">
              {CATS.map(c => (
                <button key={c} className={`filter-chip ${activeFilter===c?"active":""}`} onClick={() => setActiveFilter(c)}>{c}</button>
              ))}
            </div>

            <div className="main">
              {/* FEATURED */}
              {activeFilter === "Todos" && !search && (
                <>
                  <div className="section-header">
                    <div className="section-title">Evento <span>Destacado</span></div>
                  </div>
                  <div className="featured-card" onClick={() => setSelectedEvent(featuredEvent)}>
                    <div className="featured-bg" style={{background: featuredEvent.color}}>{featuredEvent.emoji}</div>
                    <div className="featured-overlay" />
                    <div className="featured-content">
                      <span className="featured-badge">🔥 Más vendido</span>
                      <div className="featured-title">{featuredEvent.title}</div>
                      <div className="featured-meta">📅 {featuredEvent.date} · ⏰ {featuredEvent.time} · 📍 {featuredEvent.place}</div>
                      <div className="featured-actions">
                        <button className="featured-price" onClick={e=>{e.stopPropagation();setSelectedEvent(featuredEvent);}}>
                          Reservar · {featuredEvent.price}
                        </button>
                        <button className="featured-save" onClick={e=>{e.stopPropagation();toggleSave(featuredEvent.id);}}>
                          {saved.includes(featuredEvent.id) ? "❤️ Guardado" : "🤍 Guardar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* GRID */}
              <div className="section-header">
                <div className="section-title">
                  {search ? `Resultados para "${search}"` : activeFilter === "Todos" ? <>Todos los <span>Eventos</span></> : <span>{activeFilter}</span>}
                </div>
                <span className="section-link">{filtered.length} eventos</span>
              </div>

              {filtered.length === 0 ? (
                <div style={{textAlign:'center',padding:'60px 0',color:'var(--muted)'}}>
                  <div style={{fontSize:48,marginBottom:12}}>🔍</div>
                  <div style={{fontSize:16}}>No encontramos eventos</div>
                  <div style={{fontSize:13,marginTop:4}}>Intenta con otra búsqueda o categoría</div>
                </div>
              ) : (
                <div className="events-grid">
                  {filtered.map(ev => (
                    <div key={ev.id} className="event-card" onClick={() => setSelectedEvent(ev)}>
                      <div className="event-card-img" style={{background: ev.color}}>
                        {ev.emoji}
                        <span className="event-card-cat">{ev.cat}</span>
                        {ev.tag && <span style={{position:'absolute',top:12,right:12,background:'var(--red)',color:'white',padding:'3px 8px',borderRadius:'100px',fontSize:'10px',fontWeight:700}}>{ev.tag}</span>}
                      </div>
                      <div className="event-card-body">
                        <div className="event-card-title">{ev.title}</div>
                        <div className="event-card-info">
                          <div className="event-card-info-row">📅 {ev.date} · {ev.time}</div>
                          <div className="event-card-info-row">📍 {ev.place}</div>
                          <div className="event-card-info-row">👥 {ev.attendees} asistentes confirmados</div>
                        </div>
                        <div className="event-card-footer">
                          <div className={`event-card-price ${ev.price==="Gratis"?"free":""}`}>{ev.price}</div>
                          <button className="btn-reserve" onClick={e=>{e.stopPropagation();toggleSave(ev.id);}}>
                            {saved.includes(ev.id) ? "❤️" : "🤍"} Guardar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "saved" && (
          <div className="main" style={{paddingTop:32}}>
            <div className="section-header">
              <div className="section-title">Mis <span>Guardados</span></div>
              <span className="section-link">{saved.length} eventos</span>
            </div>
            {saved.length === 0 ? (
              <div style={{textAlign:'center',padding:'80px 0',color:'var(--muted)'}}>
                <div style={{fontSize:48,marginBottom:12}}>🤍</div>
                <div style={{fontSize:16}}>Aún no tienes eventos guardados</div>
                <div style={{fontSize:13,marginTop:4}}>Explora y guarda los que te interesen</div>
              </div>
            ) : (
              <div className="events-grid">
                {EVENTS.filter(e=>saved.includes(e.id)).map(ev => (
                  <div key={ev.id} className="event-card" onClick={() => setSelectedEvent(ev)}>
                    <div className="event-card-img" style={{background: ev.color}}>
                      {ev.emoji}
                      <span className="event-card-cat">{ev.cat}</span>
                    </div>
                    <div className="event-card-body">
                      <div className="event-card-title">{ev.title}</div>
                      <div className="event-card-info">
                        <div className="event-card-info-row">📅 {ev.date}</div>
                        <div className="event-card-info-row">📍 {ev.place}</div>
                      </div>
                      <div className="event-card-footer">
                        <div className={`event-card-price ${ev.price==="Gratis"?"free":""}`}>{ev.price}</div>
                        <button className="btn-reserve" onClick={e=>{e.stopPropagation();setSelectedEvent(ev);}}>Ver detalle</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="main" style={{paddingTop:48,textAlign:'center'}}>
            <div style={{fontSize:64,marginBottom:16}}>👤</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:28,marginBottom:8}}>LUIS</div>
            <div style={{color:'var(--muted)',marginBottom:32}}>medellin@eventos.co</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,maxWidth:300,margin:'0 auto'}}>
              {[["Eventos asistidos","12"],["Eventos guardados",String(saved.length)],["Eventos creados","3"],["Reseñas","8"]].map(([l,v])=>(
                <div key={l} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'16px 12px'}}>
                  <div style={{fontFamily:'var(--font-display)',fontSize:28,color:'var(--gold)'}}>{v}</div>
                  <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM NAV */}
        <nav className="bottom-nav">
          {[["🏠","Inicio","home"],["🔍","Explorar","explore"],["🤍","Guardados","saved"],["👤","Perfil","profile"]].map(([icon,label,tab])=>(
            <button key={tab} className={`bottom-nav-item ${activeTab===tab?"active":""}`} onClick={()=>setActiveTab(tab)}>
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* DETAIL PANEL */}
        {selectedEvent && (
          <div className="detail-overlay" onClick={()=>setSelectedEvent(null)}>
            <div className="detail-panel" onClick={e=>e.stopPropagation()}>
              <div className="detail-header" style={{background: selectedEvent.color}}>
                {selectedEvent.emoji}
                <div className="detail-header-overlay" />
                <button className="detail-close" onClick={()=>setSelectedEvent(null)}>✕</button>
              </div>
              <div className="detail-body">
                {selectedEvent.tag && <span className="detail-badge" style={{background:'var(--red)',color:'white'}}>{selectedEvent.tag}</span>}
                <div className="detail-title">{selectedEvent.title}</div>
                <div className="detail-info-grid">
                  <div className="detail-info-item"><div className="detail-info-label">Fecha</div><div className="detail-info-value">{selectedEvent.date}</div></div>
                  <div className="detail-info-item"><div className="detail-info-label">Hora</div><div className="detail-info-value">{selectedEvent.time}</div></div>
                  <div className="detail-info-item"><div className="detail-info-label">Lugar</div><div className="detail-info-value">{selectedEvent.place}</div></div>
                  <div className="detail-info-item"><div className="detail-info-label">Precio</div><div className="detail-info-value" style={{color: selectedEvent.price==="Gratis"?'var(--green)':'var(--gold)'}}>{selectedEvent.price}</div></div>
                </div>
                <p className="detail-desc">{selectedEvent.desc}</p>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Asistentes ({selectedEvent.attendees} / {selectedEvent.capacity})</div>
                  <div style={{background:'var(--surface2)',borderRadius:100,height:8,overflow:'hidden'}}>
                    <div style={{height:'100%',background:'var(--gold)',width:`${Math.round(parseInt(selectedEvent.attendees.replace(',',''))/parseInt(selectedEvent.capacity.replace(',',''))*100)}%`,borderRadius:100,transition:'width 0.5s'}} />
                  </div>
                </div>
                <div className="detail-map">📍 Ver en mapa · {selectedEvent.place}</div>
                {selectedEvent.ticketPlatform && (
                  <div style={{marginBottom:16,display:'flex',alignItems:'center',gap:8,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 14px'}}>
                    <span style={{fontSize:16}}>🎟️</span>
                    <div>
                      <div style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Venta oficial de entradas</div>
                      <div style={{fontWeight:700,fontSize:14,color:'var(--gold)'}}>{selectedEvent.ticketPlatform}</div>
                    </div>
                  </div>
                )}
                <div className="detail-actions">
                  <button className="btn-buy" onClick={() => { if(selectedEvent.link) window.open(selectedEvent.link,'_blank'); else handleReserve(); }}>
                    {selectedEvent.price === "Gratis" ? "Registrarse gratis →" : selectedEvent.price.startsWith("En") ? `Ver entradas →` : `Comprar · ${selectedEvent.price} →`}
                  </button>
                  <button className="btn-share" onClick={()=>{toggleSave(selectedEvent.id);}}>
                    {saved.includes(selectedEvent.id) ? "❤️" : "🤍"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CREATE FORM */}
        {showCreate && (
          <div className="create-overlay" onClick={()=>setShowCreate(false)}>
            <div className="create-panel" onClick={e=>e.stopPropagation()}>
              <div className="create-title">Publicar <span>Evento</span></div>
              <div className="form-group">
                <label className="form-label">Nombre del evento</label>
                <input className="form-input" placeholder="ej. Festival de Jazz Medellín" />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-select">
                  {CATS.filter(c=>c!=="Todos").map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input className="form-input" type="date" />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora</label>
                  <input className="form-input" type="time" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Lugar / Dirección</label>
                <input className="form-input" placeholder="ej. Parque Arví, Medellín" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Precio de entrada</label>
                  <input className="form-input" placeholder="ej. $50.000 o Gratis" />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacidad</label>
                  <input className="form-input" type="number" placeholder="ej. 500" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-textarea" placeholder="Cuéntanos de qué trata tu evento..." />
              </div>
              <div className="form-actions">
                <button className="btn-cancel" onClick={()=>setShowCreate(false)}>Cancelar</button>
                <button className="btn-submit" onClick={handleCreateSubmit}>Publicar evento →</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
