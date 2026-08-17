import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Mail } from "lucide-react";
import { translations } from "./translations";
import { getLangFromPath, getLangPrefix } from "./lang";
import HreflangTags from "./components/HreflangTags";
import { LanguageSelectorChips } from "./components/LanguageSelector";

function buildFaqs(t) {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
    q: t[`faqQ${n}`],
    a: t[`faqA${n}`],
  }));
}

function buildInstallFaq(t) {
  const iosSteps = [t.faqInstallIOSStep1, t.faqInstallIOSStep2, t.faqInstallIOSStep3, t.faqInstallIOSStep4];
  const androidSteps = [t.faqInstallAndroidStep1, t.faqInstallAndroidStep2, t.faqInstallAndroidStep3];
  return {
    id: "instalar-app",
    q: t.faqInstallQuestion,
    a: [t.faqInstallIntro, t.faqInstallIOSTitle, ...iosSteps, t.faqInstallIOSNote, t.faqInstallAndroidTitle, ...androidSteps].join(" "),
    iosSteps,
    iosNote: t.faqInstallIOSNote,
    androidSteps,
  };
}

export default function FaqPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const lang = getLangFromPath(location.pathname);
  const langPrefix = getLangPrefix(lang);
  const t = translations[lang];
  const installFaq = buildInstallFaq(t);
  const allFaqs = [...buildFaqs(t), installFaq];
  const changeLang = (newLang) => navigate(`${getLangPrefix(newLang)}/preguntas-frecuentes`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allFaqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };

  useEffect(() => {
    document.title = t.faqDocTitle;
    document.documentElement.lang = lang;
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) { canonicalEl = document.createElement("link"); canonicalEl.setAttribute("rel", "canonical"); document.head.appendChild(canonicalEl); }
    canonicalEl.setAttribute("href", `https://www.medellinvibra.co${langPrefix}/preguntas-frecuentes`);
  }, [lang]);

  useEffect(() => {
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div style={{minHeight:'100vh', background:'#f5f3ef', fontFamily:'var(--font-body, sans-serif)'}}>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <HreflangTags basePath="/preguntas-frecuentes" />

      <div style={{background:'#1a1a1a', padding:'20px 24px'}}>
        <div style={{maxWidth:720, margin:'0 auto', display:'flex', alignItems:'center', gap:12}}>
          <button onClick={() => navigate(`${langPrefix}/`)} style={{background:'none', border:'none', color:'#C8860A', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:14, fontWeight:600, padding:0}}>
            <ChevronLeft size={18} /> {t.backLabel}
          </button>
          <div style={{marginLeft:'auto'}}>
            <LanguageSelectorChips lang={lang} onChange={changeLang} theme="dark" />
          </div>
        </div>
        <div style={{maxWidth:720, margin:'20px auto 0'}}>
          <div style={{fontFamily:'var(--font-display, sans-serif)', fontSize:34, color:'white', letterSpacing:0.5}}>
            {t.faqPageTitleMain} <span style={{color:'#C8860A'}}>{t.faqPageTitleAccent}</span>
          </div>
          <p style={{color:'rgba(255,255,255,0.6)', fontSize:15, marginTop:8, maxWidth:560}}>
            {t.faqPageSubtitle}
          </p>
        </div>
      </div>

      <div style={{maxWidth:720, margin:'0 auto', padding:'32px 24px 64px'}}>
        {allFaqs.map((f, i) => (
          <section key={i} id={f.id} style={{background:'white', borderRadius:14, border:'1px solid #e5e1d8', padding:'24px 28px', marginBottom:16, scrollMarginTop:24}}>
            <h2 style={{fontSize:18, fontWeight:700, color:'#1a1a1a', margin:'0 0 10px'}}>{f.q}</h2>
            {f.iosSteps ? (
              <>
                <p style={{fontSize:15, lineHeight:1.6, color:'#444', margin:'0 0 16px'}}>{t.faqInstallIntro}</p>
                <h3 style={{fontSize:15, fontWeight:700, color:'#1a1a1a', margin:'0 0 8px'}}>{t.faqInstallIOSTitle}</h3>
                <ol style={{fontSize:15, lineHeight:1.6, color:'#444', margin:'0 0 12px', paddingLeft:20}}>
                  {f.iosSteps.map((step, j) => <li key={j}>{step}</li>)}
                </ol>
                <p style={{fontSize:13, lineHeight:1.5, color:'#7a5a10', background:'#fdf3e0', border:'1px solid #f0dba8', borderRadius:8, padding:'10px 12px', margin:'0 0 16px'}}>{f.iosNote}</p>
                <h3 style={{fontSize:15, fontWeight:700, color:'#1a1a1a', margin:'0 0 8px'}}>{t.faqInstallAndroidTitle}</h3>
                <ol style={{fontSize:15, lineHeight:1.6, color:'#444', margin:0, paddingLeft:20}}>
                  {f.androidSteps.map((step, j) => <li key={j}>{step}</li>)}
                </ol>
              </>
            ) : (
              <p style={{fontSize:15, lineHeight:1.6, color:'#444', margin:0}}>{f.a}</p>
            )}
          </section>
        ))}

        <div style={{textAlign:'center', marginTop:40, padding:'24px', background:'white', borderRadius:14, border:'1px solid #e5e1d8'}}>
          <p style={{color:'#555', fontSize:15, marginBottom:16}}>{t.faqOtherQuestion}</p>
          <a href="mailto:hola@medellinvibra.co" style={{display:'inline-flex', alignItems:'center', gap:8, background:'#C8860A', color:'white', padding:'12px 28px', borderRadius:100, textDecoration:'none', fontWeight:700, fontSize:14}}>
            <Mail size={16} /> {t.faqWriteUs}
          </a>
        </div>
      </div>
    </div>
  );
}