"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabaseClient";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:          #0f0f0f;
    --surface:     #1a1a1a;
    --surface2:    #242424;
    --surface3:    #2e2e2e;
    --border:      #2e2e2e;
    --border-hover:#444444;
    --text:        #f0f0f0;
    --text-muted:  #888888;
    --text-dim:    #555555;
    --accent:      #e8ff47;
    --accent2:     #47c4ff;
    --green:       #47ffb3;
    --orange:      #ffb347;
    --red:         #ff5147;
    --font-ui:     'Syne', sans-serif;
    --font-mono:   'DM Mono', monospace;
  }

  html, body, #root { height: 100%; width: 100%; overflow: hidden; }
  body { font-family: var(--font-ui); background: var(--bg); color: var(--text); }

  .led-app {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg);
    position: relative;
  }



  /* ── TOPBAR ── */
  .topbar {
    height: 52px;
    min-height: 52px;
    background: rgba(15,15,15,0.96);
    border-bottom: 1px solid var(--border);
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    z-index: 100;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    flex-shrink: 0;
  }
  .topbar::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    background: var(--border);
  }

  .topbar-brand { display: flex; align-items: center; gap: 10px; }
  .topbar-logo {
    width: 28px; height: 28px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 2px;
    padding: 4px;
    border: 1px solid var(--border-hover);
    background: var(--surface2);
    border-radius: 4px;
    position: relative;
  }

  .topbar-logo-cell { border-radius: 1px; background: var(--accent); }
  .topbar-logo-cell.dim { background: var(--surface3); }
  .topbar-title { font-size: 14px; font-weight: 700; color: var(--text); letter-spacing: 0.06em; }
  .topbar-subtitle { font-size: 10px; color: var(--text-muted); letter-spacing: 0.18em; text-transform: uppercase; margin-top: 1px; font-family: var(--font-mono); }

  .topbar-kpis { display: flex; align-items: center; gap: 16px; }
  .topbar-kpi { text-align: center; }
  .topbar-kpi-label { font-size: 9px; color: var(--text-muted); letter-spacing: 0.16em; text-transform: uppercase; font-family: var(--font-mono); }
  .topbar-kpi-value { font-size: 12px; font-weight: 600; color: var(--text); margin-top: 2px; font-family: var(--font-mono); }
  .topbar-sep { width: 1px; height: 24px; background: var(--border); }
  .topbar-right { display: flex; align-items: center; gap: 8px; }

  .topbar-badge {
    padding: 4px 10px;
    border: 1px solid var(--border-hover);
    font-size: 8px; font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    border-radius: 3px;
    background: var(--surface2);
    font-family: var(--font-mono);
  }
  .admin-btn {
    padding: 6px 12px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-muted);
    font-size: 8px; font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase;
    cursor: pointer;
    font-family: var(--font-ui);
    border-radius: 3px;
    transition: all 0.2s;
  }
  .admin-btn:hover { border-color: var(--border-hover); color: var(--text); }
  .pdf-topbar-btn {
    padding: 7px 16px;
    border: none;
    background: var(--accent);
    color: #000;
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    cursor: pointer;
    font-family: var(--font-ui);
    border-radius: 8px;
    transition: all 0.2s;
  }
  .pdf-topbar-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(232,255,71,0.3); }
  .pdf-topbar-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── MAIN LAYOUT ── */
  .main-layout {
    display: grid;
    grid-template-columns: 272px 1fr;
    flex: 1;
    min-height: 0;
    position: relative;
    z-index: 1;
  }

  /* ── LEFT PANEL ── */
  .left-panel {
    background: var(--surface);
    border-right: 1px solid var(--border);
    overflow-y: auto;
    padding: 16px 14px;
    scrollbar-width: thin;
    scrollbar-color: var(--border-hover) transparent;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .left-panel::-webkit-scrollbar { width: 4px; }
  .left-panel::-webkit-scrollbar-track { background: transparent; }
  .left-panel::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 4px; }

  .section-header {
    font-size: 10px; font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin-bottom: 8px;
    margin-top: 14px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 6px;
  }
  .section-header::before {
    content: '';
    width: 3px; height: 3px;
    background: var(--accent);
    border-radius: 50%;
    flex-shrink: 0;
  }
  .section-header:first-child { margin-top: 0; }

  /* Product select */
  .product-select-wrap { position: relative; margin-bottom: 10px; }
  .product-select {
    width: 100%;
    appearance: none;
    background: var(--surface2);
    border: 1px solid var(--border);
    padding: 8px 28px 8px 10px;
    font-family: var(--font-ui);
    font-size: 12px;
    color: var(--text);
    cursor: pointer;
    outline: none;
    border-radius: 8px;
    transition: border-color 0.2s;
  }
  .product-select:focus { border-color: var(--accent); }
  .product-select option { background: var(--surface2); }
  .product-select-chevron { position: absolute; right: 9px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-dim); }

  /* Mode grid */
  .mode-grid { display: flex; gap: 6px; margin-bottom: 14px; }
  .mode-btn {
    flex: 1; padding: 8px 4px;
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    text-align: center;
    background: var(--surface2);
    font-family: var(--font-ui);
    transition: all 0.15s;
  }
  .mode-btn.active {
    background: var(--accent);
    border-color: var(--accent);
  }
  .mode-icon { font-size: 14px; margin-bottom: 3px; }
  .mode-label { font-size: 10px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.1em; text-transform: uppercase; }
  .mode-btn.active .mode-label { color: #000; }

  /* Inputs */
  .input-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
  .input-label { font-size: 10px; color: var(--text-muted); display: block; margin-bottom: 4px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; font-family: var(--font-mono); }

  .spinbox {
    display: flex; align-items: center;
    border: 1px solid var(--border);
    background: var(--surface2);
    height: 34px;
    border-radius: 4px;
    overflow: hidden;
    transition: border-color 0.2s;
  }
  .spinbox:focus-within { border-color: var(--accent); }
  .spinbox-btn {
    width: 30px; background: transparent; border: none;
    color: var(--text-muted); font-size: 15px; cursor: pointer; height: 100%;
    transition: background 0.15s, color 0.15s;
  }
  .spinbox-btn:hover { background: var(--surface3); color: var(--accent); }
  .spinbox-input {
    flex: 1; text-align: center; background: transparent; border: none;
    color: var(--text); font-size: 12px; font-weight: 600; outline: none;
    font-family: var(--font-mono);
  }
  .spinbox-unit { color: var(--text-dim); font-size: 9px; padding-right: 8px; letter-spacing: 0.08em; font-family: var(--font-mono); }

  /* Summary grid */
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 12px; }
  .summary-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-left: 2px solid var(--accent);
    padding: 8px 9px;
    border-radius: 8px;
    transition: border-color 0.15s;
  }
  .summary-card:hover { border-color: var(--border-hover); }
  .summary-label { font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.16em; font-weight: 700; margin-bottom: 3px; font-family: var(--font-mono); }
  .summary-value { font-size: 12px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; font-family: var(--font-mono); }
  .summary-sub { font-size: 9px; color: var(--text-muted); margin-top: 1px; font-family: var(--font-mono); }

  .pdf-btn {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    width: 100%; padding: 11px 14px;
    border: none;
    cursor: pointer; font-family: var(--font-ui); font-size: 10px; font-weight: 700;
    background: var(--accent);
    color: #000; letter-spacing: 0.14em; text-transform: uppercase;
    border-radius: 8px;
    transition: all 0.15s;
    margin-top: auto;
  }
  .pdf-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(232,255,71,0.3); }
  .pdf-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── RIGHT PANEL ── */
  .right-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  /* ── VIZ AREA ── */
  .viz-area {
    flex: 0 0 260px;
    min-height: 0;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .viz-grid-bg {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  .screen-container { position: relative; z-index: 2; }
  .dim-label { text-align: center; margin-bottom: 6px; display: flex; justify-content: center; align-items: center; gap: 8px; }
  .dim-line { height: 1px; background: rgba(255,255,255,0.15); }
  .dim-text { color: var(--text-muted); font-size: 10px; font-weight: 600; white-space: nowrap; letter-spacing: 0.06em; font-family: var(--font-mono); }
  .dim-diff-ok { color: var(--green); margin-left: 4px; font-size: 8px; }
  .dim-diff-warn { color: var(--orange); margin-left: 4px; font-size: 8px; }

  .screen-row { display: flex; align-items: center; gap: 10px; }
  .height-label { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 56px; }
  .height-line { width: 1px; flex: 1; background: rgba(255,255,255,0.15); }
  .height-text { color: var(--text-muted); font-size: 10px; font-weight: 600; text-align: center; line-height: 1.5; font-family: var(--font-mono); }

  .led-screen {
    position: relative; border-radius: 3px; overflow: hidden;
    border: 1px solid #444;
    box-shadow: 0 8px 40px rgba(0,0,0,0.6);
  }
  .led-grid { position: absolute; inset: 0; display: grid; gap: 1px; padding: 1px; }
  .led-panel-cell { background: transparent; border-radius: 1px; border: 1px solid rgba(255,255,255,0.08); }

  .screen-overlay-tl {
    position: absolute; top: 7px; left: 7px;
    background: rgba(0,0,0,0.82);
    padding: 4px 8px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 4px;
    backdrop-filter: blur(8px);
  }
  .screen-overlay-title { color: var(--text); font-weight: 700; font-size: 9px; letter-spacing: 0.04em; }
  .screen-overlay-sub { color: var(--text-muted); font-size: 8px; margin-top: 1px; font-family: var(--font-mono); }
  .screen-bottom-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--green), var(--accent), var(--accent2)); }

  .viz-badges { text-align: center; margin-top: 8px; display: flex; justify-content: center; gap: 6px; }
  .viz-badge {
    font-size: 10px; font-weight: 700; padding: 4px 10px;
    border: 1px solid; border-radius: 20px;
    letter-spacing: 0.06em; font-family: var(--font-mono);
  }

  /* ── TABS ── */
  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--border);
    background: var(--surface2);
    flex-shrink: 0;
  }
  .tab-btn {
    flex: 1; padding: 10px 6px;
    border: none; cursor: pointer; background: transparent;
    border-bottom: 2px solid transparent;
    color: var(--text-dim);
    font-size: 11px; font-weight: 700;
    font-family: var(--font-ui); letter-spacing: 0.08em; text-transform: uppercase;
    transition: all 0.2s;
  }
  .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); background: var(--surface); }
  .tab-btn:hover:not(.active) { color: var(--text-muted); }

  /* ── TAB CONTENT ── */
  .tab-content {
    flex: 1; overflow-y: auto; padding: 16px 20px;
    background: var(--surface);
    scrollbar-width: thin;
    scrollbar-color: var(--border-hover) transparent;
    min-height: 0;
  }
  .tab-content::-webkit-scrollbar { width: 4px; }
  .tab-content::-webkit-scrollbar-thumb { background: rgba(124,111,255,0.3); border-radius: 4px; }

  /* ── STAT CARDS ── */
  .stat-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px; }
  .stat-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-top: 2px solid var(--accent);
    padding: 12px 13px;
    border-radius: 12px;
    transition: all 0.15s;
    position: relative;
    overflow: hidden;
  }
  .stat-card:hover { border-color: var(--border-hover); box-shadow: 0 4px 20px rgba(0,0,0,0.4); transform: translateY(-1px); }
  .stat-header { display: flex; align-items: center; gap: 5px; margin-bottom: 6px; }
  .stat-icon { font-size: 13px; }
  .stat-label { color: var(--text-muted); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; font-family: var(--font-mono); }
  .stat-value { color: var(--text); font-size: 18px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; font-family: var(--font-mono); }
  .stat-sub { color: var(--text-muted); font-size: 10px; margin-top: 4px; font-family: var(--font-mono); }

  /* ── TABLES ── */
  .data-table-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 12px;
  }
  .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .data-table thead tr { background: var(--surface2); }
  .data-table th {
    text-align: left; padding: 9px 14px;
    color: var(--text-muted); font-weight: 700; font-size: 9px;
    text-transform: uppercase; letter-spacing: 0.18em;
    font-family: var(--font-mono);
  }
  .data-table th:last-child { text-align: right; }
  .data-table td { padding: 8px 14px; border-top: 1px solid var(--border); }
  .data-table td:first-child { color: var(--text-muted); font-size: 12px; }
  .data-table td:last-child { color: var(--text); font-weight: 600; text-align: right; font-family: var(--font-mono); font-size: 12px; }
  .data-table tr:hover td { background: var(--surface2); }

  /* ── POWER BAR ── */
  .power-bar-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 14px; margin-bottom: 12px;
  }
  .power-bar-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .power-bar-label { color: var(--text-muted); font-size: 11px; letter-spacing: 0.08em; font-family: var(--font-mono); }
  .power-bar-pct { color: var(--text); font-size: 13px; font-weight: 700; font-family: var(--font-mono); }
  .power-bar-track { height: 4px; background: var(--surface2); border-radius: 4px; overflow: hidden; }
  .power-bar-fill { height: 100%; background: linear-gradient(90deg, var(--green), var(--accent)); border-radius: 4px; transition: width 0.6s ease; }

  /* ── CHECKLIST ── */
  .checklist {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 14px;
  }
  .checklist-title { font-size: 9px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 10px; font-family: var(--font-mono); }
  .checklist-item { display: flex; align-items: center; gap: 9px; padding: 7px 0; border-bottom: 1px solid var(--border); }
  .checklist-item:last-child { border-bottom: none; }
  .checklist-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .checklist-text { font-size: 12px; color: var(--text-muted); }
  .checklist-text.warn { color: var(--orange); }

  /* Loading state */
  .loading-screen {
    width: 100vw; height: 100vh;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 16px;
    background: var(--bg);
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.1em;
  }
  .loading-dot {
    display: inline-block;
    animation: pulse 1.2s ease-in-out infinite;
  }
  .loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .loading-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes pulse { 0%,80%,100% { opacity: 0.3; } 40% { opacity: 1; } }

  /* Responsive */
  @media (max-width: 768px) {
    .main-layout { grid-template-columns: 1fr; height: auto; overflow: auto; }
    .left-panel { border-right: none; border-bottom: 1px solid var(--border); max-height: none; }
    .right-panel { min-height: 0; }
    .viz-area { flex: 0 0 200px; }
    .topbar-kpis { display: none; }
    .topbar { padding: 0 12px; }
    .stat-grid-3 { grid-template-columns: 1fr 1fr; }
  }
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
  if (mp >= 8.3)  return { label: "4K+",     color: "#2affa3" };
  if (mp >= 2.07) return { label: "Full HD+", color: "#47c4ff" };
  if (mp >= 0.92) return { label: "HD+",      color: "#ffaa3d" };
  return                  { label: "SD+",     color: "#7b82b4" };
}

function SpinBox({ value, onChange, step = 1, min = 0, unit = "" }) {
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

function StatCard({ icon, label, value, sub, accentColor }) {
  return (
    <div className="stat-card" style={accentColor ? { borderTopColor: accentColor } : {}}>
      <div className="stat-header">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
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
    blue:[124,111,255], blue2:[201,106,255], green:[42,255,163], orange:[255,170,61],
    red:[255,92,120], pink:[240,106,255], bg:[7,8,15], surface:[13,15,28],
    surface2:[17,19,37], white:[255,255,255], text:[232,234,246],
    muted:[123,130,180], dim:[61,68,116], border:[100,120,255],
    dark:[7,8,15],
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
  setFill(C.dark); rect(0, 0, W, 40, 0);
  // Gradient accent line
  setFill(C.blue); rect(0, 38, W * 0.5, 2, 0);
  setFill(C.blue2); rect(W * 0.5, 38, W * 0.3, 2, 0);
  setFill(C.pink); rect(W * 0.8, 38, W * 0.2, 2, 0);

  setFont(18, "bold", C.white);
  text("LED Screen Report", margin + 22, 16);
  setFont(8, "normal", C.muted);
  text("Configurateur professionnel · " + new Date().toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" }), margin + 22, 24);
  setFont(7, "bold", C.blue); text(quality.label, W - margin - 4, 20, { align:"right" });

  y = 48;

  // MODEL BANNER
  setFill(C.surface2); rect(margin, y, W - margin*2, 14, 3);
  setFill(C.blue); rect(margin, y, 3, 14, 0);
  setFont(10, "bold", C.text); text(selected.panel_ref, margin + 8, y + 9);
  setFont(7.5, "normal", C.muted);
  text(`P${selected.pixel_pitch_mm} mm  ·  ${selected.nits} nits  ·  ${selected.resolution_w}×${selected.resolution_h} px  ·  ${selected.refresh_rate_hz} Hz`, margin + 38, y + 9);
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
    setFill(C.surface2); rect(kx, y, kpiW, 22, 2);
    setDraw(C.blue); doc.setLineWidth(0.4); doc.roundedRect(kx, y, kpiW, 22, 2, 2, "S");
    setFill(C.blue); rect(kx, y, kpiW, 1.5, 0);
    setFont(6, "bold", C.muted); text(kpi.label, kx + kpiW/2, y + 8, { align:"center" });
    setFont(9, "bold", C.text); text(kpi.value, kx + kpiW/2, y + 15, { align:"center" });
    setFont(6, "normal", C.dim); text(kpi.sub, kx + kpiW/2, y + 20, { align:"center" });
  });
  y += 28;

  // SCREEN VIZ
  const vizH = 50;
  setFill(C.surface); rect(margin, y, W - margin*2, vizH, 3);
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
      const t = col / Math.max(pW-1, 1);
      setFill([Math.round(124 - t*80), Math.round(111 + t*50), Math.round(255 - t*50)]);
      rect(cx, cy, cellW - 0.8, cellH - 0.8, 0.5);
    }
  }
  setDraw(C.blue); doc.setLineWidth(0.5); doc.roundedRect(scrX, scrY, scrW, scrH, 1.5, 1.5, "S");
  setFont(7, "bold", C.muted);
  text(`${totalWidth.toFixed(2)} m · ${rW} px`, scrX + scrW/2, scrY - 4, { align:"center" });
  const bx = scrX + scrW + 8, by = scrY;
  [
    { label:"Diagonale", val:`${diagonal.toFixed(0)}"` },
    { label:"Recul min.", val:`${viewMin.toFixed(1)} m` },
    { label:"Optimal",   val:`${viewOpt.toFixed(1)} m` },
    { label:"Qualité",   val:quality.label },
  ].forEach((b, i) => {
    setFill(C.surface2); setDraw(C.blue); doc.roundedRect(bx, by + i * 10, 38, 8, 1.5, 1.5, "FD");
    setFont(6, "normal", C.muted); text(b.label, bx + 3, by + i*10 + 4);
    setFont(7, "bold", C.text); text(b.val, bx + 38 - 3, by + i*10 + 4, { align:"right" });
  });
  y += vizH + 8;

  const drawSection = (title, rows, x, startY, w) => {
    setFill(C.blue); rect(x, startY, 3, rows.length * 6.5 + 7, 0);
    setFill(C.surface2); rect(x + 3, startY, w - 3, 7, 0);
    setFont(7, "bold", C.text); text(title, x + 6, startY + 5);
    let ty = startY + 7;
    rows.forEach(([k, v], i) => {
      setFill(i % 2 === 0 ? C.surface : C.surface2); rect(x + 3, ty, w - 3, 6.5, 0);
      setDraw([...C.blue, 0.1]); doc.setLineWidth(0.15); doc.rect(x + 3, ty, w - 3, 6.5, "S");
      setFont(6.5, "normal", C.muted); text(k, x + 6, ty + 4.5);
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
  setFill(C.surface2); rect(margin, y, W - margin*2, 18, 2);
  setDraw(C.blue); doc.roundedRect(margin, y, W - margin*2, 18, 2, 2, "S");
  setFont(7, "bold", C.muted); text("CHARGE MOYENNE VS MAX", margin + 4, y + 6);
  setFont(7, "bold", C.text); text(`${Math.round(pct*100)}%`, W - margin - 4, y + 6, { align:"right" });
  setFill(C.surface); rect(margin + 4, y + 9, W - margin*2 - 8, 5, 2);
  const barW2 = (W - margin*2 - 8) * pct;
  setFill(C.green); rect(margin + 4, y + 9, barW2 * 0.5, 5, 0);
  setFill(C.blue); rect(margin + 4 + barW2 * 0.5, y + 9, barW2 * 0.5, 5, 0);
  y += 24;

  const checks = [
    { ok: powerLines <= 4,   txt: `${powerLines} ligne(s) électrique(s) — ${powerLines<=4?"Standard (OK)":"Prévoir tableau dédié"}` },
    { ok: rj45Needed <= 8,   txt: `${rj45Needed} port(s) RJ45 — ${rj45Needed<=8?"Switch standard 8p (OK)":"Switch 16p requis"}` },
    { ok: totalWeight < 300, txt: `${totalWeight.toFixed(0)} kg total — ${totalWeight<300?"Structure légère (OK)":"Renforcement requis"}` },
    { ok: true,              txt: `Recul optimal recommandé : ${viewOpt.toFixed(1)} m minimum` },
  ];
  setFill(C.surface2); rect(margin, y, W - margin*2, 10 + checks.length * 8, 2);
  setDraw(C.blue); doc.roundedRect(margin, y, W - margin*2, 10 + checks.length * 8, 2, 2, "S");
  setFont(7, "bold", C.muted); text("CHECKLIST INSTALLATION", margin + 4, y + 6);
  y += 10;
  checks.forEach((c) => {
    setFill(c.ok ? C.green : C.orange); doc.circle(margin + 6, y + 2.5, 2, "F");
    setFont(7, c.ok ? "normal" : "bold", c.ok ? C.muted : C.orange); text(c.txt, margin + 12, y + 4);
    y += 8;
  });

  // Footer
  setFill(C.dark); rect(0, H - 12, W, 12, 0);
  setFill(C.blue); rect(0, H - 12, W, 1.5, 0);
  setFont(6.5, "normal", C.dim);
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
  const [vizSize, setVizSize] = useState({ w: 600, h: 260 });

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
    const obs = new ResizeObserver(([e]) => setVizSize({ w: e.contentRect.width, h: e.contentRect.height }));
    if (vizRef.current) obs.observe(vizRef.current);
    return () => obs.disconnect();
  }, []);

  const brands = ["all", ...new Set(products.map(p => p.marque).filter(Boolean))];
  const filtered = brandFilter === "all" ? products : products.filter(p => p.marque === brandFilter);
  const selected = filtered[selIdx] || filtered[0] || null;

  if (products.length === 0) return (
    <div className="loading-screen">
      <div style={{ color: "#e8ff47", fontSize: 20, fontWeight: 700, letterSpacing: "0.1em" }}>LED Calculator</div>
      <div style={{ display: "flex", gap: 4 }}>
        <span className="loading-dot" style={{ color: "#e8ff47" }}>●</span>
        <span className="loading-dot" style={{ color: "#47c4ff" }}>●</span>
        <span className="loading-dot" style={{ color: "#47ffb3" }}>●</span>
      </div>
      <span>Chargement des produits…</span>
    </div>
  );

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
  const quality     = getScreenQuality(rW, rH);
  const viewMin     = parseFloat(selected.pixel_pitch_mm) * 1;
  const viewOpt     = parseFloat(selected.pixel_pitch_mm) * 2;
  const BTU         = totalPowerAvg * 3.412 * 0.6;
  const kW          = totalPowerAvg / 1000;
  const costDay     = kW * 0.22 * 10;
  const pixDensity  = surface ? Math.round(totalPixels / surface) : 0;

  const PAD = 80;
  const safeW = totalWidth || 1, safeH = totalHeight || 1;
  const scale = Math.min((vizSize.w - PAD * 2) / safeW, (vizSize.h - PAD) / safeH);
  const scrW  = Math.max(40, safeW * scale);
  const scrH  = Math.max(30, safeH * scale);

  const MODES = [
    { id: "dimensions", label: "Dimensions", icon: "📐" },
    { id: "panels",     label: "Panneaux",   icon: "⬛" },
    { id: "resolution", label: "Résolution", icon: "🎯" },
  ];
  const TABS = [
    { id: "product",  label: "Produit",      icon: "📦" },
    { id: "screen",   label: "Écran",        icon: "🖥️" },
    { id: "power",    label: "Électrique",   icon: "⚡" },
    { id: "install",  label: "Installation", icon: "🔧" },
  ];

  const handlePDF = async () => {
    if (!window.jspdf) { alert("jsPDF charge encore, réessayez."); return; }
    setPdfLoading(true);
    try { await generatePDF(selected, result, quality); }
    catch (e) { alert("Erreur PDF : " + e.message); }
    setPdfLoading(false);
  };

  return (
    <div className="led-app">
      {/* TOPBAR */}
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
          <div className="topbar-sep" />
          <div className="topbar-kpi">
            <div className="topbar-kpi-label">Poids</div>
            <div className="topbar-kpi-value">{totalWeight.toFixed(0)} kg</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="topbar-badge" style={{ color: quality.color, borderColor: quality.color + "55", background: quality.color + "18" }}>{quality.label}</div>
          <button onClick={onAdmin} className="admin-btn">Admin</button>
          <button onClick={handlePDF} disabled={pdfLoading} className="pdf-topbar-btn">
            {pdfLoading ? "⏳ Génération…" : "⬇ Exporter PDF"}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="main-layout">
        {/* LEFT */}
        <div className="left-panel">
          <div className="section-header">Modèle de panneau</div>
          <div style={{ marginBottom: 8 }}>
            <label className="input-label">Marque</label>
            <div className="product-select-wrap">
              <select className="product-select" value={brandFilter} onChange={e => { setBrandFilter(e.target.value); setSelIdx(0); }}>
                <option value="all">Toutes les marques</option>
                {brands.filter(b => b !== "all").map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <span className="product-select-chevron">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </div>
          </div>
          <div className="product-select-wrap">
            <select className="product-select" value={selIdx} onChange={e => setSelIdx(Number(e.target.value))}>
              {filtered.map((p, i) => (
                <option key={i} value={i}>{p.panel_ref} — P{p.pixel_pitch_mm} · {p.nits} nits · {p.resolution_w}×{p.resolution_h}px</option>
              ))}
            </select>
            <span className="product-select-chevron">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
              { label: "Panneaux",   value: `${pW} × ${pH}`,                                         sub: `= ${totalPanels} total`,  accent: "#e8ff47" },
              { label: "Dimensions", value: `${totalWidth.toFixed(2)} × ${totalHeight.toFixed(2)} m`, sub: `${surface.toFixed(2)} m²`, accent: "#47c4ff" },
              { label: "Résolution", value: `${(totalPixels/1000000).toFixed(1)} Mpx`,                sub: `${rW}×${rH}`,              accent: "#47c4ff" },
              { label: "Poids",      value: `${totalWeight.toFixed(0)} kg`,                           sub: `${selected.weight_kgs} kg/u`, accent: "#47ffb3" },
            ].map(s => (
              <div key={s.label} className="summary-card" style={{ borderLeftColor: s.accent }}>
                <div className="summary-label">{s.label}</div>
                <div className="summary-value">{s.value}</div>
                <div className="summary-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <button className="pdf-btn" onClick={handlePDF} disabled={pdfLoading}>
            {pdfLoading ? "⏳ Génération en cours…" : "⬇ Exporter en PDF"}
          </button>
        </div>

        {/* RIGHT */}
        <div className="right-panel">
          {/* VIZ */}
          <div className="viz-area" ref={vizRef}>
            <div className="viz-grid-bg" />
            <div className="screen-container">
              <div className="dim-label">
                <div className="dim-line" style={{ width: Math.max(0, scrW/2 - 28) }} />
                <span className="dim-text">
                  {totalWidth.toFixed(2)} m · {rW} px
                  {mode === "dimensions" && (Number(width)||0) > 0 && (
                    <span className={Math.abs(totalWidth-(Number(width)||0)) < 0.01 ? "dim-diff-ok" : "dim-diff-warn"}>
                      ({(totalWidth-(Number(width)||0)).toFixed(2)}m)
                    </span>
                  )}
                </span>
                <div className="dim-line" style={{ width: Math.max(0, scrW/2 - 28) }} />
              </div>
              <div className="screen-row">
                <div className="height-label">
                  <div className="height-line" />
                  <span className="height-text">
                    {totalHeight.toFixed(2)} m<br />
                    <span style={{ color: "#3d4474" }}>{rH} px</span>
                    {mode === "dimensions" && (Number(height)||0) > 0 && (
                      <><br /><span style={{ color: Math.abs(totalHeight-(Number(height)||0)) < 0.01 ? "#47ffb3" : "#ffb347", fontSize: 8 }}>
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
                    {Array.from({ length: pW * pH }).map((_, i) => <div key={i} className="led-panel-cell" />)}
                  </div>
                  <div className="screen-overlay-tl">
                    <div className="screen-overlay-title">{pW} × {pH} cabinets</div>
                    <div className="screen-overlay-sub">{rW} × {rH} px · {surface.toFixed(1)} m²</div>
                  </div>
                  <div className="screen-bottom-bar" />
                </div>
                <div style={{ width: 64 }} />
              </div>
              <div className="viz-badges">
                <span className="viz-badge" style={{ color: "#ffb347", background: "rgba(255,179,71,0.1)", borderColor: "rgba(255,179,71,0.25)" }}>
                  👁 Min: {viewMin.toFixed(1)} m
                </span>
                <span className="viz-badge" style={{ color: "#47ffb3", background: "rgba(71,255,179,0.1)", borderColor: "rgba(71,255,179,0.25)" }}>
                  ✓ Optimal: {viewOpt.toFixed(1)} m
                </span>
                <span className="viz-badge" style={{ color: "#47c4ff", background: "rgba(71,196,255,0.1)", borderColor: "rgba(71,196,255,0.25)" }}>
                  📐 {diagonal.toFixed(0)}"
                </span>
                <span className="viz-badge" style={{ color: quality.color, background: quality.color + "18", borderColor: quality.color + "44" }}>
                  ◈ {quality.label}
                </span>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="tab-bar">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tab-btn ${activeTab === t.id ? "active" : ""}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="tab-content">
            {activeTab === "product" && (
              <div>
                <div className="stat-grid-3">
                  <StatCard icon="📏" label="Pitch pixel" value={`${selected.pixel_pitch_mm} mm`} sub="Résolution angulaire" accentColor="#e8ff47" />
                  <StatCard icon="💡" label="Luminosité" value={`${selected.nits} nits`} sub="Luminance max" accentColor="#ffb347" />
                  <StatCard icon="🔄" label="Refresh rate" value={`${selected.refresh_rate_hz} Hz`} sub="Fréquence rafraîch." accentColor="#47c4ff" />
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Paramètre</th><th>Valeur</th></tr></thead>
                    <tbody>
                      {[
                        ["Référence produit", selected.panel_ref],
                        ["Type LED", selected.type_led || "—"],
                        ["Série", selected.brand || "—"],
                        ["Marque", selected.marque || "—"],
                        ["Pitch pixel", `${selected.pixel_pitch_mm} mm`],
                        ["Dimensions cabinet", `${selected.panel_width_m} × ${selected.panel_height_m} m`],
                        ["Résolution cabinet", `${selected.resolution_w} × ${selected.resolution_h} px`],
                        ["Poids unitaire", `${selected.weight_kgs} kg`],
                        ["Luminosité", `${selected.nits} nits`],
                        ["Refresh rate", `${selected.refresh_rate_hz} Hz`],
                        ["Conso max (unité)", `${selected.power_max_w} W`],
                        ["Conso moy. (unité)", `${selected.power_avg_w} W`],
                      ].map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === "screen" && (
              <div>
                <div className="stat-grid-3">
                  <StatCard icon="⬛" label="Total panneaux" value={`${pW} × ${pH}`} sub={`= ${totalPanels} cabinets`} accentColor="#47c4ff" />
                  <StatCard icon="📐" label="Surface totale" value={`${surface.toFixed(2)} m²`} sub={`${totalWidth.toFixed(2)} × ${totalHeight.toFixed(2)} m`} accentColor="#e8ff47" />
                  <StatCard icon="🎯" label="Résolution" value={`${(totalPixels/1000000).toFixed(2)} Mpx`} sub={`${rW} × ${rH} px`} accentColor={quality.color} />
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
                      ].map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === "power" && (
              <div>
                <div className="stat-grid-3">
                  <StatCard icon="⚡" label="Conso max" value={`${Math.round(totalPowerMax)} W`} sub={`${(totalPowerMax/1000).toFixed(2)} kW`} accentColor="#ff5147" />
                  <StatCard icon="📉" label="Conso moy." value={`${Math.round(totalPowerAvg)} W`} sub={`${(totalPowerAvg/1000).toFixed(2)} kW`} accentColor="#ffb347" />
                  <StatCard icon="🌡️" label="BTU/h" value={BTU.toFixed(0)} sub="Dissipation thermique" accentColor="#47c4ff" />
                </div>
                <div className="power-bar-wrap">
                  <div className="power-bar-header">
                    <span className="power-bar-label">Charge moyenne vs max</span>
                    <span className="power-bar-pct">{Math.round(totalPowerAvg/totalPowerMax*100)}%</span>
                  </div>
                  <div className="power-bar-track">
                    <div className="power-bar-fill" style={{ width: `${totalPowerAvg/totalPowerMax*100}%` }} />
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
                      ].map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === "install" && (
              <div>
                <div className="stat-grid-2">
                  <StatCard icon="🔌" label="Lignes électriques" value={`${powerLines}`} sub={`${selected.power_cable_capacity||2200} W/ligne`} accentColor="#e8ff47" />
                  <StatCard icon="🌐" label="Ports RJ45" value={`${rj45Needed}`} sub={`${(selected.rj45_capacity||535000).toLocaleString()} px/port`} accentColor="#47c4ff" />
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
                      ].map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
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
                  ].map((item, i) => (
                    <div key={i} className="checklist-item">
                      <div className="checklist-dot" style={{ background: item.ok ? "#47ffb3" : "#ffb347" }} />
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
