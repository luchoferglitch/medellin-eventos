import { useLocation } from "react-router-dom";
import EventosPorRangoPage from "./EventosPorRangoPage";
import { translations } from "./translations";
import { getLangFromPath, getLocale } from "./lang";

function getRangoSemana(t, lang) {
  const hoy = new Date();
  const desde = hoy.toISOString().split("T")[0];
  const hasta = new Date(hoy);
  hasta.setDate(hasta.getDate() + 6);
  const hastaStr = hasta.toISOString().split("T")[0];

  const opsDia = { day: "numeric", month: "long" };
  const desdeLabel = hoy.toLocaleDateString(getLocale(lang), opsDia);
  const hastaLabel = hasta.toLocaleDateString(getLocale(lang), opsDia);
  const label = t.estaSemanaRangeLabel.replace("{desde}", desdeLabel).replace("{hasta}", hastaLabel);

  return { desde, hasta: hastaStr, label };
}

export default function EstaSemanaPage() {
  const location = useLocation();
  const lang = getLangFromPath(location.pathname);
  const t = translations[lang];
  const { desde, hasta, label } = getRangoSemana(t, lang);
  return (
    <EventosPorRangoPage
      titulo={t.estaSemanaPageTitle}
      subtitulo={label}
      pageTitle={t.estaSemanaDocTitle}
      metaDescription={t.estaSemanaMetaDescription.replace("{RANGE}", label)}
      shareText={t.estaSemanaShareText}
      fechaDesde={desde}
      fechaHasta={hasta}
      page="esta-semana"
      mensajeVacio={t.estaSemanaEmptyText}
    />
  );
}
