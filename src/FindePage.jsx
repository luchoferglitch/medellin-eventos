import { useLocation } from "react-router-dom";
import EventosPorRangoPage from "./EventosPorRangoPage";
import { translations } from "./translations";
import { getLangFromPath, getLocale } from "./lang";

function getRangoFinde(t, lang) {
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
  const viernesLabel = viernes.toLocaleDateString(getLocale(lang), opsDia);
  const domingoLabel = domingo.toLocaleDateString(getLocale(lang), opsDia);
  const label = t.findeRangeLabel.replace("{desde}", viernesLabel).replace("{hasta}", domingoLabel);

  return { desde, hasta, label, viernesStr: desde };
}

export default function FindePage() {
  const location = useLocation();
  const lang = getLangFromPath(location.pathname);
  const t = translations[lang];
  const { desde, hasta, label } = getRangoFinde(t, lang);
  return (
    <EventosPorRangoPage
      titulo={t.findePageTitle}
      subtitulo={label}
      pageTitle={t.findeDocTitle}
      metaDescription={t.findeMetaDescription}
      shareText={t.findeShareText}
      fechaDesde={desde}
      fechaHasta={hasta}
      timeMin="18:00"
      page="finde"
      mensajeVacio={t.findeEmptyText}
    />
  );
}
