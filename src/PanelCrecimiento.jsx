import { useCallback, useEffect, useState } from "react";
import { TrendingUp, MousePointerClick, Users, Mail, BellRing, Megaphone, RefreshCw } from "lucide-react";
import { supabase } from "./supabase";

// Panel privado de crecimiento (solo admin). La métrica principal es la gente
// que toca "Comprar boleta": es lo que le entregamos a los organizadores.
// Los datos vienen de la función panel_crecimiento() de Supabase, que valida
// el correo del admin y lee clicks, subscribers, push_subscriptions y
// visitas_campana (push no tiene política SELECT, por eso va por función).

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const semanaCorta = (iso) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]}`;
};
const ORIGENES = {
  evento: "Recuadro en evento",
  banner: "Banner del home",
  popup: "Ventana emergente",
  sticky_footer: "Barra fija inferior",
  footer: "Formulario del pie de página",
  organizadores: "Página organizadores",
  "sin dato": "Sin dato (antes del 31 oct)",
};
const FRECUENCIAS = { diaria: "Diaria", semanal: "Semanal", destacados: "Destacados" };

const card = { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 };
const titulo = { fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 };
const nota = { fontSize: 12, color: "var(--muted)", lineHeight: 1.45, marginTop: 8 };

function Kpi({ icon: Icon, valor, label, detalle }) {
  return (
    <div style={{ ...card, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--gold-text)" }}>
        <Icon size={16} aria-hidden="true" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{label}</span>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 34, lineHeight: 1.1, color: "var(--text)", marginTop: 6 }}>{valor}</div>
      {detalle && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{detalle}</div>}
    </div>
  );
}

function Lista({ datos, nombres = {} }) {
  const filas = Object.entries(datos || {}).sort((a, b) => b[1] - a[1]);
  if (!filas.length) return <div style={{ fontSize: 13, color: "var(--muted)" }}>Todavía no hay datos.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {filas.map(([k, n]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, color: "var(--text)" }}>
          <span>{nombres[k] || k}</span><strong>{n}</strong>
        </div>
      ))}
    </div>
  );
}

export default function PanelCrecimiento() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    const { data, error: e } = await supabase.rpc("panel_crecimiento", { p_semanas: 8 });
    if (e) setError("No se pudieron cargar los datos. Revisa que sigas con sesión de admin.");
    else setDatos(data);
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando && !datos) return <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)" }}>Cargando…</div>;
  if (error) return <div style={{ ...card, color: "var(--red)" }}>{error}</div>;
  if (!datos) return null;

  const semanas = datos.semanas || [];
  const max = Math.max(1, ...semanas.map((s) => s.clics));
  const top = datos.top_eventos || [];
  const clics28 = datos.clics_28 || 0;
  const lider = top[0];
  const pesoLider = lider && clics28 ? Math.round((lider.clics / clics28) * 100) : 0;
  const ultima = semanas[semanas.length - 1] || {};
  const nuevos28 = Object.values(datos.suscriptores_origen_28 || {}).reduce((a, b) => a + b, 0);
  const pushTotal = Object.values(datos.push_activos || {}).reduce((a, b) => a + b, 0);
  const campanas = datos.campanas_28 || [];
  const visitas28 = campanas.reduce((a, c) => a + c.visitas, 0);
  const conVisitante = semanas.reduce((a, s) => a + s.clics_con_visitante, 0);

  return (
    <div className="panel-crecimiento" style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "left", lineHeight: 1.4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Últimos 28 días · semanas de lunes a domingo, hora Colombia</div>
        <button onClick={cargar} disabled={cargando} aria-label="Actualizar panel de crecimiento"
          style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--text)", fontFamily: "var(--font-body)" }}>
          <RefreshCw size={14} aria-hidden="true" /> {cargando ? "Cargando" : "Actualizar"}
        </button>
      </div>

      <div className="pc-kpis" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        <Kpi icon={MousePointerClick} valor={clics28.toLocaleString("es-CO")} label="Clics a boletería"
          detalle={lider ? `${(clics28 - lider.clics).toLocaleString("es-CO")} sin ${lider.title.split(/\s[—-]\s/)[0]}` : null} />
        <Kpi icon={Users} valor={conVisitante ? ultima.personas ?? 0 : "—"} label="Personas esta semana"
          detalle={conVisitante ? "que tocaron Comprar" : "se mide desde el 31 oct"} />
        <Kpi icon={Mail} valor={datos.suscriptores_activos} label="Newsletter activos" detalle={`+${nuevos28} en 28 días`} />
        <Kpi icon={BellRing} valor={pushTotal} label="Avisos activos" detalle={`+${ultima.push || 0} esta semana`} />
        <Kpi icon={Megaphone} valor={visitas28} label="Visitas de campaña" detalle="links /ig con utm" />
      </div>

      <div style={card}>
        <div style={titulo}><TrendingUp size={16} aria-hidden="true" color="var(--gold-text)" /> Clics a boletería por semana</div>
        <div role="img" aria-label={`Clics por semana: ${semanas.map((s) => `${semanaCorta(s.inicio)} ${s.clics}`).join(", ")}`}
          style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 150 }}>
          {semanas.map((s, i) => (
            <div key={s.inicio} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{s.clics}</span>
              <div style={{ width: "100%", maxWidth: 46, height: `${Math.max(2, (s.clics / max) * 110)}px`, borderRadius: "6px 6px 2px 2px",
                background: i === semanas.length - 1 ? "var(--gold)" : "color-mix(in srgb, var(--gold) 45%, transparent)" }} />
              <span style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>{semanaCorta(s.inicio)}</span>
            </div>
          ))}
        </div>
        <div style={nota}>La última barra es la semana en curso, todavía incompleta.</div>
      </div>

      <div style={card}>
        <div style={titulo}><MousePointerClick size={16} aria-hidden="true" color="var(--gold-text)" /> Eventos con más clics (28 días)</div>
        {top.length === 0 ? <div style={{ fontSize: 13, color: "var(--muted)" }}>Todavía no hay clics.</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {top.map((e) => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>{e.organizer_name}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <strong style={{ color: "var(--text)" }}>{e.clics}</strong>
                  {e.personas > 0 && <div style={{ color: "var(--muted)", fontSize: 11 }}>{e.personas} {e.personas === 1 ? "persona" : "personas"}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
        {pesoLider >= 40 && (
          <div style={nota}>Un solo evento concentra el {pesoLider} % de los clics. Mira el número sin él para ver la tendencia real del sitio.</div>
        )}
      </div>

      <div className="pc-dos" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        <div style={card}>
          <div style={titulo}><Mail size={16} aria-hidden="true" color="var(--gold-text)" /> De dónde llegan los suscriptores (28 días)</div>
          <Lista datos={datos.suscriptores_origen_28} nombres={ORIGENES} />
        </div>
        <div style={card}>
          <div style={titulo}><BellRing size={16} aria-hidden="true" color="var(--gold-text)" /> Avisos activos por frecuencia</div>
          <Lista datos={datos.push_activos} nombres={FRECUENCIAS} />
        </div>
        <div style={card}>
          <div style={titulo}><Megaphone size={16} aria-hidden="true" color="var(--gold-text)" /> Campañas (28 días)</div>
          {campanas.length === 0
            ? <div style={{ fontSize: 13, color: "var(--muted)" }}>Todavía no hay visitas con utm. Usa los links medellinvibra.co/ig/nombre-campaña.</div>
            : <Lista datos={Object.fromEntries(campanas.map((c) => [`${c.fuente} · ${c.campana || "sin campaña"}`, c.visitas]))} />}
        </div>
        <div style={card}>
          <div style={titulo}><Users size={16} aria-hidden="true" color="var(--gold-text)" /> Clics por dispositivo (28 días)</div>
          <Lista datos={datos.dispositivos_28} nombres={{ movil: "Celular", escritorio: "Computador", bot: "Bots", "sin dato": "Sin dato (antes del 31 oct)" }} />
        </div>
      </div>
    </div>
  );
}
