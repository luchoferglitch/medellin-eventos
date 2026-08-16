# Medellín Vibra

Agregador de eventos culturales de Medellín y sus alrededores. Público: gente que quiere
saber qué hacer esta semana en la ciudad. El sitio vive en https://www.medellinvibra.co

Responde siempre en español.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite |
| Base de datos y auth | Supabase (proyecto `jtbqaqugnqkympwnfsod`) |
| Imágenes | Cloudflare R2, bucket `medellin-vibra-eventos` |
| Correo transaccional | Resend, dominio `hola@medellinvibra.co` |
| Hosting | Vercel |

**Despliegue: cada push a `main` publica en producción automáticamente.** No hay staging.
Un error en `main` está en vivo en menos de un minuto. Trata cada commit en consecuencia.

Componentes principales en `src/`: `App.jsx` (home, filtros y listado), `EventoPage.jsx`,
`OrganizadorPage.jsx`, `HoyPage.jsx`, `OrganizadoresLanding.jsx`, `FaqPage.jsx`.

---

## Reglas que no se rompen

1. **Nunca inventes datos de un evento.** Ni precios, ni horarios, ni direcciones, ni nombres
   de organizador. Si un dato no está confirmado en la fuente, se deja vacío o se usa el valor
   de respaldo indicado más abajo. Un evento con información inventada destruye la confianza
   del usuario y la relación con el venue.
2. **Nunca escribas secretos en archivos versionados.** Las claves viven en variables de
   entorno del sistema y en los secrets de Supabase. Si necesitas una, pídela; no la busques
   en el código ni la pegues en un archivo.
3. **Antes de insertar un evento, revisa duplicados** por título con `ILIKE`.
4. **Verifica antes de dar por hecho.** Ha pasado que una tanda de inserciones se dio por
   completada sin estarlo. Después de insertar, consulta el conteo real.
5. **No toques** los cron jobs `actualizar-tags-semanal` ni `archivar-eventos-pasados`.

---

## Tabla `events`: convenciones

Estas reglas existen porque cada una corresponde a un error ya cometido.

### `zona` — solo tres valores

```
"Medellín" | "Área Metropolitana" | "Oriente Cercano"
```

La zona se determina por el **venue real**, no por lo que diga la fuente. Ticketmaster
etiqueta como "Medellín" eventos que ocurren en Llanogrande (Oriente Cercano) o en Envigado
(Área Metropolitana). Verifica siempre la dirección del venue.

### `category` — solo diez valores

```
Música | Arte | Comedia | Tech | Gastronomía | Baile | Deportes | Teatro | Bienestar | Académicos
```

### `tag` — `NULL` por defecto

```
NULL | "Destacado" | "Últimas entradas" | "Agotado" | "Nuevo"
```

Cualquier otro valor rompe el filtrado. En la duda, `NULL`.

### Fechas

- `date` **siempre** se sincroniza con `fecha_real` al insertar. Son dos campos que deben
  coincidir. Es el error de inserción más frecuente.
- `fecha_fin` siempre se llena.
- **Fechas puntuales no contiguas** (un evento que ocurre el 3, el 10 y el 17):
  `fecha_fin = fecha_real` de la fecha más próxima. Si se pone el rango completo, el
  recordatorio diario satura al suscriptor con un evento que no ocurre esos días.
- **Rango real** solo cuando el evento efectivamente ocurre todos los días del rango.

### `recurrencia`

Solo soporta dos patrones:

- `"semanal"` — requiere `dia_semana`
- `"mensual"` — día fijo del mes

**No** soporta patrones tipo "segundo viernes de cada mes". Si un evento tiene ese patrón,
se insertan las ocurrencias como eventos puntuales.

### `precio`

Si no está confirmado: `"Consultar boletería"`. Nunca una cifra estimada.

### `ticket_link`

Nunca reutilices el mismo enlace en eventos distintos. Si no hay página de venta, se deja
vacío o se usa el canal real (WhatsApp del organizador, por ejemplo).

### `organizer_name`

Obligatorio. El formulario de creación lo valida. Su ausencia genera advertencias de
schema.org en Search Console.

### `place`

Dirección real del venue. Poner solo "Medellín" no sirve: rompe el filtro "Cerca de mí" y
empobrece el schema Event. (Quedan ~33 eventos históricos con este problema, pendientes de
limpieza.)

---

## Imágenes

**Toda imagen se sube a R2 antes del INSERT.** El campo `image_url` nunca apunta a Supabase
Storage — ese bucket se vació y esas URLs están muertas.

Script de subida: `C:\Users\lucho\Documents\upload-temp\upload-compressed.mjs`
Compresión: sharp, JPEG calidad 78, máximo 1000px de ancho.

URL pública del bucket:
`https://pub-c5ba255ea192436da56e91e3ef3ecfa5.r2.dev/`

Imagen de respaldo (cuando un evento no tiene imagen propia):
`https://pub-c5ba255ea192436da56e91e3ef3ecfa5.r2.dev/default-fallback-medellin`

Este fallback está referenciado en `api/og.js` y `src/EventoPage.jsx`. Si cambia, se cambia
en ambos.

Las imágenes que suben los organizadores desde el formulario pasan por la Edge Function
`upload-imagen`, que comprime en el navegador de forma progresiva (1000px q0.78 → 900px q0.65
→ 800px q0.55) hasta bajar de 480KB. Máximo original: 10MB.

---

## Edge Functions y crons

Activas:

- `newsletter-semanal` — boletín de los viernes, 8:00 a.m. hora Colombia (cron `newsletter-semanal-viernes`)
- `recordatorio-eventos-v2` — recordatorio diario, 9:00 a.m. hora Colombia (cron `recordatorio-diario`)
- `aprobar-evento` — aprobación de un clic desde el correo de alerta, firmada con HMAC
- `upload-imagen` — subida de imágenes desde el formulario público (`verify_jwt: true`)

Preexistentes, activos, **no tocar**: `actualizar-tags-semanal`, `archivar-eventos-pasados`.

**Deuda técnica conocida:** `newsletter-semanal` y `recordatorio-eventos-v2` tienen claves
escritas directamente en el código en lugar de leerlas de los secrets de Supabase. Si tocas
alguna de estas dos funciones, migra sus claves a variables de entorno de paso.

---

## SEO

El tráfico del sitio es 100% orgánico. El SEO no es un extra, es el canal de adquisición.
Cualquier cambio que afecte metadatos, rutas o renderizado debe considerarse un cambio de
alto riesgo.

Lo que ya está implementado y no se debe romper:

- Canonical dinámico **con `www`** en Home, `EventoPage`, `OrganizadorPage`, `FaqPage`,
  `OrganizadoresLanding`, `HoyPage` y `EventosPorRangoPage` (`EstaSemanaPage`/`FindePage`).
  Cada página con ruta propia fija su propio `<link rel="canonical">` — `App.jsx` tiene una
  lista (`STANDALONE_BASE_PATHS`) para no pisarlo con el canonical del home/zona en cada
  navegación. Si agregas una página nueva con su propia ruta, súmala a esa lista o su
  canonical va a quedar siempre apuntando al home.
- Schema `Event` completo por evento (performer, organizer, offers, endDate)
- Schema `Organization` / `WebSite` en `index.html`
- Schema `FAQPage` en `/preguntas-frecuentes`
- Open Graph vía Edge Function `api/og.js`
- Sitemap dinámico; `/hoy` con priority 0.9 y changefreq daily
- `robots.txt` da bienvenida explícita a bots de IA (GPTBot, ClaudeBot, PerplexityBot)
- `llms.txt` en la raíz
- Eventos inexistentes redirigen al home (corrección de Soft 404)
- Eventos archivados muestran "Ya finalizó" con enlace a próximos, no un 404 genérico

---

## Variables de entorno

Nombres, no valores. Configuradas en el sistema del usuario vía `setx` y en los secrets de
Supabase para las Edge Functions.

```
SUPABASE_SERVICE_ROLE_KEY
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_ENDPOINT
R2_PUBLIC_URL
APROBAR_EVENTO_SECRET
```

Confirma que `.env` está en `.gitignore` antes de cualquier commit que toque configuración.

---

## Estilo y tono del producto

- Los íconos son de **lucide-react**. No se usan emojis en la interfaz.
- Copy en español de Colombia, registro conversacional, sin relleno.
- El sitio tiene modo oscuro: todo componente nuevo debe funcionar en ambos modos.
- Accesibilidad mínima: foco visible por teclado, `aria-label` en controles de solo ícono,
  `prefers-reduced-motion` respetado.
- Responsive hasta móvil. La mayoría del tráfico llega de búsqueda en celular.
- Nunca insinúes alianzas que no existen. La sección de aliados se llama "Lugares para
  explorar" precisamente por eso.

---

## Comandos

```bash
npm run dev      # desarrollo local
npm run build    # verificar que compila antes de hacer push
```

Corre `npm run build` antes de cualquier push. Un fallo de build en `main` deja el sitio
sin actualizar y no siempre es evidente.

---

## Estado actual

> Esta sección envejece. Actualízala cuando cambie algo relevante.

- ~259 eventos aprobados
- 8.000+ visitas acumuladas; 900 clics orgánicos desde Google en 28 días
- 10 suscriptores activos del newsletter
- Supabase en plan Pro con Micro compute
- Contador de clics en "Comprar boleta" escribiendo en la tabla `clicks` (sin panel de
  lectura todavía)

Pendientes conocidos:

1. Filtro por calendario en el home (diseño aprobado, componente escrito, falta integrar)
2. Verificar si GA4 está instalado; definir cómo medir retención
3. Panel para leer la tabla `clicks`
4. Limpiar los ~33 eventos con `place` genérico
