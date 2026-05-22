import { useEffect, useRef, useState } from "react";
import { useLang, LangToggle } from "./LanguageContext";

// ── LED Matrix Canvas ─────────────────────────────────────────────────────────
function LEDCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const spacing = 30;

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const cols = Math.ceil(W / spacing) + 2;
      const rows = Math.ceil(H / spacing) + 2;
      const cx = cols / 2;
      const cy = rows / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * spacing;
          const y = r * spacing;

          const dx = c - cx;
          const dy = r - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Primary wave from center
          const wave1 = Math.sin(dist * 0.38 - time * 1.1) * 0.5 + 0.5;
          // Secondary drifting wave
          const wave2 = Math.sin(dist * 0.22 + time * 0.6 + 1.4) * 0.5 + 0.5;
          // Slow ambient pulse
          const pulse = Math.sin(time * 0.4 + r * 0.15 + c * 0.07) * 0.5 + 0.5;

          const combined = wave1 * 0.55 + wave2 * 0.25 + pulse * 0.20;
          const alpha = combined * 0.18 + 0.03;
          const radius = combined * 1.8 + 0.7;

          // Core dot
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 113, 227, ${alpha})`;
          ctx.fill();

          // Occasional bright accent dots
          if (Math.sin(c * 3.7 + r * 5.3) > 0.92) {
            const accent = (Math.sin(time * 1.8 + c * 0.9 + r * 1.3) * 0.5 + 0.5);
            if (accent > 0.6) {
              ctx.beginPath();
              ctx.arc(x, y, radius * 1.4, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(100, 200, 255, ${accent * 0.25})`;
              ctx.fill();
            }
          }
        }
      }

      time += 0.016;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

// ── Card icons ────────────────────────────────────────────────────────────────
const IconMonitor = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconMulti = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="12" height="8" rx="1.5" />
    <rect x="10" y="13" width="12" height="8" rx="1.5" />
    <line x1="5" y1="14" x2="5" y2="20" strokeOpacity="0.4" />
    <line x1="3" y1="14" x2="7" y2="14" strokeOpacity="0.4" />
  </svg>
);

const IconMix = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="2" width="10" height="7" rx="1.5" />
    <rect x="13" y="2" width="10" height="11" rx="1.5" />
    <rect x="1" y="12" width="10" height="10" rx="1.5" />
    <rect x="13" y="16" width="10" height="6" rx="1.5" />
  </svg>
);

// ── Main LandingPage ──────────────────────────────────────────────────────────
export default function LandingPage({ onNavigate }) {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [clicked, setClicked] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(id);
  }, []);

  const handleClick = (id) => {
    if (clicked) return;
    setClicked(id);
    setTimeout(() => onNavigate(id), 320);
  };

  const cards = [
    {
      id: "calculator",
      icon: <IconMonitor />,
      title: t.landingStandard || "Standard Screen",
      sub: t.landingStandardSub || "Single LED display",
      desc: t.landingStandardDesc || "Configure dimensions, panel count, resolution and power consumption for a single LED screen.",
      gradient: "linear-gradient(135deg, #0071e3 0%, #40b0ff 100%)",
      glow: "0, 113, 227",
      border: "rgba(0,113,227,0.4)",
    },
    {
      id: "multiscreen",
      icon: <IconMulti />,
      title: t.landingMulti || "Multi Screen",
      sub: t.landingMultiSub || "Multiple displays",
      desc: t.landingMultiDesc || "Calculate and compare multiple LED screens side by side with independent configurations.",
      gradient: "linear-gradient(135deg, #0099cc 0%, #00d4ff 100%)",
      glow: "0, 180, 216",
      border: "rgba(0,180,216,0.4)",
    },
    {
      id: "mixer",
      icon: <IconMix />,
      title: t.landingMix || "Mix Size Screen",
      sub: t.landingMixSub || "Mixed panel layout",
      desc: t.landingMixDesc || "Combine different panel formats to achieve complex custom LED display architectures.",
      gradient: "linear-gradient(135deg, #6f42c1 0%, #a07aff 100%)",
      glow: "111, 66, 193",
      border: "rgba(111,66,193,0.4)",
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 120% 80% at 50% 0%, #0d1830 0%, #080c18 55%, #050810 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      fontFamily: "-apple-system, 'Helvetica Neue', Arial, sans-serif",
      padding: "60px 24px 80px",
    }}>
      <LEDCanvas />

      {/* Radial glow center */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600,
        height: 400,
        background: "radial-gradient(ellipse, rgba(0,113,227,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Top-right language toggle */}
      <div style={{
        position: "fixed",
        top: 20,
        right: 24,
        zIndex: 10,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.8s 0.6s",
      }}>
        <LangToggle />
      </div>

      {/* Header */}
      <div style={{
        textAlign: "center",
        marginBottom: 64,
        zIndex: 1,
        transform: visible ? "translateY(0)" : "translateY(-24px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.8s cubic-bezier(0.25,1,0.5,1), opacity 0.8s cubic-bezier(0.25,1,0.5,1)",
      }}>
        {/* AMF Logo */}
        <img
          src="/amf-logo.png"
          alt="AMF — AdvancedMultimedia.Fr"
          style={{
            height: 72,
            width: "auto",
            marginBottom: 28,
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
            filter: "invert(1) brightness(1.1)",
            mixBlendMode: "screen",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
        <h1 style={{
          fontSize: "clamp(36px, 5vw, 54px)",
          fontWeight: 700,
          color: "#ffffff",
          letterSpacing: "-0.025em",
          margin: "0 0 10px",
          lineHeight: 1.1,
        }}>
          LED Calculator
        </h1>
        <p style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.38)",
          letterSpacing: "0.04em",
          margin: 0,
        }}>
          {t.landingSubtitle || "Professional configurator — choose a mode to begin"}
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: "flex",
        gap: 20,
        flexWrap: "wrap",
        justifyContent: "center",
        zIndex: 1,
        width: "100%",
        maxWidth: 940,
      }}>
        {cards.map((card, i) => {
          const isHovered = hovered === card.id;
          const isClicked = clicked === card.id;

          return (
            <button
              key={card.id}
              onClick={() => handleClick(card.id)}
              onMouseEnter={() => setHovered(card.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                flex: "1 1 260px",
                maxWidth: 290,
                padding: "36px 28px 32px",
                background: isHovered
                  ? `rgba(${card.glow}, 0.08)`
                  : "rgba(255,255,255,0.03)",
                border: isHovered
                  ? `1px solid ${card.border}`
                  : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 22,
                cursor: "pointer",
                textAlign: "left",
                position: "relative",
                overflow: "hidden",
                outline: "none",
                fontFamily: "inherit",
                transform: !visible
                  ? `translateY(48px) scale(0.94)`
                  : isClicked
                  ? "scale(0.96)"
                  : isHovered
                  ? "translateY(-10px) scale(1.02)"
                  : "translateY(0) scale(1)",
                opacity: visible ? 1 : 0,
                transition: isClicked
                  ? "transform 0.15s cubic-bezier(0.25,1,0.5,1)"
                  : [
                    `transform 0.6s cubic-bezier(0.25,1,0.5,1) ${i * 0.12 + 0.15}s`,
                    `opacity 0.6s cubic-bezier(0.25,1,0.5,1) ${i * 0.12 + 0.15}s`,
                    "background 0.3s ease",
                    "border-color 0.3s ease",
                    "box-shadow 0.35s cubic-bezier(0.25,1,0.5,1)",
                  ].join(", "),
                boxShadow: isHovered
                  ? `0 28px 70px rgba(${card.glow}, 0.22), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.08)`
                  : "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              {/* Top gradient line */}
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: 2,
                background: card.gradient,
                opacity: isHovered ? 1 : 0.35,
                transition: "opacity 0.3s ease",
                borderRadius: "22px 22px 0 0",
              }} />

              {/* Subtle inner glow on hover */}
              {isHovered && (
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(${card.glow}, 0.1) 0%, transparent 70%)`,
                  pointerEvents: "none",
                }} />
              )}

              {/* Icon */}
              <div style={{
                width: 52, height: 52,
                borderRadius: 14,
                background: card.gradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 22,
                boxShadow: isHovered
                  ? `0 8px 28px rgba(${card.glow}, 0.55)`
                  : `0 4px 12px rgba(${card.glow}, 0.3)`,
                transition: "box-shadow 0.3s ease, transform 0.3s cubic-bezier(0.25,1,0.5,1)",
                transform: isHovered ? "scale(1.08)" : "scale(1)",
              }}>
                {card.icon}
              </div>

              {/* Title */}
              <div style={{
                fontSize: 19,
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.01em",
                marginBottom: 5,
                lineHeight: 1.2,
              }}>
                {card.title}
              </div>

              {/* Subtitle */}
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: `rgba(${card.glow}, 0.75)`,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}>
                {card.sub}
              </div>

              {/* Description */}
              <div style={{
                fontSize: 13.5,
                color: "rgba(255,255,255,0.42)",
                lineHeight: 1.65,
                marginBottom: 28,
              }}>
                {card.desc}
              </div>

              {/* CTA */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: isHovered ? `rgba(${card.glow}, 1)` : "rgba(255,255,255,0.25)",
                transition: "color 0.25s ease, transform 0.25s cubic-bezier(0.25,1,0.5,1)",
                transform: isHovered ? "translateX(3px)" : "none",
              }}>
                {t.landingLaunch || "Open"}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom watermark */}
      <div style={{
        position: "absolute",
        bottom: 28,
        fontSize: 10.5,
        color: "rgba(255,255,255,0.12)",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        zIndex: 1,
        opacity: visible ? 1 : 0,
        transition: "opacity 1s 1.2s",
        userSelect: "none",
      }}>
        AMF LED — Professional Display Solutions
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
