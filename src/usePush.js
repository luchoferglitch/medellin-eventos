import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseAnonKey } from "./supabase";
import { trackEvent } from "./analytics";

// Estado y acciones de las notificaciones push, compartidos por la campana
// del menú (PushBell), la invitación en la página de evento (PushInvite) y
// la entrada "Avisos" del menú Más en celular.

const FUNCTIONS_URL = "https://jtbqaqugnqkympwnfsod.supabase.co/functions/v1";

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
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseAnonKey}` },
    body: JSON.stringify(patch),
  });
}

function leer(clave, porDefecto) {
  try { return localStorage.getItem(clave) || porDefecto; } catch { return porDefecto; }
}
function guardar(clave, valor) {
  try { valor == null ? localStorage.removeItem(clave) : localStorage.setItem(clave, valor); } catch { /* sin storage */ }
}

export default function usePush(errorText) {
  const [supported, setSupported] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [checked, setChecked] = useState(false);
  const [frecuencia, setFrecuencia] = useState(() => leer("pushFrecuencia", "semanal"));
  const [permission, setPermission] = useState("default");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
    // En iOS, Chrome/Firefox/Edge/Opera usan el motor de Safari pero se identifican
    // en el user agent (CriOS, FxiOS, EdgiOS, OPiOS): solo Safari real permite
    // instalar la PWA con soporte completo de notificaciones push.
    setIsSafari(!/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent));
    setIsStandalone(window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator?.standalone === true);

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
      setSupported(false);
      setChecked(true);
      return;
    }
    setPermission(Notification.permission);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscription(sub || null))
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  const activar = useCallback(async (origen = "campana") => {
    setSaving(true);
    setError("");
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") { setSaving(false); return false; }

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

      guardar("pushFrecuencia", frecuencia);
      setSubscription(sub);
      trackEvent({ action: "activar_push", category: "Conversión", label: `${origen}:${frecuencia}` });
      setSaving(false);
      return true;
    } catch (e) {
      console.error("No se pudo activar notificaciones", e);
      setError(errorText);
      setSaving(false);
      return false;
    }
  }, [frecuencia, errorText]);

  const cambiarFrecuencia = useCallback(async (nueva) => {
    setFrecuencia(nueva);
    if (!subscription) return;
    setSaving(true);
    setError("");
    try {
      await gestionarPush({ endpoint: subscription.endpoint, frecuencia: nueva });
      guardar("pushFrecuencia", nueva);
    } catch (e) {
      console.error("No se pudo cambiar la frecuencia", e);
      setError(errorText);
    }
    setSaving(false);
  }, [subscription, errorText]);

  const desactivar = useCallback(async () => {
    if (!subscription) return;
    setSaving(true);
    setError("");
    try {
      await gestionarPush({ endpoint: subscription.endpoint, activo: false });
      await subscription.unsubscribe();
      guardar("pushFrecuencia", null);
      setSubscription(null);
    } catch (e) {
      console.error("No se pudo desactivar", e);
      setError(errorText);
    }
    setSaving(false);
  }, [subscription, errorText]);

  return {
    supported, isIOS, isSafari, isStandalone, subscription, checked,
    frecuencia, permission, saving, error,
    activar, cambiarFrecuencia, desactivar,
    // En iPhone solo funciona con la app instalada en la pantalla de inicio.
    needsInstall: isIOS && !isStandalone,
  };
}
