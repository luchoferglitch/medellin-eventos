import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { Calendar, MapPin, Star, MessageCircle } from "lucide-react";
import { translations } from "./translations";

import catMusica from "./assets/cat-musica.jpg";
import catArte from "./assets/cat-arte.jpg";
import catComedia from "./assets/cat-comedia.jpg";
import catTech from "./assets/cat-tech.jpg";
import catBaile from "./assets/cat-baile.jpg";
import catDeportes from "./assets/cat-deportes.jpg";
import catTeatro from "./assets/cat-teatro.jpg";
import catGastronomia from "./assets/cat-gastronomia.jpg";
import catBienestar from "./assets/cat-bienestar.jpg";
import catAcademicos from "./assets/cat-academicos.jpg";

const CAT_CONFIG = {
  "Música":      { img: catMusica,      color: "#7C3AED" },
  "Arte":        { img: catArte,        color: "#EA580C" },
  "Comedia":     { img: catComedia,     color: "#D97706" },
  "Tech":        { img: catTech,        color: "#2563EB" },
  "Baile":       { img: catBaile,       color: "#DB2777" },
  "Deportes":    { img: catDeportes,    color: "#16A34A" },
  "Teatro":      { img: catTeatro,      color: "#DC2626" },
  "Gastronomía": { img: catGastronomia, color: "#C2410C" },
  "Bienestar":   { img: catBienestar,   color: "#059669" },
  "Académicos":  { img: catAcademicos,  color: "#0369A1" },
};

const getCatConfig = (cat) => CAT_CONFIG[cat] || { img: null, color: "#C8860A" };

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --gold: #C8860A; --red: #C0392B; --green: #27AE60;
    --dark: #1a1a1a; --surface: #FFFFFF; --surface2: #F5F3EF;
    --border: rgba(0,0,0,0.08); --text: #1a1a1a; --muted: #888;
    --font-display: 'Bebas Neue', sans-serif; --font-body: 'DM Sans', sans-serif;
  }
  body { background: #F5F3EF; color: var(--text); font-family: var(--font-body); }
  .app { min-height: 100vh; display: flex; flex-direction: column; }
  .nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(255,255,255,0.95); backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border); padding: 0 24px;
    display: flex; align-items: center; justify-content: space-between; height: 60px;
    box-shadow: 0 1px 12px rgba(0,0,0,0.06);
  }
  .nav-logo { font-family: var(--font-display); font-size: 26px; letter-spacing: 1px; color: var(--gold); }
  .nav-logo span { color: var(--red); }
  .nav-actions { display: flex; gap: 10px; align-items: center; }
  .btn-ghost {
    background: none; border: 1px solid var(--border); color: var(--text);
    padding: 8px 16px; border-radius: 8px; cursor: pointer;
    font-family: var(--font-body); font-size: 13px; transition: all 0.2s;
  }
  .btn-ghost:hover { border-color: var(--gold); color: var(--gold); }
  .btn-primary {
    background: var(--gold); color: white; border: none;
    padding: 8px 18px; border-radius: 8px; cursor: pointer;
    font-family: var(--font-body); font-size: 13px; font-weight: 700; transition: all 0.2s;
  }
  .btn-primary:hover { background: #a06d08; transform: translateY(-1px); }
  .auth-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s;
  }
  .auth-panel {
    background: white; border: 1px solid var(--border);
    border-radius: 24px; width: 100%; max-width: 420px; padding: 40px;
    animation: scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  }
  .auth-logo { font-family: var(--font-display); font-size: 22px; color: var(--gold); margin-bottom: 8px; }
  .auth-logo span { color: var(--red); }
  .auth-title { font-family: var(--font-display); font-size: 32px; margin-bottom: 4px; color: var(--text); }
  .auth-sub { color: var(--muted); font-size: 14px; margin-bottom: 28px; }
  .auth-tabs { display: flex; background: var(--surface2); border-radius: 10px; padding: 4px; margin-bottom: 24px; }
  .auth-tab {
    flex: 1; padding: 8px; border-radius: 8px; border: none;
    background: none; color: var(--muted); font-family: var(--font-body);
    font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  }
  .auth-tab.active { background: var(--gold); color: white; }
  .auth-form { display: flex; flex-direction: column; gap: 14px; }
  .auth-input {
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); padding: 14px 16px; border-radius: 12px;
    font-family: var(--font-body); font-size: 15px; outline: none;
    transition: border-color 0.2s; width: 100%;
  }
  .auth-input:focus { border-color: var(--gold); }
  .auth-input::placeholder { color: var(--muted); }
  .auth-btn {
    background: var(--gold); color: white; border: none;
    padding: 15px; border-radius: 12px; font-weight: 700; font-size: 15px;
    cursor: pointer; font-family: var(--font-body); transition: all 0.2s; margin-top: 4px;
  }
  .auth-btn:hover { background: #a06d08; }
  .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-error { background: rgba(192,57,43,0.08); border: 1px solid rgba(192,57,43,0.2); color: var(--red); padding: 10px 14px; border-radius: 10px; font-size: 13px; }
  .auth-success { background: rgba(39,174,96,0.08); border: 1px solid rgba(39,174,96,0.2); color: var(--green); padding: 10px 14px; border-radius: 10px; font-size: 13px; }
  .auth-close {
    position: absolute; top: 16px; right: 16px;
    background: var(--surface2); border: none; color: var(--text);
    width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px;
  }

  /* HERO con foto aérea */
  .hero {
    position: relative; overflow: hidden; min-height: 560px;
    display: flex; align-items: center;
  }
  .hero-bg {
    position: absolute; inset: 0;
    background-image: url('/medellin.jpg');
    background-color: #1a2a3a;
    background-size: cover; background-position: center;
  }
  .hero-bg::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(to right, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0.3) 100%);
  }
  .hero-content { position: relative; z-index: 1; padding: 80px 24px 60px; max-width: 640px; }
  .hero-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
    color: white; padding: 4px 12px; border-radius: 100px;
    font-size: 12px; font-weight: 500; letter-spacing: 0.5px; margin-bottom: 20px;
    backdrop-filter: blur(8px);
  }
  .hero-tag::before { content: '●'; font-size: 8px; color: #F5A623; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .hero-title { font-family: var(--font-display); font-size: clamp(52px, 8vw, 88px); line-height: 0.95; color: white; margin-bottom: 16px; }
  .hero-title .accent { color: #F5A623; }
  .hero-title .accent-red { color: #ff6b6b; }
  .hero-sub { color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; margin-bottom: 32px; max-width: 480px; }
  .search-bar {
    display: flex; background: white; border: 1px solid rgba(255,255,255,0.3);
    border-radius: 12px; overflow: hidden; max-width: 560px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  }
  .search-bar input { flex: 1; background: none; border: none; color: var(--text); padding: 14px 18px; font-family: var(--font-body); font-size: 15px; outline: none; }
  .search-bar input::placeholder { color: var(--muted); }
  .search-bar button { background: var(--gold); color: white; border: none; padding: 14px 24px; cursor: pointer; font-weight: 700; font-family: var(--font-body); font-size: 14px; }
  .stats { display: flex; gap: 32px; margin-top: 40px; }
  .stat-num { font-family: var(--font-display); font-size: 32px; color: #F5A623; }
  .stat-label { font-size: 12px; color: rgba(255,255,255,0.6); }

  /* ABOUT SECTION */
  .about-section {
    background: white; padding: 48px 24px;
    border-bottom: 1px solid var(--border);
  }
  .about-inner { max-width: 800px; margin: 0 auto; text-align: center; }
  .about-tag {
    display: inline-block; background: rgba(200,134,10,0.1); color: var(--gold);
    border: 1px solid rgba(200,134,10,0.2); padding: 4px 14px; border-radius: 100px;
    font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px;
  }
  .about-title { font-family: var(--font-display); font-size: 36px; color: var(--text); margin-bottom: 16px; letter-spacing: 0.5px; }
  .about-text { font-size: 17px; line-height: 1.8; color: #555; max-width: 680px; margin: 0 auto; }

  .filters-bar { padding: 20px 24px; display: flex; gap: 8px; overflow-x: auto; border-bottom: 1px solid var(--border); background: white; }
  .filters-bar::-webkit-scrollbar { display: none; }
  .filter-chip { flex-shrink: 0; padding: 8px 16px; border-radius: 100px; background: var(--surface2); border: 1px solid var(--border); color: var(--muted); font-size: 13px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .filter-chip.active { background: var(--gold); color: white; border-color: var(--gold); font-weight: 600; }
  .filter-chip:hover:not(.active) { border-color: var(--gold); color: var(--gold); }
  .main { flex: 1; padding: 32px 24px; max-width: 1200px; margin: 0 auto; width: 100%; }
  .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; }
  .section-title { font-family: var(--font-display); font-size: 28px; letter-spacing: 0.5px; color: var(--text); }
  .section-title span { color: var(--gold); }
  .section-link { color: var(--gold); font-size: 13px; cursor: pointer; text-decoration: underline; }
  .featured-card { position: relative; border-radius: 20px; overflow: hidden; height: 340px; cursor: pointer; margin-bottom: 40px; transition: transform 0.3s; box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
  .featured-card:hover { transform: scale(1.005); }
  .featured-bg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 160px; opacity: 0.2; }
  .featured-overlay { position: absolute; inset: 0; background: linear-gradient(to right, rgba(0,0,0,0.85) 50%, transparent 100%); }
  .featured-content { position: absolute; inset: 0; padding: 40px; display: flex; flex-direction: column; justify-content: flex-end; }
  .featured-badge { display: inline-block; background: var(--red); color: white; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; align-self: flex-start; }
  .featured-title { font-family: var(--font-display); font-size: 42px; line-height: 1; margin-bottom: 8px; color: white; }
  .featured-meta { color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 20px; }
  .featured-actions { display: flex; gap: 12px; align-items: center; }
  .featured-price { background: var(--gold); color: white; padding: 10px 22px; border-radius: 10px; font-weight: 700; font-size: 15px; cursor: pointer; border: none; font-family: var(--font-body); transition: all 0.2s; }
  .featured-price:hover { background: #a06d08; transform: translateY(-1px); }
  .featured-save { background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 10px 18px; border-radius: 10px; cursor: pointer; font-family: var(--font-body); font-size: 14px; backdrop-filter: blur(8px); transition: all 0.2s; }
  .featured-save:hover { background: rgba(255,255,255,0.25); }
  .events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-bottom: 48px; }
  .event-card { background: white; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; cursor: pointer; transition: all 0.25s; position: relative; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  .event-card:hover { transform: translateY(-4px); border-color: rgba(200,134,10,0.3); box-shadow: 0 12px 40px rgba(0,0,0,0.12); }
  .event-card-img { height: 160px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 72px; }
  .event-card-cat { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: white; }
  .event-card-body { padding: 16px; }
  .event-card-title { font-weight: 600; font-size: 15px; margin-bottom: 8px; line-height: 1.3; color: var(--text); }
  .event-card-info { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
  .event-card-info-row { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); }
  .event-card-footer { display: flex; justify-content: space-between; align-items: center; }
  .event-card-price { font-weight: 700; font-size: 15px; color: var(--gold); }
  .event-card-price.free { color: var(--green); }
  .btn-reserve { background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
  .btn-reserve:hover { background: var(--gold); color: white; border-color: var(--gold); }
  .detail-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); display: flex; align-items: flex-end; justify-content: center; animation: fadeIn 0.2s; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .detail-panel { background: white; border-radius: 24px 24px 0 0; width: 100%; max-width: 700px; max-height: 92vh; overflow-y: auto; animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1); }
  @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
  .detail-header { height: 220px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 100px; }
  .detail-header-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 30%, white 100%); }
  .detail-close { position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.9); border: none; color: var(--text); width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .detail-body { padding: 0 24px 40px; }
  .detail-badge { display: inline-block; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
  .detail-title { font-family: var(--font-display); font-size: 36px; line-height: 1; margin-bottom: 16px; color: var(--text); }
  .detail-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .detail-info-item { background: var(--surface2); border-radius: 12px; padding: 14px; border: 1px solid var(--border); }
  .detail-info-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .detail-info-value { font-weight: 600; font-size: 14px; color: var(--text); }
  .detail-desc { color: #555; font-size: 15px; line-height: 1.7; margin-bottom: 28px; }
  .detail-map { height: 140px; border-radius: 14px; overflow: hidden; margin-bottom: 16px; background: var(--surface2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--muted); font-size: 13px; gap: 8px; transition: all 0.2s; }
  .detail-map:hover { border-color: var(--gold); color: var(--gold); background: rgba(200,134,10,0.05); }
  .detail-actions { display: flex; gap: 12px; }
  .btn-buy { flex: 1; background: var(--gold); color: white; border: none; padding: 16px; border-radius: 12px; font-weight: 700; font-size: 16px; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
  .btn-buy:hover { background: #a06d08; transform: translateY(-1px); }
  .btn-share { background: var(--surface2); color: var(--text); border: 1px solid var(--border); padding: 16px 20px; border-radius: 12px; cursor: pointer; font-size: 18px; transition: all 0.2s; }
  .btn-share:hover { border-color: var(--gold); }
  .create-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s; }
  .create-panel { background: white; border-radius: 20px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; padding: 32px; animation: scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
  @keyframes scaleIn { from{transform:scale(0.9);opacity:0} to{transform:scale(1);opacity:1} }
  .create-title { font-family: var(--font-display); font-size: 30px; margin-bottom: 24px; color: var(--text); }
  .create-title span { color: var(--gold); }
  .form-group { margin-bottom: 18px; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: block; }
  .form-input, .form-select, .form-textarea { width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 12px 14px; border-radius: 10px; font-family: var(--font-body); font-size: 14px; outline: none; transition: border-color 0.2s; }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--gold); }
  .form-input::placeholder, .form-textarea::placeholder { color: var(--muted); }
  .form-select option { background: white; }
  .form-textarea { resize: vertical; min-height: 100px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-actions { display: flex; gap: 12px; margin-top: 8px; }
  .btn-cancel { flex: 0; padding: 14px 20px; border-radius: 10px; background: none; border: 1px solid var(--border); color: var(--muted); cursor: pointer; font-family: var(--font-body); font-size: 14px; transition: all 0.2s; }
  .btn-cancel:hover { color: var(--text); border-color: var(--text); }
  .btn-submit { flex: 1; padding: 14px; border-radius: 10px; background: var(--gold); color: white; border: none; font-weight: 700; font-size: 15px; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
  .btn-submit:hover { background: #a06d08; }
  .bottom-nav { position: sticky; bottom: 0; background: rgba(255,255,255,0.97); backdrop-filter: blur(16px); border-top: 1px solid var(--border); display: flex; justify-content: space-around; padding: 10px 0 16px; box-shadow: 0 -4px 20px rgba(0,0,0,0.06); }
  .bottom-nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--muted); font-size: 11px; cursor: pointer; padding: 4px 16px; transition: color 0.2s; background: none; border: none; font-family: var(--font-body); }
  .bottom-nav-item.active { color: var(--gold); }
  .bottom-nav-item span:first-child { font-size: 20px; }
  .toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: var(--green); color: white; padding: 12px 24px; border-radius: 100px; font-weight: 700; font-size: 14px; z-index: 300; animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
  @keyframes toastIn { from{transform:translateX(-50%) translateY(20px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
  .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--gold); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; cursor: pointer; border: 2px solid rgba(200,134,10,0.3); }
`;

const ADMINS = ["luchofer2001@gmail.com"];

const CATS = ["Todos","Música","Arte","Comedia","Tech","Gastronomía","Baile","Deportes","Teatro","Bienestar","Académicos"];

export default function App() {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [activeDateFilter, setActiveDateFilter] = useState("Todos");
  const [activeZona, setActiveZona] = useState("Todas");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [saved, setSaved] = useState([]);
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  const [stats, setStats] = useState({ eventos: 0, usuarios: 0, organizadores: 0 });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [lang, setLang] = useState("es");
  const t = translations[lang];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchFavorites(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === "PASSWORD_RECOVERY") setShowResetPassword(true);
      if (session?.user) fetchFavorites(session.user);
      else setSaved([]);
    });
    fetchEvents();
    fetchStats();
    supabase.from("page_views").insert({}).then(() => {});
    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { showToast("⚠️ La contraseña debe tener al menos 6 caracteres"); return; }
    setResetLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setResetLoading(false);
    if (error) showToast("⚠️ Error: " + error.message);
    else { setShowResetPassword(false); setNewPassword(""); showToast("✓ ¡Contraseña actualizada exitosamente!"); }
  };

  const fetchStats = async () => {
    try {
      const { count: eventos } = await supabase.from("events").select("*", { count: "exact", head: true });
      const { data: orgs } = await supabase.from("events").select("organizer_name");
      const organizadores = new Set(orgs?.filter(e => e.organizer_name).map(e => e.organizer_name)).size;
      const { count: visitas } = await supabase.from("page_views").select("*", { count: "exact", head: true });
      setStats({ eventos: eventos || 0, usuarios: visitas || 0, organizadores: organizadores || 0 });
    } catch(e) { console.log("Stats error:", e); }
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase.from("events").select("*").eq("estado", "aprobado").order("fecha_real", { ascending: true, nullsFirst: false });
    if (!error && data) {
      setEvents(data.map(e => ({
        id: e.id, emoji: e.emoji, title: e.title, cat: e.category,
        date: e.date, time: e.time, place: e.place, price: e.price,
        color: e.color, tag: e.tag, desc: e.description,
        attendees: String(e.attendees), capacity: String(e.capacity),
        ticketPlatform: e.ticket_platform, link: e.ticket_link,
        organizerName: e.organizer_name, organizerContact: e.organizer_contact,
        imageUrl: e.image_url, fechaReal: e.fecha_real, fechaFin: e.fecha_fin, zona: e.zona,
      })));
    }
    setLoading(false);
  };

  const SYNONYMS = {
    "Música":      ["concierto","conciertos","show","banda","artista","música","musica"],
    "Arte":        ["exposición","exposicion","galería","galeria","museo","pintura","cultura","arte"],
    "Comedia":     ["humor","chistes","risa","stand up","standup","comedia"],
    "Tech":        ["tecnología","tecnologia","innovación","innovacion","startup","digital","tech"],
    "Baile":       ["danza","salsa","tango","rumba","baile","ballet"],
    "Teatro":      ["obra","espectáculo","espectaculo","actuación","actuacion","escena","teatro"],
    "Gastronomía": ["comida","restaurante","chef","cocina","food","gastronomía","gastronomia","festival"],
    "Bienestar":   ["yoga","meditación","meditacion","salud","bienestar","taller"],
    "Deportes":    ["carrera","fútbol","futbol","running","maratón","maraton","deporte","deportes"],
    "Académicos":  ["congreso","seminario","simposio","conferencia","académico","academico"],
  };

  const getCatFromSynonym = (term) => {
    const t = term.toLowerCase();
    for (const [cat, syns] of Object.entries(SYNONYMS)) {
      if (syns.some(s => s.includes(t) || t.includes(s))) return cat;
    }
    return null;
  };

  const getDateRange = () => {
    const today = new Date(); today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];
    const day = today.getDay();
    const diffToFri = (5 - day + 7) % 7;
    const fri = new Date(today); fri.setDate(today.getDate() + diffToFri);
    const sun = new Date(fri); sun.setDate(fri.getDate() + 2);
    const endWeek = new Date(today); endWeek.setDate(today.getDate() + (7 - day));
    const endMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      today: todayStr,
      weekendStart: fri.toISOString().split('T')[0],
      weekendEnd: sun.toISOString().split('T')[0],
      weekEnd: endWeek.toISOString().split('T')[0],
      monthEnd: endMonth.toISOString().split('T')[0],
    };
  };

  const filtered = events.filter(e => {
    const matchCat = activeFilter === "Todos" || e.cat === activeFilter;
    const s = search.toLowerCase();
    const synCat = getCatFromSynonym(s);
    const matchSearch = !s ||
      e.title.toLowerCase().includes(s) ||
      e.place.toLowerCase().includes(s) ||
      e.desc?.toLowerCase().includes(s) ||
      (synCat && e.cat === synCat);
    let matchDate = true;
    if (activeDateFilter !== "Todos" && e.fechaReal) {
      const { today, weekendStart, weekendEnd, weekEnd, monthEnd } = getDateRange();
      const fin = e.fechaFin || e.fechaReal;
      if (activeDateFilter === "Hoy") matchDate = e.fechaReal <= today && fin >= today;
      else if (activeDateFilter === "FinDeSemana") matchDate = e.fechaReal <= weekendEnd && fin >= weekendStart;
      else if (activeDateFilter === "EstaSemana") matchDate = e.fechaReal <= weekEnd && fin >= today;
      else if (activeDateFilter === "EsteMes") matchDate = e.fechaReal <= monthEnd && fin >= today;
      else if (activeDateFilter === "Gratis") matchDate = e.price === "Gratis";
    }
    const matchZona = activeZona === "Todas" || e.zona === activeZona;
    return matchCat && matchSearch && matchDate && matchZona;
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const fetchFavorites = async (currentUser) => {
    if (!currentUser) { setSaved([]); return; }
    const { data, error } = await supabase.from("favorites").select("event_id").eq("user_id", currentUser.id);
    if (error) { console.log("Error fetching favorites:", error); return; }
    if (data) setSaved(data.map(f => Number(f.event_id)));
  };

  const toggleSave = async (id) => {
    if (!user) { setShowAuth(true); return; }
    const numId = Number(id);
    if (saved.includes(numId)) {
      const { error } = await supabase.from("favorites").delete().eq("event_id", numId);
      if (!error) { setSaved(s => s.filter(x => x !== numId)); showToast("Eliminado de guardados"); }
      else showToast("⚠️ Error: " + error.message);
    } else {
      const { data, error } = await supabase.from("favorites").insert({ event_id: numId }).select();
      console.log("Insert result:", data, error);
      if (!error) { setSaved(s => [...s, numId]); showToast("✓ Guardado en tu lista"); }
      else showToast("⚠️ Error: " + error.message);
    }
  };

  const handleReserve = () => {
    if (!user) { setShowAuth(true); setSelectedEvent(null); return; }
    setSelectedEvent(null);
    showToast("✓ ¡Reserva confirmada! Revisa tu correo");
  };

  const [form, setForm] = useState({ title:"", category:"Música", date:"", time:"", place:"", price:"", capacity:"", description:"", emoji:"🎵", tag:"", ticket_platform:"", ticket_link:"", organizer_name:"", organizer_contact:"", image_url:"" });
  const [formLoading, setFormLoading] = useState(false);

  const handleFormChange = (field, value) => setForm(f => ({...f, [field]: value}));

  const handleCreateSubmit = async () => {
    if (!user) { setShowAuth(true); setShowCreate(false); return; }
    if (!form.title || !form.place || !form.date) { showToast("⚠️ Completa los campos obligatorios"); return; }
    setFormLoading(true);
    const esAdmin = ADMINS.includes(user.email);
    const { error } = await supabase.from("events").insert([{
      title: form.title, category: form.category, date: form.date,
      time: form.time, place: form.place, price: form.price || "Gratis",
      capacity: parseInt(form.capacity) || 0, attendees: 0,
      description: form.description, emoji: form.emoji,
      tag: form.tag || null, ticket_platform: form.ticket_platform,
      ticket_link: form.ticket_link, color: "linear-gradient(135deg,#1a0a00,#2a1500)",
      organizer_name: form.organizer_name, organizer_contact: form.organizer_contact,
      image_url: form.image_url || null,
      user_id: user.id,
      estado: esAdmin ? "aprobado" : "pendiente",
    }]);
    setFormLoading(false);
    if (error) { showToast("⚠️ Error al publicar: " + error.message); return; }
    setShowCreate(false);
    setForm({ title:"", category:"Música", date:"", time:"", place:"", price:"", capacity:"", description:"", emoji:"🎵", tag:"", ticket_platform:"", ticket_link:"", organizer_name:"", organizer_contact:"", image_url:"" });
    if (esAdmin) {
      showToast("✓ ¡Evento publicado exitosamente!");
      fetchEvents();
    } else {
      showToast("✓ ¡Evento enviado! Lo revisaremos pronto.");
      // Enviar alerta al admin
      await fetch("https://jtbqaqugnqkympwnfsod.supabase.co/functions/v1/alerta-evento", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YnFhcXVnbnFreW1wd25mc29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODUzMzQsImV4cCI6MjA5MzA2MTMzNH0.3tHT9CVRhboFrC3pTNMMQ-i2GeEPv_nUkG4d-hPuSdc"
        },
        body: JSON.stringify({ title: form.title, organizer: form.organizer_name, contact: form.organizer_contact, place: form.place, date: form.date }),
      });
    }
  };

  const handleLogin = async () => {
    setAuthLoading(true); setAuthError(""); setAuthSuccess("");
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos" : error.message);
    else { setShowAuth(false); showToast("✓ ¡Bienvenido de vuelta!"); }
    setAuthLoading(false);
  };

  const handleRegister = async () => {
    if (!authName) { setAuthError("Por favor escribe tu nombre"); return; }
    setAuthLoading(true); setAuthError(""); setAuthSuccess("");
    const { error } = await supabase.auth.signUp({
      email: authEmail, password: authPassword,
      options: { data: { full_name: authName } }
    });
    if (error) setAuthError(error.message);
    else setAuthSuccess("✓ ¡Cuenta creada! Revisa tu correo para confirmar.");
    setAuthLoading(false);
  };

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!forgotEmail) { setAuthError("Escribe tu correo"); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin,
    });
    setForgotLoading(false);
    if (error) setAuthError(error.message);
    else { setAuthSuccess("✓ Te enviamos un correo para restablecer tu contraseña"); setShowForgot(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSaved([]);
    showToast("Sesión cerrada");
  };

  const isAdmin = user && ADMINS.includes(user.email);

  const handleDeleteEvent = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que quieres eliminar este evento?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) showToast("⚠️ Error al eliminar");
    else { showToast("✓ Evento eliminado"); fetchEvents(); }
  };

  const getUserInitial = () => (user?.user_metadata?.full_name || user?.email || "U")[0].toUpperCase();
  const getUserName = () => user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";
  const featuredEvent = (() => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = events.filter(e => e.fechaReal >= today).slice(0, 5);
    if (upcoming.length === 0) return events[0];
    return upcoming[Math.floor(Date.now() / 3600000) % upcoming.length];
  })();

  return (
    <>
      <style>{style}</style>
      <div className="app">
        <nav className="nav">
          <div className="nav-logo">MEDELLÍN VIBRA</div>
          <div className="nav-actions">
            <select value={lang} onChange={e=>setLang(e.target.value)} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'6px 10px',fontFamily:'var(--font-body)',fontSize:13,color:'var(--text)',cursor:'pointer',outline:'none'}}>
              <option value="es">🇨🇴 ES</option>
              <option value="en">🇺🇸 EN</option>
              <option value="pt">🇧🇷 PT</option>
              <option value="fr">🇫🇷 FR</option>
            </select>
            {user ? (
              <>
                <button className="btn-ghost" onClick={handleLogout}>{t.logout}</button>
                <div className="user-avatar" onClick={() => setActiveTab("profile")}>{getUserInitial()}</div>
                <button className="btn-primary" onClick={() => setShowCreate(true)}>{t.createEvent}</button>
              </>
            ) : (
              <>
                <button className="btn-ghost" onClick={() => { setAuthTab("login"); setShowAuth(true); }}>{t.login}</button>
                <button className="btn-primary" onClick={() => { setAuthTab("register"); setShowAuth(true); }}>{t.register}</button>
              </>
            )}
          </div>
        </nav>

        {activeTab === "home" && (
          <>
            <div className="hero">
              <div className="hero-bg" />
              <div className="hero-content">
                <a href="https://www.google.com/maps/place/Medell%C3%ADn,+Antioquia/@6.2441988,-75.6357583,12z" target="_blank" rel="noopener noreferrer" className="hero-tag" style={{textDecoration:'none'}}>📍 Medellín, Colombia</a>
                <h1 className="hero-title">DESCUBRE<br/><span className="accent">LO QUE</span><br/><span className="accent-red">VIBRA</span></h1>
                <p className="hero-sub">Los mejores eventos de la ciudad de la eterna primavera. Música, arte, gastronomía y mucho más. <strong style={{color:'#F5A623'}}>Todo esto en el 2026.</strong></p>
                <div className="search-bar">
                  <input placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
                  <button>{t.searchBtn}</button>
                </div>
                <div className="stats">
                  <div><div className="stat-num">{stats.eventos}</div><div className="stat-label">{t.statEvents}</div></div>
                  <div><div className="stat-num">{stats.usuarios || 0}</div><div className="stat-label">{lang === 'es' ? 'Visitas' : lang === 'en' ? 'Visits' : lang === 'pt' ? 'Visitas' : 'Visites'}</div></div>
                  <div><div className="stat-num">{stats.organizadores}</div><div className="stat-label">{t.statOrganizers}</div></div>
                </div>
              </div>
            </div>

            <div className="about-section">
              <div className="about-inner">
                <div className="about-tag">{t.aboutTag}</div>
                <div className="about-title">{t.aboutTitle}</div>
                <p className="about-text">{t.aboutText}</p>
                <a href="https://www.instagram.com/medellinvibra.co/" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex', alignItems:'center', gap:8, marginTop:20, background:'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', color:'white', padding:'10px 20px', borderRadius:100, fontWeight:700, fontSize:14, textDecoration:'none', fontFamily:'var(--font-body)'}}>
                  {t.followUs}
                </a>
              </div>
            </div>

            {(() => {
              const today = new Date(); today.setHours(0,0,0,0);
              const todayStr = today.toISOString().split('T')[0];
              const endOfWeek = new Date(today); endOfWeek.setDate(today.getDate() + 7);
              const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
              const weekEvents = events.filter(e => e.fechaReal <= endOfWeekStr && (e.fechaFin || e.fechaReal) >= todayStr).slice(0, 4);
              if (weekEvents.length === 0) return null;
              return (
                <div style={{background:'white', padding:'32px 24px', borderBottom:'1px solid var(--border)'}}>
                  <div style={{maxWidth:1200, margin:'0 auto'}}>
                    <div className="section-header">
                      <div className="section-title">🗓️ Esta <span>Semana</span></div>
                      <span className="section-link" onClick={() => setActiveDateFilter("EstaSemana")}>{weekEvents.length} eventos →</span>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:16}}>
                      {weekEvents.map(ev => (
                        <div key={ev.id} onClick={() => setSelectedEvent(ev)} style={{display:'flex', gap:12, alignItems:'center', background:'var(--surface2)', borderRadius:12, padding:12, cursor:'pointer', border:'1px solid var(--border)', transition:'all 0.2s'}}
                          onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold)'}
                          onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                        >
                          <div style={{width:48, height:48, borderRadius:10, backgroundImage:`url(${ev.imageUrl || getCatConfig(ev.cat).img})`, backgroundSize:'cover', backgroundPosition:'center', flexShrink:0}} />
                          <div style={{overflow:'hidden'}}>
                            <div style={{fontWeight:600, fontSize:13, lineHeight:1.3, marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{ev.title}</div>
                            <div style={{fontSize:12, color:'var(--muted)'}}>{ev.date}</div>
                            <div style={{fontSize:12, color:'var(--gold)', fontWeight:700}}>{ev.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* LUGARES DESTACADOS */}
            <div style={{background:'var(--surface2)', padding:'32px 24px', borderBottom:'1px solid var(--border)'}}>
              <div style={{maxWidth:1200, margin:'0 auto'}}>
                <div className="section-header" style={{marginBottom:16}}>
                  <div className="section-title">{t.venuesTitle} <span>{t.venuesTitleSpan}</span></div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12}}>
                  {[
                    {name:"Teatro Pablo Tobón Uribe", emoji:"🎭", maps:"https://maps.google.com/?q=Teatro+Pablo+Tobon+Uribe+Medellin"},
                    {name:"La Macarena", emoji:"🎵", maps:"https://maps.google.com/?q=La+Macarena+Medellin"},
                    {name:"Parque Norte", emoji:"🎡", maps:"https://maps.google.com/?q=Parque+Norte+Medellin"},
                    {name:"Plaza Mayor", emoji:"🏛️", maps:"https://maps.google.com/?q=Plaza+Mayor+Medellin"},
                    {name:"Teatro Metropolitano", emoji:"🎼", maps:"https://maps.google.com/?q=Teatro+Metropolitano+Medellin"},
                    {name:"Estadio Atanasio Girardot", emoji:"⚽", maps:"https://maps.google.com/?q=Estadio+Atanasio+Girardot+Medellin"},
                    {name:"Parque Explora", emoji:"🔭", maps:"https://maps.google.com/?q=Parque+Explora+Medellin"},
                    {name:"El Tesoro Parque Comercial", emoji:"🛍️", maps:"https://maps.google.com/?q=El+Tesoro+Parque+Comercial+Medellin"},
                  ].map(lugar => (
                    <a key={lugar.name} href={lugar.maps} target="_blank" rel="noopener noreferrer" style={{display:'flex', flexDirection:'column', alignItems:'center', gap:8, background:'white', borderRadius:14, padding:'16px 12px', textDecoration:'none', border:'1px solid var(--border)', transition:'all 0.2s', textAlign:'center'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.transform='translateY(-2px)';}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='translateY(0)';}}
                    >
                      <span style={{fontSize:28}}>{lugar.emoji}</span>
                      <span style={{fontSize:12, fontWeight:600, color:'var(--text)', lineHeight:1.3}}>{lugar.name}</span>
                      <span style={{fontSize:11, color:'var(--gold)'}}>Ver en mapa ↗</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="filters-bar" style={{borderBottom:'none',paddingBottom:4,paddingTop:12}}>
              {[["Todas","🌎 Todas las zonas"],["Medellín","🏙️ Medellín"],["Área Metropolitana","🌆 Área Metropolitana"],["Oriente Cercano","🌿 Oriente Cercano"]].map(([val,label]) => (
                <button key={val} className={`filter-chip ${activeZona===val?"active":""}`} onClick={() => setActiveZona(val)}>{label}</button>
              ))}
            </div>
            <div className="filters-bar" style={{borderBottom:'none',paddingBottom:8}}>
              {[["Todos",t.filterAll],["Hoy",t.filterToday],["FinDeSemana",t.filterWeekend],["EstaSemana",t.filterWeek],["EsteMes",t.filterMonth],["Gratis",t.filterFree]].map(([val,label]) => (
                <button key={val} className={`filter-chip ${activeDateFilter===val?"active":""}`} onClick={() => setActiveDateFilter(val)}>
                  {val !== "Gratis" ? `📅 ${label}` : label}
                </button>
              ))}
            </div>
            <div className="filters-bar">
              {CATS.map(c => {
                const count = c === "Todos" ? events.length : events.filter(e => e.cat === c).length;
                return (
                  <button key={c} className={`filter-chip ${activeFilter===c?"active":""}`} onClick={() => setActiveFilter(c)}>
                    {c} {count > 0 && <span style={{fontSize:11,opacity:0.8,marginLeft:4}}>({count})</span>}
                  </button>
                );
              })}
            </div>

            <div className="main">
              {activeFilter === "Todos" && !search && featuredEvent && (
                <>
                  <div className="section-header"><div className="section-title">{t.featuredTitle} <span>{t.featuredTitleSpan}</span></div></div>
                  <div className="featured-card" onClick={() => setSelectedEvent(featuredEvent)}>
                    <div className="featured-bg" style={{backgroundImage: `url(${getCatConfig(featuredEvent.cat).img})`, backgroundSize:'cover', backgroundPosition:'center'}} />
                    <div className="featured-overlay" />
                    <div className="featured-content">
                      <span className="featured-badge">{t.featuredBadge}</span>
                      <div className="featured-title">{featuredEvent.title}</div>
                      <div className="featured-meta">📅 {featuredEvent.date} · ⏰ {featuredEvent.time} · 📍 {featuredEvent.place}</div>
                      <div className="featured-actions">
                        <button className="featured-price" onClick={e=>{e.stopPropagation();setSelectedEvent(featuredEvent);}}>Reservar · {featuredEvent.price}</button>
                        <button className="featured-save" onClick={e=>{e.stopPropagation();toggleSave(featuredEvent.id);}}>{saved.includes(featuredEvent.id) ? t.saved : t.save}</button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="section-header">
                <div className="section-title">{search ? `Resultados para "${search}"` : activeFilter === "Todos" ? <>{t.allEvents} <span>{t.allEventsSpan}</span></> : <span>{activeFilter}</span>}</div>
                <div style={{display:'flex', alignItems:'center', gap:12}}>
                  <span className="section-link">{filtered.length} eventos</span>
                  <div style={{display:'flex', gap:4, background:'var(--surface2)', borderRadius:8, padding:3, border:'1px solid var(--border)'}}>
                    <button onClick={()=>setViewMode("grid")} style={{padding:'4px 8px', borderRadius:6, border:'none', cursor:'pointer', background: viewMode==="grid" ? 'var(--gold)' : 'none', color: viewMode==="grid" ? 'white' : 'var(--muted)', fontSize:14}}>⊞</button>
                    <button onClick={()=>setViewMode("list")} style={{padding:'4px 8px', borderRadius:6, border:'none', cursor:'pointer', background: viewMode==="list" ? 'var(--gold)' : 'none', color: viewMode==="list" ? 'white' : 'var(--muted)', fontSize:14}}>☰</button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div style={{textAlign:'center',padding:'60px 0',color:'var(--muted)'}}>
                  <div style={{fontSize:32,marginBottom:12}}>⏳</div>
                  <div style={{fontSize:16}}>{t.loading}</div>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{textAlign:'center',padding:'60px 0',color:'var(--muted)'}}>
                  <div style={{fontSize:48,marginBottom:12}}>🔍</div>
                  <div style={{fontSize:16}}>{t.noEvents}</div>
                </div>
              ) : viewMode === "grid" ? (
                <div className="events-grid">
                  {filtered.map(ev => (
                    <div key={ev.id} className="event-card" onClick={() => setSelectedEvent(ev)}>
                      <div className="event-card-img" style={{backgroundImage: `url(${ev.imageUrl || getCatConfig(ev.cat).img})`, backgroundSize:'cover', backgroundPosition:'center'}}>
                        <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.35)'}} />
                        <span className="event-card-cat" style={{zIndex:1}}>{ev.cat}</span>
                        {ev.tag && <span style={{position:'absolute',top:12,right:12,background:'var(--red)',color:'white',padding:'3px 8px',borderRadius:'100px',fontSize:'10px',fontWeight:700,zIndex:1}}>{ev.tag}</span>}
                      </div>
                      <div className="event-card-body">
                        <div className="event-card-title">{ev.title}</div>
                        <div className="event-card-info">
                          <div className="event-card-info-row"><Calendar size={13} color="var(--muted)" /> {ev.date} · {ev.time}</div>
                          <div className="event-card-info-row"><MapPin size={13} color="var(--muted)" /> {ev.place}</div>
                        </div>
                        <div className="event-card-footer">
                          <div className={`event-card-price ${ev.price==="Gratis"?"free":""}`}>{ev.price}</div>
                          <div style={{display:'flex',gap:6}}>
                            {isAdmin && (
                              <button className="btn-reserve" style={{color:'var(--red)',borderColor:'rgba(232,53,58,0.3)'}} onClick={e=>handleDeleteEvent(ev.id,e)}>🗑️</button>
                            )}
                            <button className="btn-reserve" onClick={e=>{e.stopPropagation();toggleSave(ev.id);}}>{saved.includes(ev.id) ? "❤️" : "🤍"} {t.save.replace("🤍 ","")}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{display:'flex', flexDirection:'column', gap:12, marginBottom:48}}>
                  {filtered.map(ev => (
                    <div key={ev.id} onClick={() => setSelectedEvent(ev)} style={{display:'flex', gap:16, alignItems:'center', background:'white', borderRadius:14, padding:14, cursor:'pointer', border:'1px solid var(--border)', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', transition:'all 0.2s'}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold)'}
                      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                    >
                      <div style={{width:72, height:72, borderRadius:12, backgroundImage:`url(${ev.imageUrl || getCatConfig(ev.cat).img})`, backgroundSize:'cover', backgroundPosition:'center', flexShrink:0, position:'relative'}}>
                        <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.2)',borderRadius:12}} />
                      </div>
                      <div style={{flex:1, overflow:'hidden'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
                          <div style={{fontWeight:700, fontSize:15, lineHeight:1.3}}>{ev.title}</div>
                          <div className={`event-card-price ${ev.price==="Gratis"?"free":""}`} style={{flexShrink:0, fontSize:13}}>{ev.price}</div>
                        </div>
                        <div style={{fontSize:12, color:'var(--muted)', marginTop:4, display:'flex', gap:12, flexWrap:'wrap'}}>
                          <span><Calendar size={11} style={{display:'inline',marginRight:3}} />{ev.date}</span>
                          <span><MapPin size={11} style={{display:'inline',marginRight:3}} />{ev.place}</span>
                        </div>
                        <div style={{marginTop:6, display:'flex', gap:6, alignItems:'center'}}>
                          <span style={{background:'var(--surface2)', padding:'2px 8px', borderRadius:100, fontSize:11, color:'var(--muted)', fontWeight:600}}>{ev.cat}</span>
                          {ev.tag && <span style={{background:'var(--red)', padding:'2px 8px', borderRadius:100, fontSize:11, color:'white', fontWeight:700}}>{ev.tag}</span>}
                        </div>
                      </div>
                      <button className="btn-reserve" style={{flexShrink:0}} onClick={e=>{e.stopPropagation();toggleSave(ev.id);}}>{saved.includes(ev.id) ? "❤️" : "🤍"}</button>
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
              <div className="section-title">{t.mySaved} <span>{t.mySavedSpan}</span></div>
              <span className="section-link">{saved.length} {t.allEventsSpan.toLowerCase()}</span>
            </div>
            {!user ? (
              <div style={{textAlign:'center',padding:'80px 0',color:'var(--muted)'}}>
                <div style={{fontSize:48,marginBottom:12}}>🔐</div>
                <div style={{fontSize:16,marginBottom:16}}>{t.loginToSave}</div>
                <button className="btn-primary" onClick={()=>{setAuthTab("login");setShowAuth(true);}}>{t.login}</button>
              </div>
            ) : saved.length === 0 ? (
              <div style={{textAlign:'center',padding:'80px 0',color:'var(--muted)'}}>
                <div style={{fontSize:48,marginBottom:12}}>🤍</div>
                <div style={{fontSize:16}}>{t.noSaved}</div>
              </div>
            ) : (
              <div className="events-grid">
                {events.filter(e=>saved.includes(e.id)).map(ev => (
                  <div key={ev.id} className="event-card" onClick={() => setSelectedEvent(ev)}>
                    <div className="event-card-img" style={{backgroundImage: `url(${ev.imageUrl || getCatConfig(ev.cat).img})`, backgroundSize:'cover', backgroundPosition:'center'}}>
                      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.35)'}} />
                      <span className="event-card-cat" style={{zIndex:1}}>{ev.cat}</span>
                    </div>
                    <div className="event-card-body">
                      <div className="event-card-title">{ev.title}</div>
                      <div className="event-card-info">
                        <div className="event-card-info-row"><Calendar size={13} color="var(--muted)" /> {ev.date}</div>
                        <div className="event-card-info-row"><MapPin size={13} color="var(--muted)" /> {ev.place}</div>
                      </div>
                      <div className="event-card-footer">
                        <div className={`event-card-price ${ev.price==="Gratis"?"free":""}`}>{ev.price}</div>
                        <button className="btn-reserve" onClick={e=>{e.stopPropagation();setSelectedEvent(ev);}}>{t.viewDetail}</button>
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
            {!user ? (
              <div>
                <div style={{fontSize:64,marginBottom:16}}>👤</div>
                <div style={{color:'var(--muted)',marginBottom:24}}>{t.loginToSave}</div>
                <button className="btn-primary" onClick={()=>{setAuthTab("login");setShowAuth(true);}}>{t.login}</button>
              </div>
            ) : (
              <>
                <div style={{width:72,height:72,borderRadius:'50%',background:'var(--gold)',color:'var(--dark)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:700,margin:'0 auto 16px'}}>{getUserInitial()}</div>
                <div style={{fontFamily:'var(--font-display)',fontSize:28,marginBottom:4}}>{getUserName().toUpperCase()}</div>
                <div style={{color:'var(--muted)',marginBottom:32,fontSize:14}}>{user.email}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,maxWidth:300,margin:'0 auto 32px'}}>
                  {[[t.eventsAttended,"12"],[t.eventsSaved,String(saved.length)],[t.eventsCreated,"3"],[t.reviews,"8"]].map(([l,v])=>(
                    <div key={l} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'16px 12px'}}>
                      <div style={{fontFamily:'var(--font-display)',fontSize:28,color:'var(--gold)'}}>{v}</div>
                      <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{l}</div>
                    </div>
                  ))}
                </div>
                <button className="btn-ghost" onClick={handleLogout}>{t.closeSession}</button>
              </>
            )}
          </div>
        )}

        <footer style={{background:'var(--surface2)', borderTop:'1px solid var(--border)', padding:'20px 24px', textAlign:'center'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:16, flexWrap:'wrap'}}>
            <span style={{fontFamily:'var(--font-display)', fontSize:18, color:'var(--gold)'}}>MEDELLÍN VIBRA</span>
            <a href="https://www.instagram.com/medellinvibra.co/" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex', alignItems:'center', gap:6, color:'#C0392B', fontWeight:600, fontSize:13, textDecoration:'none', fontFamily:'var(--font-body)'}}>
              📸 @medellinvibra.co
            </a>
            <span style={{fontSize:12, color:'var(--muted)'}}>{t.copyright}</span>
          </div>
        </footer>

        <nav className="bottom-nav">
          {[[" 🏠",t.tabHome,"home"],["🔍",t.tabExplore,"explore"],[saved.length > 0 ? "❤️" : "🤍",t.tabSaved,"saved"],["👤",t.tabProfile,"profile"]].map(([icon,label,tab])=>(
            <button key={tab} className={`bottom-nav-item ${activeTab===tab?"active":""}`} onClick={()=>setActiveTab(tab)}>
              <span>{icon}</span><span>{label}</span>
            </button>
          ))}
        </nav>

        {showAuth && (
          <div className="auth-overlay" onClick={()=>setShowAuth(false)}>
            <div className="auth-panel" style={{position:'relative'}} onClick={e=>e.stopPropagation()}>
              <button className="auth-close" onClick={()=>setShowAuth(false)}>✕</button>
              <div className="auth-logo">MEDELLÍN VIBRA</div>
              <div className="auth-title">{authTab==="login" ? t.welcome : t.createAccount}</div>
              <div className="auth-sub">{authTab==="login" ? t.loginSub : t.registerSub}</div>
              <div className="auth-tabs">
                <button className={`auth-tab ${authTab==="login"?"active":""}`} onClick={()=>{setAuthTab("login");setAuthError("");setAuthSuccess("");}}>{t.login}</button>
                <button className={`auth-tab ${authTab==="register"?"active":""}`} onClick={()=>{setAuthTab("register");setAuthError("");setAuthSuccess("");}}>{t.register}</button>
              </div>
              <div className="auth-form">
                {authTab === "register" && <input className="auth-input" placeholder={t.fullName} value={authName} onChange={e=>setAuthName(e.target.value)} />}
                <input className="auth-input" type="email" placeholder={t.emailPlaceholder} value={authEmail} onChange={e=>setAuthEmail(e.target.value)} />
                <input className="auth-input" type="password" placeholder={t.passwordPlaceholder} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} />
                {authTab === "login" && !showForgot && (
                  <div style={{textAlign:'right',marginTop:-8}}>
                    <span style={{fontSize:13,color:'var(--gold)',cursor:'pointer',textDecoration:'underline'}} onClick={()=>{setShowForgot(true);setAuthError("");setAuthSuccess("");}}>
                      {t.forgotPassword}
                    </span>
                  </div>
                )}
                {showForgot && (
                  <div style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:12,padding:16}}>
                    <div style={{fontSize:14,marginBottom:10,color:'var(--muted)'}}>Escribe tu correo y te enviamos un link para restablecer tu contraseña.</div>
                    <input className="auth-input" type="email" placeholder="correo@ejemplo.com" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} style={{marginBottom:10}} />
                    <div style={{display:'flex',gap:8}}>
                      <button className="btn-cancel" style={{flex:0,padding:'10px 14px',borderRadius:8}} onClick={()=>setShowForgot(false)}>{t.cancel}</button>
                      <button className="auth-btn" style={{margin:0}} disabled={forgotLoading} onClick={handleForgotPassword}>
                        {forgotLoading ? "Enviando..." : "Enviar correo →"}
                      </button>
                    </div>
                  </div>
                )}
                {authError && <div className="auth-error">⚠️ {authError}</div>}
                {authSuccess && <div className="auth-success">{authSuccess}</div>}
                {!showForgot && <button className="auth-btn" disabled={authLoading} onClick={authTab==="login"?handleLogin:handleRegister}>
                  {authLoading ? t.loading_auth : authTab==="login" ? t.loginBtn : t.registerBtn}
                </button>}
              </div>
            </div>
          </div>
        )}

        {selectedEvent && (
          <div className="detail-overlay" onClick={()=>setSelectedEvent(null)}>
            <div className="detail-panel" onClick={e=>e.stopPropagation()}>
              <div className="detail-header" style={{backgroundImage: `url(${selectedEvent.imageUrl || getCatConfig(selectedEvent.cat).img})`, backgroundSize:'cover', backgroundPosition:'center'}}>
                <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.4)'}} />
                <div className="detail-header-overlay" />
                <button className="detail-close" onClick={()=>setSelectedEvent(null)}>✕</button>
              </div>
              <div className="detail-body">
                {selectedEvent.tag && <span className="detail-badge" style={{background:'var(--red)',color:'white'}}>{selectedEvent.tag}</span>}
                <div className="detail-title">{selectedEvent.title}</div>
                <div className="detail-info-grid">
                  <div className="detail-info-item"><div className="detail-info-label">{t.date}</div><div className="detail-info-value">{selectedEvent.date}</div></div>
                  <div className="detail-info-item"><div className="detail-info-label">{t.time}</div><div className="detail-info-value">{selectedEvent.time}</div></div>
                  <div className="detail-info-item"><div className="detail-info-label">{t.place}</div><div className="detail-info-value">{selectedEvent.place}</div></div>
                  <div className="detail-info-item"><div className="detail-info-label">{t.price}</div><div className="detail-info-value" style={{color: selectedEvent.price==="Gratis"?'var(--green)':'var(--gold)'}}>{selectedEvent.price}</div></div>
                </div>
                <p className="detail-desc">{selectedEvent.desc}</p>
                <div className="detail-map" style={{cursor:'pointer'}} onClick={()=>window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedEvent.place)}`, '_blank')}>
                  📍 {t.viewMap} · {selectedEvent.place}
                </div>
                {selectedEvent.ticketPlatform && (
                  <div style={{marginBottom:12,display:'flex',alignItems:'center',gap:8,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 14px',cursor: selectedEvent.link ? 'pointer' : 'default'}}
                    onClick={() => selectedEvent.link && window.open(selectedEvent.link, '_blank')}>
                    <span style={{fontSize:16}}>🎟️</span>
                    <div>
                      <div style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{t.officialTickets}</div>
                      <div style={{fontWeight:700,fontSize:14,color:'var(--gold)'}}>{selectedEvent.ticketPlatform} {selectedEvent.link && '↗'}</div>
                    </div>
                  </div>
                )}
                {selectedEvent.organizerName && (
                  <div style={{marginBottom:16,display:'flex',alignItems:'center',gap:8,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 14px'}}>
                    <span style={{fontSize:16}}>👤</span>
                    <div>
                      <div style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{t.organizer}</div>
                      <div style={{fontWeight:700,fontSize:14}}>{selectedEvent.organizerName}</div>
                      {selectedEvent.organizerContact && (
                        selectedEvent.organizerContact.startsWith('http') 
                          ? <a href={selectedEvent.organizerContact} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:'var(--gold)',marginTop:2,display:'block',textDecoration:'none'}}>{selectedEvent.organizerContact} ↗</a>
                          : <div style={{fontSize:13,color:'var(--gold)',marginTop:2}}>{selectedEvent.organizerContact}</div>
                      )}
                    </div>
                  </div>
                )}
                <div className="detail-actions">
                  <button className="btn-buy" onClick={() => { if(selectedEvent.link) window.open(selectedEvent.link,'_blank'); else handleReserve(); }}>
                    {selectedEvent.price === "Gratis" ? t.registerFree : selectedEvent.price.startsWith("En") ? t.buyTickets : `${t.buy} · ${selectedEvent.price} →`}
                  </button>
                  <button className="btn-share" title="Compartir por WhatsApp" style={{color:'#25D366',borderColor:'rgba(37,211,102,0.3)'}} onClick={()=>{
                    const texto = `🎉 *${selectedEvent.title}*\n📅 ${selectedEvent.date} · ${selectedEvent.time}\n📍 ${selectedEvent.place}\n💰 ${selectedEvent.price}\n\n👉 Más info en medellinvibra.co`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
                  }}><MessageCircle size={20} /></button>
                  <button className="btn-share" onClick={()=>toggleSave(selectedEvent.id)}>{saved.includes(selectedEvent.id) ? "❤️" : "🤍"}</button>
                  {isAdmin && (
                    <button className="btn-share" style={{color:'var(--red)',borderColor:'rgba(232,53,58,0.3)'}} onClick={e=>{handleDeleteEvent(selectedEvent.id,e);setSelectedEvent(null);}}>🗑️</button>
                  )}
                </div>
                <button onClick={()=>setSelectedEvent(null)} style={{width:'100%',marginTop:16,padding:'16px',borderRadius:12,border:'1px solid var(--border)',background:'var(--surface2)',color:'var(--muted)',fontFamily:'var(--font-body)',fontSize:15,fontWeight:600,cursor:'pointer'}}>
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        )}

        {showCreate && (
          <div className="create-overlay" onClick={()=>setShowCreate(false)}>
            <div className="create-panel" onClick={e=>e.stopPropagation()}>
              <div className="create-title">Publicar <span>Evento</span></div>

              <div className="form-group">
                <label className="form-label">Emoji del evento</label>
                <input className="form-input" placeholder="ej. 🎵 🎨 🍜 💃" value={form.emoji} onChange={e=>handleFormChange("emoji",e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre del evento *</label>
                <input className="form-input" placeholder="ej. Festival de Jazz Medellín" value={form.title} onChange={e=>handleFormChange("title",e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-select" value={form.category} onChange={e=>handleFormChange("category",e.target.value)}>
                  {CATS.filter(c=>c!=="Todos").map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input className="form-input" type="date" value={form.date} onChange={e=>handleFormChange("date",e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora</label>
                  <input className="form-input" type="time" value={form.time} onChange={e=>handleFormChange("time",e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Lugar / Dirección *</label>
                <input className="form-input" placeholder="ej. Parque Arví, Medellín" value={form.place} onChange={e=>handleFormChange("place",e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Precio</label>
                  <input className="form-input" placeholder="ej. $50.000 o Gratis" value={form.price} onChange={e=>handleFormChange("price",e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacidad</label>
                  <input className="form-input" type="number" placeholder="ej. 500" value={form.capacity} onChange={e=>handleFormChange("capacity",e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-textarea" placeholder="Cuéntanos de qué trata tu evento..." value={form.description} onChange={e=>handleFormChange("description",e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">🖼️ URL de la imagen del evento</label>
                <input className="form-input" placeholder="https://... (pega el link de la foto del evento)" value={form.image_url} onChange={e=>handleFormChange("image_url",e.target.value)} />
                <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>Si no tienes imagen, se usará la foto de la categoría automáticamente.</div>
              </div>

              <div style={{borderTop:'1px solid var(--border)',margin:'16px 0',paddingTop:16}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--gold)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:14}}>👤 Información del organizador</div>
                <div className="form-group">
                  <label className="form-label">Nombre del organizador</label>
                  <input className="form-input" placeholder="ej. Productora XYZ" value={form.organizer_name} onChange={e=>handleFormChange("organizer_name",e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contacto (WhatsApp, Instagram, correo)</label>
                  <input className="form-input" placeholder="ej. @productoraxyz o +57 300 123 4567" value={form.organizer_contact} onChange={e=>handleFormChange("organizer_contact",e.target.value)} />
                </div>
              </div>

              <div style={{borderTop:'1px solid var(--border)',margin:'16px 0',paddingTop:16}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--gold)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:14}}>🎟️ Venta de entradas</div>
                <div className="form-group">
                  <label className="form-label">Plataforma de venta</label>
                  <input className="form-input" placeholder="ej. TuBoleta, La Tiquetera, Gratis" value={form.ticket_platform} onChange={e=>handleFormChange("ticket_platform",e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Link de compra</label>
                  <input className="form-input" placeholder="https://..." value={form.ticket_link} onChange={e=>handleFormChange("ticket_link",e.target.value)} />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-cancel" onClick={()=>setShowCreate(false)}>{t.cancel}</button>
                <button className="btn-submit" onClick={handleCreateSubmit} disabled={formLoading}>
                  {formLoading ? t.publishing : t.publish}
                </button>
              </div>
            </div>
          </div>
        )}

        {showResetPassword && (
          <div className="auth-overlay">
            <div className="auth-panel" style={{position:'relative'}}>
              <div className="auth-logo">MEDELLÍN VIBRA</div>
              <div className="auth-title">Nueva contraseña</div>
              <div className="auth-sub">Escribe tu nueva contraseña para continuar.</div>
              <div className="auth-form">
                <input className="auth-input" type="password" placeholder="Nueva contraseña (mín. 6 caracteres)" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
                <button className="auth-btn" disabled={resetLoading} onClick={handleResetPassword}>
                  {resetLoading ? "Guardando..." : "Guardar contraseña →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
