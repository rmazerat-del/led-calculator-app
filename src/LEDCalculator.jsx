"use client";

import { useState, useRef, useEffect } from "react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f5f5f7;
    --surface: rgba(255,255,255,0.72);
    --surface-solid: #ffffff;
    --surface-2: rgba(255,255,255,0.5);
    --border: rgba(0,0,0,0.08);
    --border-strong: rgba(0,0,0,0.14);
    --text-primary: #1d1d1f;
    --text-secondary: #6e6e73;
    --text-tertiary: #aeaeb2;
    --accent: #0071e3;
    --accent-light: #e8f2ff;
    --green: #34c759;
    --orange: #ff9f0a;
    --red: #ff3b30;
    --purple: #af52de;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
    --radius: 14px;
    --radius-sm: 10px;
    --radius-xs: 7px;
    --font: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  }
  body { font-family: var(--font); background: var(--bg); }
  .led-app { min-height: 100vh; background: var(--bg); font-family: var(--font); color: var(--text-primary); -webkit-font-smoothing: antialiased; }
  .topbar { background: rgba(245,245,247,0.85); backdrop-filter: saturate(180%) blur(20px); border-bottom: 1px solid var(--border); padding: 0 28px; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
  .topbar-brand { display: flex; align-items: center; gap: 11px; }
  .topbar-icon { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(145deg, #0071e3, #40b0ff); display: flex; align-items: center; justify-content: center; font-size: 15px; box-shadow: 0 2px 8px rgba(0,113,227,0.35); }
  .topbar-title { font-size: 17px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.3px; }
  .topbar-subtitle { font-size: 11px; color: var(--text-tertiary); font-weight: 400; letter-spacing: 0.05em; text-transform: uppercase; }
  .topbar-right { display: flex; gap: 8px; align-items: center; }
  .badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: -0.1px; }
  .badge-quality-4k { background: rgba(52,199,89,0.12); color: var(--green); }
  .badge-quality-fhd { background: rgba(0,113,227,0.1); color: var(--accent); }
  .badge-quality-hd { background: rgba(255,159,10,0.12); color: var(--orange); }
  .badge-quality-sd { background: rgba(142,142,147,0.12); color: #8e8e93; }
  .badge-res { background: rgba(0,0,0,0.05); color: var(--text-secondary); }
  .pdf-btn { display: flex; align-items: center; justify-content: center; gap: 7px; width: 100%; margin-top: 14px; padding: 10px 14px; border-radius: var(--radius-xs); border: none; cursor: pointer; font-family: var(--font); font-size: 13px; font-weight: 600; background: linear-gradient(145deg, #0071e3, #40b0ff); color: white; box-shadow: 0 2px 8px rgba(0,113,227,0.35); transition: all 0.2s; letter-spacing: -0.1px; }
  .pdf-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,113,227,0.4); }
  .pdf-btn:active { transform: translateY(0); }
  .pdf-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .main-layout { display: grid; grid-template-columns: 320px 1fr; height: calc(100vh - 60px); overflow: hidden; }
  .left-panel { background: var(--surface); backdrop-filter: blur(20px); border-right: 1px solid var(--border); overflow-y: auto; padding: 20px 16px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .left-panel::-webkit-scrollbar { width: 4px; }
  .left-panel::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 2px; }
  .section-header { display: flex; align-items: center; gap: 7px; margin-bottom: 12px; padding: 0 2px; }
  .section-header-label { font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.07em; }
  .section-header-line { flex: 1; height: 1px; background: var(--border); }
  .product-select-wrap { position: relative; margin-bottom: 24px; }
  .product-select { width: 100%; appearance: none; -webkit-appearance: none; background: white; border: 1px solid var(--border-strong); border-radius: var(--radius-xs); padding: 10px 36px 10px 12px; font-family: var(--font); font-size: 13px; font-weight: 600; color: var(--text-primary); cursor: pointer; box-shadow: var(--shadow-sm); transition: border-color 0.15s, box-shadow 0.15s; outline: none; }
  .product-select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,113,227,0.12); }
  .product-select-chevron { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-tertiary); }
  .mode-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; margin-bottom: 20px; background: rgba(0,0,0,0.05); padding: 3px; border-radius: var(--radius-sm); }
  .mode-btn { padding: 8px 4px; border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s ease; text-align: center; background: transparent; font-family: var(--font); }
  .mode-btn.active { background: white; box-shadow: var(--shadow-sm); }
  .mode-icon { font-size: 15px; margin-bottom: 3px; }
  .mode-label { font-size: 10px; font-weight: 600; color: var(--text-tertiary); letter-spacing: 0.02em; }
  .mode-btn.active .mode-label { color: var(--accent); }
  .input-group { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
  .input-label { font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 5px; font-weight: 500; letter-spacing: 0.02em; }
  .spinbox { display: flex; align-items: center; border: 1px solid var(--border-strong); border-radius: var(--radius-xs); overflow: hidden; background: white; height: 38px; transition: border-color 0.15s, box-shadow 0.15s; }
  .spinbox:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,113,227,0.12); }
  .spinbox-btn { width: 34px; background: transparent; border: none; color: var(--accent); font-size: 17px; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: background 0.1s; height: 100%; }
  .spinbox-btn:hover { background: var(--accent-light); }
  .spinbox-input { flex: 1; text-align: center; background: transparent; border: none; color: var(--text-primary); font-size: 14px; font-weight: 500; outline: none; min-width: 0; font-family: var(--font); }
  .spinbox-unit { color: var(--text-tertiary); font-size: 11px; padding-right: 8px; font-weight: 500; }
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .summary-card { background: white; border: 1px solid var(--border); border-radius: var(--radius-xs); padding: 10px 12px; position: relative; overflow: hidden; box-shadow: var(--shadow-sm); }
  .summary-accent { position: absolute; top: 0; left: 0; width: 100%; height: 1.5px; background: rgba(0,0,0,0.09); border-radius: 0; }
  .summary-label { font-size: 10px; color: #8a8a8e; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600; margin-bottom: 4px; }
  .summary-value { font-size: 14px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.4px; }
  .summary-sub { font-size: 10px; color: #aeaeb2; margin-top: 2px; font-weight: 400; }
  .right-panel { display: flex; flex-direction: column; overflow: hidden; background: var(--bg); }
  .viz-area { flex: 0 0 290px; background: white; border-bottom: 1px solid var(--border); position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .viz-grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px); background-size: 24px 24px; }
  .screen-container { position: relative; z-index: 2; }
  .dim-label { text-align: center; margin-bottom: 6px; display: flex; justify-content: center; align-items: center; gap: 8px; }
  .dim-line { height: 1px; background: rgba(0,113,227,0.3); border-radius: 1px; }
  .dim-text { color: var(--accent); font-size: 11px; font-weight: 600; white-space: nowrap; letter-spacing: -0.1px; }
  .dim-diff-ok { color: var(--green); margin-left: 5px; font-size: 10px; }
  .dim-diff-warn { color: var(--orange); margin-left: 5px; font-size: 10px; }
  .screen-row { display: flex; align-items: center; gap: 8px; }
  .height-label { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 64px; }
  .height-line { width: 1px; flex: 1; background: rgba(0,113,227,0.3); }
  .height-text { color: var(--accent); font-size: 10px; font-weight: 600; text-align: center; line-height: 1.4; }
  .led-screen { position: relative; border-radius: 4px; overflow: hidden; border: 1.5px solid rgba(0,0,0,0.12); }
  .led-grid { position: absolute; inset: 0; display: grid; gap: 1px; padding: 1px; }
  .led-panel-cell { background: linear-gradient(135deg, #0071e3 0%, #40b0ff 100%); border-radius: 1px; position: relative; overflow: hidden; }
  .led-panel-cell::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 50% 30%, rgba(255,255,255,0.18) 0%, transparent 60%); }
  .screen-overlay-tl { position: absolute; top: 8px; left: 8px; background: rgba(255,255,255,0.9); backdrop-filter: blur(8px); border-radius: 7px; padding: 5px 9px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
  .screen-overlay-tr { position: absolute; top: 8px; right: 8px; border-radius: 10px; padding: 3px 9px; font-size: 10px; font-weight: 700; }
  .screen-overlay-title { color: var(--accent); font-weight: 700; font-size: 11px; letter-spacing: -0.1px; }
  .screen-overlay-sub { color: var(--text-tertiary); font-size: 10px; }
  .screen-bottom-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 2.5px; background: linear-gradient(90deg, var(--green), var(--accent), var(--purple)); }
  .viz-badges { text-align: center; margin-top: 8px; display: flex; justify-content: center; gap: 8px; }
  .viz-badge { font-size: 10px; font-weight: 600; padding: 3px 10px; border-radius: 10px; border: 1px solid; }
  .tab-bar { display: flex; border-bottom: 1px solid var(--border); background: rgba(245,245,247,0.9); backdrop-filter: blur(12px); padding: 0 4px; }
  .tab-btn { flex: 1; padding: 11px 8px; border: none; cursor: pointer; background: transparent; transition: all 0.15s ease; border-bottom: 2px solid transparent; color: var(--text-tertiary); font-size: 12px; font-weight: 600; font-family: var(--font); letter-spacing: 0.01em; }
  .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
  .tab-btn:hover:not(.active) { color: var(--text-secondary); }
  .tab-content { flex: 1; overflow-y: auto; padding: 20px 24px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .tab-content::-webkit-scrollbar { width: 4px; }
  .tab-content::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 2px; }
  .stat-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 18px; }
  .stat-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
  .stat-card { background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; display: flex; flex-direction: column; gap: 5px; position: relative; overflow: hidden; box-shadow: var(--shadow-sm); transition: box-shadow 0.15s; }
  .stat-card:hover { box-shadow: var(--shadow-md); }
  .stat-accent-bar { position: absolute; top: 0; left: 0; width: 100%; height: 1.5px; background: rgba(0,0,0,0.09); border-radius: 0; }
  .stat-header { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
  .stat-icon { font-size: 14px; }
  .stat-label { color: #8a8a8e; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; }
  .stat-value { color: #1d1d1f; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; line-height: 1; }
  .stat-sub { color: #aeaeb2; font-size: 11px; font-weight: 400; }
  .data-table-wrap { background: white; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm); margin-bottom: 14px; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .data-table thead tr { background: var(--bg); }
  .data-table th { text-align: left; padding: 9px 16px; color: var(--text-tertiary); font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; }
  .data-table th:last-child { text-align: right; }
  .data-table td { padding: 9px 16px; border-top: 1px solid var(--border); }
  .data-table td:first-child { color: var(--text-secondary); }
  .data-table td:last-child { color: var(--text-primary); font-weight: 600; text-align: right; }
  .data-table tr:nth-child(even) td { background: rgba(0,0,0,0.015); }
  .power-bar-wrap { background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; margin-bottom: 14px; box-shadow: var(--shadow-sm); }
  .power-bar-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .power-bar-label { color: var(--text-secondary); font-size: 12px; }
  .power-bar-pct { color: var(--text-primary); font-size: 12px; font-weight: 700; }
  .power-bar-track { height: 6px; border-radius: 3px; background: var(--border); overflow: hidden; }
  .power-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--green), var(--orange)); transition: width 0.5s ease; }
  .checklist { background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; box-shadow: var(--shadow-sm); }
  .checklist-title { font-size: 10px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
  .checklist-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
  .checklist-item:not(:last-child) { border-bottom: 1px solid var(--border); }
  .checklist-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .checklist-text { font-size: 12px; color: var(--text-secondary); }
  .checklist-text.warn { color: var(--orange); }
`;

const DATA = [
  { panel_ref:"FX_2725", pixel_pitch_mm:"2.5", resolution_w:240, resolution_h:135, weight_kgs:4.0, nits:600, power_max_w:69, power_avg_w:21.0, panel_width_m:0.6, panel_height_m:0.337, refresh_rate_hz:3840, rj45_capacity:535000, power_cable_capacity:2200 },
  { panel_ref:"FX_2718", pixel_pitch_mm:"1.8", resolution_w:320, resolution_h:180, weight_kgs:4.0, nits:600, power_max_w:78, power_avg_w:23.0, panel_width_m:0.6, panel_height_m:0.337, refresh_rate_hz:3840, rj45_capacity:535000, power_cable_capacity:2200 },
  { panel_ref:"FX_2715", pixel_pitch_mm:"1.5", resolution_w:384, resolution_h:216, weight_kgs:4.0, nits:600, power_max_w:63, power_avg_w:20.0, panel_width_m:0.6, panel_height_m:0.337, refresh_rate_hz:3840, rj45_capacity:535000, power_cable_capacity:2200 },
  { panel_ref:"FX_2712", pixel_pitch_mm:"1.2", resolution_w:480, resolution_h:270, weight_kgs:4.0, nits:600, power_max_w:74, power_avg_w:22.0, panel_width_m:0.6, panel_height_m:0.337, refresh_rate_hz:3840, rj45_capacity:535000, power_cable_capacity:2200 },
  { panel_ref:"CX_2715", pixel_pitch_mm:"1.5", resolution_w:384, resolution_h:216, weight_kgs:3.8, nits:800, power_max_w:58, power_avg_w:19.6, panel_width_m:0.6, panel_height_m:0.337, refresh_rate_hz:3840, rj45_capacity:535000, power_cable_capacity:2200 },
  { panel_ref:"CX_2712", pixel_pitch_mm:"1.2", resolution_w:480, resolution_h:270, weight_kgs:3.8, nits:800, power_max_w:66, power_avg_w:22.2, panel_width_m:0.6, panel_height_m:0.337, refresh_rate_hz:3840, rj45_capacity:535000, power_cable_capacity:2200 },
  { panel_ref:"CX_2709", pixel_pitch_mm:"0.9", resolution_w:640, resolution_h:360, weight_kgs:3.8, nits:800, power_max_w:63, power_avg_w:21.2, panel_width_m:0.6, panel_height_m:0.337, refresh_rate_hz:3840, rj45_capacity:535000, power_cable_capacity:2200 },
  { panel_ref:"CM_2709", pixel_pitch_mm:"0.9", resolution_w:640, resolution_h:360, weight_kgs:4.0, nits:1000, power_max_w:53, power_avg_w:17.7, panel_width_m:0.6, panel_height_m:0.337, refresh_rate_hz:3840, rj45_capacity:535000, power_cable_capacity:2200 },
];

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
  if (mp >= 8.3)  return { label:"4K+",     color:"#34c759" };
  if (mp >= 2.07) return { label:"Full HD+", color:"#0071e3" };
  if (mp >= 0.92) return { label:"HD+",      color:"#ff9f0a" };
  if (mp >= 0.41) return { label:"SD+",      color:"#ff9f0a" };
  return                  { label:"Basse",   color:"#8e8e93" };
}
function getScreenQualityBadge(w, h) {
  const mp = (w * h) / 1000000;
  if (mp >= 8.3)  return { label:"4K+",     cls:"badge-quality-4k",  color:"#34c759" };
  if (mp >= 2.07) return { label:"Full HD+", cls:"badge-quality-fhd", color:"#0071e3" };
  if (mp >= 0.92) return { label:"HD+",      cls:"badge-quality-hd",  color:"#ff9f0a" };
  if (mp >= 0.41) return { label:"SD+",      cls:"badge-quality-sd",  color:"#ff9f0a" };
  return                  { label:"Basse",   cls:"badge-quality-sd",  color:"#8e8e93" };
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
      <div className="stat-accent-bar" />
      <div className="stat-header"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span></div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <div className="section-header">
      <span style={{fontSize:13}}>{icon}</span>
      <span className="section-header-label">{title}</span>
      <div className="section-header-line" />
    </div>
  );
}

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────
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

  // ── COLORS ──
  const C = {
    blue:   [0, 113, 227],
    blue2:  [64, 176, 255],
    green:  [52, 199, 89],
    orange: [255, 159, 10],
    red:    [255, 59, 48],
    purple: [175, 82, 222],
    bg:     [245, 245, 247],
    white:  [255, 255, 255],
    text:   [29, 29, 31],
    muted:  [110, 110, 115],
    light:  [174, 174, 178],
    border: [220, 220, 225],
  };

  // ── HELPERS ──
  const setFill = (rgb) => doc.setFillColor(...rgb);
  const setDraw = (rgb) => doc.setDrawColor(...rgb);
  const setFont = (size, style="normal", rgb=C.text) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...rgb);
  };
  const rect = (x, y, w, h, r=0, fill=true) => {
    if (r > 0) doc.roundedRect(x, y, w, h, r, r, fill ? "F" : "S");
    else doc.rect(x, y, w, h, fill ? "F" : "S");
  };
  const line = (x1, y1, x2, y2, rgb=C.border, lw=0.3) => {
    doc.setLineWidth(lw);
    setDraw(rgb);
    doc.line(x1, y1, x2, y2);
  };
  const text = (str, x, y, opts={}) => doc.text(str, x, y, opts);

  let y = 0;

  // ══════════════════════════════════════════════════════════════════
  // HEADER GRADIENT BAND
  // ══════════════════════════════════════════════════════════════════
  setFill(C.blue);
  rect(0, 0, W, 38, 0);
  // accent stripe bottom
  setFill(C.blue2);
  rect(0, 35, W, 3, 0);

  // Icon circle
  setFill(C.white);
  doc.circle(margin + 8, 19, 8, "F");
  setFont(11, "bold", C.blue);
  text("LED", margin + 8, 20.5, { align:"center" });

  // Title
  setFont(18, "bold", C.white);
  text("LED Screen Report", margin + 22, 15);
  setFont(8, "normal", [180,210,255]);
  text("Configurateur professionnel · " + new Date().toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" }), margin + 22, 23);

  // Quality badge top right
  const qColor = quality.color === "#34c759" ? C.green : quality.color === "#0071e3" ? C.blue2 : quality.color === "#ff9f0a" ? C.orange : [142,142,147];
  setFill([255,255,255,0.15]);
  rect(W - margin - 40, 11, 40, 14, 4);
  setFont(9, "bold", C.white);
  text(quality.label, W - margin - 20, 19.5, { align:"center" });

  y = 46;

  // ══════════════════════════════════════════════════════════════════
  // MODEL BANNER
  // ══════════════════════════════════════════════════════════════════
  setFill(C.bg);
  rect(margin, y, W - margin*2, 14, 4);
  setFont(11, "bold", C.blue);
  text(selected.panel_ref, margin + 8, y + 9.5);
  setFont(8, "normal", C.muted);
  text(`P${selected.pixel_pitch_mm} mm  ·  ${selected.nits} nits  ·  ${selected.resolution_w}×${selected.resolution_h} px/cabinet  ·  ${selected.refresh_rate_hz} Hz`, margin + 8 + 28, y + 9.5);

  // Resolution badge right
  setFill(C.blue);
  rect(W - margin - 46, y + 2, 46, 10, 3);
  setFont(7, "bold", C.white);
  text(`${rW} × ${rH} px`, W - margin - 23, y + 8, { align:"center" });

  y += 20;

  // ══════════════════════════════════════════════════════════════════
  // KPI CARDS ROW
  // ══════════════════════════════════════════════════════════════════
  const kpis = [
    { label:"PANNEAUX",    value:`${pW} × ${pH}`,                                   sub:`${totalPanels} total` },
    { label:"DIMENSIONS",  value:`${totalWidth.toFixed(2)} × ${totalHeight.toFixed(2)}`, sub:`${surface.toFixed(2)} m²` },
    { label:"RÉSOLUTION",  value:`${(totalPixels/1000000).toFixed(2)} Mpx`,          sub:`${rW} × ${rH}` },
    { label:"POIDS TOTAL", value:`${totalWeight.toFixed(0)} kg`,                     sub:`${selected.weight_kgs} kg/unit` },
  ];
  const kpiW = (W - margin*2 - 9) / 4;
  kpis.forEach((kpi, i) => {
    const kx = margin + i * (kpiW + 3);
    setFill(C.white);
    rect(kx, y, kpiW, 22, 3);
    setDraw(C.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(kx, y, kpiW, 22, 3, 3, "S");
    // accent top bar — noir subtil unifié
    setFill([29, 29, 31]);
    rect(kx, y, kpiW, 1.5, 0);
    setFont(6, "bold", C.light);
    text(kpi.label, kx + kpiW/2, y + 8, { align:"center" });
    setFont(9, "bold", C.text);
    text(kpi.value, kx + kpiW/2, y + 15, { align:"center" });
    setFont(6, "normal", C.muted);
    text(kpi.sub, kx + kpiW/2, y + 20, { align:"center" });
  });
  y += 28;

  // ══════════════════════════════════════════════════════════════════
  // SCREEN VISUALIZATION
  // ══════════════════════════════════════════════════════════════════
  const vizH = 50;
  setFill(C.bg);
  rect(margin, y, W - margin*2, vizH, 4);

  // Draw LED screen grid centered
  const maxScrW = 80, maxScrH = 40;
  const aspect = totalWidth / totalHeight;
  let scrW = maxScrW, scrH = maxScrW / aspect;
  if (scrH > maxScrH) { scrH = maxScrH; scrW = maxScrH * aspect; }
  const scrX = margin + (W - margin*2)/2 - scrW/2;
  const scrY = y + (vizH - scrH) / 2;

  // Screen shadow effect
  setFill([0,113,227,0.08]);
  rect(scrX + 1, scrY + 1.5, scrW, scrH, 2);

  // Panel grid
  const cellW = scrW / pW, cellH = scrH / pH;
  for (let row = 0; row < pH; row++) {
    for (let col = 0; col < pW; col++) {
      const cx = scrX + col * cellW + 0.4;
      const cy = scrY + row * cellH + 0.4;
      const cw = cellW - 0.8, ch = cellH - 0.8;
      // gradient simulation: lighter top-left to darker bottom-right
      const shade = 0.85 + (col + row) / (pW + pH) * 0.15;
      setFill([Math.round(C.blue[0]*shade), Math.round(C.blue[1]*shade + 40*(1-shade)), Math.round(255*shade)]);
      rect(cx, cy, cw, ch, 0.5);
    }
  }

  // Screen border
  setDraw([0,113,227,0.4]);
  doc.setLineWidth(0.5);
  doc.roundedRect(scrX, scrY, scrW, scrH, 1.5, 1.5, "S");

  // Bottom bar
  setFill(C.green);
  rect(scrX, scrY + scrH - 1, scrW/3, 1, 0);
  setFill(C.blue);
  rect(scrX + scrW/3, scrY + scrH - 1, scrW/3, 1, 0);
  setFill(C.purple);
  rect(scrX + 2*scrW/3, scrY + scrH - 1, scrW/3, 1, 0);

  // Dimension labels
  setFont(7, "bold", C.blue);
  const cx = scrX + scrW / 2;
  // Width arrow
  line(scrX, scrY - 4, scrX + scrW, scrY - 4, C.blue, 0.4);
  line(scrX, scrY - 6, scrX, scrY - 2, C.blue, 0.4);
  line(scrX + scrW, scrY - 6, scrX + scrW, scrY - 2, C.blue, 0.4);
  text(`${totalWidth.toFixed(2)} m · ${rW} px`, cx, scrY - 6, { align:"center" });
  // Height arrow
  line(scrX - 4, scrY, scrX - 4, scrY + scrH, C.blue, 0.4);
  line(scrX - 6, scrY, scrX - 2, scrY, C.blue, 0.4);
  line(scrX - 6, scrY + scrH, scrX - 2, scrY + scrH, C.blue, 0.4);
  doc.text(`${totalHeight.toFixed(2)} m`, scrX - 5, scrY + scrH/2 + 1.5, { align:"center", angle:90 });

  // Info badges right of screen
  const bx = scrX + scrW + 8;
  const by = scrY;
  [
    { label:"Diagonale", val:`${diagonal.toFixed(0)}"` },
    { label:"Recul min.", val:`${viewMin.toFixed(1)} m` },
    { label:"Optimal", val:`${viewOpt.toFixed(1)} m` },
    { label:"Qualité", val:quality.label },
  ].forEach((b, i) => {
    setFill(C.bg);
    setDraw(C.border);
    doc.roundedRect(bx, by + i * 10, 38, 8, 1.5, 1.5, "FD");
    setFont(6, "normal", C.muted);
    text(b.label, bx + 3, by + i*10 + 4);
    setFont(7, "bold", C.text);
    text(b.val, bx + 38 - 3, by + i*10 + 4, { align:"right" });
  });

  y += vizH + 8;

  // ══════════════════════════════════════════════════════════════════
  // TWO-COLUMN TABLES
  // ══════════════════════════════════════════════════════════════════
  const drawSection = (title, rows, x, startY, w) => {
    // Section title bar — noir premium unifié
    setFill([29, 29, 31]);
    rect(x, startY, w, 7, 2);
    setFont(7, "bold", C.white);
    text(title, x + 4, startY + 5);
    let ty = startY + 7;
    rows.forEach(([k, v], i) => {
      setFill(i % 2 === 0 ? C.white : [248,248,250]);
      rect(x, ty, w, 6.5, 0);
      setDraw(C.border);
      doc.setLineWidth(0.2);
      doc.rect(x, ty, w, 6.5, "S");
      setFont(6.5, "normal", C.muted);
      text(k, x + 3, ty + 4.5);
      setFont(6.5, "bold", C.text);
      text(v, x + w - 3, ty + 4.5, { align:"right" });
      ty += 6.5;
    });
    return ty;
  };

  const col1x = margin;
  const col2x = margin + colW + 8;

  // LEFT: Écran
  const screenRows = [
    ["Panneaux (L × H)", `${pW} × ${pH} = ${totalPanels} unités`],
    ["Dimensions réelles", `${totalWidth.toFixed(3)} × ${totalHeight.toFixed(3)} m`],
    ["Résolution totale", `${rW} × ${rH} px`],
    ["Mégapixels", `${(totalPixels/1000000).toFixed(3)} Mpx`],
    ["Ratio d'image", getRatio(rW, rH)],
    ["Densité pixels", `${pixDensity.toLocaleString()} px/m²`],
    ["Surface active", `${surface.toFixed(3)} m²`],
    ["Poids total", `${totalWeight.toFixed(1)} kg`],
    ["Qualité image", quality.label],
  ];
  const endLeft1 = drawSection("ÉCRAN", screenRows, col1x, y, colW);

  // RIGHT: Produit
  const productRows = [
    ["Référence", selected.panel_ref],
    ["Pitch pixel", `${selected.pixel_pitch_mm} mm`],
    ["Dimensions cabinet", `${selected.panel_width_m} × ${selected.panel_height_m} m`],
    ["Résolution cabinet", `${selected.resolution_w} × ${selected.resolution_h} px`],
    ["Poids unitaire", `${selected.weight_kgs} kg`],
    ["Luminosité", `${selected.nits} nits`],
    ["Refresh rate", `${selected.refresh_rate_hz} Hz`],
    ["Conso max", `${selected.power_max_w} W`],
    ["Conso moy.", `${selected.power_avg_w} W`],
  ];
  const endRight1 = drawSection("PRODUIT", productRows, col2x, y, colW);

  y = Math.max(endLeft1, endRight1) + 8;

  // LEFT: Électrique
  const powerRows = [
    ["Conso max totale", `${Math.round(totalPowerMax)} W`],
    ["Conso moy. totale", `${Math.round(totalPowerAvg)} W`],
    ["Puissance (moy.)", `${kW.toFixed(3)} kW`],
    ["BTU/heure", `${BTU.toFixed(0)} BTU/h`],
    ["Coût/an", `${(costDay*365).toFixed(0)} €`],
  ];
  const endLeft2 = drawSection("ÉLECTRIQUE", powerRows, col1x, y, colW);

  // RIGHT: Installation
  const installRows = [
    ["Lignes électriques", `${powerLines} ligne(s)`],
    ["Ports RJ45 requis", `${rj45Needed} port(s)`],
    ["Recul minimum", `${viewMin.toFixed(2)} m`],
    ["Recul optimal", `${viewOpt.toFixed(2)} m`],
    ["Poids total", `${totalWeight.toFixed(1)} kg`],
    ["Diagonale", `${diagonal.toFixed(1)}"`],
  ];
  const endRight2 = drawSection("INSTALLATION", installRows, col2x, y, colW);

  y = Math.max(endLeft2, endRight2) + 8;

  // ══════════════════════════════════════════════════════════════════
  // POWER BAR
  // ══════════════════════════════════════════════════════════════════
  const pct = totalPowerAvg / totalPowerMax;
  setFill(C.white);
  rect(margin, y, W - margin*2, 18, 3);
  setDraw(C.border);
  doc.roundedRect(margin, y, W - margin*2, 18, 3, 3, "S");
  setFont(7, "bold", C.muted);
  text("CHARGE MOYENNE VS MAX", margin + 4, y + 6);
  setFont(7, "bold", C.text);
  text(`${Math.round(pct*100)}%`, W - margin - 4, y + 6, { align:"right" });
  // track
  setFill(C.bg);
  rect(margin + 4, y + 9, W - margin*2 - 8, 5, 2);
  // fill — simulate green to orange gradient with two rects
  const barW = (W - margin*2 - 8) * pct;
  setFill(C.green);
  rect(margin + 4, y + 9, barW * 0.5, 5, 0);
  setFill(C.orange);
  rect(margin + 4 + barW * 0.5, y + 9, barW * 0.5, 5, 0);

  y += 24;

  // ══════════════════════════════════════════════════════════════════
  // CHECKLIST
  // ══════════════════════════════════════════════════════════════════
  const checks = [
    { ok: powerLines <= 4,   txt: `${powerLines} ligne(s) électrique(s) — ${powerLines<=4?"Standard (OK)":"Prévoir tableau dédié"}` },
    { ok: rj45Needed <= 8,   txt: `${rj45Needed} port(s) RJ45 — ${rj45Needed<=8?"Switch standard 8p (OK)":"Switch 16p ou supérieur requis"}` },
    { ok: totalWeight < 300, txt: `${totalWeight.toFixed(0)} kg total — ${totalWeight<300?"Structure légère (OK)":"Renforcement mural requis"}` },
    { ok: true,              txt: `Recul optimal recommandé : ${viewOpt.toFixed(1)} m minimum` },
  ];

  setFill(C.white);
  rect(margin, y, W - margin*2, 10 + checks.length * 8, 3);
  setDraw(C.border);
  doc.roundedRect(margin, y, W - margin*2, 10 + checks.length * 8, 3, 3, "S");
  setFont(7, "bold", C.muted);
  text("CHECKLIST INSTALLATION", margin + 4, y + 6);
  y += 10;
  checks.forEach((c) => {
    const dotColor = c.ok ? C.green : C.orange;
    setFill(dotColor);
    doc.circle(margin + 6, y + 2.5, 2, "F");
    setFont(7, c.ok ? "normal" : "bold", c.ok ? C.muted : C.orange);
    text(c.txt, margin + 12, y + 4);
    y += 8;
  });

  y += 6;

  // ══════════════════════════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════════════════════════
  setFill(C.blue);
  rect(0, H - 12, W, 12, 0);
  setFont(6.5, "normal", [180,210,255]);
  text("LED Calculator · Configurateur professionnel", margin, H - 5);
  text(`Généré le ${new Date().toLocaleDateString("fr-FR")} · ${selected.panel_ref} · ${rW}×${rH}px`, W - margin, H - 5, { align:"right" });

  doc.save(`LED_Report_${selected.panel_ref}_${rW}x${rH}.pdf`);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function LEDCalculator() {
  const [selIdx, setSelIdx] = useState(0);
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
  const [vizSize, setVizSize] = useState({w:600, h:290});

  const selected = DATA[selIdx];

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

  useEffect(() => {
    // Load jsPDF
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
    if (!window.jspdf) {
      alert("jsPDF est encore en cours de chargement, réessayez dans un instant.");
      return;
    }
    setPdfLoading(true);
    try {
      await generatePDF(selected, result, getScreenQuality(rW, rH));
    } catch(e) {
      console.error(e);
      alert("Erreur lors de la génération du PDF : " + e.message);
    }
    setPdfLoading(false);
  };

  return (
    <div className="led-app">
      <div className="topbar">
        <div className="topbar-brand">
          <div className="topbar-icon">💡</div>
          <div>
            <div className="topbar-title">LED Calculator</div>
            <div className="topbar-subtitle">Configurateur professionnel</div>
          </div>
        </div>
        <div className="topbar-right">
          <span className={`badge ${quality.cls}`}>{quality.label}</span>
          <span className="badge badge-res">{rW} × {rH} px</span>
        </div>
      </div>

      <div className="main-layout">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <SectionHeader icon="📦" title="Modèle de panneau" />
          <div className="product-select-wrap">
            <select className="product-select" value={selIdx} onChange={e => setSelIdx(Number(e.target.value))}>
              {DATA.map((p, i) => (
                <option key={i} value={i}>{p.panel_ref} — P{p.pixel_pitch_mm} · {p.nits} nits · {p.resolution_w}×{p.resolution_h}px</option>
              ))}
            </select>
            <span className="product-select-chevron">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="#aeaeb2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>

          <SectionHeader icon="🎛️" title="Mode de saisie" />
          <div className="mode-grid">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} className={`mode-btn ${mode === m.id ? "active" : ""}`}>
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

          <SectionHeader icon="📊" title="Résumé rapide" />
          <div className="summary-grid">
            {[
              { label:"Panneaux",    value:`${pW} × ${pH}`,                                sub:`= ${totalPanels} total` },
              { label:"Dimensions",  value:`${totalWidth.toFixed(2)} × ${totalHeight.toFixed(2)} m`, sub:`${surface.toFixed(2)} m²` },
              { label:"Résolution",  value:`${(totalPixels/1000000).toFixed(1)} Mpx`,      sub:`${rW}×${rH}` },
              { label:"Poids total", value:`${totalWeight.toFixed(0)} kg`,                 sub:`${selected.weight_kgs} kg/unit` },
            ].map(s => (
              <div key={s.label} className="summary-card">
                <div className="summary-accent" />
                <div className="summary-label">{s.label}</div>
                <div className="summary-value">{s.value}</div>
                <div className="summary-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <button className="pdf-btn" onClick={handlePDF} disabled={pdfLoading}>
            {pdfLoading ? "⏳" : "📄"} {pdfLoading ? "Génération en cours…" : "Exporter en PDF"}
          </button>
        </div>

        {/* RIGHT PANEL */}
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
                    <span style={{color:"#aeaeb2"}}>{rH} px</span>
                    {mode==="dimensions" && (Number(height)||0)>0 && (
                      <><br /><span style={{color: Math.abs(totalHeight-(Number(height)||0))<0.01?"#34c759":"#ff9f0a",fontSize:9}}>
                        ({(totalHeight-(Number(height)||0)).toFixed(2)}m)
                      </span></>
                    )}
                  </span>
                  <div className="height-line" />
                </div>
                <div className="led-screen" style={{ width: scrW, height: scrH, boxShadow: "0 4px 24px rgba(0,113,227,0.15), 0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div className="led-grid" style={{ gridTemplateColumns: `repeat(${pW},1fr)`, gridTemplateRows: `repeat(${pH},1fr)` }}>
                    {Array.from({length: pW*pH}).map((_,i) => <div key={i} className="led-panel-cell" />)}
                  </div>
                  <div className="screen-overlay-tl">
                    <div className="screen-overlay-title">{pW} × {pH} cabinets</div>
                    <div className="screen-overlay-sub">{rW} × {rH} px · {surface.toFixed(1)} m²</div>
                  </div>
                  <div className="screen-overlay-tr" style={{ background: quality.color + "18", border: `1px solid ${quality.color}30` }}>
                    <span style={{color: quality.color, fontSize:10, fontWeight:700}}>{quality.label}</span>
                  </div>
                  <div className="screen-bottom-bar" />
                </div>
                <div style={{width:64}} />
              </div>
              <div className="viz-badges">
                <span className="viz-badge" style={{color:"#ff9f0a",background:"rgba(255,159,10,0.08)",borderColor:"rgba(255,159,10,0.2)"}}>👁️ Min: {viewMin.toFixed(1)} m</span>
                <span className="viz-badge" style={{color:"#34c759",background:"rgba(52,199,89,0.08)",borderColor:"rgba(52,199,89,0.2)"}}>✓ Optimal: {viewOpt.toFixed(1)} m</span>
                <span className="viz-badge" style={{color:"#0071e3",background:"rgba(0,113,227,0.08)",borderColor:"rgba(0,113,227,0.2)"}}>📐 {diagonal.toFixed(0)}"</span>
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
                  <StatCard icon="📏" label="Pitch pixel" value={`${selected.pixel_pitch_mm} mm`} sub="Résolution angulaire" accent="#0071e3" />
                  <StatCard icon="💡" label="Luminosité" value={`${selected.nits} nits`} sub="Luminance max" accent="#ff9f0a" />
                  <StatCard icon="🔄" label="Refresh rate" value={`${selected.refresh_rate_hz} Hz`} sub="Fréquence rafraîch." accent="#34c759" />
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Paramètre</th><th>Valeur</th></tr></thead>
                    <tbody>
                      {[
                        ["Référence produit", selected.panel_ref],
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
                  <StatCard icon="⬛" label="Total panneaux" value={`${pW} × ${pH}`} sub={`= ${totalPanels} cabinets`} accent="#0071e3" />
                  <StatCard icon="📐" label="Surface totale" value={`${surface.toFixed(2)} m²`} sub={`${totalWidth.toFixed(2)} × ${totalHeight.toFixed(2)} m`} accent="#af52de" />
                  <StatCard icon="🎯" label="Résolution" value={`${(totalPixels/1000000).toFixed(2)} Mpx`} sub={`${rW} × ${rH} px`} accent="#34c759" />
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
                        ["Qualité image", quality.label],
                      ].map(([k,v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === "power" && (
              <div>
                <div className="stat-grid-3">
                  <StatCard icon="⚡" label="Conso max" value={`${Math.round(totalPowerMax)} W`} sub={`${(totalPowerMax/1000).toFixed(2)} kW`} accent="#ff3b30" />
                  <StatCard icon="📉" label="Conso moy." value={`${Math.round(totalPowerAvg)} W`} sub={`${(totalPowerAvg/1000).toFixed(2)} kW`} accent="#ff9f0a" />
                  <StatCard icon="🌡️" label="BTU/h" value={BTU.toFixed(0)} sub="Dissipation thermique" accent="#af52de" />
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
                        ["Coût/an",                  `${(costDay*365).toFixed(0)} €`],
                      ].map(([k,v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === "install" && (
              <div>
                <div className="stat-grid-2">
                  <StatCard icon="🔌" label="Lignes électriques" value={`${powerLines}`} sub={`${selected.power_cable_capacity||2200} W/ligne`} accent="#ff3b30" />
                  <StatCard icon="🌐" label="Ports RJ45" value={`${rj45Needed}`} sub={`${(selected.rj45_capacity||535000).toLocaleString()} px/port`} accent="#0071e3" />
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