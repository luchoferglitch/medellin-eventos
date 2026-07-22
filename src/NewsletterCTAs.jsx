export default function NewsletterCTAs({
  alreadySubscribed,
  showPopup,
  showStickyFooter,
  subEmail,
  setSubEmail,
  handleSubscribe,
  dismissPopup,
  dismissSticky,
}) {
  return (
    <>
      {/* ── 1. Banner permanente entre hero y filtros ── */}
      {!alreadySubscribed && (
        <div style={{
          background: "linear-gradient(90deg, #fef4dc 0%, #fef4dc 50%, #fbe3a3 100%)",
          border: "1px solid #f5d47a",
          borderRadius: 12,
          padding: "14px 18px",
          margin: "16px auto 4px",
          maxWidth: 1080,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          justifyContent: "space-between",
        }}>
          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#5a3f00" }}>
              No te pierdas nada. Suscríbete al newsletter.
            </div>
            <div style={{ fontSize: 13, color: "#7a5a1a", marginTop: 2 }}>
              Los mejores eventos filtrados por tu zona, cada viernes en tu correo. 100% gratis.
            </div>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubscribe(); }}
            style={{ display: "flex", gap: 8, flex: "1 1 260px", minWidth: 0 }}
          >
            <input
              type="email"
              placeholder="Tu correo"
              value={subEmail}
              onChange={(e) => setSubEmail(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: "10px 14px", border: "1px solid #d4a747", borderRadius: 8, fontSize: 14, background: "white" }}
            />
            <button
              type="submit"
              style={{ background: "#C8860A", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontSize: 14 }}
            >
              Suscribirme
            </button>
          </form>
        </div>
      )}

      {/* ── 2. Pop-up al 30% de scroll ── */}
      {showPopup && !alreadySubscribed && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}
          onClick={dismissPopup}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "white", borderRadius: 16, maxWidth: 440, width: "100%", padding: 28, position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
          >
            <button onClick={dismissPopup} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#888" }} aria-label="Cerrar">×</button>
            <div style={{ fontSize: 38, textAlign: "center", marginBottom: 12 }}>📩</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1a1a", textAlign: "center" }}>No te pierdas nada</h3>
            <p style={{ margin: "0 0 20px", color: "#555", textAlign: "center", fontSize: 14 }}>
              Todos los eventos filtrados por tu zona, cada viernes en tu correo. Gratis, sin spam.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); handleSubscribe(); }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="email"
                placeholder="Tu correo"
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                style={{ padding: "12px 14px", border: "1px solid #d8d3c5", borderRadius: 8, fontSize: 15 }}
                required
              />
              <button type="submit" style={{ background: "#C8860A", color: "white", border: "none", borderRadius: 8, padding: "12px 20px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Suscribirme gratis
              </button>
            </form>
            <div style={{ marginTop: 14, textAlign: "center" }}>
              <button onClick={dismissPopup} style={{ background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Sticky footer — primera visita ── */}
      {showStickyFooter && !alreadySubscribed && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#1a1a1a", color: "white",
          padding: "14px 20px", display: "flex", alignItems: "center",
          gap: 12, zIndex: 9998, boxShadow: "0 -4px 20px rgba(0,0,0,0.2)", flexWrap: "wrap",
        }}>
          <div style={{ flex: "1 1 240px", minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>💌 Recibe los planes de la semana</div>
            <div style={{ fontSize: 12, color: "#bbb" }}>Newsletter gratis cada viernes</div>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubscribe(); }}
            style={{ display: "flex", gap: 8, flex: "1 1 240px" }}
          >
            <input
              type="email"
              placeholder="Tu correo"
              value={subEmail}
              onChange={(e) => setSubEmail(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: "8px 12px", border: "none", borderRadius: 6, fontSize: 13 }}
              required
            />
            <button type="submit" style={{ background: "#C8860A", color: "white", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
              Suscribirme
            </button>
          </form>
          <button onClick={dismissSticky} style={{ background: "none", border: "none", color: "#888", fontSize: 22, cursor: "pointer", padding: "0 4px" }} aria-label="Cerrar">×</button>
        </div>
      )}
    </>
  );
}
