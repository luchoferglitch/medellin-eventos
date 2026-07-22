import EventosPorRangoPage from "./EventosPorRangoPage";

function getRangoSemana() {
  const hoy = new Date();
  const desde = hoy.toISOString().split("T")[0];
  const hasta = new Date(hoy);
  hasta.setDate(hasta.getDate() + 6);
  const hastaStr = hasta.toISOString().split("T")[0];

  const opsDia = { day: "numeric", month: "long" };
  const desdeLabel = hoy.toLocaleDateString("es-CO", opsDia);
  const hastaLabel = hasta.toLocaleDateString("es-CO", opsDia);

  return { desde, hasta: hastaStr, label: `Del ${desdeLabel} al ${hastaLabel}` };
}

export default function EstaSemanaPage() {
  const { desde, hasta, label } = getRangoSemana();
  return (
    <EventosPorRangoPage
      titulo="Qué hacer esta semana"
      subtitulo={label}
      pageTitle={`Eventos esta semana en Medellín — Medellín Vibra`}
      metaDescription={`Todos los eventos culturales de esta semana en Medellín, Área Metropolitana y Oriente Cercano. ${label}.`}
      shareText="Mira qué hay en Medellín esta semana 👇"
      fechaDesde={desde}
      fechaHasta={hasta}
      page="esta-semana"
      mensajeVacio="No encontramos eventos para esta semana. ¡Vuelve pronto, la agenda se actualiza constantemente!"
    />
  );
}
