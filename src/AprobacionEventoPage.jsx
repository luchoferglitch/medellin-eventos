import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const CONTENIDO = {
  aprobado: {
    Icon: CheckCircle2,
    color: "#059669",
    titulo: "Evento aprobado",
    mensaje: (t) => `"${t}" ya está visible en Medellín Vibra.`,
  },
  rechazado: {
    Icon: XCircle,
    color: "#C0392B",
    titulo: "Evento rechazado",
    mensaje: (t) => `"${t}" quedó marcado como rechazado y no aparecerá en el sitio.`,
  },
  invalido: {
    Icon: AlertTriangle,
    color: "#C0392B",
    titulo: "Enlace inválido o vencido",
    mensaje: () => "Este enlace no es válido. Ve a Supabase para revisar el evento manualmente.",
  },
  servidor: {
    Icon: AlertTriangle,
    color: "#C0392B",
    titulo: "No se pudo actualizar el evento",
    mensaje: () => "Ocurrió un error al guardar el cambio. Revisa el evento manualmente en Supabase.",
  },
};

export default function AprobacionEventoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const estado = searchParams.get("estado");
  const error = searchParams.get("error");
  const titulo = searchParams.get("titulo") || "Evento";

  const clave = estado === "aprobado" || estado === "rechazado" ? estado : (error || "invalido");
  const { Icon, color, titulo: tituloMsg, mensaje } = CONTENIDO[clave] || CONTENIDO.invalido;

  useEffect(() => {
    document.title = `${tituloMsg} — Medellín Vibra`;
    let robotsEl = document.querySelector('meta[name="robots"]');
    if (!robotsEl) { robotsEl = document.createElement("meta"); robotsEl.setAttribute("name", "robots"); document.head.appendChild(robotsEl); }
    robotsEl.setAttribute("content", "noindex, nofollow");
  }, [tituloMsg]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f3ef", fontFamily: "var(--font-body, sans-serif)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: 420, width: "100%", background: "white", borderRadius: 16, padding: "40px 28px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: 22, color: "#C8860A", letterSpacing: 0.5, marginBottom: 20 }}>
          MEDELLÍN VIBRA
        </div>
        <Icon size={48} color={color} style={{ marginBottom: 16 }} />
        <div style={{ fontSize: 20, fontWeight: 700, color, marginBottom: 8 }}>{tituloMsg}</div>
        <p style={{ color: "#555", fontSize: 14, lineHeight: 1.6, margin: "0 0 28px" }}>{mensaje(titulo)}</p>
        <button
          onClick={() => navigate("/")}
          style={{ background: "#C8860A", color: "white", border: "none", padding: "12px 28px", borderRadius: 100, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
        >
          Ir al sitio
        </button>
      </div>
    </div>
  );
}
