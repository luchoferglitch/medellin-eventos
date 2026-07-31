import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

/* ============================================================
   HELPERS DE FECHA
   Todo se maneja como string 'YYYY-MM-DD'.
   Nunca uses new Date('2026-08-01') para comparar: eso se parsea
   como medianoche UTC y en Colombia (UTC-5) se ve como el día
   anterior. Ese es el bug clásico de este tipo de filtro.
   ============================================================ */

/** Convierte un objeto Date (en hora local) a 'YYYY-MM-DD'. */
export function aYMD(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Normaliza cualquier valor de fecha de la BD a 'YYYY-MM-DD' o null. */
export function normalizarYMD(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') return valor.slice(0, 10);
  if (valor instanceof Date) return aYMD(valor);
  return null;
}

/** Crea un Date local a partir de 'YYYY-MM-DD' (sin corrimiento de zona). */
export function desdeYMD(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/**
 * Traduce el campo `dia_semana` de la BD a un número 0-6 (0 = domingo).
 * Tolera número, string numérico o nombre en español con o sin tilde.
 * >>> Si tu BD guarda otro formato, este es el único punto a ajustar. <<<
 */
function diaSemanaANumero(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'number') return valor;
  const limpio = String(valor).trim().toLowerCase();
  if (/^\d+$/.test(limpio)) return Number(limpio);
  const sinTilde = limpio.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const idx = DIAS_SEMANA.findIndex(
    (d) => d.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === sinTilde
  );
  return idx === -1 ? null : idx;
}

/**
 * ¿Este evento ocurre en la fecha dada?
 * Contempla las 3 formas en que Medellín Vibra guarda fechas:
 *   1. Evento puntual o con rango: fecha_real .. fecha_fin
 *   2. Recurrencia semanal: se repite cada `dia_semana`
 *   3. Recurrencia mensual: se repite el mismo día del mes
 */
export function eventoOcurreEnFecha(evento, ymd) {
  if (!evento || !ymd) return false;

  const inicio = normalizarYMD(evento.fecha_real ?? evento.date);
  const fin = normalizarYMD(evento.fecha_fin) ?? inicio;

  // --- Recurrentes ---
  if (evento.recurrencia === 'semanal') {
    const objetivo = diaSemanaANumero(evento.dia_semana);
    if (objetivo === null) return false;
    if (desdeYMD(ymd).getDay() !== objetivo) return false;
    // No mostrarlo antes de que arranque la serie
    return !inicio || ymd >= inicio;
  }

  if (evento.recurrencia === 'mensual') {
    const diaDelMes = Number(evento.dia_mes ?? (inicio ? inicio.slice(8, 10) : NaN));
    if (Number.isNaN(diaDelMes)) return false;
    if (desdeYMD(ymd).getDate() !== diaDelMes) return false;
    return !inicio || ymd >= inicio;
  }

  // --- Puntual o con rango ---
  if (!inicio) return false;
  return ymd >= inicio && ymd <= fin;
}

/* ============================================================
   COMPONENTE
   ============================================================ */

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const INICIALES_DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

/**
 * @param {Array}    eventos          Lista completa de eventos aprobados (para marcar días con actividad)
 * @param {string?}  fechaSeleccionada 'YYYY-MM-DD' o null
 * @param {Function} onSeleccionar    (ymd|null) => void
 */
export default function FiltroCalendario({ eventos = [], fechaSeleccionada, onSeleccionar }) {
  const [abierto, setAbierto] = useState(false);
  const hoyYMD = aYMD(new Date());

  // El mes visible arranca en el de la fecha elegida, o en el actual
  const [mesVisible, setMesVisible] = useState(() => {
    const base = fechaSeleccionada ? desdeYMD(fechaSeleccionada) : new Date();
    return { anio: base.getFullYear(), mes: base.getMonth() };
  });

  const contenedorRef = useRef(null);
  const chipRef = useRef(null);
  const panelRef = useRef(null);

  // Posición del panel en coordenadas de viewport: se porta a document.body
  // (ver el render más abajo) para escapar del contenedor de chips, que tiene
  // overflow-x: auto y por lo tanto recorta cualquier hijo absoluto que se
  // salga de su alto.
  const [posPanel, setPosPanel] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!abierto || !chipRef.current) return;
    const ANCHO_PANEL = 288;
    const MARGEN = 12;
    const actualizarPosicion = () => {
      const r = chipRef.current.getBoundingClientRect();
      let left = r.left;
      if (left + ANCHO_PANEL + MARGEN > window.innerWidth) left = window.innerWidth - ANCHO_PANEL - MARGEN;
      if (left < MARGEN) left = MARGEN;
      setPosPanel({ top: r.bottom + 8, left });
    };
    actualizarPosicion();
    window.addEventListener('resize', actualizarPosicion);
    return () => window.removeEventListener('resize', actualizarPosicion);
  }, [abierto]);

  // Cerrar al hacer clic fuera, con Escape, o al hacer scroll (el panel
  // portado no se mueve solo cuando se hace scroll horizontal de los chips)
  useEffect(() => {
    if (!abierto) return;
    const clicFuera = (e) => {
      const dentroChip = contenedorRef.current && contenedorRef.current.contains(e.target);
      const dentroPanel = panelRef.current && panelRef.current.contains(e.target);
      if (!dentroChip && !dentroPanel) setAbierto(false);
    };
    const escape = (e) => { if (e.key === 'Escape') setAbierto(false); };
    const cerrarPorScroll = (e) => {
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setAbierto(false);
    };
    document.addEventListener('mousedown', clicFuera);
    document.addEventListener('keydown', escape);
    window.addEventListener('scroll', cerrarPorScroll, true);
    return () => {
      document.removeEventListener('mousedown', clicFuera);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('scroll', cerrarPorScroll, true);
    };
  }, [abierto]);

  // Días del mes visible que tienen al menos un evento
  const diasConEventos = useMemo(() => {
    const set = new Set();
    const diasEnMes = new Date(mesVisible.anio, mesVisible.mes + 1, 0).getDate();
    for (let d = 1; d <= diasEnMes; d++) {
      const ymd = `${mesVisible.anio}-${String(mesVisible.mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (ymd < hoyYMD) continue; // no marcamos días pasados
      if (eventos.some((ev) => eventoOcurreEnFecha(ev, ymd))) set.add(ymd);
    }
    return set;
  }, [eventos, mesVisible, hoyYMD]);

  // Matriz de celdas del mes (con huecos iniciales)
  const celdas = useMemo(() => {
    const primerDia = new Date(mesVisible.anio, mesVisible.mes, 1).getDay();
    const diasEnMes = new Date(mesVisible.anio, mesVisible.mes + 1, 0).getDate();
    const salida = Array(primerDia).fill(null);
    for (let d = 1; d <= diasEnMes; d++) {
      salida.push(`${mesVisible.anio}-${String(mesVisible.mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return salida;
  }, [mesVisible]);

  const cambiarMes = (delta) => {
    setMesVisible((prev) => {
      const nuevo = new Date(prev.anio, prev.mes + delta, 1);
      return { anio: nuevo.getFullYear(), mes: nuevo.getMonth() };
    });
  };

  const seleccionar = (ymd) => {
    if (ymd === fechaSeleccionada) {
      onSeleccionar(null);
    } else {
      onSeleccionar(ymd);
      setAbierto(false);
    }
  };

  const limpiar = (e) => {
    e.stopPropagation();
    onSeleccionar(null);
    setAbierto(false);
  };

  // Etiqueta del chip: "Elegir fecha" o "Vie 14 ago"
  const etiqueta = useMemo(() => {
    if (!fechaSeleccionada) return 'Elegir fecha';
    const f = desdeYMD(fechaSeleccionada);
    const dia = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][f.getDay()];
    const mes = MESES[f.getMonth()].slice(0, 3).toLowerCase();
    return `${dia} ${f.getDate()} ${mes}`;
  }, [fechaSeleccionada]);

  // No dejamos retroceder antes del mes actual
  const hoy = new Date();
  const puedeRetroceder =
    mesVisible.anio > hoy.getFullYear() ||
    (mesVisible.anio === hoy.getFullYear() && mesVisible.mes > hoy.getMonth());

  return (
    <div className="mvcal-wrap" ref={contenedorRef}>
      <button
        ref={chipRef}
        type="button"
        className={`mvcal-chip${fechaSeleccionada ? ' mvcal-chip--activo' : ''}`}
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="dialog"
      >
        <Calendar size={15} aria-hidden="true" />
        <span>{etiqueta}</span>
        {fechaSeleccionada && (
          <span
            role="button"
            tabIndex={0}
            className="mvcal-limpiar"
            onClick={limpiar}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') limpiar(e); }}
            aria-label="Quitar el filtro de fecha"
          >
            <X size={13} aria-hidden="true" />
          </span>
        )}
      </button>

      {abierto && createPortal(
        <div
          className="mvcal-panel"
          ref={panelRef}
          role="dialog"
          aria-label="Elegir una fecha"
          style={{ position: 'fixed', top: posPanel.top, left: posPanel.left }}
        >
          <div className="mvcal-cabecera">
            <button
              type="button"
              onClick={() => cambiarMes(-1)}
              disabled={!puedeRetroceder}
              aria-label="Mes anterior"
              className="mvcal-nav"
            >
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            <span className="mvcal-mes">
              {MESES[mesVisible.mes]} {mesVisible.anio}
            </span>
            <button
              type="button"
              onClick={() => cambiarMes(1)}
              aria-label="Mes siguiente"
              className="mvcal-nav"
            >
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>

          <div className="mvcal-grid mvcal-grid--encabezado" aria-hidden="true">
            {INICIALES_DIAS.map((d, i) => (
              <span key={i} className="mvcal-inicial">{d}</span>
            ))}
          </div>

          <div className="mvcal-grid">
            {celdas.map((ymd, i) => {
              if (!ymd) return <span key={`h-${i}`} className="mvcal-hueco" />;
              const pasado = ymd < hoyYMD;
              const tieneEventos = diasConEventos.has(ymd);
              const esHoy = ymd === hoyYMD;
              const elegido = ymd === fechaSeleccionada;
              const numero = Number(ymd.slice(8, 10));

              return (
                <button
                  key={ymd}
                  type="button"
                  className={[
                    'mvcal-dia',
                    pasado ? 'mvcal-dia--pasado' : '',
                    esHoy ? 'mvcal-dia--hoy' : '',
                    elegido ? 'mvcal-dia--elegido' : '',
                    tieneEventos ? 'mvcal-dia--conEventos' : '',
                  ].filter(Boolean).join(' ')}
                  disabled={pasado}
                  onClick={() => seleccionar(ymd)}
                  aria-pressed={elegido}
                  aria-label={
                    `${numero} de ${MESES[mesVisible.mes]}` +
                    (tieneEventos ? ', con eventos' : ', sin eventos')
                  }
                >
                  {numero}
                  {tieneEventos && <span className="mvcal-punto" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="mvcal-pie">
            <span className="mvcal-leyenda">
              <span className="mvcal-punto mvcal-punto--leyenda" aria-hidden="true" />
              Días con eventos
            </span>
            {fechaSeleccionada && (
              <button type="button" className="mvcal-quitar" onClick={limpiar}>
                Ver todas las fechas
              </button>
            )}
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .mvcal-wrap { position: relative; display: inline-block; }

        .mvcal-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 999px; cursor: pointer;
          font-size: 0.875rem; font-weight: 500; white-space: nowrap;
          border: 1px solid var(--mv-borde, #d8d8d8);
          background: var(--mv-chip-bg, #fff);
          color: var(--mv-texto, #1a1a1a);
          transition: background .15s ease, border-color .15s ease, color .15s ease;
        }
        .mvcal-chip:hover { border-color: var(--gold, #D4AF37); }
        .mvcal-chip:focus-visible { outline: 2px solid var(--gold, #D4AF37); outline-offset: 2px; }
        .mvcal-chip--activo {
          background: var(--gold, #D4AF37);
          border-color: var(--gold, #D4AF37);
          color: #1a1a1a;
        }
        .mvcal-limpiar {
          display: inline-flex; align-items: center; justify-content: center;
          margin-left: 2px; border-radius: 50%; padding: 2px; cursor: pointer;
          transition: background .15s ease;
        }
        .mvcal-limpiar:hover { background: rgba(0,0,0,.15); }

        .mvcal-panel {
          z-index: 150;
          width: 288px; padding: 14px; border-radius: 14px;
          background: var(--mv-panel-bg, #fff);
          border: 1px solid var(--mv-borde, #e2e2e2);
          box-shadow: 0 12px 32px rgba(0,0,0,.16);
          animation: mvcal-entrada .16s ease-out;
        }
        @keyframes mvcal-entrada {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mvcal-panel { animation: none; }
        }

        .mvcal-cabecera {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px;
        }
        .mvcal-mes {
          font-size: .9rem; font-weight: 600; letter-spacing: .01em;
          color: var(--mv-texto, #1a1a1a);
        }
        .mvcal-nav {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 8px; cursor: pointer;
          background: transparent; border: none;
          color: var(--mv-texto, #1a1a1a);
        }
        .mvcal-nav:hover:not(:disabled) { background: var(--mv-hover, rgba(0,0,0,.06)); }
        .mvcal-nav:disabled { opacity: .28; cursor: default; }
        .mvcal-nav:focus-visible { outline: 2px solid var(--gold, #D4AF37); outline-offset: 1px; }

        .mvcal-grid {
          display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
        }
        .mvcal-grid--encabezado { margin-bottom: 4px; }
        .mvcal-inicial {
          text-align: center; font-size: .68rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: .04em;
          color: var(--mv-texto-suave, #8a8a8a);
        }
        .mvcal-hueco { aspect-ratio: 1; }

        .mvcal-dia {
          position: relative; aspect-ratio: 1;
          display: flex; align-items: center; justify-content: center;
          border-radius: 9px; cursor: pointer; font-size: .82rem;
          background: transparent; border: 1px solid transparent;
          color: var(--mv-texto, #1a1a1a);
          transition: background .12s ease, color .12s ease;
        }
        .mvcal-dia:hover:not(:disabled) { background: var(--mv-hover, rgba(0,0,0,.06)); }
        .mvcal-dia:focus-visible { outline: 2px solid var(--gold, #D4AF37); outline-offset: 1px; }
        .mvcal-dia--pasado { opacity: .26; cursor: default; }
        .mvcal-dia--hoy { border-color: var(--gold, #D4AF37); font-weight: 700; }
        .mvcal-dia--conEventos { font-weight: 600; }
        .mvcal-dia--elegido {
          background: var(--gold, #D4AF37);
          color: #1a1a1a; font-weight: 700;
        }

        .mvcal-punto {
          position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
          width: 4px; height: 4px; border-radius: 50%;
          background: var(--gold, #D4AF37);
        }
        .mvcal-dia--elegido .mvcal-punto { background: #1a1a1a; }
        .mvcal-punto--leyenda { position: static; transform: none; }

        .mvcal-pie {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; margin-top: 12px; padding-top: 10px;
          border-top: 1px solid var(--mv-borde, #ececec);
        }
        .mvcal-leyenda {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: .72rem; color: var(--mv-texto-suave, #8a8a8a);
        }
        .mvcal-quitar {
          font-size: .75rem; font-weight: 600; cursor: pointer;
          background: none; border: none; padding: 0;
          color: var(--gold, #D4AF37); text-decoration: underline;
        }
        .mvcal-quitar:focus-visible { outline: 2px solid var(--gold, #D4AF37); outline-offset: 2px; }

        /* El sitio activa el modo oscuro agregando la clase .dark-mode al <html> */
        .dark-mode .mvcal-chip,
        .dark-mode .mvcal-panel {
          --mv-chip-bg: #1c1c1c;
          --mv-panel-bg: #161616;
          --mv-borde: #333;
          --mv-texto: #f0f0f0;
          --mv-texto-suave: #909090;
          --mv-hover: rgba(255,255,255,.09);
        }
      `}</style>
    </div>
  );
}
