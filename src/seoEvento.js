// Título y descripción de un evento para Google y redes.
//
// Search Console mostró que la gente busca "<artista> medellín" o
// "<artista> medellín 2026": páginas como Marco Antonio Solís salían
// ~4.000 veces en Google con 0,1 % de clics porque el título no decía ni
// la ciudad ni la fecha. Ana Gabriel, cuyo título sí coincidía con la
// búsqueda, tenía 7-9 %. Por eso el título lleva ciudad y fecha cuando el
// nombre del evento no las trae ya.
//
// IMPORTANTE: api/og.js (lo que leen Googlebot y las redes) tiene una copia
// de estas funciones, porque corre en el runtime edge sin importar src/.
// Si cambias algo aquí, cámbialo también allá.

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const normalizar = (s = "") =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Municipio real tomado del campo place (convención "..., Municipio, Antioquia").
// Si no se puede leer, Medellín solo cuando la zona es Medellín; si no, null.
export function municipioDelEvento(place = "", zona = "") {
  const partes = String(place).split(",").map((p) => p.trim()).filter(Boolean);
  const iAntioquia = partes.findIndex((p) => /^antioquia$/i.test(p));
  if (iAntioquia > 0) return partes[iAntioquia - 1];
  // "..., Envigado" o "..., Medellín": la última parte, si no es una dirección.
  const ultima = (partes[partes.length - 1] || "").split(/\s[—-]\s/).pop().trim();
  if (partes.length > 1 && ultima && !/\d/.test(ultima) && ultima.length <= 30) {
    return /^medell[ií]n$/i.test(ultima) ? "Medellín" : ultima;
  }
  return zona === "Medellín" ? "Medellín" : null;
}

// Cómo nombrar el lugar en el título. La gente busca "<artista> medellín"
// también para conciertos del Área Metropolitana (DAVIarena en Sabaneta,
// Polideportivo Sur en Envigado), así que ahí va "Medellín (Sabaneta)":
// coincide con la búsqueda y dice el municipio real.
function lugarParaTitulo(place, zona) {
  const municipio = municipioDelEvento(place, zona);
  if (zona === "Área Metropolitana") {
    return municipio && municipio !== "Medellín" ? `Medellín (${municipio})` : "Medellín";
  }
  return municipio;
}

export function fechaCorta(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MESES[m - 1]} ${y}`;
}

export function tituloSeoEvento({ title = "", place = "", zona = "", fechaReal = "" }) {
  const ciudad = lugarParaTitulo(place, zona);
  const yaTieneCiudad = ciudad && normalizar(title).includes(normalizar(ciudad.split(" (")[0]));
  const fecha = fechaCorta(fechaReal);
  let t = title.trim();
  // Si el título ya dice "en <lugar>", no se repite el "en".
  if (ciudad && !yaTieneCiudad) t += / en /i.test(t) ? ` · ${ciudad}` : ` en ${ciudad}`;
  if (fecha) t += ` · ${fecha}`;
  return `${t} | Medellín Vibra`;
}

// Descripción: primero los datos que la gente busca (fecha, lugar, precio)
// y después el texto del evento, todo en ~155 caracteres.
export function descripcionSeoEvento({ description = "", place = "", fechaReal = "", time = "", price = "", category = "" }) {
  const fecha = fechaCorta(fechaReal);
  const lugar = String(place).split(",")[0].split(/\s[—-]\s/)[0].trim();
  // Precios largos (etapas, localidades) se recortan a la primera parte.
  let precio = String(price || "").trim();
  if (precio.length > 40) precio = precio.split(/\s*\(|;|\.\s|,\s/)[0].trim();
  const datos = [fecha && time ? `${fecha}, ${time}` : fecha, lugar, precio].filter(Boolean).join(" · ");
  const texto = String(description || "").replace(/\s+/g, " ").trim();
  const base = texto ? `${datos}. ${texto}` : `${category ? category + " · " : ""}${datos}`;
  return base.length > 155 ? base.slice(0, 154).replace(/\s+\S*$/, "") + "…" : base;
}
