import { createContext, useContext, useState, useRef, useEffect } from "react";
import { translations } from "./i18n";

const LangCtx = createContext({ lang: "fr", setLang: () => {}, t: translations.fr });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("fr");
  return (
    <LangCtx.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangCtx.Provider>
  );
}

export function useLang() {
  return useContext(LangCtx);
}

const LANGS = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "zh", flag: "🇨🇳", label: "中文" },
];

export function LangToggle() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = LANGS.find(l => l.code === lang);

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          borderRadius: 8,
          border: "1.5px solid rgba(0,0,0,.18)",
          background: "white",
          color: "#1d1d1f",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "border-color .15s",
          whiteSpace: "nowrap",
        }}
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 2 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          right: 0,
          background: "white",
          borderRadius: 10,
          border: "1.5px solid rgba(0,0,0,.12)",
          boxShadow: "0 8px 24px rgba(0,0,0,.12)",
          overflow: "hidden",
          zIndex: 9999,
          minWidth: 140,
        }}>
          {LANGS.map(({ code, flag, label }) => (
            <button
              key={code}
              onClick={() => { setLang(code); setOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 14px",
                border: "none",
                background: lang === code ? "#f5f5f7" : "transparent",
                color: "#1d1d1f",
                fontSize: 13,
                fontWeight: lang === code ? 700 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                transition: "background .1s",
              }}
              onMouseEnter={e => { if (lang !== code) e.currentTarget.style.background = "#fafafa"; }}
              onMouseLeave={e => { if (lang !== code) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 18 }}>{flag}</span>
              <span>{label}</span>
              {lang === code && <span style={{ marginLeft: "auto", color: "#0071e3", fontSize: 12 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
