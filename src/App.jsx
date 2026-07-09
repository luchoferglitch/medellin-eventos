import { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { Calendar, MapPin, MessageCircle, Home, Search, Map as MapIcon, Heart, User, Settings, Sun, Moon, Clock, Handshake, Mail, CalendarPlus, PartyPopper, Link2, Trash2, Tag, Ticket, Drama, Music, FerrisWheel, Landmark, Music4, Trophy, Telescope, ShoppingBag, Mic, Palette } from "lucide-react";
import { translations } from "./translations";
import EventoPage from "./EventoPage";
import OrganizadorPage from "./OrganizadorPage";
import OrganizadoresLanding from "./OrganizadoresLanding";

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

// Iconos de marca (retirados de lucide-react; trazos originales MIT)
const InstagramIcon = ({ size = 14, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);
const FacebookIcon = ({ size = 14, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

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

// Sistema de tags editoriales
const TAGS_CONFIG = {
  "Destacado":        { emoji: "⭐", color: "#C8860A", bg: "rgba(200,134,10,0.12)", border: "rgba(200,134,10,0.3)" },
  "Últimas entradas": { emoji: "🎟️", color: "#DC2626", bg: "rgba(220,38,38,0.10)", border: "rgba(220,38,38,0.3)" },
  "Agotado":          { emoji: "🔥", color: "#7C3AED", bg: "rgba(124,58,237,0.10)", border: "rgba(124,58,237,0.3)" },
  "Nuevo":            { emoji: "🆕", color: "#059669", bg: "rgba(5,150,105,0.10)",  border: "rgba(5,150,105,0.3)"  },
  "Próximo":          { emoji: "", color: "#C8860A", bg: "rgba(200,134,10,0.12)", border: "rgba(200,134,10,0.3)" },
};

const ADMIN_TAGS = ["Destacado", "Últimas entradas", "Agotado"]; // asignables manualmente

const slugify = (str) =>
  str?.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-")
    .slice(0, 80) || "";

const isNewEvent = (event) => {
  if (!event.fechaReal) return false;
  const created = event.createdAt ? new Date(event.createdAt) : null;
  if (!created) return false;
  const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

// Calcula la próxima fecha de un evento recurrente
const getProximaFecha = (ev) => {
  if (!ev.recurrencia) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  if (ev.recurrencia === "semanal" && ev.diaSemana !== null && ev.diaSemana !== undefined) {
    const next = new Date(today);
    const diff = (ev.diaSemana - today.getDay() + 7) % 7;
    // Si diff === 0 significa que hoy es ese día — mostrar el próximo (en 7 días)
    next.setDate(today.getDate() + (diff === 0 ? 7 : diff));
    return next;
  }
  if (ev.recurrencia === "mensual" && ev.diaMes) {
    const next = new Date(today.getFullYear(), today.getMonth(), ev.diaMes);
    if (next <= today) next.setMonth(next.getMonth() + 1);
    return next;
  }
  return null;
};

const DIAS_SEMANA = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES_CORTO = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&display=swap');
  @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --gold: #C8860A; --red: #C0392B; --green: #27AE60;
    --dark: #1a1a1a; --surface: #FFFFFF; --surface2: #F5F3EF;
    --border: rgba(0,0,0,0.08); --text: #1a1a1a; --muted: #888;
    --font-display: 'Bebas Neue', sans-serif; --font-body: 'DM Sans', sans-serif;
  }
  .dark-mode {
    --surface: #1e1e1e; --surface2: #2a2a2a; --dark: #0a0a0a;
    --border: rgba(255,255,255,0.08); --text: #f0f0f0; --muted: #888;
  }
  .dark-mode body, body.dark-mode { background: #141414; color: var(--text); }
  .dark-mode .app { background: #141414; }
  .dark-mode .nav { background: rgba(20,20,20,0.95); }
  .dark-mode .bottom-nav { background: rgba(20,20,20,0.97); }
  .dark-mode .event-card { background: var(--surface); }
  .dark-mode .filters-bar, .dark-mode .tags-bar { background: #1e1e1e; }
  .dark-mode .filter-chip { background: #2a2a2a; }
  .dark-mode .detail-panel { background: #1e1e1e; }
  .dark-mode .auth-modal { background: #1e1e1e; }
  .dark-mode .form-input, .dark-mode .form-select, .dark-mode .form-textarea { background: #2a2a2a; color: var(--text); }
  .dark-mode .admin-event-row { background: #1e1e1e; }
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
  .nav-links { display: none; }
  @media (min-width: 768px) {
    .nav-links { display: flex; gap: 4px; margin-left: 18px; flex: 1; }
    .nav-link { background: none; border: none; cursor: pointer; font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--muted); padding: 8px 12px; border-radius: 8px; transition: all 0.2s; }
    .nav-link:hover { color: var(--gold); background: var(--surface2); }
    .nav-link.active { color: var(--gold); }
    .bottom-nav { display: none; }
  }
  @media (max-width: 640px) {
    .nav { padding: 0 14px; }
    .nav-logo { font-size: 20px; }
    .nav-actions { gap: 6px; }
    .nav-actions .btn-ghost { padding: 8px 10px; }
    .nav-actions .btn-primary { padding: 8px 12px; white-space: nowrap; }
  }
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
    background-image: url('https://i.imgur.com/gcIvQUD.jpg');
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
  .about-text { font-size: 17px; line-height: 1.8; color: #555; max-width: 640px; margin: 0 auto; text-align: left; }

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
  .detail-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); display: flex; align-items: flex-end; justify-content: center; animation: fadeIn 0.2s; }
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
  .detail-desc { color: #555; font-size: 15px; line-height: 1.7; margin-bottom: 28px; text-align: left; }
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
  .bottom-nav { position: sticky; bottom: 0; z-index: 200; background: rgba(255,255,255,0.97); backdrop-filter: blur(16px); border-top: 1px solid var(--border); display: flex; justify-content: space-around; padding: 10px 0 16px; box-shadow: 0 -4px 20px rgba(0,0,0,0.06); }
  .bottom-nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--muted); font-size: 11px; cursor: pointer; padding: 4px 16px; transition: color 0.2s; background: none; border: none; font-family: var(--font-body); }
  .bottom-nav-item.active { color: var(--gold); }
  .bottom-nav-item span:first-child { font-size: 20px; display: flex; align-items: center; justify-content: center; position: relative; }
  .map-container { position: relative; flex: 1; min-height: 0; }
  .map-wrap { height: 100%; width: 100%; }
  .map-popup { font-family: var(--font-body); min-width: 200px; }
  .map-popup-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; color: var(--text); }
  .map-popup-meta { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
  .map-popup-price { font-weight: 700; font-size: 13px; color: var(--gold); margin-bottom: 8px; }
  .map-popup-btn { background: var(--gold); color: white; border: none; padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: var(--font-body); width: 100%; }
  .map-loading { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); background: white; border: 1px solid var(--border); border-radius: 100px; padding: 6px 16px; font-size: 12px; font-weight: 600; color: var(--muted); z-index: 1000; box-shadow: 0 2px 12px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 6px; }
  .map-filters { position: absolute; top: 12px; right: 12px; z-index: 1000; display: flex; flex-direction: column; gap: 6px; }
  .map-filter-btn { background: white; border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: var(--font-body); box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: all 0.2s; color: var(--text); }
  .map-filter-btn:hover { border-color: var(--gold); color: var(--gold); }
  .leaflet-popup-content-wrapper { border-radius: 14px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important; border: 1px solid var(--border) !important; }
  .leaflet-popup-tip { display: none !important; }
  .toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: var(--green); color: white; padding: 12px 24px; border-radius: 100px; font-weight: 700; font-size: 14px; z-index: 300; animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
  @keyframes toastIn { from{transform:translateX(-50%) translateY(20px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
  .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--gold); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; cursor: pointer; border: 2px solid rgba(200,134,10,0.3); }
  .tags-bar { padding: 10px 24px; display: flex; gap: 8px; overflow-x: auto; background: white; border-bottom: 1px solid var(--border); }
  .tags-bar::-webkit-scrollbar { display: none; }
  .tag-chip { flex-shrink: 0; display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; white-space: nowrap; }
  .tag-chip:hover { transform: translateY(-1px); }
  .admin-tag-picker { position: absolute; bottom: calc(100% + 8px); right: 0; background: white; border: 1px solid var(--border); border-radius: 14px; padding: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); z-index: 50; min-width: 180px; }
  .admin-tag-option { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: background 0.15s; }
  .admin-tag-option:hover { background: var(--surface2); }
  .admin-panel { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .admin-section-title { font-family: var(--font-display); font-size: 22px; color: var(--text); padding: 8px 0 4px; }
  .admin-event-row { background: white; border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; display: flex; gap: 12px; align-items: flex-start; }
  .admin-event-row-img { width: 56px; height: 56px; border-radius: 10px; background: var(--surface2); background-size: cover; background-position: center; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 24px; }
  .admin-event-row-info { flex: 1; min-width: 0; }
  .admin-event-row-title { font-weight: 700; font-size: 14px; color: var(--text); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .admin-event-row-meta { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
  .admin-event-row-actions { display: flex; gap: 6px; flex-wrap: wrap; }
  .admin-btn-approve { background: #059669; color: white; border: none; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: var(--font-body); }
  .admin-btn-reject { background: var(--red); color: white; border: none; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: var(--font-body); }
  .admin-btn-delete { background: var(--surface2); color: var(--muted); border: 1px solid var(--border); padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: var(--font-body); }
  .admin-badge { background: var(--red); color: white; border-radius: 100px; font-size: 10px; font-weight: 700; padding: 1px 6px; margin-left: 4px; }
`;

const ADMINS = ["luchofer2001@gmail.com"];

// ── Seguridad: Rate limiter y sanitización ──
const rateLimiter = {};
const checkRateLimit = (key, maxAttempts = 3, windowMs = 60000) => {
  const now = Date.now();
  if (!rateLimiter[key]) rateLimiter[key] = [];
  rateLimiter[key] = rateLimiter[key].filter(t => now - t < windowMs);
  if (rateLimiter[key].length >= maxAttempts) return false;
  rateLimiter[key].push(now);
  return true;
};
const sanitize = (str) => {
  if (!str) return "";
  return str.replace(/[<>]/g, "").replace(/javascript:/gi, "").replace(/on\w+=/gi, "").trim();
};
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidUrl = (url) => !url || url.startsWith("http://") || url.startsWith("https://");

// Agregar evento al calendario (Google Calendar URL)
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

const CATS = ["Todos","Música","Arte","Comedia","Tech","Gastronomía","Baile","Deportes","Teatro","Bienestar","Académicos"];

// ── Geocodificación: límites de la región y venues verificados ──
// Rectángulo que cubre el Valle de Aburrá y el Oriente Cercano
const GEO_BOUNDS = { latMin: 5.90, latMax: 6.50, lngMin: -75.80, lngMax: -75.10 };
const inRegion = (lat, lng) =>
  lat >= GEO_BOUNDS.latMin && lat <= GEO_BOUNDS.latMax &&
  lng >= GEO_BOUNDS.lngMin && lng <= GEO_BOUNDS.lngMax;

// Normaliza texto: minúsculas y sin tildes, para comparar nombres de lugares
const normPlace = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Coordenadas verificadas (Google Places, jun 2026). Se comparan por palabra
// completa contra el campo `place`, en orden: los más específicos primero.
const VENUES_CONOCIDOS = [
  // Venues de Medellín
  { match: "teatro metropolitano", lat: 6.2430, lng: -75.5775 },
  { match: "plaza mayor", lat: 6.2410, lng: -75.5759 },
  { match: "pablo tobon", lat: 6.2476, lng: -75.5594 },
  { match: "mamm", lat: 6.2238, lng: -75.5738 },
  { match: "museo de arte moderno", lat: 6.2238, lng: -75.5738 },
  { match: "el tesoro", lat: 6.1973, lng: -75.5582 },
  { match: "claustro comfama", lat: 6.2459, lng: -75.5640 },
  { match: "teatro comfama", lat: 6.2459, lng: -75.5640 },
  { match: "patio teatro", lat: 6.2459, lng: -75.5640 },
  { match: "teatro ateneo", lat: 6.2445, lng: -75.5634 },
  { match: "teatro panamericana", lat: 6.1980, lng: -75.5737 },
  { match: "teatro lido", lat: 6.2524, lng: -75.5645 },
  { match: "coliseo de combate", lat: 6.2550, lng: -75.5887 },
  { match: "alfonso galvis", lat: 6.2577, lng: -75.5876 },
  { match: "atanasio girardot", lat: 6.2568, lng: -75.5902 },
  { match: "jardin botanico", lat: 6.2694, lng: -75.5648 },
  { match: "parque explora", lat: 6.2706, lng: -75.5650 },
  { match: "biblioteca espana", lat: 6.2947, lng: -75.5441 },
  { match: "jose luis arroyave", lat: 6.2545, lng: -75.6134 },
  { match: "chamorro city hall", lat: 6.2047, lng: -75.5971 },
  { match: "city hall el rodeo", lat: 6.2047, lng: -75.5971 },
  { match: "eafit", lat: 6.1996, lng: -75.5792 },
  { match: "universidad ces", lat: 6.2080, lng: -75.5524 },
  { match: "upb", lat: 6.2421, lng: -75.5895 },
  { match: "pontificia bolivariana", lat: 6.2421, lng: -75.5895 },
  { match: "universidad de medellin", lat: 6.2312, lng: -75.6109 },
  { match: "coltejer", lat: 6.2501, lng: -75.5661 },
  { match: "trilogia bar", lat: 6.2256, lng: -75.5724 },
  // Venues del Área Metropolitana y Oriente Cercano
  { match: "polideportivo sur", lat: 6.1630, lng: -75.6003 },
  { match: "polideportivo de envigado", lat: 6.1630, lng: -75.6003 },
  { match: "media luna", lat: 6.0729, lng: -75.4971 },
  { match: "llanogrande", lat: 6.1153, lng: -75.4170 },
  // Municipios (parques principales) — van al final, como respaldo
  { match: "el retiro", lat: 6.0573, lng: -75.5027 },
  { match: "carmen de viboral", lat: 6.0832, lng: -75.3354 },
  { match: "marinilla", lat: 6.1737, lng: -75.3346 },
  { match: "rionegro", lat: 6.1536, lng: -75.3736 },
  { match: "guarne", lat: 6.2772, lng: -75.4428 },
  { match: "la ceja", lat: 6.0303, lng: -75.4314 },
  { match: "sabaneta", lat: 6.1515, lng: -75.6154 },
  { match: "envigado", lat: 6.1700, lng: -75.5874 },
  { match: "itagui", lat: 6.1723, lng: -75.6094 },
  { match: "la estrella", lat: 6.1578, lng: -75.6431 },
  { match: "caldas", lat: 6.0911, lng: -75.6353 },
  { match: "bello", lat: 6.3367, lng: -75.5558 },
  { match: "copacabana", lat: 6.3467, lng: -75.5092 },
  { match: "girardota", lat: 6.3786, lng: -75.4453 },
  { match: "barbosa", lat: 6.4389, lng: -75.3314 },
];

// Busca el lugar en el diccionario de venues verificados (coincidencia de palabra completa)
const matchVenueConocido = (place) => {
  const placeNorm = normPlace(place);
  return VENUES_CONOCIDOS.find(v => new RegExp(`\\b${v.match}\\b`).test(placeNorm)) || null;
};

export default function App() {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [activeDateFilter, setActiveDateFilter] = useState("Todos");
  const [activeZona, setActiveZona] = useState("Todas");
  const [activeTagFilter, setActiveTagFilter] = useState(null);
  const [adminTagPicker, setAdminTagPicker] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("mv-dark") === "1");
  const [pendingEvents, setPendingEvents] = useState([]);
  const [adminSection, setAdminSection] = useState("pending"); // "pending" | "approved" | "stats"
  const [adminStats, setAdminStats] = useState(null);
  const [subEmail, setSubEmail] = useState("");
  const [subNombre, setSubNombre] = useState("");
  const [subLoading, setSubLoading] = useState(false);
  const [subDone, setSubDone] = useState(false);
  const [honeypot, setHoneypot] = useState(""); // anti-bot field
  const [geoCache, setGeoCache] = useState({});
  const [hourTick, setHourTick] = useState(0);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoProgress, setGeoProgress] = useState({ done: 0, total: 0 });
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [markerCount, setMarkerCount] = useState(0);
  const leafletRef = useRef(null); // event id with open picker
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [saved, setSaved] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
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

  const [stats, setStats] = useState({ eventos: 0, promocionados: 0, usuarios: 0, organizadores: 0 });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [lang, setLang] = useState("es");
  const t = translations[lang];

  // Actualiza el evento destacado rotativo cada hora (evita leer Date.now() durante el render)
  useEffect(() => {
    const updateTick = () => setHourTick(Math.floor(Date.now() / 3600000));
    updateTick();
    const interval = setInterval(updateTick, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchFavorites = async (currentUser) => {
    if (!currentUser) { setSaved([]); return; }
    const { data, error } = await supabase.from("favorites").select("event_id").eq("user_id", currentUser.id);
    if (error) { console.log("Error fetching favorites:", error); return; }
    if (data) setSaved(data.map(f => Number(f.event_id)));
  };

  const fetchStats = async () => {
    try {
      const { data: contadorData } = await supabase.from("contador_historico").select("total").eq("id", 1).single();
      const promocionados = contadorData?.total || 104;
      const { count: aprobados } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("estado", "aprobado");
      const { data: orgs } = await supabase.from("events").select("organizer_name");
      const organizadores = new Set(orgs?.filter(e => e.organizer_name).map(e => e.organizer_name)).size;
      const { count: visitas } = await supabase.from("page_views").select("*", { count: "exact", head: true });
      setStats({ eventos: aprobados || 0, promocionados: promocionados, usuarios: visitas || 0, organizadores: organizadores || 0 });
    } catch(e) { console.log("Stats error:", e); }
  };
  const fetchEvents = async () => {
    const { data, error } = await supabase.from("events").select("*, recurrencia, dia_semana, dia_mes").eq("estado", "aprobado").order("fecha_real", { ascending: true, nullsFirst: false });
    if (!error && data) {
      setEvents(data.map(e => ({
        id: e.id, emoji: e.emoji, title: e.title, cat: e.category,
        date: e.date, time: e.time, place: e.place, price: e.price,
        color: e.color, tag: e.tag, desc: e.description,
        attendees: String(e.attendees), capacity: String(e.capacity),
        ticketPlatform: e.ticket_platform, link: e.ticket_link,
        organizerName: e.organizer_name, organizerContact: e.organizer_contact,
        imageUrl: e.image_url, fechaReal: e.fecha_real, fechaFin: e.fecha_fin, zona: e.zona,
        createdAt: e.created_at, lat: e.lat, lng: e.lng,
        recurrencia: e.recurrencia, diaSemana: e.dia_semana, diaMes: e.dia_mes,
      })));
    }
    setLoading(false);
  };

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


  const SYNONYMS = {
    "Música":      ["concierto","conciertos","show","banda","artista","música","musica","rock","jazz","salsa","reggaeton","reggaetón","pop","electrónica","electronica","sinfónico","sinfonico","orquesta","ópera","opera","zarzuela","tributo","bolero","vallenato","cumbia","rap","hip hop","metal","punk","ska","trova"],
    "Arte":        ["exposición","exposicion","galería","galeria","museo","pintura","cultura","arte","mural","fotografía","fotografia","escultura","instalación","instalacion","dibujo","ilustración","ilustracion"],
    "Comedia":     ["humor","chistes","risa","stand up","standup","comedia","monólogo","monologo","comediante","improvisación","improvisacion"],
    "Tech":        ["tecnología","tecnologia","innovación","innovacion","startup","digital","tech","programación","programacion","software","python","inteligencia artificial","ia","datos","data","ciberseguridad","hackathon","developer","desarrollador"],
    "Baile":       ["danza","salsa","tango","rumba","baile","ballet","contemporáneo","contemporaneo","urbano","breakdance","folclor","folclore","coreografía","coreografia"],
    "Teatro":      ["obra","espectáculo","espectaculo","actuación","actuacion","escena","teatro","dramaturgia","monólogo","monologo","musical","mimo","circo","performance","ópera","opera"],
    "Gastronomía": ["comida","restaurante","chef","cocina","food","gastronomía","gastronomia","festival","feria","sabores","plato","receta","vino","cerveza","maridaje","foodie","brunch","degustación","degustacion"],
    "Bienestar":   ["yoga","meditación","meditacion","salud","bienestar","taller","mindfulness","pilates","fitness","retiro","respiración","respiracion","sanación","sanacion","terapia","wellness"],
    "Deportes":    ["carrera","fútbol","futbol","running","maratón","maraton","deporte","deportes","ciclismo","natación","natacion","atletismo","baloncesto","voleibol","tenis","escalada","trail","triatlón","triatlon","crossfit"],
    "Académicos":  ["congreso","seminario","simposio","conferencia","académico","academico","feria","bienal","poesía","poesia","libro","lectura","literatura","escritura","educación","educacion","ciencia","investigación","investigacion","foro"],
  };

  // Sinónimos de precio y fecha para búsqueda directa
  const PRICE_SYNONYMS = ["gratis","gratuito","gratuita","sin costo","sin cobro","libre","entrada libre","entrada gratuita","free"];
  const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

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
    const s = search.toLowerCase().trim();
    const synCat = getCatFromSynonym(s);
    const effectiveTagForSearch = e.tag || (isNewEvent(e) ? "Nuevo" : null);

    // ¿Es una búsqueda de precio gratis?
    const isSearchingFree = PRICE_SYNONYMS.some(p => p.includes(s) || s.includes(p));
    // ¿Está buscando por mes?
    const mesIdx = MESES.findIndex(m => s.includes(m));
    const matchMes = mesIdx >= 0 && e.fechaReal
      ? e.fechaReal.startsWith(`2026-${String(mesIdx + 1).padStart(2, '0')}`) ||
        (e.fechaFin && e.fechaFin.startsWith(`2026-${String(mesIdx + 1).padStart(2, '0')}`))
      : false;

    const matchSearch = !s ||
      e.title?.toLowerCase().includes(s) ||
      e.place?.toLowerCase().includes(s) ||
      e.desc?.toLowerCase().includes(s) ||
      e.organizerName?.toLowerCase().includes(s) ||
      e.zona?.toLowerCase().includes(s) ||
      e.ticketPlatform?.toLowerCase().includes(s) ||
      e.date?.toLowerCase().includes(s) ||
      effectiveTagForSearch?.toLowerCase().includes(s) ||
      (synCat && e.cat === synCat) ||
      (isSearchingFree && e.price === "Gratis") ||
      matchMes;

    let matchDate = true;
    if (activeDateFilter !== "Todos") {
      if (e.recurrencia) {
        // Eventos recurrentes siempre aparecen excepto en filtro de mes específico
        matchDate = activeDateFilter !== "Gratis" && activeDateFilter !== "ConCobro";
        if (activeDateFilter === "Gratis") matchDate = e.price === "Gratis";
        else if (activeDateFilter === "ConCobro") matchDate = e.price !== "Gratis";
        else {
          // Para hoy/finde/semana verificar si la próxima ocurrencia cae en ese rango
          const proxima = getProximaFecha(e);
          if (proxima) {
            const { today, weekendStart, weekendEnd, weekEnd, monthEnd } = getDateRange();
            const proximaStr = proxima.toISOString().split('T')[0];
            if (activeDateFilter === "Hoy") matchDate = proximaStr === today;
            else if (activeDateFilter === "FinDeSemana") matchDate = proximaStr >= weekendStart && proximaStr <= weekendEnd;
            else if (activeDateFilter === "EstaSemana") matchDate = proximaStr >= today && proximaStr <= weekEnd;
            else if (activeDateFilter === "EsteMes") matchDate = proximaStr >= today && proximaStr <= monthEnd;
          }
        }
      } else if (e.fechaReal) {
        const { today, weekendStart, weekendEnd, weekEnd, monthEnd } = getDateRange();
        const fin = e.fechaFin || e.fechaReal;
        if (activeDateFilter === "Hoy") matchDate = e.fechaReal <= today && fin >= today;
        else if (activeDateFilter === "FinDeSemana") matchDate = e.fechaReal <= weekendEnd && fin >= weekendStart;
        else if (activeDateFilter === "EstaSemana") matchDate = e.fechaReal <= weekEnd && fin >= today;
        else if (activeDateFilter === "EsteMes") matchDate = e.fechaReal <= monthEnd && fin >= today;
        else if (activeDateFilter === "Gratis") matchDate = e.price === "Gratis";
        else if (activeDateFilter === "ConCobro") matchDate = e.price !== "Gratis";
      }
    }
    const matchZona = activeZona === "Todas" || e.zona === activeZona;
    const effectiveTag = e.tag || (isNewEvent(e) ? "Nuevo" : null);
    const matchTag = !activeTagFilter || effectiveTag === activeTagFilter;
    return matchCat && matchSearch && matchDate && matchZona && matchTag;
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

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

  const [form, setForm] = useState({ title:"", category:"Música", date:"", time:"", place:"", price:"", capacity:"", description:"", emoji:"🎵", tag:"", ticket_platform:"", ticket_link:"", organizer_name:"", organizer_contact:"", image_url:"", recurrencia:"", dia_semana:"", dia_mes:"" });
  const [formLoading, setFormLoading] = useState(false);

  const handleFormChange = (field, value) => setForm(f => ({...f, [field]: value}));

  const handleCreateSubmit = async () => {
    if (!user) { setShowAuth(true); setShowCreate(false); return; }
    if (!form.title || !form.place || !form.date) { showToast("⚠️ Completa los campos obligatorios"); return; }
    // Rate limiting: máximo 5 eventos por hora
    if (!checkRateLimit("createEvent_" + user.id, 5, 3600000)) { showToast("⚠️ Has publicado demasiados eventos, intenta más tarde"); return; }
    // Validar URLs
    if (form.ticket_link && !isValidUrl(form.ticket_link)) { showToast("⚠️ El link de compra no es válido"); return; }
    if (form.image_url && !isValidUrl(form.image_url)) { showToast("⚠️ El link de la imagen no es válido"); return; }
    setFormLoading(true);
    const esAdmin = ADMINS.includes(user.email);
    const { error } = await supabase.from("events").insert([{
      title: sanitize(form.title).slice(0, 200),
      category: form.category,
      date: sanitize(form.date).slice(0, 100),
      time: sanitize(form.time).slice(0, 50),
      place: sanitize(form.place).slice(0, 300),
      price: sanitize(form.price).slice(0, 50) || "Gratis",
      capacity: parseInt(form.capacity) || 0, attendees: 0,
      description: sanitize(form.description).slice(0, 2000),
      emoji: form.emoji,
      tag: form.tag || null,
      ticket_platform: sanitize(form.ticket_platform).slice(0, 100),
      ticket_link: form.ticket_link,
      color: "linear-gradient(135deg,#1a0a00,#2a1500)",
      organizer_name: sanitize(form.organizer_name).slice(0, 150),
      organizer_contact: sanitize(form.organizer_contact).slice(0, 150),
      recurrencia: form.recurrencia || null,
      dia_semana: form.dia_semana !== "" ? parseInt(form.dia_semana) : null,
      dia_mes: form.dia_mes !== "" ? parseInt(form.dia_mes) : null,
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
    if (!checkRateLimit("login", 5, 300000)) { setAuthError("Demasiados intentos. Espera 5 minutos."); return; }
    setAuthLoading(true); setAuthError(""); setAuthSuccess("");
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos" : error.message);
    else { setShowAuth(false); showToast("✓ ¡Bienvenido de vuelta!"); }
    setAuthLoading(false);
  };

  const handleRegister = async () => {
    if (!authName) { setAuthError("Por favor escribe tu nombre"); return; }
    if (!checkRateLimit("register", 3, 600000)) { setAuthError("Demasiados intentos. Espera 10 minutos."); return; }
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

  const handleAdminSetTag = async (eventId, newTag) => {
    const { error } = await supabase.from("events").update({ tag: newTag }).eq("id", eventId);
    if (error) { showToast("⚠️ Error al actualizar tag"); return; }
    setEvents(evs => evs.map(e => e.id === eventId ? { ...e, tag: newTag } : e));
    setAdminTagPicker(null);
    showToast(newTag ? `✓ Tag "${newTag}" asignado` : "✓ Tag eliminado");
  };

  const fetchPendingEvents = async () => {
    const { data } = await supabase.from("events").select("*").eq("estado", "pendiente").order("created_at", { ascending: false });
    setPendingEvents(data || []);
  };

  const fetchAdminStats = async () => {
    const { data: allEvents } = await supabase.from("events").select("category, zona, estado, fecha_real, organizer_name");
    const { count: totalSubs } = await supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("activo", true);
    if (!allEvents) return;
    const byEstado = { aprobado: 0, pendiente: 0, archivado: 0 };
    allEvents.forEach(e => { if (byEstado[e.estado] !== undefined) byEstado[e.estado]++; });
    const byCat = {};
    allEvents.filter(e => e.estado === "aprobado").forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + 1; });
    const byZona = {};
    allEvents.filter(e => e.estado === "aprobado").forEach(e => { const z = e.zona || "Sin zona"; byZona[z] = (byZona[z] || 0) + 1; });
    const byMes = {};
    allEvents.filter(e => e.estado === "aprobado" && e.fecha_real).forEach(e => { const mes = e.fecha_real.slice(0, 7); byMes[mes] = (byMes[mes] || 0) + 1; });
    const byOrg = {};
    allEvents.filter(e => e.estado === "aprobado" && e.organizer_name).forEach(e => { byOrg[e.organizer_name] = (byOrg[e.organizer_name] || 0) + 1; });
    const topOrgs = Object.entries(byOrg).sort((a, b) => b[1] - a[1]).slice(0, 8);
    setAdminStats({ byEstado, byCat, byZona, byMes, topOrgs, totalSubs: totalSubs || 0, total: allEvents.length });
  };

  const handleApprove = async (id) => {
    const { error } = await supabase.from("events").update({ estado: "aprobado" }).eq("id", id);
    if (error) { showToast("⚠️ Error al aprobar"); return; }
    setPendingEvents(evs => evs.filter(e => e.id !== id));
    fetchEvents();
    showToast("✅ Evento aprobado");
  };

  const handleReject = async (id) => {
    if (!window.confirm("¿Rechazar y eliminar este evento?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { showToast("⚠️ Error al rechazar"); return; }
    setPendingEvents(evs => evs.filter(e => e.id !== id));
    showToast("✗ Evento rechazado");
  };

  // Geocodificación con Supabase como caché persistente
  const geocode = useCallback(async (ev) => {
    // 1. Si el evento ya tiene coordenadas en Supabase, usarlas directamente
    if (ev.lat && ev.lng) return { lat: ev.lat, lng: ev.lng };
    // 2. Si ya están en caché en memoria, usarlas
    if (geoCache[ev.place]) return geoCache[ev.place];

    // Guarda coordenadas en Supabase, en el estado local y en la caché en memoria
    const saveCoords = async (coords) => {
      await supabase.from("events").update({ lat: coords.lat, lng: coords.lng }).eq("id", ev.id);
      setEvents(evs => evs.map(e => e.id === ev.id ? { ...e, lat: coords.lat, lng: coords.lng } : e));
      setGeoCache(c => ({ ...c, [ev.place]: coords }));
    };

    // 3. Diccionario de venues verificados — sin llamadas externas, precisión garantizada
    const known = matchVenueConocido(ev.place);
    if (known) {
      const coords = { lat: known.lat, lng: known.lng };
      await saveCoords(coords);
      return coords;
    }

    // 4. Nominatim, restringido a la región con viewbox + bounded
    try {
      // Si el lugar ya menciona Medellín o Antioquia, no duplicar el contexto
      const placeNorm = normPlace(ev.place);
      const sufijo = (placeNorm.includes("medellin") || placeNorm.includes("antioquia"))
        ? ", Colombia"
        : ", Medellín, Colombia";
      const query = encodeURIComponent(`${ev.place}${sufijo}`);
      // viewbox en formato lng1,lat1,lng2,lat2 (esquinas del rectángulo regional)
      const viewbox = `${GEO_BOUNDS.lngMin},${GEO_BOUNDS.latMax},${GEO_BOUNDS.lngMax},${GEO_BOUNDS.latMin}`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=co&viewbox=${viewbox}&bounded=1`, {
        headers: { 'Accept-Language': 'es', 'User-Agent': 'MedellinVibra/1.0' }
      });
      const data = await res.json();
      if (data && data[0]) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        // 5. Validación final: nunca guardar coordenadas fuera de la región
        if (!inRegion(coords.lat, coords.lng)) return null;
        await saveCoords(coords);
        return coords;
      }
    } catch(e) { console.log("Geocode error:", e); }
    return null;
  }, [geoCache]);

  // Inicializar mapa Leaflet
  const initMap = useCallback(() => {
    if (mapInstanceRef.current || !mapRef.current) return;
    const L = leafletRef.current;
    if (!L) return;
    // Forzar dimensiones antes de inicializar
    mapRef.current.style.height = '100%';
    mapRef.current.style.width = '100%';
    const map = L.map(mapRef.current, {
      center: [6.2442, -75.5812],
      zoom: 12,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
    // Forzar re-render del mapa después de montarlo
    setTimeout(() => { map.invalidateSize(); }, 100);
  }, []);

  // Cargar Leaflet dinámicamente
  useEffect(() => {
    if (activeTab !== "map") return;
    if (leafletRef.current) {
      initMap();
      // Si ya estaba inicializado, forzar invalidateSize por si el contenedor cambió
      setTimeout(() => { mapInstanceRef.current?.invalidateSize(); }, 150);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      leafletRef.current = window.L;
      delete window.L.Icon.Default.prototype._getIconUrl;
      window.L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      initMap();
    };
    document.head.appendChild(script);
  }, [activeTab, initMap]);

  // Pintar markers cuando cambian los eventos filtrados o el tab
  useEffect(() => {
    if (activeTab !== "map") return;
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Limpiar markers anteriores
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    setMarkerCount(0);

    const eventsToShow = filtered.filter(e => e.place);
    if (eventsToShow.length === 0) return;

    const addMarker = (ev, coords) => {
      const cfg = getCatConfig(ev.cat);
      const color = cfg.color || '#C8860A';
      const markerHtml = `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:13px;">${ev.emoji||'📍'}</span></div>`;
      const icon = L.divIcon({ html: markerHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -36] });
      const marker = L.marker([coords.lat, coords.lng], { icon });
      const priceColor = ev.price === "Gratis" ? "var(--green)" : "var(--gold)";
      marker.bindPopup(`
        <div class="map-popup">
          <div class="map-popup-title">${ev.title}</div>
          <div class="map-popup-meta">📅 ${ev.date}${ev.time ? ' · ⏰ ' + ev.time : ''}</div>
          <div class="map-popup-meta">📍 ${ev.place}</div>
          <div class="map-popup-price" style="color:${priceColor}">${ev.price}</div>
          <button class="map-popup-btn" onclick="window.__mvOpenEvent(${ev.id})">Ver detalle →</button>
        </div>
      `, { maxWidth: 240 });
      marker.addTo(map);
      markersRef.current.push(marker);
      setMarkerCount(markersRef.current.length);
    };

    // Ajustar el encuadre del mapa para que se vean todos los pines
    const fitToMarkers = () => {
      if (markersRef.current.length === 0) return;
      const bounds = L.featureGroup(markersRef.current).getBounds();
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    };

    // FASE 1: Pintar instantáneamente los que ya tienen coords en Supabase
    const withCoords = eventsToShow.filter(e => e.lat && e.lng);
    const withoutCoords = eventsToShow.filter(e => !e.lat || !e.lng);

    withCoords.forEach(ev => addMarker(ev, { lat: ev.lat, lng: ev.lng }));
    fitToMarkers();

    // FASE 2: Geocodificar los que no tienen coords (en segundo plano)
    if (withoutCoords.length === 0) {
      setGeoLoading(false);
      return;
    }

    setGeoLoading(true);
    setGeoProgress({ done: withCoords.length, total: eventsToShow.length });

    let done = withCoords.length;
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    (async () => {
      for (const ev of withoutCoords) {
        const coords = await geocode(ev);
        if (coords) addMarker(ev, coords);
        done++;
        setGeoProgress({ done, total: eventsToShow.length });
        if (done < eventsToShow.length) await delay(1100);
      }
      fitToMarkers();
      setGeoLoading(false);
    })();
  }, [activeTab, filtered]);

  useEffect(() => {
    if (activeTab === "admin" && isAdmin) { fetchPendingEvents(); fetchAdminStats(); }
  }, [activeTab]);

  // Exponer función global para el popup
  useEffect(() => {
    window.__mvOpenEvent = (id) => {
      const ev = events.find(e => e.id === id);
      if (ev) setSelectedEvent(ev);
    };
    return () => { delete window.__mvOpenEvent; };
  }, [events]);

  // Cleanup mapa al desmontar
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) { root.classList.add("dark-mode"); localStorage.setItem("mv-dark", "1"); }
    else { root.classList.remove("dark-mode"); localStorage.setItem("mv-dark", "0"); }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(d => !d);

  const handleSubscribe = async () => {
    // Anti-bot: si el honeypot tiene valor, es un bot
    if (honeypot) return;
    // Validación de email
    if (!subEmail || !isValidEmail(subEmail)) { showToast("⚠️ Ingresa un correo válido"); return; }
    // Rate limiting: máximo 3 intentos por minuto
    if (!checkRateLimit("subscribe", 3, 60000)) { showToast("⚠️ Demasiados intentos, espera un momento"); return; }
    setSubLoading(true);
    const cleanEmail = sanitize(subEmail).trim().toLowerCase();
    const cleanNombre = sanitize(subNombre).trim().slice(0, 100) || null;
    const { error } = await supabase.from("subscribers").insert({ email: cleanEmail, nombre: cleanNombre });
    setSubLoading(false);
    if (error) {
      if (error.code === "23505") showToast("📧 Ya estás suscrito");
      else showToast("⚠️ Error al suscribirse");
    } else {
      setSubDone(true);
      setSubEmail("");
      setSubNombre("");
    }
  };

  const getUserInitial = () => (user?.user_metadata?.full_name || user?.email || "U")[0].toUpperCase();
  const getUserName = () => user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";
  const getEffectiveTag = (ev) => ev.tag || (isNewEvent(ev) ? "Nuevo" : null);

  const getDisplayDate = (ev) => {
    if (!ev.recurrencia) return ev.date;
    const proxima = getProximaFecha(ev);
    if (!proxima) return ev.date;
    const dia = DIAS_SEMANA[proxima.getDay()];
    const num = proxima.getDate();
    const mes = MESES_CORTO[proxima.getMonth()];
    return `${dia} ${num} ${mes}`;
  };
  const featuredEvent = (() => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = events.filter(e => e.fechaReal >= today).slice(0, 5);
    if (upcoming.length === 0) return events[0];
    return upcoming[hourTick % upcoming.length];
  })();

  return (
    <Routes>
      <Route path="/evento/:slug" element={<EventoPage />} />
      <Route path="/organizador/:slug" element={<OrganizadorPage />} />
      <Route path="/para-organizadores" element={<OrganizadoresLanding />} />
      <Route path="*" element={<>
      <style>{style}</style>
      <div className="app">
        <nav className="nav">
          <div className="nav-logo" style={{cursor:'pointer'}} onClick={()=>setActiveTab("home")}>MEDELLÍN VIBRA</div>
          <div className="nav-links">
            {[[t.tabExplore,"explore"],["Mapa","map"],[t.tabSaved,"saved"]].map(([label,tab]) => (
              <button key={tab} className={`nav-link ${activeTab===tab?"active":""}`} onClick={()=>setActiveTab(tab)}>{label}</button>
            ))}
          </div>
          <div className="nav-actions">
            <select value={lang} onChange={e=>setLang(e.target.value)} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'6px 10px',fontFamily:'var(--font-body)',fontSize:13,color:'var(--text)',cursor:'pointer',outline:'none'}}>
              <option value="es">ES</option>
              <option value="en">EN</option>
              <option value="pt">PT</option>
              <option value="fr">FR</option>
            </select>
            <button onClick={toggleDarkMode} title={darkMode ? "Modo claro" : "Modo oscuro"}
              style={{background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'7px 10px', cursor:'pointer', display:'flex', alignItems:'center', color:'var(--text)'}}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
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
                <a href="https://www.google.com/maps/place/Medell%C3%ADn,+Antioquia/@6.2441988,-75.6357583,12z" target="_blank" rel="noopener noreferrer" className="hero-tag" style={{textDecoration:'none'}}><MapPin size={12} style={{display:'inline', verticalAlign:'-2px', marginRight:4}} />Medellín, Colombia</a>
                <h1 className="hero-title">DESCUBRE<br/><span className="accent">LO QUE</span><br/><span className="accent-red">VIBRA</span></h1>
                <p className="hero-sub">Los mejores eventos de la ciudad de la eterna primavera. Música, arte, gastronomía y mucho más. <strong style={{color:'#F5A623'}}>Tu agenda cultural, actualizada cada semana.</strong></p>
<div className="search-bar">
                  <input placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
                  <button>{t.searchBtn}</button>
                </div>
                <div className="stats">
                  <div><div className="stat-num">{stats.eventos}</div><div className="stat-label">{t.statEvents}</div></div>
                  <div><div className="stat-num">{stats.promocionados}</div><div className="stat-label">{lang === 'es' ? 'Promocionados' : lang === 'en' ? 'Promoted' : lang === 'pt' ? 'Promovidos' : 'Promus'}</div></div>
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

            {/* BLOQUE ESTE FIN DE SEMANA */}
            {(() => {
              const today = new Date(); today.setHours(0,0,0,0);
              const day = today.getDay();
              const diffToFri = (5 - day + 7) % 7;
              // Si hoy es sáb o dom, mostrar el finde actual; si no, el próximo
              const fri = new Date(today);
              if (day === 6 || day === 0) {
                // Estamos en fin de semana — mostrar desde hoy hasta el domingo
                fri.setDate(today.getDate() - (day === 0 ? 1 : 0));
              } else {
                fri.setDate(today.getDate() + diffToFri);
              }
              const sun = new Date(fri); sun.setDate(fri.getDate() + (day === 0 ? 0 : 2));
              const friStr = fri.toISOString().split('T')[0];
              const sunStr = sun.toISOString().split('T')[0];
              const findeEvents = events.filter(e =>
                e.fechaReal <= sunStr && (e.fechaFin || e.fechaReal) >= friStr
              ).slice(0, 6);
              if (findeEvents.length === 0) return null;
              const label = (day === 6 || day === 0) ? "Este Fin de Semana" : "El Próximo Fin de Semana";
              return (
                <div style={{background:'linear-gradient(135deg, #1a1a1a, #2a2020)', padding:'32px 24px', borderBottom:'1px solid var(--border)'}}>
                  <div style={{maxWidth:1200, margin:'0 auto'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20}}>
                      <div>
                        <div style={{fontFamily:'var(--font-display)', fontSize:28, color:'white', letterSpacing:0.5}}>
                          <PartyPopper size={22} style={{display:'inline', verticalAlign:'-3px', marginRight:8, color:'var(--gold)'}} /><span style={{color:'var(--gold)'}}>{label}</span>
                        </div>
                        <div style={{fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:4}}>
                          {findeEvents.length} plan{findeEvents.length !== 1 ? 'es' : ''} para no quedarte en casa
                        </div>
                      </div>
                      <button onClick={() => setActiveDateFilter("FinDeSemana")}
                        style={{background:'rgba(200,134,10,0.2)', border:'1px solid rgba(200,134,10,0.4)', color:'var(--gold)', borderRadius:100, padding:'8px 16px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)', whiteSpace:'nowrap'}}>
                        Ver todos →
                      </button>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12}}>
                      {findeEvents.map(ev => {
                        const cfg = getCatConfig(ev.cat);
                        return (
                          <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                            style={{borderRadius:16, overflow:'hidden', cursor:'pointer', position:'relative', aspectRatio:'3/4', background:`linear-gradient(135deg, ${cfg.color}33, ${cfg.color}66)`}}
                            onMouseEnter={e=>e.currentTarget.style.transform='scale(1.02)'}
                            onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                          >
                            {ev.imageUrl && <img src={ev.imageUrl} alt={ev.title} style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover'}} />}
                            <div style={{position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.85) 40%, transparent 70%)'}} />
                            <div style={{position:'absolute', top:10, left:10, background:cfg.color, color:'white', padding:'3px 10px', borderRadius:100, fontSize:10, fontWeight:700}}>{ev.cat}</div>
                            {ev.price === "Gratis" && <div style={{position:'absolute', top:10, right:10, background:'#059669', color:'white', padding:'3px 10px', borderRadius:100, fontSize:10, fontWeight:700}}>Gratis</div>}
                            <div style={{position:'absolute', bottom:0, left:0, right:0, padding:'14px 12px'}}>
                              <div style={{fontWeight:700, fontSize:13, color:'white', lineHeight:1.3, marginBottom:4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{ev.title}</div>
                              <div style={{fontSize:11, color:'rgba(255,255,255,0.7)'}}>{ev.date}</div>
                              <div style={{fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:2, display:'flex', alignItems:'center', gap:3}}><MapPin size={10} />{ev.place?.split(',')[0]}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

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

            <div className="filters-bar" style={{borderBottom:'none',paddingBottom:4,paddingTop:12}}>
              {[["Todas","Todas las zonas"],["Medellín","Medellín"],["Área Metropolitana","Área Metropolitana"],["Oriente Cercano","Oriente Cercano"]].map(([val,label]) => (
                <button key={val} className={`filter-chip ${activeZona===val?"active":""}`} onClick={() => setActiveZona(val)}>{label}</button>
              ))}
            </div>
            <div className="filters-bar" style={{borderBottom:'none',paddingBottom:8}}>
              {[["Todos",t.filterAll],["Hoy",t.filterToday],["FinDeSemana",t.filterWeekend],["EstaSemana",t.filterWeek],["EsteMes",t.filterMonth],["Gratis",t.filterFree],["ConCobro","De pago"]].map(([val,label]) => (
                <button key={val} className={`filter-chip ${activeDateFilter===val?"active":""}`} onClick={() => setActiveDateFilter(val)}>
                  {label}
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

            {/* BARRA DE TAGS */}
            {(() => {
              const tagCounts = Object.keys(TAGS_CONFIG).reduce((acc, tag) => {
                acc[tag] = events.filter(e => {
                  const eff = e.tag || (isNewEvent(e) ? "Nuevo" : null);
                  return eff === tag;
                }).length;
                return acc;
              }, {});
              const hasAny = Object.values(tagCounts).some(c => c > 0);
              if (!hasAny) return null;
              return (
                <div className="tags-bar">
                  <button
                    className="tag-chip"
                    onClick={() => setActiveTagFilter(null)}
                    style={{
                      background: !activeTagFilter ? "var(--gold)" : "var(--surface2)",
                      color: !activeTagFilter ? "white" : "var(--muted)",
                      border: `1px solid ${!activeTagFilter ? "var(--gold)" : "var(--border)"}`,
                    }}
                  >
                    Todos los tags
                  </button>
                  {Object.entries(TAGS_CONFIG).map(([tag, cfg]) => {
                    if (tagCounts[tag] === 0) return null;
                    const isActive = activeTagFilter === tag;
                    return (
                      <button
                        key={tag}
                        className="tag-chip"
                        onClick={() => setActiveTagFilter(isActive ? null : tag)}
                        style={{
                          background: isActive ? cfg.color : cfg.bg,
                          color: isActive ? "white" : cfg.color,
                          border: `1px solid ${isActive ? cfg.color : cfg.border}`,
                        }}
                      >
                        {cfg.emoji} {tag}
                        <span style={{opacity:0.7, fontWeight:400, marginLeft:2}}>({tagCounts[tag]})</span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}

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
                      <div className="featured-meta" style={{display:'flex', flexWrap:'wrap', alignItems:'center', gap:'6px 16px'}}>
                        <span style={{display:'inline-flex', alignItems:'center', gap:5}}><Calendar size={13} />{featuredEvent.date}</span>
                        {featuredEvent.time && featuredEvent.time !== "Por confirmar" && <span style={{display:'inline-flex', alignItems:'center', gap:5}}><Clock size={13} />{featuredEvent.time}</span>}
                        <span style={{display:'inline-flex', alignItems:'center', gap:5}}><MapPin size={13} />{featuredEvent.place}</span>
                      </div>
                      <div className="featured-actions">
                        <button className="featured-price" onClick={e=>{e.stopPropagation();setSelectedEvent(featuredEvent);}}>{featuredEvent.price === "Gratis" ? "Ver evento · Gratis" : featuredEvent.price === "Con cobro" ? "Reservar entradas" : `Reservar · ${featuredEvent.price}`}</button>
                        <button className="featured-save" onClick={e=>{e.stopPropagation();toggleSave(featuredEvent.id);}}><Heart size={14} fill={saved.includes(featuredEvent.id) ? "#E8353A" : "none"} style={{marginRight:6, verticalAlign:'-2px'}} />{(saved.includes(featuredEvent.id) ? t.saved : t.save).replace("❤️ ","").replace("🤍 ","")}</button>
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
                  <div style={{marginBottom:12}}><Search size={44} strokeWidth={1.5} /></div>
                  <div style={{fontSize:16}}>{t.noEvents}</div>
                </div>
              ) : viewMode === "grid" ? (
                <div className="events-grid">
                  {filtered.map(ev => (
                    <div key={ev.id} className="event-card" onClick={() => setSelectedEvent(ev)}>
                      <div className="event-card-img" style={{backgroundImage: `url(${ev.imageUrl || getCatConfig(ev.cat).img})`, backgroundSize:'cover', backgroundPosition:'center'}}>
                        <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.35)'}} />
                        <span className="event-card-cat" style={{zIndex:1}}>{ev.cat}</span>
                        {(() => {
                          const effTag = getEffectiveTag(ev);
                          if (!effTag) return null;
                          const cfg = TAGS_CONFIG[effTag];
                          return <span style={{position:'absolute',top:12,right:12,background:cfg?.color||'var(--red)',color:'white',padding:'3px 8px',borderRadius:'100px',fontSize:'10px',fontWeight:700,zIndex:1}}>{effTag}</span>;
                        })()}
                      </div>
                      <div className="event-card-body">
                        <div className="event-card-title">{ev.title}</div>
                        <div className="event-card-info">
                          <div className="event-card-info-row"><Calendar size={13} color="var(--muted)" /> {getDisplayDate(ev)}{ev.time ? ` · ${ev.time}` : ''}{ev.recurrencia && <span style={{marginLeft:4, fontSize:10, background:'rgba(200,134,10,0.15)', color:'var(--gold)', padding:'1px 6px', borderRadius:100, fontWeight:700}}>🔄 {ev.recurrencia}</span>}</div>
                          <div className="event-card-info-row"><MapPin size={13} color="var(--muted)" /> {ev.place}</div>
                        </div>
                        <div className="event-card-footer">
                          <div className={`event-card-price ${ev.price==="Gratis"?"free":""}`}>{ev.price}</div>
                          <div style={{display:'flex',gap:6,position:'relative'}}>
                            {isAdmin && (
                              <>
                                <button className="btn-reserve" style={{color:'var(--gold)',borderColor:'rgba(200,134,10,0.3)',fontSize:11}} onClick={e=>{e.stopPropagation();setAdminTagPicker(adminTagPicker===ev.id?null:ev.id);}}><Tag size={11} style={{marginRight:3, verticalAlign:'-1px'}} />Tag</button>
                                {adminTagPicker === ev.id && (
                                  <div className="admin-tag-picker" onClick={e=>e.stopPropagation()}>
                                    <div style={{fontSize:11,color:'var(--muted)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6,padding:'0 4px'}}>Asignar tag</div>
                                    {ADMIN_TAGS.map(tag => {
                                      const cfg = TAGS_CONFIG[tag];
                                      return (
                                        <div key={tag} className="admin-tag-option" onClick={()=>handleAdminSetTag(ev.id, ev.tag===tag ? null : tag)}>
                                          <span>{cfg.emoji}</span>
                                          <span style={{color: cfg.color}}>{tag}</span>
                                          {ev.tag === tag && <span style={{marginLeft:'auto',color:'var(--green)'}}>✓</span>}
                                        </div>
                                      );
                                    })}
                                    {ev.tag && <div className="admin-tag-option" style={{color:'var(--muted)'}} onClick={()=>handleAdminSetTag(ev.id,null)}>✕ Quitar tag</div>}
                                  </div>
                                )}
                                <button className="btn-reserve" style={{color:'var(--red)',borderColor:'rgba(232,53,58,0.3)'}} onClick={e=>handleDeleteEvent(ev.id,e)}><Trash2 size={14} /></button>
                              </>
                            )}
                            <button className="btn-reserve" style={{display:'inline-flex', alignItems:'center', gap:5}} onClick={e=>{e.stopPropagation();toggleSave(ev.id);}}><Heart size={13} fill={saved.includes(ev.id) ? "#E8353A" : "none"} color={saved.includes(ev.id) ? "#E8353A" : "currentColor"} />{t.save.replace("🤍 ","")}</button>
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
                          <span><Calendar size={11} style={{display:'inline',marginRight:3}} />{getDisplayDate(ev)}{ev.recurrencia && <span style={{marginLeft:4, fontSize:10, color:'var(--gold)', fontWeight:700}}>🔄</span>}</span>
                          <span><MapPin size={11} style={{display:'inline',marginRight:3}} />{ev.place}</span>
                        </div>
                        <div style={{marginTop:6, display:'flex', gap:6, alignItems:'center'}}>
                          <span style={{background:'var(--surface2)', padding:'2px 8px', borderRadius:100, fontSize:11, color:'var(--muted)', fontWeight:600}}>{ev.cat}</span>
                          {(() => {
                            const effTag = getEffectiveTag(ev);
                            if (!effTag) return null;
                            const cfg = TAGS_CONFIG[effTag];
                            return <span style={{background:cfg?.color||'var(--red)', padding:'2px 8px', borderRadius:100, fontSize:11, color:'white', fontWeight:700}}>{effTag}</span>;
                          })()}
                        </div>
                      </div>
                      <button className="btn-reserve" style={{flexShrink:0, display:'inline-flex', alignItems:'center'}} onClick={e=>{e.stopPropagation();toggleSave(ev.id);}}><Heart size={15} fill={saved.includes(ev.id) ? "#E8353A" : "none"} color={saved.includes(ev.id) ? "#E8353A" : "currentColor"} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ALIADOS MEDELLÍN VIBRA */}
            <div style={{background:'linear-gradient(135deg, #1a1a1a, #2a1a00)', padding:'32px 24px', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)'}}>
              <div style={{maxWidth:1200, margin:'0 auto'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20}}>
                  <div>
                    <div style={{fontFamily:'var(--font-display)', fontSize:28, color:'white', letterSpacing:0.5}}>
                      <Handshake size={24} style={{display:'inline', verticalAlign:'-3px', marginRight:8, color:'var(--gold)'}} />Aliados <span style={{color:'var(--gold)'}}>Medellín Vibra</span>
                    </div>
                    <div style={{fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:4}}>Espacios y marcas que vibran con la ciudad</div>
                  </div>
                  <a href="mailto:hola@medellinvibra.co?subject=Quiero ser Aliado de Medellín Vibra" style={{background:'rgba(200,134,10,0.2)', border:'1px solid rgba(200,134,10,0.4)', color:'var(--gold)', borderRadius:100, padding:'8px 16px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-body)', textDecoration:'none', whiteSpace:'nowrap'}}>
                    Ser aliado →
                  </a>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12}}>
                  {[
                    {name:"Teatro Pablo Tobón Uribe", Icon:Drama, maps:"https://maps.google.com/?q=Teatro+Pablo+Tobon+Uribe+Medellin"},
                    {name:"La Macarena", Icon:Music, maps:"https://maps.google.com/?q=La+Macarena+Medellin"},
                    {name:"Parque Norte", Icon:FerrisWheel, maps:"https://maps.google.com/?q=Parque+Norte+Medellin"},
                    {name:"Plaza Mayor", Icon:Landmark, maps:"https://maps.google.com/?q=Plaza+Mayor+Medellin"},
                    {name:"Teatro Metropolitano", Icon:Music4, maps:"https://maps.google.com/?q=Teatro+Metropolitano+Medellin"},
                    {name:"Estadio Atanasio Girardot", Icon:Trophy, maps:"https://maps.google.com/?q=Estadio+Atanasio+Girardot+Medellin"},
                    {name:"Parque Explora", Icon:Telescope, maps:"https://maps.google.com/?q=Parque+Explora+Medellin"},
                    {name:"El Tesoro Parque Comercial", Icon:ShoppingBag, maps:"https://maps.google.com/?q=El+Tesoro+Parque+Comercial+Medellin"},
                    {name:"City Hall El Rodeo", Icon:Mic, maps:"https://maps.google.com/?q=City+Hall+El+Rodeo+Medellin"},
                    {name:"MAMM — Museo de Arte Moderno", Icon:Palette, maps:"https://maps.google.com/?q=MAMM+Museo+Arte+Moderno+Medellin"},
                  ].map(lugar => (
                    <a key={lugar.name} href={lugar.maps} target="_blank" rel="noopener noreferrer" style={{display:'flex', flexDirection:'column', alignItems:'center', gap:8, background:'rgba(255,255,255,0.06)', borderRadius:14, padding:'16px 12px', textDecoration:'none', border:'1px solid rgba(255,255,255,0.08)', transition:'all 0.2s', textAlign:'center'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.background='rgba(255,255,255,0.1)';}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.background='rgba(255,255,255,0.06)';}}
                    >
                      <lugar.Icon size={26} color="var(--gold)" strokeWidth={1.75} />
                      <span style={{fontSize:12, fontWeight:600, color:'white', lineHeight:1.3}}>{lugar.name}</span>
                      <span style={{fontSize:11, color:'var(--gold)'}}>Ver en mapa ↗</span>
                    </a>
                  ))}
                </div>
              </div>
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
                        <div className="event-card-info-row"><Calendar size={13} color="var(--muted)" /> {getDisplayDate(ev)}</div>
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
                <div style={{marginBottom:16}}><User size={56} strokeWidth={1.25} /></div>
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

        {/* PESTAÑA MAPA */}
        {activeTab === "map" && (
          <div style={{flex:1, display:'flex', flexDirection:'column', minHeight:0, height:'calc(100vh - 120px)'}}>
            {/* Header del mapa */}
            <div style={{background:'white', borderBottom:'1px solid var(--border)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0}}>
              <div>
                <div style={{fontFamily:'var(--font-display)', fontSize:22, color:'var(--text)'}}>Mapa de <span style={{color:'var(--gold)'}}>Eventos</span></div>
                <div style={{fontSize:12, color:'var(--muted)', marginTop:1}}>{filtered.length} eventos · {activeFilter !== "Todos" ? activeFilter : "todas las categorías"}{activeZona !== "Todas" ? ` · ${activeZona}` : ""}</div>
              </div>
              {geoLoading && (
                <div style={{display:'flex', alignItems:'center', gap:6, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:100, padding:'6px 12px'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'var(--gold)',animation:'pulse 1s infinite'}} />
                  <span style={{fontSize:11, fontWeight:600, color:'var(--muted)'}}>Cargando {geoProgress.done}/{geoProgress.total}</span>
                </div>
              )}
            </div>

            {/* Filtros rápidos sobre el mapa */}
            <div style={{background:'white', padding:'8px 16px', display:'flex', gap:6, overflowX:'auto', flexShrink:0, borderBottom:'1px solid var(--border)'}}>
              {CATS.map(c => (
                <button key={c} className={`filter-chip ${activeFilter===c?"active":""}`} style={{fontSize:12,padding:'5px 12px'}} onClick={() => setActiveFilter(c)}>{c}</button>
              ))}
            </div>

            {/* Mapa Leaflet */}
            <div className="map-container" style={{flex:1, position:'relative', height:'calc(100vh - 200px)'}}>
              <div ref={mapRef} className="map-wrap" style={{height:'100%', width:'100%', minHeight:'400px'}} />
              {!geoLoading && markerCount === 0 && filtered.length > 0 && (
                <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, pointerEvents:'none'}}>
                  <div style={{background:'white', border:'1px solid var(--border)', borderRadius:16, padding:'20px 28px', textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}>
                    <div style={{marginBottom:8}}><MapIcon size={30} color="var(--gold)" /></div>
                    <div style={{fontWeight:700, marginBottom:4}}>Geocodificando ubicaciones</div>
                    <div style={{fontSize:13, color:'var(--muted)'}}>Los pins aparecerán en unos segundos…</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL ADMIN */}
        {activeTab === "admin" && isAdmin && (
          <div className="admin-panel">
            {/* Header */}
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:4}}>
              <div style={{fontFamily:'var(--font-display)', fontSize:28, color:'var(--text)'}}>
                Panel <span style={{color:'var(--gold)'}}>Admin</span>
              </div>
              <button onClick={()=>{fetchPendingEvents();fetchEvents();}} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)'}}>
                🔄 Actualizar
              </button>
            </div>

            {/* Tabs internos */}
            <div style={{display:'flex', gap:8, background:'var(--surface2)', borderRadius:12, padding:4}}>
              {[["pending","⏳ Pendientes", pendingEvents.length],["approved","✅ Aprobados", events.length],["stats","📊 Stats", null]].map(([key,label,count])=>(
                <button key={key} onClick={()=>{ setAdminSection(key); if(key==='stats') fetchAdminStats(); }}
                  style={{flex:1, padding:'8px', borderRadius:9, border:'none', fontFamily:'var(--font-body)', fontWeight:700, fontSize:13, cursor:'pointer',
                    background: adminSection===key ? 'white' : 'transparent',
                    color: adminSection===key ? 'var(--text)' : 'var(--muted)',
                    boxShadow: adminSection===key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  {label} {count !== null && <span style={{background: key==='pending' && count>0 ? 'var(--red)' : 'var(--surface2)', color: key==='pending' && count>0 ? 'white' : 'var(--muted)', borderRadius:100, padding:'1px 7px', fontSize:11}}>{count}</span>}
                </button>
              ))}
            </div>

            {/* Sección Pendientes */}
            {adminSection === "pending" && (
              pendingEvents.length === 0
                ? <div style={{textAlign:'center', padding:'48px 0', color:'var(--muted)'}}>
                    <div style={{marginBottom:12}}><PartyPopper size={44} strokeWidth={1.5} /></div>
                    <div style={{fontWeight:700, marginBottom:4}}>Sin eventos pendientes</div>
                    <div style={{fontSize:13}}>Todo está al día</div>
                  </div>
                : pendingEvents.map(ev => (
                  <div key={ev.id} className="admin-event-row">
                    <div className="admin-event-row-img" style={{backgroundImage: ev.image_url ? `url(${ev.image_url})` : 'none'}}>
                      {!ev.image_url && (ev.emoji || "📅")}
                    </div>
                    <div className="admin-event-row-info">
                      <div className="admin-event-row-title">{ev.title}</div>
                      <div className="admin-event-row-meta">
                        📅 {ev.date} · 📍 {ev.place}<br/>
                        💰 {ev.price} · 🏷️ {ev.category}<br/>
                        {ev.organizer_name && `👤 ${ev.organizer_name}`}
                        {ev.organizer_contact && ` · ${ev.organizer_contact}`}
                      </div>
                      {ev.description && <div style={{fontSize:12, color:'var(--muted)', marginBottom:8, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{ev.description}</div>}
                      <div className="admin-event-row-actions">
                        <button className="admin-btn-approve" onClick={()=>handleApprove(ev.id)}>✅ Aprobar</button>
                        <button className="admin-btn-reject" onClick={()=>handleReject(ev.id)}>✗ Rechazar</button>
                        {ev.ticket_link && <a href={ev.ticket_link} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:'var(--gold)',fontWeight:600,textDecoration:'none',padding:'6px 0'}}>🔗 Ver link</a>}
                      </div>
                    </div>
                  </div>
                ))
            )}

            {/* Sección Aprobados */}
            {adminSection === "approved" && (
              events.map(ev => (
                <div key={ev.id} className="admin-event-row">
                  <div className="admin-event-row-img" style={{backgroundImage: ev.imageUrl ? `url(${ev.imageUrl})` : 'none'}}>
                    {!ev.imageUrl && (ev.emoji || "📅")}
                  </div>
                  <div className="admin-event-row-info">
                    <div className="admin-event-row-title">{ev.title}</div>
                    <div className="admin-event-row-meta">📅 {ev.date} · 📍 {ev.place} · 💰 {ev.price}</div>
                    <div className="admin-event-row-actions">
                      {/* Tag picker */}
                      <div style={{position:'relative'}}>
                        <button className="admin-btn-delete" onClick={()=>setAdminTagPicker(adminTagPicker===ev.id?null:ev.id)}>
                          🏷️ {ev.tag || "Sin tag"}
                        </button>
                        {adminTagPicker === ev.id && (
                          <div className="admin-tag-picker" onClick={e=>e.stopPropagation()}>
                            {ADMIN_TAGS.map(tag => {
                              const cfg = TAGS_CONFIG[tag];
                              return (
                                <div key={tag} className="admin-tag-option" onClick={()=>handleAdminSetTag(ev.id, ev.tag===tag ? null : tag)}>
                                  <span>{cfg.emoji}</span>
                                  <span style={{color:cfg.color}}>{tag}</span>
                                  {ev.tag === tag && <span style={{marginLeft:'auto',color:'var(--green)'}}>✓</span>}
                                </div>
                              );
                            })}
                            {ev.tag && <div className="admin-tag-option" style={{color:'var(--muted)'}} onClick={()=>handleAdminSetTag(ev.id,null)}>✕ Quitar tag</div>}
                          </div>
                        )}
                      </div>
                      <button className="admin-btn-delete" onClick={()=>setSelectedEvent(ev)}>👁️ Ver</button>
                      <button className="admin-btn-reject" onClick={e=>handleDeleteEvent(ev.id,e)}>🗑️ Eliminar</button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Sección Stats */}
            {adminSection === "stats" && (
              !adminStats
                ? <div style={{textAlign:'center', padding:'48px 0', color:'var(--muted)'}}>
                    <div style={{fontSize:40, marginBottom:12}}>⏳</div>
                    <div style={{fontWeight:700}}>Cargando estadísticas…</div>
                  </div>
                : <div style={{display:'flex', flexDirection:'column', gap:16}}>

                    {/* Números grandes */}
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                      {[
                        ["✅ Aprobados", adminStats.byEstado.aprobado, "#059669"],
                        ["⏳ Pendientes", adminStats.byEstado.pendiente, "#D97706"],
                        ["📦 Archivados", adminStats.byEstado.archivado, "#6B7280"],
                        ["📬 Suscriptores", adminStats.totalSubs, "#C8860A"],
                      ].map(([label, value, color]) => (
                        <div key={label} style={{background:'white', border:'1px solid var(--border)', borderRadius:14, padding:'16px', textAlign:'center'}}>
                          <div style={{fontFamily:'var(--font-display)', fontSize:36, color}}>{value}</div>
                          <div style={{fontSize:12, color:'var(--muted)', fontWeight:600, marginTop:2}}>{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Por categoría */}
                    <div style={{background:'white', border:'1px solid var(--border)', borderRadius:14, padding:'16px'}}>
                      <div style={{fontWeight:700, fontSize:13, marginBottom:12, color:'var(--text)'}}>📂 Eventos por categoría</div>
                      {Object.entries(adminStats.byCat).sort((a,b)=>b[1]-a[1]).map(([cat, count]) => {
                        const max = Math.max(...Object.values(adminStats.byCat));
                        const pct = Math.round((count / max) * 100);
                        const color = CAT_CONFIG[cat]?.color || '#C8860A';
                        return (
                          <div key={cat} style={{marginBottom:8}}>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:600, marginBottom:3}}>
                              <span>{cat}</span><span style={{color:'var(--muted)'}}>{count}</span>
                            </div>
                            <div style={{background:'var(--surface2)', borderRadius:100, height:8, overflow:'hidden'}}>
                              <div style={{width:`${pct}%`, height:'100%', background:color, borderRadius:100, transition:'width 0.5s'}} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Por zona */}
                    <div style={{background:'white', border:'1px solid var(--border)', borderRadius:14, padding:'16px'}}>
                      <div style={{fontWeight:700, fontSize:13, marginBottom:12, color:'var(--text)'}}>🗺️ Eventos por zona</div>
                      {Object.entries(adminStats.byZona).sort((a,b)=>b[1]-a[1]).map(([zona, count]) => {
                        const max = Math.max(...Object.values(adminStats.byZona));
                        const pct = Math.round((count / max) * 100);
                        return (
                          <div key={zona} style={{marginBottom:8}}>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:600, marginBottom:3}}>
                              <span>{zona}</span><span style={{color:'var(--muted)'}}>{count}</span>
                            </div>
                            <div style={{background:'var(--surface2)', borderRadius:100, height:8, overflow:'hidden'}}>
                              <div style={{width:`${pct}%`, height:'100%', background:'var(--gold)', borderRadius:100, transition:'width 0.5s'}} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Por mes */}
                    <div style={{background:'white', border:'1px solid var(--border)', borderRadius:14, padding:'16px'}}>
                      <div style={{fontWeight:700, fontSize:13, marginBottom:12, color:'var(--text)'}}>📅 Eventos por mes</div>
                      {Object.entries(adminStats.byMes).sort((a,b)=>a[0].localeCompare(b[0])).map(([mes, count]) => {
                        const max = Math.max(...Object.values(adminStats.byMes));
                        const pct = Math.round((count / max) * 100);
                        const [year, month] = mes.split('-');
                        const label = new Date(parseInt(year), parseInt(month)-1).toLocaleDateString('es-CO', {month:'long', year:'numeric'});
                        return (
                          <div key={mes} style={{marginBottom:8}}>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:600, marginBottom:3}}>
                              <span style={{textTransform:'capitalize'}}>{label}</span><span style={{color:'var(--muted)'}}>{count}</span>
                            </div>
                            <div style={{background:'var(--surface2)', borderRadius:100, height:8, overflow:'hidden'}}>
                              <div style={{width:`${pct}%`, height:'100%', background:'#7C3AED', borderRadius:100, transition:'width 0.5s'}} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Organizadores más activos */}
                    <div style={{background:'white', border:'1px solid var(--border)', borderRadius:14, padding:'16px'}}>
                      <div style={{fontWeight:700, fontSize:13, marginBottom:12, color:'var(--text)'}}>👤 Organizadores más activos</div>
                      {adminStats.topOrgs.map(([org, count], i) => (
                        <div key={org} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom: i < adminStats.topOrgs.length-1 ? '1px solid var(--border)' : 'none'}}>
                          <div style={{width:24, height:24, borderRadius:'50%', background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--muted)', flexShrink:0}}>{i+1}</div>
                          <div style={{flex:1, fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{org}</div>
                          <div style={{background:'var(--gold)', color:'white', borderRadius:100, padding:'2px 10px', fontSize:11, fontWeight:700, flexShrink:0}}>{count}</div>
                        </div>
                      ))}
                    </div>

                  </div>
            )}
          </div>
        )}

        <footer style={{background:'var(--surface2)', borderTop:'1px solid var(--border)', display: activeTab === 'map' || activeTab === 'admin' ? 'none' : 'block'}}>
          {/* Bloque newsletter */}
          <div style={{background:'var(--dark)', padding:'32px 24px', textAlign:'center'}}>
            {subDone ? (
              <div>
                <div style={{marginBottom:12}}><PartyPopper size={36} color="var(--gold)" /></div>
                <div style={{fontFamily:'var(--font-display)', fontSize:24, color:'var(--gold)', marginBottom:8}}>¡YA ESTÁS SUSCRITO!</div>
                <div style={{color:'rgba(255,255,255,0.7)', fontSize:14}}>Cada viernes te mandamos los mejores eventos de la semana.</div>
              </div>
            ) : (
              <>
                <div style={{fontFamily:'var(--font-display)', fontSize:26, color:'white', marginBottom:4}}><Mail size={22} style={{display:'inline', verticalAlign:'-2px', marginRight:8, color:'var(--gold)'}} />AGENDA SEMANAL</div>
                <div style={{color:'rgba(255,255,255,0.6)', fontSize:14, marginBottom:20}}>Recibe cada viernes los mejores eventos de Medellín</div>
                <div style={{display:'flex', flexDirection:'column', gap:10, maxWidth:360, margin:'0 auto'}}>
                  {/* Honeypot anti-bot — invisible para usuarios reales */}
                  <input type="text" value={honeypot} onChange={e => setHoneypot(e.target.value)} style={{position:'absolute', left:'-9999px', opacity:0, height:0, width:0}} tabIndex={-1} autoComplete="off" />
                  <input type="text" placeholder="Tu nombre (opcional)" value={subNombre} onChange={e => setSubNombre(e.target.value)}
                    style={{padding:'12px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.08)', color:'white', fontSize:14, fontFamily:'var(--font-body)', outline:'none'}} />
                  <input type="email" placeholder="Tu correo electrónico" value={subEmail} onChange={e => setSubEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                    style={{padding:'12px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.08)', color:'white', fontSize:14, fontFamily:'var(--font-body)', outline:'none'}} />
                  <button onClick={handleSubscribe} disabled={subLoading}
                    style={{padding:'13px', borderRadius:10, background:'var(--gold)', color:'white', border:'none', fontWeight:700, fontSize:15, fontFamily:'var(--font-body)', cursor:'pointer', opacity: subLoading ? 0.7 : 1}}>
                    {subLoading ? "Suscribiendo..." : "Suscribirme gratis →"}
                  </button>
                </div>
                <div style={{color:'rgba(255,255,255,0.3)', fontSize:11, marginTop:12}}>Sin spam. Cancela cuando quieras.</div>
              </>
            )}
          </div>
          {/* Footer normal */}
          <div style={{padding:'20px 24px', textAlign:'center'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:16, flexWrap:'wrap'}}>
              <span style={{fontFamily:'var(--font-display)', fontSize:18, color:'var(--gold)'}}>MEDELLÍN VIBRA</span>
              <a href="https://www.instagram.com/medellinvibra.co/" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex', alignItems:'center', gap:6, color:'#C0392B', fontWeight:600, fontSize:13, textDecoration:'none', fontFamily:'var(--font-body)'}}>
                <InstagramIcon size={14} />@medellinvibra.co
              </a>
              <a href="https://www.facebook.com/profile.php?id=61591129902444" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex', alignItems:'center', gap:6, color:'#1877F2', fontWeight:600, fontSize:13, textDecoration:'none', fontFamily:'var(--font-body)'}}>
                <FacebookIcon size={14} />Medellín Vibra
              </a>
              <a href="mailto:hola@medellinvibra.co" style={{display:'inline-flex', alignItems:'center', gap:6, color:'var(--gold)', fontWeight:600, fontSize:13, textDecoration:'none', fontFamily:'var(--font-body)'}}>
                <Mail size={14} />hola@medellinvibra.co
              </a>
              <span style={{fontSize:12, color:'var(--muted)'}}>{t.copyright}</span>
            </div>
          </div>
        </footer>

        <nav className="bottom-nav">
          {[[Home,t.tabHome,"home"],[Search,t.tabExplore,"explore"],[MapIcon,"Mapa","map"],[Heart,t.tabSaved,"saved"],[User,t.tabProfile,"profile"]].map(([Icon,label,tab])=>(
            <button key={tab} className={`bottom-nav-item ${activeTab===tab?"active":""}`} onClick={()=>setActiveTab(tab)}>
              <span><Icon size={20} fill={tab==="saved" && saved.length > 0 ? "#E8353A" : "none"} color={tab==="saved" && saved.length > 0 ? "#E8353A" : "currentColor"} /></span><span>{label}</span>
            </button>
          ))}
          {isAdmin && (
            <button className={`bottom-nav-item ${activeTab==="admin"?"active":""}`} onClick={()=>setActiveTab("admin")}>
              <span><Settings size={20} />{pendingEvents.length > 0 && <span className="admin-badge">{pendingEvents.length}</span>}</span>
              <span>Admin</span>
            </button>
          )}
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
                {(() => {
                  const effTag = getEffectiveTag(selectedEvent);
                  if (!effTag) return null;
                  const cfg = TAGS_CONFIG[effTag];
                  return <span className="detail-badge" style={{background:cfg?.color||'var(--red)',color:'white'}}>{cfg?.emoji} {effTag}</span>;
                })()}
                <div className="detail-title">{selectedEvent.title}</div>
                <div className="detail-info-grid">
                  <div className="detail-info-item"><div className="detail-info-label">{t.date}</div><div className="detail-info-value">{selectedEvent.date}</div></div>
                  <div className="detail-info-item"><div className="detail-info-label">{t.time}</div><div className="detail-info-value">{selectedEvent.time}</div></div>
                  <div className="detail-info-item"><div className="detail-info-label">{t.place}</div><div className="detail-info-value">{selectedEvent.place}</div></div>
                  <div className="detail-info-item"><div className="detail-info-label">{t.price}</div><div className="detail-info-value" style={{color: selectedEvent.price==="Gratis"?'var(--green)':'var(--gold)'}}>{selectedEvent.price}</div></div>
                </div>
                <p className="detail-desc">{selectedEvent.desc}</p>
                <div style={{marginBottom:16}}>
                  <iframe
                    title="Ubicación del evento"
                    width="100%"
                    height="160"
                    style={{border:'none', borderRadius:14, display:'block'}}
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent('-75.65,-75.50,6.18,6.35')}&layer=mapnik&marker=${encodeURIComponent(`6.2442,-75.5812`)}`}
                  />
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedEvent.place)}`} target="_blank" rel="noopener noreferrer"
                    style={{display:'flex', alignItems:'center', gap:6, marginTop:8, color:'var(--gold)', fontSize:13, fontWeight:600, textDecoration:'none'}}>
                    <MapPin size={14} />Abrir en Google Maps · {selectedEvent.place} ↗
                  </a>
                </div>
                {selectedEvent.ticketPlatform && (
                  <div style={{marginBottom:12,display:'flex',alignItems:'center',gap:8,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 14px',cursor: selectedEvent.link ? 'pointer' : 'default'}}
                    onClick={() => selectedEvent.link && window.open(selectedEvent.link, '_blank')}>
                    <Ticket size={18} color="var(--gold)" style={{flexShrink:0}} />
                    <div>
                      <div style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{t.officialTickets}</div>
                      <div style={{fontWeight:700,fontSize:14,color:'var(--gold)'}}>{selectedEvent.ticketPlatform} {selectedEvent.link && '↗'}</div>
                    </div>
                  </div>
                )}
                {selectedEvent.organizerName && (
                  <div style={{marginBottom:16, display:'flex', alignItems:'center', gap:12, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 14px', cursor:'pointer'}}
                    onClick={() => { setSelectedEvent(null); navigate(`/organizador/${slugify(selectedEvent.organizerName)}`); }}>
                    <div style={{width:40, height:40, borderRadius:'50%', background:'var(--gold)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, flexShrink:0}}>
                      {selectedEvent.organizerName[0]?.toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px'}}>{t.organizer}</div>
                      <div style={{fontWeight:700, fontSize:14}}>{selectedEvent.organizerName}</div>
                      {selectedEvent.organizerContact && (
                        <div style={{fontSize:12, color:'var(--gold)', marginTop:2}}>{selectedEvent.organizerContact}</div>
                      )}
                    </div>
                    <span style={{color:'var(--gold)', fontSize:20}}>›</span>
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
                  <button className="btn-share" style={{display:'inline-flex', alignItems:'center', justifyContent:'center'}} onClick={()=>toggleSave(selectedEvent.id)}><Heart size={20} fill={saved.includes(selectedEvent.id) ? "#E8353A" : "none"} color={saved.includes(selectedEvent.id) ? "#E8353A" : "currentColor"} /></button>
                  {isAdmin && (
                    <button className="btn-share" style={{color:'var(--red)',borderColor:'rgba(232,53,58,0.3)'}} onClick={e=>{handleDeleteEvent(selectedEvent.id,e);setSelectedEvent(null);}}><Trash2 size={18} /></button>
                  )}
                </div>
                <button
                  onClick={() => { setSelectedEvent(null); navigate(`/evento/${slugify(selectedEvent.title)}-${selectedEvent.id}`); }}
                  style={{width:'100%', marginTop:10, padding:'13px', borderRadius:12, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6}}
                >
                  <Link2 size={15} />Ver página del evento · Compartir link
                </button>
                <button
                  onClick={() => addToCalendar(selectedEvent)}
                  style={{width:'100%', marginTop:8, padding:'13px', borderRadius:12, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6}}
                >
                  <CalendarPlus size={15} />Agregar al calendario
                </button>
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
                <div style={{fontSize:12,fontWeight:700,color:'var(--gold)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:14}}><User size={12} style={{marginRight:4, verticalAlign:'-2px'}} />Información del organizador</div>
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

              <div style={{borderTop:'1px solid var(--border)',margin:'16px 0',paddingTop:16}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--gold)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:14}}>🔄 Recurrencia (opcional)</div>
                <div className="form-group">
                  <label className="form-label">¿Este evento se repite?</label>
                  <select className="form-select" value={form.recurrencia} onChange={e=>handleFormChange("recurrencia",e.target.value)}>
                    <option value="">No se repite</option>
                    <option value="semanal">Semanal (mismo día cada semana)</option>
                    <option value="mensual">Mensual (mismo día del mes)</option>
                  </select>
                </div>
                {form.recurrencia === "semanal" && (
                  <div className="form-group">
                    <label className="form-label">¿Qué día de la semana?</label>
                    <select className="form-select" value={form.dia_semana} onChange={e=>handleFormChange("dia_semana",e.target.value)}>
                      <option value="">Selecciona un día</option>
                      {["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"].map((d,i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                )}
                {form.recurrencia === "mensual" && (
                  <div className="form-group">
                    <label className="form-label">¿Qué día del mes? (1-31)</label>
                    <input className="form-input" type="number" min="1" max="31" placeholder="ej. 15" value={form.dia_mes} onChange={e=>handleFormChange("dia_mes",e.target.value)} />
                  </div>
                )}
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
    </>} />
    </Routes>
  );
}
