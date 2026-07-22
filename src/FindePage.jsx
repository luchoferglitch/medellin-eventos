import EventosPorRangoPage from "./EventosPorRangoPage";

function getRangoFinde() {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0=Dom, 1=Lun, ..., 5=Vie, 6=Sab

  // Días hasta el próximo viernes (o el viernes actual si ya es vie/sab/dom)
  let diasHastaVie;
  if (diaSemana === 5) diasHastaVie = 0;      // hoy es viernes
  else if (diaSemana === 6) diasHastaVie = -1; // ayer fue viernes
  else if (diaSemana === 0) diasHastaVie = -2; // anteayer fue viernes
  else diasHastaVie = 5 - diaSemana;           // próximo viernes

  const viernes = new Date(hoy);
  viernes.setDate(hoy.getDate() + diasHastaVie);
  const domingo = new Date(viernes);
  domingo.setDate(viernes.getDate() + 2);

  const desde = viernes.toISOString().split("T")[0];
  const hasta = domingo.toISOString().split("T")[0];

  const opsDia = { weekday: "long", day: "numeric", month: "long" };
  const viernesLabel = viernes.toLocaleDateString("es-CO", opsDia);
  const domingoLabel = domingo.toLocaleDateString("es-CO", opsDia);
  const label = `${viernesLabel} · noche al ${domingoLabel}`;

  return { desde, hasta, label, viernesStr: desde };
}

export default function FindePage() {
  const { desde, hasta, label } = getRangoFinde();
  return (
    <EventosPorRangoPage
      titulo="Qué hacer el fin de semana"
      subtitulo={label}
      pageTitle={`Eventos este fin de semana en Medellín — Medellín Vibra`}
      metaDescription="Planes para el fin de semana en Medellín, Área Metropolitana y Oriente Cercano. Viernes noche, sábado y domingo."
      shareText="Mira los planes del finde en Medellín 👇"
      fechaDesde={desde}
      fechaHasta={hasta}
      timeMin="18:00"
      page="finde"
      mensajeVacio="!No encontramos eventos para este fin de semana. ¡Vuelve el jueves, la agenda se actualiza constantemente!"
    />
  );
}
