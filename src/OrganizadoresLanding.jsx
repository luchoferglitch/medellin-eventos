import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function OrganizadoresLanding() {
  const navigate = useNavigate();
  const [formNombre, setFormNombre] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formEmpresa, setFormEmpresa] = useState("");
  const [formMensaje, setFormMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleContacto = async () => {
    if (!formEmail || !formNombre) return;
    setEnviando(true);
    // Guardar el contacto como suscriptor con nota
    await supabase.from("subscribers").insert({
      email: formEmail.trim().toLowerCase(),
      nombre: `[ORGANIZADOR] ${formNombre.trim()} — ${formEmpresa.trim()} — ${formMensaje.trim()}`.slice(0, 500),
    }).then(() => {});
    setEnviado(true);
    setEnviando(false);
  };

  return (
    <div style={{minHeight:'100vh', background:'#f5f3ef', fontFamily:"'DM Sans', sans-serif"}}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300&display=swap" rel="stylesheet" />

      {/* NAV */}
      <div style={{background:'rgba(26,26,26,0.97)', backdropFilter:'blur(16px)', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100}}>
        <button onClick={() => navigate("/")} style={{background:'none', border:'none', cursor:'pointer', color:'#C8860A', fontWeight:700, fontSize:14, fontFamily:'inherit'}}>← Volver</button>
        <span style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:22, color:'#C8860A', letterSpacing:1}}>MEDELLÍN VIBRA</span>
        <a href="#contacto" style={{background:'#C8860A', color:'white', padding:'8px 16px', borderRadius:100, fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:'inherit'}}>Ser aliado →</a>
      </div>

      {/* HERO */}
      <div style={{background:'linear-gradient(135deg, #1a1a1a 0%, #2a1500 50%, #1a1a1a 100%)', padding:'80px 24px', textAlign:'center', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', inset:0, background:'radial-gradient(circle at 50% 30%, rgba(200,134,10,0.15), transparent 70%)'}} />
        <div style={{position:'relative', maxWidth:700, margin:'0 auto'}}>
          <div style={{fontSize:16, color:'#C8860A', fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:16}}>Para organizadores y empresas</div>
          <h1 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:'clamp(40px, 8vw, 64px)', color:'white', lineHeight:1, margin:'0 0 20px', letterSpacing:1}}>
            Lleva tus eventos a<br/><span style={{color:'#C8860A'}}>miles de personas</span>
          </h1>
          <p style={{color:'rgba(255,255,255,0.7)', fontSize:18, lineHeight:1.6, maxWidth:520, margin:'0 auto 32px'}}>
            Medellín Vibra es la agenda cultural digital más completa de Medellín, el Área Metropolitana y el Oriente Cercano. Publica tus eventos gratis o conviértete en aliado para máxima visibilidad.
          </p>
          <div style={{display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap'}}>
            <a href="#planes" style={{background:'#C8860A', color:'white', padding:'14px 32px', borderRadius:100, fontSize:16, fontWeight:700, textDecoration:'none', fontFamily:'inherit'}}>Ver planes →</a>
            <button onClick={() => navigate("/")} style={{background:'transparent', color:'white', padding:'14px 32px', borderRadius:100, fontSize:16, fontWeight:600, border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer', fontFamily:'inherit'}}>Publicar gratis</button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{background:'white', borderBottom:'1px solid #e5e1d8', padding:'40px 24px'}}>
        <div style={{maxWidth:800, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:20, textAlign:'center'}}>
          {[
            ["100+", "Eventos activos", "🎪"],
            ["4,000+", "Visitas mensuales", "👀"],
            ["500+", "Suscriptores", "📬"],
            ["50+", "Organizadores", "👤"],
          ].map(([num, label, emoji]) => (
            <div key={label}>
              <div style={{fontSize:14, marginBottom:6}}>{emoji}</div>
              <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:36, color:'#C8860A'}}>{num}</div>
              <div style={{fontSize:13, color:'#888', fontWeight:600}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* POR QUÉ MEDELLÍN VIBRA */}
      <div style={{padding:'60px 24px', maxWidth:900, margin:'0 auto'}}>
        <div style={{textAlign:'center', marginBottom:40}}>
          <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:38, color:'#1a1a1a', marginBottom:8}}>
            ¿Por qué publicar en <span style={{color:'#C8860A'}}>Medellín Vibra</span>?
          </div>
          <p style={{color:'#888', fontSize:16, maxWidth:550, margin:'0 auto'}}>
            Tu evento merece ser visto. Nosotros te conectamos con la audiencia correcta.
          </p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:20}}>
          {[
            ["🔍", "SEO optimizado", "Cada evento tiene su propia página indexada en Google. Cuando alguien busca tu evento, nos encuentra."],
            ["📬", "Newsletter semanal", "Cada viernes enviamos los mejores eventos de la semana a nuestra base de suscriptores activos."],
            ["📱", "App instalable (PWA)", "Los usuarios instalan Medellín Vibra como app en su celular y regresan cada semana a buscar planes."],
            ["🗺️", "Mapa interactivo", "Tu evento aparece geolocalizado en un mapa de Medellín con pins por categoría."],
            ["🌎", "Multiidioma", "Tu evento se muestra en español, inglés, portugués y francés — ideal para atraer turistas."],
            ["📊", "Estadísticas", "Como aliado tendrás acceso a métricas de visualización de tus eventos."],
            ["📤", "Compartir fácil", "Cada evento genera una vista previa con imagen al compartir por WhatsApp, Facebook o Twitter."],
            ["📅", "Agregar al calendario", "Los usuarios agregan tu evento directo a Google Calendar con un click."],
            ["⭐", "Reseñas", "Los asistentes pueden dejar reseñas con estrellas, generando confianza y comunidad alrededor de tu marca."],
          ].map(([emoji, title, desc]) => (
            <div key={title} style={{background:'white', border:'1px solid #e5e1d8', borderRadius:16, padding:'24px 20px'}}>
              <div style={{fontSize:28, marginBottom:12}}>{emoji}</div>
              <div style={{fontWeight:700, fontSize:15, marginBottom:6, color:'#1a1a1a'}}>{title}</div>
              <div style={{fontSize:13, color:'#666', lineHeight:1.6}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CÓMO FUNCIONA */}
      <div style={{background:'white', borderTop:'1px solid #e5e1d8', borderBottom:'1px solid #e5e1d8', padding:'60px 24px'}}>
        <div style={{maxWidth:800, margin:'0 auto', textAlign:'center'}}>
          <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:38, color:'#1a1a1a', marginBottom:8}}>
            Así de <span style={{color:'#C8860A'}}>fácil</span> es
          </div>
          <p style={{color:'#888', fontSize:16, marginBottom:40}}>Publicar un evento toma menos de 3 minutos</p>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:24}}>
            {[
              ["1", "Crea tu cuenta", "Regístrate gratis en medellinvibra.co con tu correo electrónico."],
              ["2", "Publica tu evento", "Completa el formulario con la info del evento: fecha, lugar, precio, imagen y descripción."],
              ["3", "Nosotros lo revisamos", "Nuestro equipo editorial aprueba tu evento y queda visible para toda la comunidad."],
            ].map(([num, title, desc]) => (
              <div key={num} style={{textAlign:'center'}}>
                <div style={{width:56, height:56, borderRadius:'50%', background:'#C8860A', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue', sans-serif", fontSize:28, margin:'0 auto 16px'}}>{num}</div>
                <div style={{fontWeight:700, fontSize:15, marginBottom:6, color:'#1a1a1a'}}>{title}</div>
                <div style={{fontSize:13, color:'#666', lineHeight:1.6}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PLANES */}
      <div id="planes" style={{padding:'60px 24px', background:'#f5f3ef'}}>
        <div style={{maxWidth:900, margin:'0 auto'}}>
          <div style={{textAlign:'center', marginBottom:40}}>
            <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:38, color:'#1a1a1a', marginBottom:8}}>
              Planes para <span style={{color:'#C8860A'}}>Organizadores</span>
            </div>
            <p style={{color:'#888', fontSize:16}}>Elige el nivel de visibilidad que necesitas</p>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:20}}>

            {/* Plan Gratis */}
            <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:20, padding:'32px 24px', display:'flex', flexDirection:'column'}}>
              <div style={{fontSize:13, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:1, marginBottom:8}}>Publicación gratuita</div>
              <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:44, color:'#1a1a1a', marginBottom:4}}>GRATIS</div>
              <div style={{fontSize:13, color:'#888', marginBottom:24}}>Para cualquier organizador</div>
              <div style={{flex:1}}>
                {["Publicación de eventos ilimitada", "Página individual del evento", "Aparece en búsqueda y mapa", "Compartible por WhatsApp y redes", "Agregar al calendario"].map(f => (
                  <div key={f} style={{display:'flex', gap:8, alignItems:'flex-start', marginBottom:10, fontSize:14, color:'#444'}}>
                    <span style={{color:'#059669', fontWeight:700, flexShrink:0}}>✓</span> {f}
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/")} style={{marginTop:20, width:'100%', padding:'14px', background:'white', color:'#1a1a1a', border:'1px solid #e5e1d8', borderRadius:12, fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit'}}>
                Publicar ahora →
              </button>
            </div>

            {/* Plan Aliado */}
            <div style={{background:'linear-gradient(135deg, #1a1a1a, #2a1500)', border:'2px solid #C8860A', borderRadius:20, padding:'32px 24px', display:'flex', flexDirection:'column', position:'relative'}}>
              <div style={{position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'#C8860A', color:'white', padding:'4px 16px', borderRadius:100, fontSize:12, fontWeight:700}}>⭐ RECOMENDADO</div>
              <div style={{fontSize:13, fontWeight:700, color:'#C8860A', textTransform:'uppercase', letterSpacing:1, marginBottom:8}}>Aliado Medellín Vibra</div>
              <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:44, color:'white', marginBottom:4}}>PREMIUM</div>
              <div style={{fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:24}}>Para empresas y marcas</div>
              <div style={{flex:1}}>
                {[
                  "Todo lo del plan gratuito",
                  "Logo y enlace en sección Aliados",
                  "Mención en newsletter semanal",
                  "Publicación en redes sociales",
                  "Eventos con tag ⭐ Destacado",
                  "Página de organizador verificada",
                  "Soporte prioritario",
                  "Estadísticas de tus eventos",
                ].map(f => (
                  <div key={f} style={{display:'flex', gap:8, alignItems:'flex-start', marginBottom:10, fontSize:14, color:'rgba(255,255,255,0.8)'}}>
                    <span style={{color:'#C8860A', fontWeight:700, flexShrink:0}}>✓</span> {f}
                  </div>
                ))}
              </div>
              <a href="#contacto" style={{marginTop:20, width:'100%', padding:'14px', background:'#C8860A', color:'white', border:'none', borderRadius:12, fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit', textDecoration:'none', textAlign:'center', display:'block', boxSizing:'border-box'}}>
                Quiero ser aliado →
              </a>
            </div>

            {/* Plan Estratégico */}
            <div style={{background:'white', border:'1px solid #e5e1d8', borderRadius:20, padding:'32px 24px', display:'flex', flexDirection:'column'}}>
              <div style={{fontSize:13, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:1, marginBottom:8}}>Aliado estratégico</div>
              <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:44, color:'#1a1a1a', marginBottom:4}}>A MEDIDA</div>
              <div style={{fontSize:13, color:'#888', marginBottom:24}}>Para festivales y grandes marcas</div>
              <div style={{flex:1}}>
                {[
                  "Todo lo del plan Aliado Premium",
                  "Sección exclusiva en el home",
                  "Campaña de contenido dedicada",
                  "Eventos patrocinados con banner",
                  "Integración con tu ticketera",
                  "Reportes mensuales de impacto",
                  "Co-branding en materiales",
                  "Reunión estratégica mensual",
                ].map(f => (
                  <div key={f} style={{display:'flex', gap:8, alignItems:'flex-start', marginBottom:10, fontSize:14, color:'#444'}}>
                    <span style={{color:'#7C3AED', fontWeight:700, flexShrink:0}}>✓</span> {f}
                  </div>
                ))}
              </div>
              <a href="#contacto" style={{marginTop:20, width:'100%', padding:'14px', background:'white', color:'#1a1a1a', border:'1px solid #e5e1d8', borderRadius:12, fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit', textDecoration:'none', textAlign:'center', display:'block', boxSizing:'border-box'}}>
                Hablemos →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* QUIÉNES CONFÍAN EN NOSOTROS */}
      <div style={{background:'white', borderTop:'1px solid #e5e1d8', padding:'60px 24px'}}>
        <div style={{maxWidth:800, margin:'0 auto', textAlign:'center'}}>
          <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:32, color:'#1a1a1a', marginBottom:32}}>
            Organizadores que ya <span style={{color:'#C8860A'}}>vibran</span> con nosotros
          </div>
          <div style={{display:'flex', flexWrap:'wrap', gap:16, justifyContent:'center'}}>
            {[
              "Teatro Metropolitano", "Teatro Pablo Tobón Uribe", "MAMM", 
              "Jardín Botánico", "Plaza Mayor", "Alcaldía de Medellín",
              "Cámara de Comercio", "Alianza Francesa", "Banco de la República",
              "Fever", "Tu Boleta", "Ticketmaster",
              "Bodytech", "Python Colombia", "Universidad CES",
            ].map(org => (
              <div key={org} style={{background:'#f5f3ef', border:'1px solid #e5e1d8', borderRadius:100, padding:'8px 18px', fontSize:13, fontWeight:600, color:'#555'}}>
                {org}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FORMULARIO DE CONTACTO */}
      <div id="contacto" style={{background:'linear-gradient(135deg, #1a1a1a, #2a1500)', padding:'60px 24px'}}>
        <div style={{maxWidth:500, margin:'0 auto', textAlign:'center'}}>
          <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:38, color:'white', marginBottom:8}}>
            ¿Listo para <span style={{color:'#C8860A'}}>vibrar</span>?
          </div>
          <p style={{color:'rgba(255,255,255,0.6)', fontSize:15, marginBottom:32}}>
            Déjanos tus datos y te contactamos para armar el plan perfecto para tu marca o evento.
          </p>

          {enviado ? (
            <div style={{background:'rgba(255,255,255,0.08)', border:'1px solid rgba(200,134,10,0.3)', borderRadius:16, padding:'32px 24px'}}>
              <div style={{fontSize:48, marginBottom:12}}>🎉</div>
              <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:28, color:'#C8860A', marginBottom:8}}>¡MENSAJE ENVIADO!</div>
              <div style={{color:'rgba(255,255,255,0.7)', fontSize:14}}>Te contactaremos pronto para conversar sobre tu alianza con Medellín Vibra.</div>
            </div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <input type="text" placeholder="Tu nombre *" value={formNombre} onChange={e => setFormNombre(e.target.value)}
                style={{padding:'14px 18px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.06)', color:'white', fontSize:15, fontFamily:'inherit', outline:'none'}} />
              <input type="email" placeholder="Tu correo electrónico *" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                style={{padding:'14px 18px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.06)', color:'white', fontSize:15, fontFamily:'inherit', outline:'none'}} />
              <input type="text" placeholder="Empresa / Organización (opcional)" value={formEmpresa} onChange={e => setFormEmpresa(e.target.value)}
                style={{padding:'14px 18px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.06)', color:'white', fontSize:15, fontFamily:'inherit', outline:'none'}} />
              <textarea placeholder="Cuéntanos sobre tu evento o marca (opcional)" value={formMensaje} onChange={e => setFormMensaje(e.target.value)}
                style={{padding:'14px 18px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.06)', color:'white', fontSize:15, fontFamily:'inherit', outline:'none', minHeight:100, resize:'vertical'}} />
              <button onClick={handleContacto} disabled={enviando || !formNombre || !formEmail}
                style={{padding:'16px', borderRadius:12, background: formNombre && formEmail ? '#C8860A' : '#555', color:'white', border:'none', fontWeight:700, fontSize:16, cursor: formNombre && formEmail ? 'pointer' : 'default', fontFamily:'inherit', transition:'background 0.2s'}}>
                {enviando ? "Enviando..." : "Enviar mensaje →"}
              </button>
              <div style={{color:'rgba(255,255,255,0.3)', fontSize:12, marginTop:4}}>
                También puedes escribirnos a <a href="mailto:hola@medellinvibra.co" style={{color:'#C8860A', textDecoration:'none'}}>hola@medellinvibra.co</a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{background:'#0a0a0a', padding:'24px', textAlign:'center'}}>
        <a href="/" style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:22, color:'#C8860A', textDecoration:'none', letterSpacing:1}}>MEDELLÍN VIBRA</a>
        <div style={{color:'#555', fontSize:12, marginTop:8}}>La agenda cultural de Medellín · © {new Date().getFullYear()} medellinvibra.co</div>
        <div style={{display:'flex', gap:16, justifyContent:'center', marginTop:12}}>
          <a href="https://www.instagram.com/medellinvibra.co/" target="_blank" rel="noopener noreferrer" style={{color:'#888', fontSize:13, textDecoration:'none'}}>📸 Instagram</a>
          <a href="https://www.facebook.com/profile.php?id=61591129902444" target="_blank" rel="noopener noreferrer" style={{color:'#888', fontSize:13, textDecoration:'none'}}>📘 Facebook</a>
          <a href="mailto:hola@medellinvibra.co" style={{color:'#888', fontSize:13, textDecoration:'none'}}>✉️ Correo</a>
        </div>
      </div>
    </div>
  );
}
