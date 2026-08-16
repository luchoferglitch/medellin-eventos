import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BellRing } from "lucide-react";
import { supabase } from "./supabase";

const FUNCTIONS_URL = "https://jtbqaqugnqkympwnfsod.supabase.co/functions/v1";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YnFhcXVnbnFreW1wd25mc29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODUzMzQsImV4cCI6MjA5MzA2MTMzNH0.3tHT9CVRhboFrC3pTNMMQ-i2GeEPv_nUkG4d-hPuSdc";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function gestionarPush(patch) {
  await fetch(`${FUNCTIONS_URL}/gestionar-push`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON_KEY}` },
    body: JSON.stringify(patch),
  });
}

export default function PushBell({ t }) {
  const [open, setOpen] = useState(false);
  const [supported, setSupported] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [frecuencia, setFrecuencia] = useState(() => localStorage.getItem("pushFrecuencia") || "semanal");
  const [permission, setPermission] = useState("default");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const panelRef = useRef(null);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
    // En iOS, Chrome/Firefox/Edge/Opera usan el motor de Safari pero se identifican
    // en el user agent (CriOS, FxiOS, EdgiOS, OPiOS): solo Safari real permite
    // instalar la PWA con soporte completo de notificaciones push.
    setIsSafari(!/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent));
    setIsStandalone(window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator?.standalone === true);

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
      setSupported(false);
      return;
    }
    setPermission(Notification.permission);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscription(sub || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const activar = async () => {
    setSaving(true);
    setError("");
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") { setSaving(false); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
      });
      const { endpoint, keys } = sub.toJSON();

      // INSERT simple: solo se llega aquí cuando getSubscription() ya confirmó
      // que no había suscripción previa, así que el endpoint es nuevo. Un upsert
      // con ON CONFLICT DO NOTHING viola RLS porque la tabla no tiene política de
      // SELECT (a propósito) y Postgres no puede resolver el conflicto sin ella.
      const { error: insertError } = await supabase.from("push_subscriptions").insert(
        { endpoint, p256dh: keys.p256dh, auth_key: keys.auth, frecuencia }
      );

      // 23505 = ya existía esa fila (endpoint reutilizado): no es un error real.
      if (insertError && insertError.code !== "23505") throw insertError;

      localStorage.setItem("pushFrecuencia", frecuencia);
      setSubscription(sub);
    } catch (e) {
      console.error("No se pudo activar notificaciones", e);
      setError(t.pushError);
    }
    setSaving(false);
  };

  const cambiarFrecuencia = async (nueva) => {
    setFrecuencia(nueva);
    if (!subscription) return;
    setSaving(true);
    setError("");
    try {
      await gestionarPush({ endpoint: subscription.endpoint, frecuencia: nueva });
      localStorage.setItem("pushFrecuencia", nueva);
    } catch (e) {
      console.error("No se pudo cambiar la frecuencia", e);
      setError(t.pushError);
    }
    setSaving(false);
  };

  const desactivar = async () => {
    if (!subscription) return;
    setSaving(true);
    setError("");
    try {
      await gestionarPush({ endpoint: subscription.endpoint, activo: false });
      await subscription.unsubscribe();
      localStorage.removeItem("pushFrecuencia");
      setSubscription(null);
    } catch (e) {
      console.error("No se pudo desactivar", e);
      setError(t.pushError);
    }
    setSaving(false);
  };

  const bellButton = (activeVisual) => (
    <button
      onClick={() => setOpen((o) => !o)}
      aria-label={t.pushBellLabel}
      aria-expanded={open}
      style={{
        background: activeVisual ? "var(--gold)" : "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "7px 10px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        color: activeVisual ? "white" : "var(--text)",
      }}
    >
      {activeVisual ? <BellRing size={16} /> : <Bell size={16} />}
    </button>
  );

  const panelStyle = {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    width: 280,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    zIndex: 50,
  };

  if (isIOS && !isStandalone) {
    return (
      <div style={{ position: "relative" }} ref={panelRef}>
        {bellButton(false)}
        {open && (
          <div style={panelStyle}>
            <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, marginBottom: 8 }}>
              {isSafari ? t.pushIOSInstructions : t.pushIOSNotSafari}
            </div>
            <Link to="/preguntas-frecuentes#instalar-app" style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600, textDecoration: "underline" }}>
              {t.pushIOSMoreInfo}
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (!supported) return null;

  const FREQ_OPTIONS = [
    ["diaria", t.pushFreqDaily],
    ["semanal", t.pushFreqWeekly],
    ["destacados", t.pushFreqFeatured],
  ];

  return (
    <div style={{ position: "relative" }} ref={panelRef}>
      {bellButton(!!subscription)}
      {open && (
        <div style={panelStyle}>
          {permission === "denied" ? (
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{t.pushDenied}</div>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                {subscription ? t.pushManageTitle : t.pushOptInTitle}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
                {subscription ? t.pushManageText : t.pushOptInText}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                {FREQ_OPTIONS.map(([val, label]) => (
                  <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="push-frecuencia"
                      checked={frecuencia === val}
                      onChange={() => cambiarFrecuencia(val)}
                      disabled={saving}
                    />
                    {label}
                  </label>
                ))}
              </div>
              {error && (
                <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 10 }}>{error}</div>
              )}
              {subscription ? (
                <button
                  onClick={desactivar}
                  disabled={saving}
                  style={{ background: "none", border: "none", color: "var(--red)", fontSize: 12, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                >
                  {t.pushDisable}
                </button>
              ) : (
                <button
                  onClick={activar}
                  disabled={saving}
                  style={{ width: "100%", background: "var(--gold)", color: "white", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  {saving ? t.pushActivating : t.pushActivateBtn}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
