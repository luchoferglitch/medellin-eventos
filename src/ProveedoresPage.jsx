import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import {
  Armchair, Speaker, Tent, MonitorPlay, UtensilsCrossed, Palette, Camera, Sofa, Truck, ShieldCheck,
  Store, Mail, MessageCircle, Globe, X, ImagePlus, Loader2, Wheat, Users, BadgeCheck,
} from "lucide-react";

// Lista cerrada — igual patrón que `category` en events (ver CLAUDE.md). Cambiarla
// después implica migrar datos existentes, así que se fijó de una vez con el
// usuario antes de construir.
const TIPOS_SERVICIO = [
  "Sillas y Mesas", "Sonido e Iluminación", "Carpas y Toldos", "Pantallas y Video",
  "Catering", "Decoración", "Fotografía y Video", "Mobiliario Lounge", "Transporte", "Seguridad",
  "Producción Local, Artesanal y de Origen", "Personal: Hostess, Meseros, Bartenders y Recreacionistas",
];

// Mismo dominio de `zona` que ya usa events — un proveedor cubre una de estas
// tres áreas, no un venue puntual.
const ZONAS = ["Medellín", "Área Metropolitana", "Oriente Cercano"];

const TIPO_ICON = {
  "Sillas y Mesas": Armchair, "Sonido e Iluminación": Speaker, "Carpas y Toldos": Tent,
  "Pantallas y Video": MonitorPlay, "Catering": UtensilsCrossed, "Decoración": Palette,
  "Fotografía y Video": Camera, "Mobiliario Lounge": Sofa, "Transporte": Truck, "Seguridad": ShieldCheck,
  "Producción Local, Artesanal y de Origen": Wheat, "Personal: Hostess, Meseros, Bartenders y Recreacionistas": Users,
};

const TIPO_COLORS = {
  "Sillas y Mesas": "#B45309", "Sonido e Iluminación": "#7C3AED", "Carpas y Toldos": "#0369A1",
  "Pantallas y Video": "#2563EB", "Catering": "#C2410C", "Decoración": "#DB2777",
  "Fotografía y Video": "#059669", "Mobiliario Lounge": "#9333EA", "Transporte": "#16A34A", "Seguridad": "#DC2626",
  "Producción Local, Artesanal y de Origen": "#65A30D", "Personal: Hostess, Meseros, Bartenders y Recreacionistas": "#0891B2",
};

// Copia local de utilidades ya definidas en App.jsx — no se exportan desde ahí,
// mismo patrón de duplicación que ya usa CategoriaPage.jsx para sus propias.
const sanitize = (str) => {
  if (!str) return "";
  return str.replace(/[<>]/g, "").replace(/javascript:/gi, "").replace(/on\w+=/gi, "").trim();
};
const isValidUrl = (url) => !url || url.startsWith("http://") || url.startsWith("https://");
const isValidEmail = (email) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const rateLimiter = {};
const checkRateLimit = (key, maxAttempts = 3, windowMs = 60000) => {
  const now = Date.now();
  if (!rateLimiter[key]) rateLimiter[key] = [];
  rateLimiter[key] = rateLimiter[key].filter((t) => now - t < windowMs);
  if (rateLimiter[key].length >= maxAttempts) return false;
  rateLimiter[key].push(now);
  return true;
};

const waLink = (raw) => {
  const digits = (raw || "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const withCountry = digits.length === 10 ? `57${digits}` : digits;
  return `https://wa.me/${withCountry}`;
};

const comprimirImagen = (file, maxWidth = 1000, quality = 0.78) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo comprimir")), "image/jpeg", quality);
    };
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = e.target.result;
  };
  reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
  reader.readAsDataURL(file);
});

const FORM_INICIAL = {
  nombre: "", tipo_servicio: TIPOS_SERVICIO[0], zona: ZONAS[0],
  contacto_whatsapp: "", contacto_email: "", sitio_web: "", descripcion: "", image_url: "",
};

export default function ProveedoresPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroZona, setFiltroZona] = useState("Todas");
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // Auth mínima propia (esta página vive fuera del árbol de App.jsx, no comparte
  // su modal de login) — la sesión sí se comparte vía localStorage porque es el
  // mismo cliente de supabase.
  const [authMode, setAuthMode] = useState("register");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [form, setForm] = useState(FORM_INICIAL);
  const [formLoading, setFormLoading] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark-mode"));

    document.documentElement.lang = "es";
    document.title = "Proveedores para eventos en Medellín — sillas, sonido, carpas y más | Medellín Vibra";

    const canonicalUrl = "https://www.medellinvibra.co/proveedores";
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) { canonicalEl = document.createElement("link"); canonicalEl.setAttribute("rel", "canonical"); document.head.appendChild(canonicalEl); }
    canonicalEl.setAttribute("href", canonicalUrl);

    const metaDescription = "Directorio de proveedores para eventos en Medellín, el Área Metropolitana y el Oriente Cercano: sillas y mesas, sonido e iluminación, carpas, pantallas, catering, decoración y más. Filtra por tipo de servicio y zona.";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.setAttribute("name", "description"); document.head.appendChild(metaDesc); }
    metaDesc.setAttribute("content", metaDescription);

    let ogUrl = document.querySelector('meta[property="og:url"]'); if (!ogUrl) { ogUrl = document.createElement("meta"); ogUrl.setAttribute("property", "og:url"); document.head.appendChild(ogUrl); } ogUrl.setAttribute("content", canonicalUrl);
    let ogTitle = document.querySelector('meta[property="og:title"]'); if (!ogTitle) { ogTitle = document.createElement("meta"); ogTitle.setAttribute("property", "og:title"); document.head.appendChild(ogTitle); } ogTitle.setAttribute("content", document.title);
    let ogDesc = document.querySelector('meta[property="og:description"]'); if (!ogDesc) { ogDesc = document.createElement("meta"); ogDesc.setAttribute("property", "og:description"); document.head.appendChild(ogDesc); } ogDesc.setAttribute("content", metaDescription);

    fetchProveedores();

    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchProveedores = async () => {
    setLoading(true);
    const { data } = await supabase.from("proveedores").select("*").eq("estado", "aprobado").order("created_at", { ascending: false });
    setProveedores(data || []);
    setLoading(false);
  };

  const filtered = proveedores.filter((p) =>
    (filtroTipo === "Todos" || p.tipo_servicio === filtroTipo) &&
    (filtroZona === "Todas" || p.zona === filtroZona)
  );

  const handleLogin = async () => {
    if (!checkRateLimit("proveedorLogin", 5, 300000)) { setAuthError("Demasiados intentos. Espera 5 minutos."); return; }
    setAuthLoading(true); setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos" : error.message);
    setAuthLoading(false);
  };

  const handleRegister = async () => {
    if (!authName.trim()) { setAuthError("Escribe tu nombre"); return; }
    if (!isValidEmail(authEmail)) { setAuthError("Correo no válido"); return; }
    if (authPassword.length < 6) { setAuthError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (!checkRateLimit("proveedorRegister", 3, 600000)) { setAuthError("Demasiados intentos. Espera 10 minutos."); return; }
    setAuthLoading(true); setAuthError("");
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { full_name: authName } } });
    if (error) setAuthError(error.message);
    else setAuthError("✓ Cuenta creada. Si tu proyecto pide confirmación por correo, revisa tu bandeja antes de publicar.");
    setAuthLoading(false);
  };

  const handleImagenUpload = async (fileInputEvent) => {
    const file = fileInputEvent.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMensaje({ tipo: "error", texto: "El archivo debe ser una imagen" }); return; }
    if (file.size > 10 * 1024 * 1024) { setMensaje({ tipo: "error", texto: "La imagen supera 10 MB" }); return; }

    setSubiendoImagen(true);
    try {
      let blob = await comprimirImagen(file, 1000, 0.78);
      if (blob.size > 480 * 1024) blob = await comprimirImagen(file, 900, 0.65);
      if (blob.size > 480 * 1024) blob = await comprimirImagen(file, 800, 0.55);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setMensaje({ tipo: "error", texto: "Necesitas iniciar sesión" }); setSubiendoImagen(false); return; }

      const formData = new FormData();
      formData.append("file", blob, "proveedor.jpg");
      formData.append("hint", form.nombre || "proveedor");

      const resp = await fetch("https://jtbqaqugnqkympwnfsod.supabase.co/functions/v1/upload-imagen", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.access_token}` },
        body: formData,
      });
      const data = await resp.json();
      if (!resp.ok) { setMensaje({ tipo: "error", texto: data.error || "Error al subir la imagen" }); setSubiendoImagen(false); return; }

      setForm((f) => ({ ...f, image_url: data.url }));
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
    } finally {
      setSubiendoImagen(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) { setAuthError("Inicia sesión o crea tu cuenta para publicar"); return; }
    if (!form.nombre.trim()) { setMensaje({ tipo: "error", texto: "Escribe el nombre del proveedor" }); return; }
    if (!form.contacto_whatsapp.trim() && !form.contacto_email.trim()) { setMensaje({ tipo: "error", texto: "Deja al menos un medio de contacto (WhatsApp o correo)" }); return; }
    if (!form.image_url) { setMensaje({ tipo: "error", texto: "Sube una imagen del proveedor" }); return; }
    if (!isValidEmail(form.contacto_email)) { setMensaje({ tipo: "error", texto: "El correo no es válido" }); return; }
    if (!isValidUrl(form.sitio_web)) { setMensaje({ tipo: "error", texto: "El sitio web no es válido (debe empezar con http:// o https://)" }); return; }
    if (!checkRateLimit("crearProveedor_" + user.id, 5, 3600000)) { setMensaje({ tipo: "error", texto: "Has enviado demasiadas solicitudes, intenta más tarde" }); return; }

    setFormLoading(true);
    const { error } = await supabase.from("proveedores").insert([{
      nombre: sanitize(form.nombre).slice(0, 150),
      tipo_servicio: form.tipo_servicio,
      zona: form.zona,
      contacto_whatsapp: sanitize(form.contacto_whatsapp).slice(0, 50),
      contacto_email: sanitize(form.contacto_email).slice(0, 150),
      sitio_web: form.sitio_web,
      descripcion: sanitize(form.descripcion).slice(0, 1000),
      image_url: form.image_url || null,
      user_id: user.id,
      estado: "pendiente",
    }]);
    setFormLoading(false);

    if (error) { setMensaje({ tipo: "error", texto: "Error al publicar: " + error.message }); return; }

    setMensaje({ tipo: "ok", texto: "✓ ¡Gracias! Enviamos tu proveedor a revisión, lo verás en el directorio en cuanto lo aprobemos." });
    setForm(FORM_INICIAL);
    setShowForm(false);

    fetch("https://jtbqaqugnqkympwnfsod.supabase.co/functions/v1/alerta-proveedor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: form.nombre, tipoServicio: form.tipo_servicio, zona: form.zona, whatsapp: form.contacto_whatsapp, email: form.contacto_email }),
    }).catch(() => {});
  };

  // Colores del tema — self-contained porque esta página no comparte el árbol de
  // App.jsx (donde viven las variables CSS --gold/--surface2/etc, ver CLAUDE.md
  // "modo oscuro"). Se lee la clase dark-mode que App.jsx ya aplica en <html>.
  const c = dark
    ? { bg: "#141414", surface: "#1e1e1e", surface2: "#2a2a2a", border: "rgba(255,255,255,0.08)", text: "#f0f0f0", muted: "#999" }
    : { bg: "#f5f3ef", surface: "#ffffff", surface2: "#f5f3ef", border: "#e5e1d8", text: "#1a1a1a", muted: "#888" };
  const gold = "#C8860A";

  // ItemList de Service (no Event) — esta página no es una agenda de eventos,
  // así que no se fuerza el schema de Event sobre negocios de renta/servicios.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Proveedores de servicios para eventos en Medellín",
    itemListElement: filtered.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        serviceType: p.tipo_servicio,
        name: p.nombre,
        areaServed: p.zona,
        ...(p.descripcion ? { description: p.descripcion } : {}),
        provider: {
          "@type": "Organization",
          name: p.nombre,
          ...(p.sitio_web ? { url: p.sitio_web } : {}),
        },
      },
    })),
  };

  const ProviderCard = ({ p }) => {
    const Icon = TIPO_ICON[p.tipo_servicio] || Store;
    const color = TIPO_COLORS[p.tipo_servicio] || gold;
    const wa = waLink(p.contacto_whatsapp);
    return (
      <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ height: 120, background: `linear-gradient(135deg, ${color}22, ${color}44)`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {p.image_url
            ? <img src={p.image_url} alt={p.nombre} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <Icon size={40} color={color} strokeWidth={1.5} />
          }
          {p.verificado && (
            <div style={{ position: "absolute", top: 10, right: 10, background: gold, color: "white", padding: "3px 9px", borderRadius: 100, fontSize: 10, fontWeight: 700, zIndex: 1, display: "flex", alignItems: "center", gap: 3 }}>
              <BadgeCheck size={11} />Verificado
            </div>
          )}
        </div>
        <div style={{ padding: "14px 16px" }}>
          <span style={{ display: "inline-block", background: `${color}1a`, color, padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{p.tipo_servicio}</span>
          <div style={{ fontWeight: 700, fontSize: 15, color: c.text, marginBottom: 4 }}>{p.nombre}</div>
          <div style={{ fontSize: 12, color: c.muted, marginBottom: 8 }}>📍 {p.zona}</div>
          {p.descripcion && <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.5, marginBottom: 10 }}>{p.descripcion.length > 120 ? p.descripcion.slice(0, 120).trimEnd() + "…" : p.descripcion}</div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#25D366", textDecoration: "none" }}><MessageCircle size={13} />WhatsApp</a>}
            {p.contacto_email && <a href={`mailto:${p.contacto_email}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: gold, textDecoration: "none" }}><Mail size={13} />Correo</a>}
            {p.sitio_web && <a href={p.sitio_web} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: gold, textDecoration: "none" }}><Globe size={13} />Sitio</a>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: c.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      <style>{`@keyframes proveedores-spin { to { transform: rotate(360deg); } } .proveedores-spin { animation: proveedores-spin 0.8s linear infinite; }`}</style>

      <div style={{ background: c.surface, borderBottom: `1px solid ${c.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", color: gold, fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>← Volver</button>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: gold, letterSpacing: 1 }}>MEDELLÍN VIBRA</span>
        <span style={{ width: 60 }} />
      </div>

      <div style={{ background: "linear-gradient(135deg, #1a1a1a, #2a1500)", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}><Store size={30} color={gold} strokeWidth={1.5} /></div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "white", margin: "0 0 12px", letterSpacing: 1 }}>Proveedores para eventos</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.6, maxWidth: 560, margin: "0 auto" }}>
          Sillas, sonido, carpas, pantallas, catering y más — servicios para montar tu evento en Medellín, el Área Metropolitana y el Oriente Cercano.
        </p>
        <button onClick={() => setShowForm(true)} style={{ marginTop: 20, background: gold, color: "white", border: "none", padding: "12px 24px", borderRadius: 100, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          + Publica tu servicio
        </button>
      </div>

      {mensaje && (
        <div style={{ position: "relative", zIndex: 250, maxWidth: 680, margin: "16px auto 0", padding: "0 20px" }}>
          <div style={{ background: mensaje.tipo === "ok" ? "#05966922" : "#C0392B22", border: `1px solid ${mensaje.tipo === "ok" ? "#059669" : "#C0392B"}`, color: mensaje.tipo === "ok" ? "#059669" : "#C0392B", borderRadius: 12, padding: "12px 16px", fontSize: 13, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span>{mensaje.texto}</span>
            <button onClick={() => setMensaje(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={14} /></button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 20px 0" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {["Todas", ...ZONAS].map((z) => (
            <button key={z} onClick={() => setFiltroZona(z)}
              style={{ background: filtroZona === z ? gold : c.surface2, color: filtroZona === z ? "white" : c.muted, border: `1px solid ${filtroZona === z ? gold : c.border}`, borderRadius: 100, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {z}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          <button onClick={() => setFiltroTipo("Todos")}
            style={{ background: filtroTipo === "Todos" ? gold : c.surface2, color: filtroTipo === "Todos" ? "white" : c.muted, border: `1px solid ${filtroTipo === "Todos" ? gold : c.border}`, borderRadius: 100, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Todos
          </button>
          {TIPOS_SERVICIO.map((t) => {
            const Icon = TIPO_ICON[t];
            return (
              <button key={t} onClick={() => setFiltroTipo(t)}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, background: filtroTipo === t ? gold : c.surface2, color: filtroTipo === t ? "white" : c.muted, border: `1px solid ${filtroTipo === t ? gold : c.border}`, borderRadius: 100, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                <Icon size={13} />{t}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px 60px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: c.muted, fontSize: 14 }}>Cargando proveedores…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: c.muted, fontSize: 14 }}>
            {proveedores.length === 0 ? "Todavía no hay proveedores aprobados en el directorio." : "No hay proveedores con estos filtros."}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {filtered.map((p) => <ProviderCard key={p.id} p={p} />)}
          </div>
        )}
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowForm(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: c.surface, borderRadius: 20, padding: 28, maxWidth: 440, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: gold, letterSpacing: 1 }}>PUBLICA TU SERVICIO</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: c.muted }}><X size={20} /></button>
            </div>

            {!user ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 13, color: c.muted, marginBottom: 4 }}>
                  Publicar un proveedor requiere una cuenta — igual que publicar un evento — para poder identificar quién envía cada solicitud.
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                  <button onClick={() => { setAuthMode("register"); setAuthError(""); }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${c.border}`, background: authMode === "register" ? gold : "transparent", color: authMode === "register" ? "white" : c.text, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Crear cuenta</button>
                  <button onClick={() => { setAuthMode("login"); setAuthError(""); }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${c.border}`, background: authMode === "login" ? gold : "transparent", color: authMode === "login" ? "white" : c.text, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Ya tengo cuenta</button>
                </div>
                {authMode === "register" && (
                  <input placeholder="Tu nombre" value={authName} onChange={(e) => setAuthName(e.target.value)} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, fontSize: 14, fontFamily: "inherit" }} />
                )}
                <input type="email" placeholder="Correo" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, fontSize: 14, fontFamily: "inherit" }} />
                <input type="password" placeholder="Contraseña" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, fontSize: 14, fontFamily: "inherit" }} />
                {authError && <div style={{ fontSize: 12, color: authError.startsWith("✓") ? "#059669" : "#C0392B", fontWeight: 600 }}>{authError}</div>}
                <button onClick={authMode === "register" ? handleRegister : handleLogin} disabled={authLoading} style={{ padding: "13px", borderRadius: 10, background: gold, color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  {authLoading ? "Un momento…" : authMode === "register" ? "Crear cuenta →" : "Iniciar sesión →"}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Nombre del proveedor *" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, fontSize: 14, fontFamily: "inherit" }} />
                <select value={form.tipo_servicio} onChange={(e) => setForm((f) => ({ ...f, tipo_servicio: e.target.value }))} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, fontSize: 14, fontFamily: "inherit" }}>
                  {TIPOS_SERVICIO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={form.zona} onChange={(e) => setForm((f) => ({ ...f, zona: e.target.value }))} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, fontSize: 14, fontFamily: "inherit" }}>
                  {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
                <input placeholder="WhatsApp (ej. 3001234567)" value={form.contacto_whatsapp} onChange={(e) => setForm((f) => ({ ...f, contacto_whatsapp: e.target.value }))} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, fontSize: 14, fontFamily: "inherit" }} />
                <input type="email" placeholder="Correo de contacto" value={form.contacto_email} onChange={(e) => setForm((f) => ({ ...f, contacto_email: e.target.value }))} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, fontSize: 14, fontFamily: "inherit" }} />
                <input placeholder="Sitio web (opcional, https://...)" value={form.sitio_web} onChange={(e) => setForm((f) => ({ ...f, sitio_web: e.target.value }))} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, fontSize: 14, fontFamily: "inherit" }} />
                <textarea placeholder="Descripción corta (opcional)" value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface2, color: c.text, fontSize: 14, fontFamily: "inherit", minHeight: 70, resize: "vertical" }} />

                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, border: `1px dashed ${form.image_url ? c.border : gold}`, cursor: "pointer", fontSize: 13, color: c.muted }}>
                  {subiendoImagen ? <Loader2 size={16} className="proveedores-spin" /> : <ImagePlus size={16} />}
                  {form.image_url ? "✓ Imagen subida — cambiar" : subiendoImagen ? "Subiendo…" : "Imagen del proveedor * (máx. 10 MB)"}
                  <input type="file" accept="image/*" onChange={handleImagenUpload} disabled={subiendoImagen} style={{ display: "none" }} />
                </label>

                <button onClick={handleSubmit} disabled={formLoading || subiendoImagen || !form.image_url} style={{ padding: "13px", borderRadius: 10, background: gold, color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", opacity: (formLoading || subiendoImagen || !form.image_url) ? 0.5 : 1 }}>
                  {formLoading ? "Enviando…" : "Enviar a revisión →"}
                </button>
                <div style={{ fontSize: 11, color: c.muted, textAlign: "center" }}>Lo revisamos antes de publicarlo — no aparece en el directorio de inmediato.</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ background: "#1a1a1a", padding: "20px 24px", textAlign: "center" }}>
        <a href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: gold, textDecoration: "none", letterSpacing: 1 }}>MEDELLÍN VIBRA</a>
        <div style={{ color: "#666", fontSize: 12, marginTop: 6 }}>© {new Date().getFullYear()} medellinvibra.co</div>
      </div>
    </div>
  );
}
