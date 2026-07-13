import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Mail } from "lucide-react";

const faqs = [
  {
    q: "¿Qué es Medellín Vibra?",
    a: "Medellín Vibra es una plataforma digital que centraliza la agenda cultural y de entretenimiento de Medellín y el Oriente Cercano (Rionegro, Marinilla, La Ceja, El Retiro, Guarne y otros municipios). En un solo lugar puedes encontrar conciertos, teatro, arte, gastronomía, bienestar, deportes y actividades académicas, con fecha, lugar, precio y enlace de compra de boletas."
  },
  {
    q: "¿Es gratis usar Medellín Vibra?",
    a: "Sí. Explorar la agenda, guardar eventos favoritos, recibir el boletín semanal y activar recordatorios es completamente gratis para cualquier persona."
  },
  {
    q: "¿Cómo publico mi evento en Medellín Vibra?",
    a: "Cualquier organizador puede publicar su evento gratis desde la plataforma. El evento queda en revisión (estado pendiente) y se activa una vez el equipo de Medellín Vibra lo verifica, para garantizar que la información sea real y esté correctamente descrita."
  },
  {
    q: "¿Qué tipos de eventos hay en Medellín Vibra?",
    a: "Cubrimos diez categorías: Música, Arte, Comedia, Tech, Baile, Deportes, Teatro, Gastronomía, Bienestar y Académicos. Desde conciertos masivos hasta talleres pequeños de barrio o corregimiento."
  },
  {
    q: "¿Medellín Vibra solo cubre eventos en Medellín?",
    a: "No. Además de Medellín, cubrimos el Área Metropolitana y el Oriente Cercano (Rionegro, Marinilla, La Ceja, El Retiro, Guarne, San Antonio de Pereira y alrededores). Puedes filtrar los eventos por zona directamente en el sitio."
  },
  {
    q: "¿Cómo funciona la función \"Eventos cerca de mí\"?",
    a: "Al activarla, el sitio te pide permiso de ubicación en tu navegador y muestra los eventos ordenados por cercanía real (usando tus coordenadas), con la opción de filtrar por un radio de 10, 20 o 50 kilómetros. Tu ubicación nunca se guarda ni se comparte."
  },
  {
    q: "¿Cómo me entero de los eventos nuevos cada semana?",
    a: "Puedes suscribirte gratis al boletín semanal de Medellín Vibra, que se envía todos los viernes con los eventos más destacados de la semana. También puedes activar recordatorios individuales por evento desde la plataforma."
  },
  {
    q: "¿Cómo puede mi marca o negocio ser aliado de Medellín Vibra?",
    a: "Medellín Vibra ofrece distintos planes de alianza para marcas, hoteles y negocios que quieran tener visibilidad ante la audiencia de la plataforma. Puedes escribir a hola@medellinvibra.co para conocer los planes disponibles."
  },
  {
    q: "¿Puedo guardar eventos como favoritos?",
    a: "Sí. Con una cuenta gratuita puedes guardar cualquier evento como favorito para encontrarlo fácilmente después, y activar un recordatorio para el día anterior al evento."
  },
  {
    q: "¿Cómo contacto al equipo de Medellín Vibra?",
    a: "Puedes escribirnos directamente a hola@medellinvibra.co o a través de nuestras redes sociales (Instagram y Facebook @medellinvibra.co)."
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(f => ({
    "@type": "Question",
    "name": f.q,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": f.a
    }
  }))
};

export default function FaqPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Preguntas Frecuentes — Medellín Vibra";
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) { canonicalEl = document.createElement("link"); canonicalEl.setAttribute("rel", "canonical"); document.head.appendChild(canonicalEl); }
    canonicalEl.setAttribute("href", "https://www.medellinvibra.co/preguntas-frecuentes");
  }, []);

  return (
    <div style={{minHeight:'100vh', background:'#f5f3ef', fontFamily:'var(--font-body, sans-serif)'}}>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      <div style={{background:'#1a1a1a', padding:'20px 24px'}}>
        <div style={{maxWidth:720, margin:'0 auto', display:'flex', alignItems:'center', gap:12}}>
          <button onClick={() => navigate('/')} style={{background:'none', border:'none', color:'#C8860A', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:14, fontWeight:600, padding:0}}>
            <ChevronLeft size={18} /> Volver
          </button>
        </div>
        <div style={{maxWidth:720, margin:'20px auto 0'}}>
          <div style={{fontFamily:'var(--font-display, sans-serif)', fontSize:34, color:'white', letterSpacing:0.5}}>
            Preguntas <span style={{color:'#C8860A'}}>Frecuentes</span>
          </div>
          <p style={{color:'rgba(255,255,255,0.6)', fontSize:15, marginTop:8, maxWidth:560}}>
            Todo lo que necesitas saber sobre cómo usar Medellín Vibra, publicar tus eventos y ser parte de la agenda cultural de la ciudad.
          </p>
        </div>
      </div>

      <div style={{maxWidth:720, margin:'0 auto', padding:'32px 24px 64px'}}>
        {faqs.map((f, i) => (
          <section key={i} style={{background:'white', borderRadius:14, border:'1px solid #e5e1d8', padding:'24px 28px', marginBottom:16}}>
            <h2 style={{fontSize:18, fontWeight:700, color:'#1a1a1a', margin:'0 0 10px'}}>{f.q}</h2>
            <p style={{fontSize:15, lineHeight:1.6, color:'#444', margin:0}}>{f.a}</p>
          </section>
        ))}

        <div style={{textAlign:'center', marginTop:40, padding:'24px', background:'white', borderRadius:14, border:'1px solid #e5e1d8'}}>
          <p style={{color:'#555', fontSize:15, marginBottom:16}}>¿Tienes otra pregunta que no está aquí?</p>
          <a href="mailto:hola@medellinvibra.co" style={{display:'inline-flex', alignItems:'center', gap:8, background:'#C8860A', color:'white', padding:'12px 28px', borderRadius:100, textDecoration:'none', fontWeight:700, fontSize:14}}>
            <Mail size={16} /> Escríbenos
          </a>
        </div>
      </div>
    </div>
  );
}