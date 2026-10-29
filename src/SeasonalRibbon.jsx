import { useState } from "react";
import {
  Ghost, MoonStar, Candy, Skull, Sparkles, TreePine, Star, Gift, Bell, Flame, Lamp, Church, Sprout, Sunrise,
  Flower, Flower2, Heart, GraduationCap, BookOpen, Pencil, Apple, Coffee, Award, Music, Mountain, Moon,
  PartyPopper, Clock, Rose, Mail, Balloon, ToyBrick, IceCreamCone, Rocket, HeartHandshake, Users, X,
} from "lucide-react";
import { añoBogota } from "./temporadas";

// Mapa explícito nombre → ícono (en vez de importar todo lucide) para que el
// bundle solo incluya los íconos que usan las temporadas. Si una temporada
// nueva usa otro ícono, se importa arriba y se agrega aquí.
export const ICONOS_TEMPORADA = {
  Ghost, MoonStar, Candy, Skull, Sparkles, TreePine, Star, Gift, Bell, Flame, Lamp, Church, Sprout, Sunrise,
  Flower, Flower2, Heart, GraduationCap, BookOpen, Pencil, Apple, Coffee, Award, Music, Mountain, Moon,
  PartyPopper, Clock, Rose, Mail, Balloon, ToyBrick, IceCreamCone, Rocket, HeartHandshake, Users,
};

// La clave lleva el año: quien cerró Halloween 2026 sí ve Halloween 2027.
const claveCerrada = (id) => `mv-temporada-cerrada-${id}-${añoBogota()}`;

function yaCerrada(id) {
  try { return localStorage.getItem(claveCerrada(id)) === "1"; } catch { return false; }
}

// Franja delgada bajo el menú. Altura fija (40px) y se pinta en el primer render
// (la fecha se conoce en el cliente sin esperar ninguna consulta), así que no
// desplaza el contenido después de cargar.
export default function SeasonalRibbon({ temporada, lang = "es", onVerPlanes }) {
  const [cerrada, setCerrada] = useState(() => (temporada ? yaCerrada(temporada.id) : true));
  if (!temporada || cerrada) return null;

  const { colores, textos, iconos } = temporada;
  const txt = textos[lang] || textos.es;
  const Icono = ICONOS_TEMPORADA[iconos[0]] || Sparkles;

  const cerrar = () => {
    setCerrada(true);
    try { localStorage.setItem(claveCerrada(temporada.id), "1"); } catch { /* sin storage: solo se cierra en esta vista */ }
  };

  return (
    <div
      className="seasonal-ribbon"
      role="region"
      aria-label={txt.mensaje}
      style={{ "--sr-bg": colores.fondo, "--sr-text": colores.texto, "--sr-accent": colores.acento }}
    >
      <button type="button" className="seasonal-ribbon-main" onClick={onVerPlanes}>
        <Icono size={16} aria-hidden="true" className="seasonal-ribbon-icon" />
        <span className="seasonal-ribbon-msg">{txt.mensaje}</span>
        <span className="seasonal-ribbon-cta">{txt.cta} →</span>
      </button>
      <button type="button" className="seasonal-ribbon-close" onClick={cerrar} aria-label="Cerrar aviso de temporada">
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

// Figuras tenues para el fondo del hero. Puramente decorativas.
export function SeasonalHeroDecor({ temporada }) {
  if (!temporada) return null;
  const iconos = temporada.iconos.map((n) => ICONOS_TEMPORADA[n]).filter(Boolean);
  if (!iconos.length) return null;
  // Posiciones fijas (no aleatorias) para que el render sea estable. Todas van
  // en la mitad derecha del hero, donde no hay texto. En celular solo se ven
  // las marcadas con `movil` (más pequeñas, en las esquinas libres).
  const posiciones = [
    { top: "12%", right: "7%", size: 84, delay: "0s", movil: true },
    { top: "52%", right: "14%", size: 52, delay: "1.2s" },
    { top: "28%", right: "28%", size: 38, delay: "2.1s" },
    { top: "74%", right: "4%", size: 46, delay: "0.6s", movil: true },
    { top: "66%", right: "32%", size: 30, delay: "1.7s" },
    { top: "8%", right: "38%", size: 26, delay: "2.6s" },
  ];
  return (
    <div className="seasonal-hero-decor" aria-hidden="true" style={{ "--sr-accent": temporada.colores.acento, "--sr-bg": temporada.colores.fondo }}>
      {posiciones.map((p, i) => {
        const Icono = iconos[i % iconos.length];
        return (
          <span key={i} className={`seasonal-hero-fig fig-${i}${p.movil ? " fig-movil" : ""}`} style={{ top: p.top, right: p.right, animationDelay: p.delay }}>
            <Icono size={p.size} strokeWidth={1.5} />
          </span>
        );
      })}
    </div>
  );
}
