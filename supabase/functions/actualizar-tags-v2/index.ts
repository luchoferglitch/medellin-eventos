import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const dayOfWeek = today.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const thisSunday = new Date(today);
  thisSunday.setDate(today.getDate() + daysUntilSunday);
  const thisSundayStr = thisSunday.toISOString().split("T")[0];

  const AUTO_TAGS_FILTER = `tag.is.null,tag.in.("ESTA SEMANA","PRÓXIMO","HOY")`;

  const { count: vencidos } = await supabase.from("events")
    .update({ estado: "vencido" })
    .or(`fecha_fin.lt.${todayStr},and(fecha_fin.is.null,fecha_real.lt.${todayStr})`)
    .eq("estado", "aprobado")
    .select("*", { count: "exact", head: true });

  const { count: hoy } = await supabase.from("events")
    .update({ tag: "HOY" })
    .eq("estado", "aprobado")
    .eq("fecha_real", todayStr)
    .or(AUTO_TAGS_FILTER)
    .select("*", { count: "exact", head: true });

  const { count: estaSemana } = await supabase.from("events")
    .update({ tag: "ESTA SEMANA" })
    .eq("estado", "aprobado")
    .gt("fecha_real", todayStr)
    .lte("fecha_real", thisSundayStr)
    .or(AUTO_TAGS_FILTER)
    .select("*", { count: "exact", head: true });

  const { count: proximo } = await supabase.from("events")
    .update({ tag: "PRÓXIMO" })
    .eq("estado", "aprobado")
    .gt("fecha_real", thisSundayStr)
    .or(AUTO_TAGS_FILTER)
    .select("*", { count: "exact", head: true });

  return new Response(JSON.stringify({
    message: "Actualización completada",
    semana: `${todayStr} al ${thisSundayStr}`,
    eventosVencidos: vencidos || 0,
    etiquetadosHoy: hoy || 0,
    etiquetadosEstaSemana: estaSemana || 0,
    etiquetadosProximo: proximo || 0
  }), { status: 200 });
});
