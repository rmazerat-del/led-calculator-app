"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabaseClient";

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f5f5f3;
    --surface: #ffffff;
    --border: rgba(0,0,0,0.08);
    --border-strong: #e0e0dc;
    --text-primary: #1a1a1a;
    --text-secondary: #6e6e73;
    --text-tertiary: #aaa;
    --accent: #0071e3;
    --green: #34c759;
    --orange: #ff9f0a;
    --red: #ff3b30;
    --purple: #af52de;
    --font: -apple-system, 'Helvetica Neue', sans-serif;
  }
  body { font-family: var(--font); background: var(--bg); }
  .led-app { min-height: 100vh; background: var(--bg); font-family: var(--font); color: var(--text-primary); -webkit-font-smoothing: antialiased; }

  /* ── TOPBAR ── */
  .topbar { background: #111113; border-bottom: 1px solid #222; padding: 0 24px; height: 58px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
  .topbar-brand { display: flex; align-items: center; gap: 12px; }
  .topbar-logo { width: 30px; height: 30px; border: 1.5px solid #444; display: grid; grid-template-columns: 1fr 1fr; gap: 2px; padding: 5px; flex-shrink: 0; }
  .topbar-logo-cell { background: #fff; border-radius: 1px; }
  .topbar-logo-cell.dim { background: #444; }
  .topbar-title { color: #ffffff; font-size: 14px; font-weight: 500; letter-spacing: 0.04em; }
  .topbar-subtitle { color: #555; font-size: 9px; font-weight: 400; letter-spacing: 0.18em; text-transform: uppercase; margin-top: 2px; }
  .topbar-kpis { display: flex; align-items: center; gap: 20px; }
  .topbar-kpi { text-align: center; }
  .topbar-kpi-label { color: #555; font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; }
  .topbar-kpi-value { color: #e0e0e0; font-size: 11px; font-weight: 500; margin-top: 2px; letter-spacing: 0.02em; }
  .topbar-sep { width: 1px; height: 28px; background: #2a2a2a; }
  .topbar-right { display: flex; align-items: center; gap: 8px; }
  .topbar-badge { padding: 4px 12px; border: 1px solid #333; font-size: 9px; color: #777; letter-spacing: 0.12em; text-transform: uppercase; }
  .admin-btn { padding: 7px 14px; border: 1px solid #444; background: transparent; color: #ccc; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; font-family: var(--font); }
  .pdf-topbar-btn { padding: 7px 16px; border: 1px solid #fff; background: #fff; color: #111; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; font-family: var(--font); font-weight: 600; }

  /* ── LAYOUT ── */
  .main-layout { display: grid; grid-template-columns: 290px 1fr; height: calc(100vh - 58px); overflow: hidden; }
  @media (max-width: 768px) {
    .main-layout { grid-template-columns: 1fr; height: auto; overflow: auto; }
    .left-panel { border-right: none; border-bottom: 1px solid var(--border); }
    .right-panel { height: auto; }
    .viz-area { flex: 0 0 220px; }
    .topbar-kpis { display: none; }
    .topbar { padding: 0 14px; }
    .stat-grid-3 { grid-template-columns: 1fr 1fr; }
  }

  /* ── LEFT PANEL ── */
  .left-panel { background: #fafaf8; border-right: 1px solid var(--border-strong); overflow-y: auto; padding: 20px 16px; scrollbar-width: thin; }
  .section-header { font-size: 9px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #efefeb; }
  .product-select-wrap { position: relative; margin-bottom: 16px; }
  .product-select { width: 100%; appearance: none; background: #fff; border: 1px solid var(--border-strong); padding: 9px 30px 9px 10px; font-family: var(--font); font-size: 12px; color: var(--text-primary); cursor: pointer; outline: none; }
  .product-select:focus { border-color: #555; }
  .product-select-chevron { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
  .mode-grid { display: flex; border: 1px solid var(--border-strong); margin-bottom: 18px; }
  .mode-btn { flex: 1; padding: 8px 4px; border: none; cursor: pointer; text-align: center; background: #fafaf8; font-family: var(--font); border-right: 1px solid var(--border-strong); }
  .mode-btn:last-child { border-right: none; }
  .mode-btn.active { background: #111113; }
  .mode-icon { font-size: 13px; margin-bottom: 2px; }
  .mode-label { font-size: 9px; font-weight: 600; color: #aaa; letter-spacing: 0.12em; text-transform: uppercase; }
  .mode-btn.active .mode-label { color: #fff; }
  .input-group { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
  .input-label { font-size: 9px; color: #aaa; display: block; margin-bottom: 5px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; }
  .spinbox { display: flex; align-items: center; border: 1px solid var(--border-strong); background: white; height: 36px; }
  .spinbox-btn { width: 32px; background: transparent; border: none; color: #888; font-size: 16px; cursor: pointer; height: 100%; }
  .spinbox-btn:hover { background: #f5f5f3; }
  .spinbox-input { flex: 1; text-align: center; background: transparent; border: none; color: var(--text-primary); font-size: 13px; font-weight: 500; outline: none; font-family: var(--font); }
  .spinbox-unit { color: #bbb; font-size: 10px; padding-right: 8px; letter-spacing: 0.08em; }
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 16px; }
  .summary-card { background: #fff; border: 1px solid #e8e8e4; border-left: 2px solid #1a1a1a; padding: 9px 10px; }
  .summary-label { font-size: 8px; color: #aaa; text-transform: uppercase; letter-spacing: 0.18em; font-weight: 600; margin-bottom: 3px; }
  .summary-value { font-size: 12px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.02em; }
  .summary-sub { font-size: 9px; color: #bbb; margin-top: 1px; }
  .pdf-btn { display: flex; align-items: center; justify-content: center; gap: 7px; width: 100%; padding: 11px 14px; border: none; cursor: pointer; font-family: var(--font); font-size: 10px; font-weight: 600; background: #111113; color: #fff; letter-spacing: 0.18em; text-transform: uppercase; }
  .pdf-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── RIGHT PANEL ── */
  .right-panel { display: flex; flex-direction: column; overflow: hidden; }

  /* ── VIZ AREA — fond clair ── */
  .viz-area { flex: 0 0 285px; background: #eeecea; border-bottom: 1px solid var(--border-strong); position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .viz-grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px); background-size: 24px 24px; }
  .screen-container { position: relative; z-index: 2; }
  .dim-label { text-align: center; margin-bottom: 6px; display: flex; justify-content: center; align-items: center; gap: 8px; }
  .dim-line { height: 1px; background: rgba(0,0,0,0.2); }
  .dim-text { color: #444; font-size: 10px; font-weight: 600; white-space: nowrap; letter-spacing: 0.04em; }
  .dim-diff-ok { color: var(--green); margin-left: 4px; font-size: 9px; }
  .dim-diff-warn { color: var(--orange); margin-left: 4px; font-size: 9px; }
  .screen-row { display: flex; align-items: center; gap: 8px; }
  .height-label { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 60px; }
  .height-line { width: 1px; flex: 1; background: rgba(0,0,0,0.2); }
  .height-text { color: #444; font-size: 9px; font-weight: 600; text-align: center; line-height: 1.4; }
  .led-screen { position: relative; border-radius: 2px; overflow: hidden; border: 1.5px solid rgba(0,0,0,0.2); box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
  .led-grid { position: absolute; inset: 0; display: grid; gap: 1px; padding: 1px; }
  .led-panel-cell { background: transparent; border-radius: 1px; }
  .screen-overlay-tl { position: absolute; top: 7px; left: 7px; background: rgba(255,255,255,0.92); padding: 4px 8px; border: 1px solid rgba(0,0,0,0.1); }
  .screen-overlay-title { color: #1a1a1a; font-weight: 600; font-size: 10px; letter-spacing: 0.02em; }
  .screen-overlay-sub { color: #888; font-size: 9px; margin-top: 1px; }
  .screen-bottom-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--green), var(--accent), var(--purple)); }
  .viz-badges { text-align: center; margin-top: 8px; display: flex; justify-content: center; gap: 6px; }
  .viz-badge { font-size: 9px; font-weight: 600; padding: 3px 9px; border: 1px solid; letter-spacing: 0.08em; }

  /* ── TABS ── */
  .tab-bar { display: flex; border-bottom: 1px solid var(--border-strong); background: #fff; }
  .tab-btn { flex: 1; padding: 10px 6px; border: none; cursor: pointer; background: transparent; border-bottom: 2px solid transparent; color: #bbb; font-size: 10px; font-weight: 600; font-family: var(--font); letter-spacing: 0.1em; text-transform: uppercase; }
  .tab-btn.active { color: #1a1a1a; border-bottom-color: #1a1a1a; }
  .tab-btn:hover:not(.active) { color: #888; }
  .tab-content { flex: 1; overflow-y: auto; padding: 18px 22px; background: #fff; scrollbar-width: thin; }

  /* ── STAT CARDS ── */
  .stat-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px; }
  .stat-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
  .stat-card { background: #fafaf8; border: 1px solid #e8e8e4; border-top: 2px solid #1a1a1a; padding: 12px 14px; }
  .stat-header { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; }
  .stat-icon { font-size: 13px; }
  .stat-label { color: #aaa; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; }
  .stat-value { color: #1a1a1a; font-size: 19px; font-weight: 600; letter-spacing: -0.04em; line-height: 1; }
  .stat-sub { color: #bbb; font-size: 10px; margin-top: 3px; }

  /* ── TABLES ── */
  .data-table-wrap { background: #fff; border: 1px solid #e8e8e4; overflow: hidden; margin-bottom: 12px; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .data-table thead tr { background: #fafaf8; }
  .data-table th { text-align: left; padding: 8px 14px; color: #aaa; font-weight: 700; font-size: 8px; text-transform: uppercase; letter-spacing: 0.18em; }
  .data-table th:last-child { text-align: right; }
  .data-table td { padding: 8px 14px; border-top: 1px solid #f0f0ec; }
  .data-table td:first-child { color: #888; }
  .data-table td:last-child { color: #1a1a1a; font-weight: 600; text-align: right; }
  .data-table tr:nth-child(even) td { background: rgba(0,0,0,0.012); }

  /* ── POWER BAR ── */
  .power-bar-wrap { background: #fafaf8; border: 1px solid #e8e8e4; padding: 12px 14px; margin-bottom: 12px; }
  .power-bar-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .power-bar-label { color: #888; font-size: 10px; letter-spacing: 0.08em; }
  .power-bar-pct { color: #1a1a1a; font-size: 11px; font-weight: 700; }
  .power-bar-track { height: 5px; background: #e8e8e4; overflow: hidden; }
  .power-bar-fill { height: 100%; background: linear-gradient(90deg, var(--green), var(--orange)); transition: width 0.5s ease; }

  /* ── CHECKLIST ── */
  .checklist { background: #fafaf8; border: 1px solid #e8e8e4; padding: 12px 14px; }
  .checklist-title { font-size: 8px; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.18em; margin-bottom: 10px; }
  .checklist-item { display: flex; align-items: center; gap: 9px; padding: 7px 0; border-bottom: 1px solid #f0f0ec; }
  .checklist-item:last-child { border-bottom: none; }
  .checklist-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .checklist-text { font-size: 11px; color: #888; }
  .checklist-text.warn { color: var(--orange); }
`;

function computeLED(selected, inputs, mode) {
  let panelsW, panelsH;
  if (mode === "dimensions") {
    panelsW = Math.max(1, Math.floor(inputs.width / selected.panel_width_m));
    panelsH = Math.max(1, Math.floor(inputs.height / selected.panel_height_m));
  } else if (mode === "panels") {
    panelsW = Math.max(1, inputs.panelsW);
    panelsH = Math.max(1, inputs.panelsH);
  } else {
    panelsW = Math.max(1, Math.ceil(inputs.resW / selected.resolution_w));
    panelsH = Math.max(1, Math.ceil(inputs.resH / selected.resolution_h));
  }
  const totalWidth = panelsW * selected.panel_width_m;
  const totalHeight = panelsH * selected.panel_height_m;
  const resW = panelsW * selected.resolution_w;
  const resH = panelsH * selected.resolution_h;
  const totalPixels = resW * resH;
  const surface = totalWidth * totalHeight;
  const totalPanels = panelsW * panelsH;
  const totalPowerMax = totalPanels * selected.power_max_w;
  const totalPowerAvg = totalPanels * selected.power_avg_w;
  return { panelsW, panelsH, totalWidth, totalHeight, resW, resH, totalPixels, surface, totalPanels, totalPowerMax, totalPowerAvg };
}

function getGcd(a, b) { return b === 0 ? a : getGcd(b, a % b); }
function getRatio(w, h) { const g = getGcd(Math.round(w), Math.round(h)); return `${Math.round(w/g)}:${Math.round(h/g)}`; }
function getScreenQuality(w, h) {
  const mp = (w * h) / 1000000;
  if (mp >= 8.3)  return { label:"4K+",      color:"#34c759" };
  if (mp >= 2.07) return { label:"Full HD+",  color:"#0071e3" };
  if (mp >= 0.92) return { label:"HD+",       color:"#ff9f0a" };
  return                  { label:"SD+",      color:"#8e8e93" };
}
function getScreenQualityBadge(w, h) {
  const mp = (w * h) / 1000000;
  if (mp >= 8.3)  return { label:"4K+",      color:"#34c759" };
  if (mp >= 2.07) return { label:"Full HD+",  color:"#0071e3" };
  if (mp >= 0.92) return { label:"HD+",       color:"#ff9f0a" };
  return                  { label:"SD+",      color:"#8e8e93" };
}

function SpinBox({ value, onChange, step=1, min=0, unit="" }) {
  const inc = () => onChange(v => Math.round(((Number(v)||0) + step) * 1000) / 1000);
  const dec = () => onChange(v => Math.max(min, Math.round(((Number(v)||0) - step) * 1000) / 1000));
  return (
    <div className="spinbox">
      <button className="spinbox-btn" onClick={dec}>−</button>
      <input className="spinbox-input" type="text" inputMode="numeric" value={value} onChange={e => onChange(e.target.value)} />
      {unit && <span className="spinbox-unit">{unit}</span>}
      <button className="spinbox-btn" onClick={inc}>+</button>
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-header"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span></div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

async function generatePDF(selected, result, quality) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297;
  const margin = 16;
  const colW = (W - margin * 2 - 8) / 2;

  const { panelsW: pW, panelsH: pH, totalWidth, totalHeight, resW: rW, resH: rH,
    totalPixels, surface, totalPanels, totalPowerMax, totalPowerAvg } = result;

  const powerLines  = Math.ceil(totalPowerMax / (selected.power_cable_capacity || 2200));
  const rj45Needed  = Math.ceil(totalPixels   / (selected.rj45_capacity       || 535000));
  const totalWeight = totalPanels * selected.weight_kgs;
  const diagonal    = Math.sqrt(totalWidth**2 + totalHeight**2) * 39.37;
  const viewMin     = parseFloat(selected.pixel_pitch_mm) * 1;
  const viewOpt     = parseFloat(selected.pixel_pitch_mm) * 2;
  const BTU         = totalPowerAvg * 3.412 * 0.6;
  const kW          = totalPowerAvg / 1000;
  const costDay     = kW * 0.22 * 10;
  const pixDensity  = surface ? Math.round(totalPixels / surface) : 0;

  const C = {
    blue:[0,113,227], blue2:[64,176,255], green:[52,199,89], orange:[255,159,10],
    red:[255,59,48], purple:[175,82,222], bg:[245,245,243], white:[255,255,255],
    text:[26,26,26], muted:[110,110,115], light:[174,174,178], border:[220,220,220],
    dark:[17,17,19],
  };

  const setFill = (rgb) => doc.setFillColor(...rgb);
  const setDraw = (rgb) => doc.setDrawColor(...rgb);
  const setFont = (size, style="normal", rgb=C.text) => {
    doc.setFontSize(size); doc.setFont("helvetica", style); doc.setTextColor(...rgb);
  };
  const rect = (x, y, w, h, r=0, fill=true) => {
    if (r > 0) doc.roundedRect(x, y, w, h, r, r, fill ? "F" : "S");
    else doc.rect(x, y, w, h, fill ? "F" : "S");
  };
  const line = (x1, y1, x2, y2, rgb=C.border, lw=0.3) => {
    doc.setLineWidth(lw); setDraw(rgb); doc.line(x1, y1, x2, y2);
  };
  const text = (str, x, y, opts={}) => doc.text(str, x, y, opts);

  let y = 0;

  // HEADER
  setFill(C.dark); rect(0, 0, W, 38, 0);
  setFont(18, "bold", C.white);
  text("LED Screen Report", margin + 22, 15);
  setFont(8, "normal", [100,100,110]);
  text("Configurateur professionnel · " + new Date().toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" }), margin + 22, 23);
  setFont(7, "bold", [150,150,155]);
  text(quality.label, W - margin - 4, 19, { align:"right" });

  y = 46;

  // MODEL BANNER
  setFill(C.bg); rect(margin, y, W - margin*2, 14, 3);
  setFont(10, "bold", C.text); text(selected.panel_ref, margin + 6, y + 9);
  setFont(7.5, "normal", C.muted);
  text(`P${selected.pixel_pitch_mm} mm  ·  ${selected.nits} nits  ·  ${selected.resolution_w}×${selected.resolution_h} px  ·  ${selected.refresh_rate_hz} Hz`, margin + 36, y + 9);
  y += 20;

  // KPI CARDS
  const kpis = [
    { label:"PANNEAUX",    value:`${pW} × ${pH}`,                                        sub:`${totalPanels} total` },
    { label:"DIMENSIONS",  value:`${totalWidth.toFixed(2)} × ${totalHeight.toFixed(2)}`,  sub:`${surface.toFixed(2)} m²` },
    { label:"RÉSOLUTION",  value:`${(totalPixels/1000000).toFixed(2)} Mpx`,               sub:`${rW} × ${rH}` },
    { label:"POIDS TOTAL", value:`${totalWeight.toFixed(0)} kg`,                          sub:`${selected.weight_kgs} kg/unit` },
  ];
  const kpiW = (W - margin*2 - 9) / 4;
  kpis.forEach((kpi, i) => {
    const kx = margin + i * (kpiW + 3);
    setFill(C.white); rect(kx, y, kpiW, 22, 2);
    setDraw(C.border); doc.setLineWidth(0.3); doc.roundedRect(kx, y, kpiW, 22, 2, 2, "S");
    setFill(C.dark); rect(kx, y, kpiW, 1.5, 0);
    setFont(6, "bold", C.light); text(kpi.label, kx + kpiW/2, y + 8, { align:"center" });
    setFont(9, "bold", C.text); text(kpi.value, kx + kpiW/2, y + 15, { align:"center" });
    setFont(6, "normal", C.muted); text(kpi.sub, kx + kpiW/2, y + 20, { align:"center" });
  });
  y += 28;

  // SCREEN VIZ
  const vizH = 50;
  setFill([238,238,234]); rect(margin, y, W - margin*2, vizH, 3);
  const maxScrW = 80, maxScrH = 40;
  const aspect = totalWidth / totalHeight;
  let scrW = maxScrW, scrH = maxScrW / aspect;
  if (scrH > maxScrH) { scrH = maxScrH; scrW = maxScrH * aspect; }
  const scrX = margin + (W - margin*2)/2 - scrW/2;
  const scrY = y + (vizH - scrH) / 2;
  const cellW = scrW / pW, cellH = scrH / pH;
  for (let row = 0; row < pH; row++) {
    for (let col = 0; col < pW; col++) {
      const cx = scrX + col * cellW + 0.4, cy = scrY + row * cellH + 0.4;
      setFill([Math.round(0 + col*8), Math.round(113 + col*5), Math.round(227 - col*10)]);
      rect(cx, cy, cellW - 0.8, cellH - 0.8, 0.5);
    }
  }
  setDraw([0,0,0,0.3]); doc.setLineWidth(0.5); doc.roundedRect(scrX, scrY, scrW, scrH, 1.5, 1.5, "S");
  setFont(7, "bold", [68,68,68]);
  text(`${totalWidth.toFixed(2)} m · ${rW} px`, scrX + scrW/2, scrY - 4, { align:"center" });
  const bx = scrX + scrW + 8, by = scrY;
  [
    { label:"Diagonale", val:`${diagonal.toFixed(0)}"` },
    { label:"Recul min.", val:`${viewMin.toFixed(1)} m` },
    { label:"Optimal",   val:`${viewOpt.toFixed(1)} m` },
    { label:"Qualité",   val:quality.label },
  ].forEach((b, i) => {
    setFill(C.bg); setDraw(C.border); doc.roundedRect(bx, by + i * 10, 38, 8, 1.5, 1.5, "FD");
    setFont(6, "normal", C.muted); text(b.label, bx + 3, by + i*10 + 4);
    setFont(7, "bold", C.text); text(b.val, bx + 38 - 3, by + i*10 + 4, { align:"right" });
  });
  y += vizH + 8;

  const drawSection = (title, rows, x, startY, w) => {
    setFill(C.dark); rect(x, startY, w, 7, 2);
    setFont(7, "bold", C.white); text(title, x + 4, startY + 5);
    let ty = startY + 7;
    rows.forEach(([k, v], i) => {
      setFill(i % 2 === 0 ? C.white : [248,248,246]); rect(x, ty, w, 6.5, 0);
      setDraw(C.border); doc.setLineWidth(0.2); doc.rect(x, ty, w, 6.5, "S");
      setFont(6.5, "normal", C.muted); text(k, x + 3, ty + 4.5);
      setFont(6.5, "bold", C.text); text(v, x + w - 3, ty + 4.5, { align:"right" });
      ty += 6.5;
    });
    return ty;
  };

  const col1x = margin, col2x = margin + colW + 8;
  const endLeft1 = drawSection("ÉCRAN", [
    ["Panneaux (L × H)", `${pW} × ${pH} = ${totalPanels} unités`],
    ["Dimensions réelles", `${totalWidth.toFixed(3)} × ${totalHeight.toFixed(3)} m`],
    ["Résolution totale", `${rW} × ${rH} px`],
    ["Mégapixels", `${(totalPixels/1000000).toFixed(3)} Mpx`],
    ["Ratio d'image", getRatio(rW, rH)],
    ["Densité pixels", `${pixDensity.toLocaleString()} px/m²`],
    ["Surface active", `${surface.toFixed(3)} m²`],
    ["Poids total", `${totalWeight.toFixed(1)} kg`],
    ["Qualité image", quality.label],
  ], col1x, y, colW);
  const endRight1 = drawSection("PRODUIT", [
    ["Référence", selected.panel_ref],
    ["Type LED", selected.type_led || "—"],
    ["Pitch pixel", `${selected.pixel_pitch_mm} mm`],
    ["Dimensions cabinet", `${selected.panel_width_m} × ${selected.panel_height_m} m`],
    ["Résolution cabinet", `${selected.resolution_w} × ${selected.resolution_h} px`],
    ["Poids unitaire", `${selected.weight_kgs} kg`],
    ["Luminosité", `${selected.nits} nits`],
    ["Refresh rate", `${selected.refresh_rate_hz} Hz`],
    ["Conso max", `${selected.power_max_w} W`],
  ], col2x, y, colW);
  y = Math.max(endLeft1, endRight1) + 8;

  const endLeft2 = drawSection("ÉLECTRIQUE", [
    ["Conso max totale", `${Math.round(totalPowerMax)} W`],
    ["Conso moy. totale", `${Math.round(totalPowerAvg)} W`],
    ["Puissance (moy.)", `${kW.toFixed(3)} kW`],
    ["BTU/heure", `${BTU.toFixed(0)} BTU/h`],
    ["Coût/an", `${(costDay*365).toFixed(0)} €`],
  ], col1x, y, colW);
  const endRight2 = drawSection("INSTALLATION", [
    ["Lignes électriques", `${powerLines} ligne(s)`],
    ["Ports RJ45 requis", `${rj45Needed} port(s)`],
    ["Recul minimum", `${viewMin.toFixed(2)} m`],
    ["Recul optimal", `${viewOpt.toFixed(2)} m`],
    ["Poids total", `${totalWeight.toFixed(1)} kg`],
    ["Diagonale", `${diagonal.toFixed(1)}"`],
  ], col2x, y, colW);
  y = Math.max(endLeft2, endRight2) + 8;

  const pct = totalPowerAvg / totalPowerMax;
  setFill(C.white); rect(margin, y, W - margin*2, 18, 2);
  setDraw(C.border); doc.roundedRect(margin, y, W - margin*2, 18, 2, 2, "S");
  setFont(7, "bold", C.muted); text("CHARGE MOYENNE VS MAX", margin + 4, y + 6);
  setFont(7, "bold", C.text); text(`${Math.round(pct*100)}%`, W - margin - 4, y + 6, { align:"right" });
  setFill(C.bg); rect(margin + 4, y + 9, W - margin*2 - 8, 5, 2);
  const barW = (W - margin*2 - 8) * pct;
  setFill(C.green); rect(margin + 4, y + 9, barW * 0.5, 5, 0);
  setFill(C.orange); rect(margin + 4 + barW * 0.5, y + 9, barW * 0.5, 5, 0);
  y += 24;

  const checks = [
    { ok: powerLines <= 4,   txt: `${powerLines} ligne(s) électrique(s) — ${powerLines<=4?"Standard (OK)":"Prévoir tableau dédié"}` },
    { ok: rj45Needed <= 8,   txt: `${rj45Needed} port(s) RJ45 — ${rj45Needed<=8?"Switch standard 8p (OK)":"Switch 16p requis"}` },
    { ok: totalWeight < 300, txt: `${totalWeight.toFixed(0)} kg total — ${totalWeight<300?"Structure légère (OK)":"Renforcement requis"}` },
    { ok: true,              txt: `Recul optimal recommandé : ${viewOpt.toFixed(1)} m minimum` },
  ];
  setFill(C.white); rect(margin, y, W - margin*2, 10 + checks.length * 8, 2);
  setDraw(C.border); doc.roundedRect(margin, y, W - margin*2, 10 + checks.length * 8, 2, 2, "S");
  setFont(7, "bold", C.muted); text("CHECKLIST INSTALLATION", margin + 4, y + 6);
  y += 10;
  checks.forEach((c) => {
    setFill(c.ok ? C.green : C.orange); doc.circle(margin + 6, y + 2.5, 2, "F");
    setFont(7, c.ok ? "normal" : "bold", c.ok ? C.muted : C.orange); text(c.txt, margin + 12, y + 4);
    y += 8;
  });

  setFill(C.dark); rect(0, H - 12, W, 12, 0);
  setFont(6.5, "normal", [100,100,110]);
  text("LED Calculator · Configurateur professionnel", margin, H - 5);
  text(`Généré le ${new Date().toLocaleDateString("fr-FR")} · ${selected.panel_ref} · ${rW}×${rH}px`, W - margin, H - 5, { align:"right" });

  doc.save(`LED_Report_${selected.panel_ref}_${rW}x${rH}.pdf`);
}

export default function LEDCalculator({ onAdmin }) {
  const [products, setProducts] = useState([]);
  const [selIdx, setSelIdx] = useState(0);
  const [brandFilter, setBrandFilter] = useState("all");
  const [mode, setMode] = useState("dimensions");
  const [width, setWidth]   = useState(3);
  const [height, setHeight] = useState(2);
  const [panelsW, setPanelsW] = useState(5);
  const [panelsH, setPanelsH] = useState(3);
  const [resW, setResW] = useState(1920);
  const [resH, setResH] = useState(1080);
  const [activeTab, setActiveTab] = useState("product");
  const [pdfLoading, setPdfLoading] = useState(false);
  const vizRef = useRef(null);
  const [vizSize, setVizSize] = useState({w:600, h:285});

  useEffect(() => {
    supabase.from("products").select("*").eq("is_active", true).order("marque").order("panel_ref")
      .then(({ data }) => { if (data && data.length > 0) { setProducts(data); setSelIdx(0); } });
  }, []);

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

  useEffect(() => {
    if (!window.jspdf) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const obs = new ResizeObserver(([e]) => setVizSize({w: e.contentRect.width, h: e.contentRect.height}));
    if (vizRef.current) obs.observe(vizRef.current);
    return () => obs.disconnect();
  }, []);

  const brands = ["all", ...new Set(products.map(p => p.marque).filter(Boolean))];
  const filtered = brandFilter === "all" ? products : products.filter(p => p.marque === brandFilter);
  const selected = filtered[selIdx] || filtered[0] || null;

  if (products.length === 0) return <div style={{padding:40, textAlign:"center", color:"#6e6e73"}}>Chargement…</div>;

  const result = computeLED(selected, {
    width: Number(width)||0, height: Number(height)||0,
    panelsW: Number(panelsW)||1, panelsH: Number(panelsH)||1,
    resW: Number(resW)||1920, resH: Number(resH)||1080
  }, mode);

  const { totalWidth, totalHeight, resW: rW, resH: rH, totalPixels, surface,
    totalPanels, totalPowerMax, totalPowerAvg, panelsW: pW, panelsH: pH } = result;

  const powerLines  = Math.ceil(totalPowerMax / (selected.power_cable_capacity || 2200));
  const rj45Needed  = Math.ceil(totalPixels   / (selected.rj45_capacity       || 535000));
  const totalWeight = totalPanels * selected.weight_kgs;
  const diagonal    = Math.sqrt(totalWidth**2 + totalHeight**2) * 39.37;
  const quality     = getScreenQualityBadge(rW, rH);
  const viewMin     = parseFloat(selected.pixel_pitch_mm) * 1;
  const viewOpt     = parseFloat(selected.pixel_pitch_mm) * 2;
  const BTU         = totalPowerAvg * 3.412 * 0.6;
  const kW          = totalPowerAvg / 1000;
  const costDay     = kW * 0.22 * 10;
  const pixDensity  = surface ? Math.round(totalPixels / surface) : 0;

  const PAD = 80;
  const safeW = totalWidth || 1, safeH = totalHeight || 1;
  const scale = Math.min((vizSize.w - PAD*2) / safeW, (vizSize.h - PAD) / safeH);
  const scrW  = Math.max(40, safeW * scale);
  const scrH  = Math.max(30, safeH * scale);

  const MODES = [
    { id:"dimensions", label:"Dimensions", icon:"📐" },
    { id:"panels",     label:"Panneaux",   icon:"⬛" },
    { id:"resolution", label:"Résolution", icon:"🎯" },
  ];
  const TABS = [
    { id:"product",  label:"Produit",      icon:"📦" },
    { id:"screen",   label:"Écran",        icon:"🖥️" },
    { id:"power",    label:"Électrique",   icon:"⚡" },
    { id:"install",  label:"Installation", icon:"🔧" },
  ];

  const handlePDF = async () => {
    if (!window.jspdf) { alert("jsPDF charge encore, réessayez."); return; }
    setPdfLoading(true);
    try { await generatePDF(selected, result, getScreenQuality(rW, rH)); }
    catch(e) { alert("Erreur PDF : " + e.message); }
    setPdfLoading(false);
  };

  return (
    <div className="led-app">
      <div className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">
            <div className="topbar-logo-cell"></div>
            <div className="topbar-logo-cell dim"></div>
            <div className="topbar-logo-cell dim"></div>
            <div className="topbar-logo-cell"></div>
          </div>
          <div>
            <div className="topbar-title">LED Calculator</div>
            <div className="topbar-subtitle">Configurateur professionnel</div>
          </div>
        </div>
        <div className="topbar-kpis">
          <div className="topbar-kpi">
            <div className="topbar-kpi-label">Résolution</div>
            <div className="topbar-kpi-value">{rW} × {rH} px</div>
          </div>
          <div className="topbar-sep" />
          <div className="topbar-kpi">
            <div className="topbar-kpi-label">Surface</div>
            <div className="topbar-kpi-value">{surface.toFixed(2)} m²</div>
          </div>
          <div className="topbar-sep" />
          <div className="topbar-kpi">
            <div className="topbar-kpi-label">Panneaux</div>
            <div className="topbar-kpi-value">{pW} × {pH} = {totalPanels} u.</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="topbar-badge">{quality.label}</div>
          <button onClick={onAdmin} className="admin-btn">Admin</button>
          <button onClick={handlePDF} disabled={pdfLoading} className="pdf-topbar-btn">
            {pdfLoading ? "Génération…" : "Exporter PDF"}
          </button>
        </div>
      </div>

      <div className="main-layout">
        <div className="left-panel">
          <div className="section-header">Modèle de panneau</div>
          <div style={{marginBottom:10}}>
            <label className="input-label">Marque</label>
            <select className="product-select" value={brandFilter} onChange={e => { setBrandFilter(e.target.value); setSelIdx(0); }}>
              <option value="all">Toutes les marques</option>
              {brands.filter(b => b !== "all").map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="product-select-wrap">
            <select className="product-select" value={selIdx} onChange={e => setSelIdx(Number(e.target.value))}>
              {filtered.map((p, i) => (
                <option key={i} value={i}>{p.panel_ref} — P{p.pixel_pitch_mm} · {p.nits} nits · {p.resolution_w}×{p.resolution_h}px</option>
              ))}
            </select>
            <span className="product-select-chevron">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>

          <div className="section-header">Mode de saisie</div>
          <div className="mode-grid">
            {MODES.map(m => (
              <button key={m.id} className={`mode-btn ${mode === m.id ? "active" : ""}`} onClick={() => {
                if (m.id === "panels") { setPanelsW(result.panelsW); setPanelsH(result.panelsH); }
                else if (m.id === "resolution") { setResW(result.resW); setResH(result.resH); }
                else if (m.id === "dimensions") { setWidth(result.totalWidth.toFixed(2)); setHeight(result.totalHeight.toFixed(2)); }
                setMode(m.id);
              }}>
                <div className="mode-icon">{m.icon}</div>
                <div className="mode-label">{m.label}</div>
              </button>
            ))}
          </div>

          <div className="input-group">
            {mode === "dimensions" && (<>
              <div><label className="input-label">Largeur souhaitée</label><SpinBox value={width} onChange={setWidth} step={0.1} min={0} unit="m" /></div>
              <div><label className="input-label">Hauteur souhaitée</label><SpinBox value={height} onChange={setHeight} step={0.1} min={0} unit="m" /></div>
            </>)}
            {mode === "panels" && (<>
              <div><label className="input-label">Panneaux en largeur</label><SpinBox value={panelsW} onChange={setPanelsW} step={1} min={1} unit="col" /></div>
              <div><label className="input-label">Panneaux en hauteur</label><SpinBox value={panelsH} onChange={setPanelsH} step={1} min={1} unit="row" /></div>
            </>)}
            {mode === "resolution" && (<>
              <div><label className="input-label">Résolution largeur</label><SpinBox value={resW} onChange={setResW} step={selected.resolution_w} min={selected.resolution_w} unit="px" /></div>
              <div><label className="input-label">Résolution hauteur</label><SpinBox value={resH} onChange={setResH} step={selected.resolution_h} min={selected.resolution_h} unit="px" /></div>
            </>)}
          </div>

          <div className="section-header">Synthèse</div>
          <div className="summary-grid">
            {[
              { label:"Panneaux",    value:`${pW} × ${pH}`,                                        sub:`= ${totalPanels} total` },
              { label:"Dimensions",  value:`${totalWidth.toFixed(2)} × ${totalHeight.toFixed(2)} m`, sub:`${surface.toFixed(2)} m²` },
              { label:"Résolution",  value:`${(totalPixels/1000000).toFixed(1)} Mpx`,               sub:`${rW}×${rH}` },
              { label:"Poids",       value:`${totalWeight.toFixed(0)} kg`,                          sub:`${selected.weight_kgs} kg/unit` },
            ].map(s => (
              <div key={s.label} className="summary-card">
                <div className="summary-label">{s.label}</div>
                <div className="summary-value">{s.value}</div>
                <div className="summary-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <button className="pdf-btn" onClick={handlePDF} disabled={pdfLoading}>
            {pdfLoading ? "⏳ Génération en cours…" : "📄 Exporter en PDF"}
          </button>
        </div>

        <div className="right-panel">
          <div className="viz-area" ref={vizRef}>
            <div className="viz-grid-bg" />
            <div className="screen-container">
              <div className="dim-label">
                <div className="dim-line" style={{width: Math.max(0, scrW/2 - 24)}} />
                <span className="dim-text">
                  {totalWidth.toFixed(2)} m · {rW} px
                  {mode==="dimensions" && (Number(width)||0)>0 && (
                    <span className={Math.abs(totalWidth-(Number(width)||0))<0.01 ? "dim-diff-ok" : "dim-diff-warn"}>
                      ({(totalWidth-(Number(width)||0)).toFixed(2)}m)
                    </span>
                  )}
                </span>
                <div className="dim-line" style={{width: Math.max(0, scrW/2 - 24)}} />
              </div>
              <div className="screen-row">
                <div className="height-label">
                  <div className="height-line" />
                  <span className="height-text">
                    {totalHeight.toFixed(2)} m<br />
                    <span style={{color:"#bbb"}}>{rH} px</span>
                    {mode==="dimensions" && (Number(height)||0)>0 && (
                      <><br /><span style={{color: Math.abs(totalHeight-(Number(height)||0))<0.01?"#34c759":"#ff9f0a",fontSize:9}}>
                        ({(totalHeight-(Number(height)||0)).toFixed(2)}m)
                      </span></>
                    )}
                  </span>
                  <div className="height-line" />
                </div>
                <div className="led-screen" style={{
                  width: scrW, height: scrH,
                  backgroundImage: "url('/screen-content.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}>
                  <div className="led-grid" style={{ gridTemplateColumns: `repeat(${pW},1fr)`, gridTemplateRows: `repeat(${pH},1fr)` }}>
                    {Array.from({length: pW*pH}).map((_,i) => <div key={i} className="led-panel-cell" />)}
                  </div>
                  <div className="screen-overlay-tl">
                    <div className="screen-overlay-title">{pW} × {pH} cabinets</div>
                    <div className="screen-overlay-sub">{rW} × {rH} px · {surface.toFixed(1)} m²</div>
                  </div>
                  <div className="screen-bottom-bar" />
                </div>
                <div style={{width:64}} />
              </div>
              <div className="viz-badges">
                <span className="viz-badge" style={{color:"#ff9f0a",background:"rgba(255,159,10,0.08)",borderColor:"rgba(255,159,10,0.25)"}}>👁 Min: {viewMin.toFixed(1)} m</span>
                <span className="viz-badge" style={{color:"#34c759",background:"rgba(52,199,89,0.08)",borderColor:"rgba(52,199,89,0.25)"}}>✓ Optimal: {viewOpt.toFixed(1)} m</span>
                <span className="viz-badge" style={{color:"#555",background:"rgba(0,0,0,0.04)",borderColor:"rgba(0,0,0,0.12)"}}>📐 {diagonal.toFixed(0)}"</span>
              </div>
            </div>
          </div>

          <div className="tab-bar">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tab-btn ${activeTab === t.id ? "active" : ""}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === "product" && (
              <div>
                <div className="stat-grid-3">
                  <StatCard icon="📏" label="Pitch pixel" value={`${selected.pixel_pitch_mm} mm`} sub="Résolution angulaire" />
                  <StatCard icon="💡" label="Luminosité" value={`${selected.nits} nits`} sub="Luminance max" />
                  <StatCard icon="🔄" label="Refresh rate" value={`${selected.refresh_rate_hz} Hz`} sub="Fréquence rafraîch." />
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Paramètre</th><th>Valeur</th></tr></thead>
                    <tbody>
                      {[
                        ["Référence produit", selected.panel_ref],
                        ["Type LED", selected.type_led || '—'],
                        ["Série", selected.brand || '—'],
                        ["Marque", selected.marque || '—'],
                        ["Pitch pixel", `${selected.pixel_pitch_mm} mm`],
                        ["Dimensions cabinet", `${selected.panel_width_m} × ${selected.panel_height_m} m`],
                        ["Résolution cabinet", `${selected.resolution_w} × ${selected.resolution_h} px`],
                        ["Poids unitaire", `${selected.weight_kgs} kg`],
                        ["Luminosité", `${selected.nits} nits`],
                        ["Refresh rate", `${selected.refresh_rate_hz} Hz`],
                        ["Conso max (unité)", `${selected.power_max_w} W`],
                        ["Conso moy. (unité)", `${selected.power_avg_w} W`],
                      ].map(([k,v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === "screen" && (
              <div>
                <div className="stat-grid-3">
                  <StatCard icon="⬛" label="Total panneaux" value={`${pW} × ${pH}`} sub={`= ${totalPanels} cabinets`} />
                  <StatCard icon="📐" label="Surface totale" value={`${surface.toFixed(2)} m²`} sub={`${totalWidth.toFixed(2)} × ${totalHeight.toFixed(2)} m`} />
                  <StatCard icon="🎯" label="Résolution" value={`${(totalPixels/1000000).toFixed(2)} Mpx`} sub={`${rW} × ${rH} px`} />
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <tbody>
                      {[
                        ["Panneaux (L × H)", `${pW} × ${pH} = ${totalPanels} unités`],
                        ["Dimensions réelles", `${totalWidth.toFixed(3)} × ${totalHeight.toFixed(3)} m`],
                        ["Résolution totale", `${rW} × ${rH} px`],
                        ["Mégapixels", `${(totalPixels/1000000).toFixed(3)} Mpx`],
                        ["Ratio d'image", getRatio(rW, rH)],
                        ["Densité pixels", `${pixDensity.toLocaleString()} px/m²`],
                        ["Diagonale", `${diagonal.toFixed(1)} pouces`],
                        ["Surface active", `${surface.toFixed(3)} m²`],
                        ["Poids total", `${totalWeight.toFixed(1)} kg`],
                        ["Recul minimum", `${viewMin.toFixed(2)} m`],
                        ["Recul optimal", `${viewOpt.toFixed(2)} m`],
                      ].map(([k,v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === "power" && (
              <div>
                <div className="stat-grid-3">
                  <StatCard icon="⚡" label="Conso max" value={`${Math.round(totalPowerMax)} W`} sub={`${(totalPowerMax/1000).toFixed(2)} kW`} />
                  <StatCard icon="📉" label="Conso moy." value={`${Math.round(totalPowerAvg)} W`} sub={`${(totalPowerAvg/1000).toFixed(2)} kW`} />
                  <StatCard icon="🌡️" label="BTU/h" value={BTU.toFixed(0)} sub="Dissipation thermique" />
                </div>
                <div className="power-bar-wrap">
                  <div className="power-bar-header">
                    <span className="power-bar-label">Charge moyenne vs max</span>
                    <span className="power-bar-pct">{Math.round(totalPowerAvg/totalPowerMax*100)}%</span>
                  </div>
                  <div className="power-bar-track">
                    <div className="power-bar-fill" style={{width:`${totalPowerAvg/totalPowerMax*100}%`}} />
                  </div>
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <tbody>
                      {[
                        ["Consommation max totale",  `${Math.round(totalPowerMax)} W`],
                        ["Consommation moy. totale", `${Math.round(totalPowerAvg)} W`],
                        ["Puissance en kW (moy.)",   `${kW.toFixed(3)} kW`],
                        ["BTU/heure",                `${BTU.toFixed(0)} BTU/h`],
                        ["Coût/an estimé",           `${(costDay*365).toFixed(0)} €`],
                      ].map(([k,v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === "install" && (
              <div>
                <div className="stat-grid-2">
                  <StatCard icon="🔌" label="Lignes électriques" value={`${powerLines}`} sub={`${selected.power_cable_capacity||2200} W/ligne`} />
                  <StatCard icon="🌐" label="Ports RJ45" value={`${rj45Needed}`} sub={`${(selected.rj45_capacity||535000).toLocaleString()} px/port`} />
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <tbody>
                      {[
                        ["Nombre de cabinets", `${totalPanels} unités (${pW} × ${pH})`],
                        ["Poids unitaire", `${selected.weight_kgs} kg`],
                        ["Poids total", `${totalWeight.toFixed(1)} kg`],
                        ["Surface totale", `${surface.toFixed(3)} m²`],
                        ["Lignes électriques", `${powerLines} ligne(s)`],
                        ["Ports RJ45 requis", `${rj45Needed} port(s)`],
                        ["Recul min. recommandé", `${viewMin.toFixed(2)} m`],
                        ["Recul optimal", `${viewOpt.toFixed(2)} m`],
                      ].map(([k,v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                    </tbody>
                  </table>
                </div>
                <div className="checklist">
                  <div className="checklist-title">Checklist installation</div>
                  {[
                    { ok: powerLines <= 4,   txt: `${powerLines} ligne(s) électrique(s) — ${powerLines<=4?"✓ Standard":"⚠ Prévoir tableau dédié"}` },
                    { ok: rj45Needed <= 8,   txt: `${rj45Needed} port(s) RJ45 — ${rj45Needed<=8?"✓ Switch standard 8p":"⚠ Switch 16p ou supérieur"}` },
                    { ok: totalWeight < 300, txt: `${totalWeight.toFixed(0)} kg total — ${totalWeight<300?"✓ Structure légère":"⚠ Renforcement mural requis"}` },
                    { ok: true,              txt: `Recul optimal: ${viewOpt.toFixed(1)} m minimum` },
                  ].map((item,i) => (
                    <div key={i} className="checklist-item">
                      <div className="checklist-dot" style={{background: item.ok ? "#34c759" : "#ff9f0a"}} />
                      <span className={`checklist-text ${item.ok ? "" : "warn"}`}>{item.txt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
