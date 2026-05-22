import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  
  // Calcular el domingo de esta semana
  const dayOfWeek = today.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const thisSunday = new Date(today);
  thisSunday.setDate(today.getDate() + daysUntilSunday);
  const thisSundayStr = thisSunday.toISOString().split("T")[0];

  // 1. Archivar eventos vencidos (fecha_fin pasó, o fecha_real pasó sin fecha_fin)
  const { count: vencidos } = await supabase.from("events")
    .update({ estado: "vencido" })
    .or(`fecha_fin.lt.${todayStr},and(fecha_fin.is.null,fecha_real.lt.${todayStr})`)
    .eq("estado", "aprobado")
    .select("*", { count: "exact", head: true });

  // 2. Eventos de esta semana
  await supabase.from("events")
    .update({ tag: "ESTA SEMANA" })
    .eq("estado", "aprobado")
    .gte("fecha_real", todayStr)
    .lte("fecha_real", thisSundayStr);

  // 3. Eventos próximos
  await supabase.from("events")
    .update({ tag: "PRÓXIMO" })
    .eq("estado", "aprobado")
    .gt("fecha_real", thisSundayStr);

  return new Response(JSON.stringify({ 
    message: "Actualización completada",
    semana: `${todayStr} al ${thisSundayStr}`,
    eventosVencidos: vencidos || 0
  }), { status: 200 });
});