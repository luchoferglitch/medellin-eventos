// Normaliza el precio de un evento para mostrarlo en tarjeta: nunca en blanco,
// nunca inventado — solo "Gratis", "Desde $X" (si hay una cifra parseable) o
// "Consultar boletería" como último recurso. Misma regla esGratis que ya usan
// EventoPage.jsx (ficha individual) y api/og.js para "entrada libre"/"gratis".
//
// Vive en un módulo compartido (no duplicado como slugify) porque todos sus
// consumidores están en src/ — no cruza el límite hacia las funciones edge de
// api/, así que no aplica la razón por la que slugify sí se duplica ahí.
export const esGratis = (price) => {
  const l = (price || "").toLowerCase();
  return l.startsWith("gratis") || l.startsWith("entrada libre");
};

export const formatPriceLabel = (price) => {
  if (esGratis(price)) return "Gratis";
  const match = (price || "").match(/[0-9][0-9.,]*/);
  if (match) return `Desde $${match[0]}`;
  return "Consultar boletería";
};
