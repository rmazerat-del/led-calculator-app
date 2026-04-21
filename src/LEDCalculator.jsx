"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ── BASE QSTECH EMBARQUÉE — jamais perdue ─────────────────────────────────────
const STATIC_PRODUCTS = [
  {
    panel_ref: "FX_2725", marque: "QSTECH", brand: "FX", type_led: "SMD",
    pixel_pitch_mm: 2.5, resolution_w: 240, resolution_h: 135,
    weight_kgs: 4, nits: 600, power_max_w: 69, power_avg_w: 21,
    panel_width_m: 0.6, panel_height_m: 0.337, refresh_rate_hz: 3840,
    is_active: true, power_cable_capacity: 2200, rj45_capacity: 535000,
  },
  {
    panel_ref: "FX_2718", marque: "QSTECH", brand: "FX", type_led: "SMD",
    pixel_pitch_mm: 1.8, resolution_w: 320, resolution_h: 180,
    weight_kgs: 4, nits: 600, power_max_w: 78, power_avg_w: 23,
    panel_width_m: 0.6, panel_height_m: 0.337, refresh_rate_hz: 3840,
    is_active: true, power_cable_capacity: 2200, rj45_capacity: 535000,
  },
  {
    panel_ref: "FX_2715", marque: "QSTECH", brand: "FX", type_led: "SMD",
    pixel_pitch_mm: 1.5, resolution_w: 384, resolution_h: 216,
    weight_kgs: 4, nits: 600, power_max_w: 63, power_avg_w: 20,
    panel_width_m: 0.6, panel_height_m: 0.337, refresh_rate_hz: 3840,
    is_active: true, power_cable_capacity: 2200, rj45_capacity: 535000,
  },
  {
    panel_ref: "FX_2712", marque: "QSTECH", brand: "FX", type_led: "SMD",
    pixel_pitch_mm: 1.2, resolution_w: 480, resolution_h: 270,
    weight_kgs: 4, nits: 600, power_max_w: 74, power_avg_w: 22,
    panel_width_m: 0.6, panel_height_m: 0.337, refresh_rate_hz: 3840,
    is_active: true, power_cable_capacity: 2200, rj45_capacity: 535000,
  },
  {
    panel_ref: "CX_2715", marque: "QSTECH", brand: "CX", type_led: "MiniLED",
    pixel_pitch_mm: 1.5, resolution_w: 384, resolution_h: 216,
    weight_kgs: 3.8, nits: 800, power_max_w: 58, power_avg_w: 19.6,
    panel_width_m: 0.6, panel_height_m: 0.337, refresh_rate_hz: 3840,
    is_active: true, power_cable_capacity: 2200, rj45_capacity: 535000,
  },
  {
    panel_ref: "CX_2712", marque: "QSTECH", brand: "CX", type_led: "MiniLED",
    pixel_pitch_mm: 1.2, resolution_w: 480, resolution_h: 270,
    weight_kgs: 3.8, nits: 800, power_max_w: 66, power_avg_w: 22.2,
    panel_width_m: 0.6, panel_height_m: 0.337, refresh_rate_hz: 3840,
    is_active: true, power_cable_capacity: 2200, rj45_capacity: 535000,
  },
  {
    panel_ref: "CX_2709", marque: "QSTECH", brand: "CX", type_led: "MiniLED",
    pixel_pitch_mm: 0.9, resolution_w: 640, resolution_h: 360,
    weight_kgs: 3.8, nits: 800, power_max_w: 63, power_avg_w: 21.2,
    panel_width_m: 0.6, panel_height_m: 0.337, refresh_rate_hz: 3840,
    is_active: true, power_cable_capacity: 2200, rj45_capacity: 535000,
  },
  {
    panel_ref: "CM_2709", marque: "QSTECH", brand: "CM", type_led: "COB",
    pixel_pitch_mm: 0.9, resolution_w: 640, resolution_h: 360,
    weight_kgs: 4, nits: 1000, power_max_w: 53, power_avg_w: 17.7,
    panel_width_m: 0.6, panel_height_m: 0.337, refresh_rate_hz: 3840,
    is_active: true, power_cable_capacity: 2200, rj45_capacity: 535000,
  },
];

// ── THÈME INSTRUMENTAL ────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:           oklch(95.5% 0.008 245);
    --surface:      oklch(99%   0.003 245);
    --surface2:     oklch(93.5% 0.010 245);
    --surface3:     oklch(90%   0.014 245);
    --border:       oklch(86%   0.016 245);
    --border-hover: oklch(76%   0.022 245);
    --text:         oklch(19%   0.026 245);
    --text-muted:   oklch(46%   0.022 245);
    --text-dim:     oklch(64%   0.014 245);
    --accent:       oklch(44%   0.188 245);
    --accent2:      oklch(58%   0.160 220);
    --green:        oklch(60%   0.170 155);
    --orange:       oklch(70%   0.155  55);
    --red:          oklch(56%   0.195  25);
    --font-ui:      'Hanken Grotesk', sans-serif;
    --font-mono:    'JetBrains Mono', monospace;
  }

  html, body, #root { height: 100%; width: 100%; }
  body { font-family: var(--font-ui); background: var(--bg); color: var(--text); }

  .led-app {
    width: 100vw; min-height: 100vh;
    display: flex; flex-direction: column;
    background: var(--bg);
  }

  /* ── TOPBAR ── */
  .topbar {
    height: 52px; min-height: 52px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 0 20px;
    display: flex; align-items: center; justify-content: space-between;
    position: relative; z-index: 100;
    flex-shrink: 0;
  }
  .topbar::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1.5px;
    background: linear-gradient(90deg, var(--accent) 0%, var(--accent2) 55%, var(--green) 100%);
  }

  .topbar-brand { display: flex; align-items: center; gap: 10px; }
  .topbar-logo {
    width: 26px; height: 26px; display: grid; grid-template-columns: 1fr 1fr;
    gap: 2px; padding: 4px; border: 1px solid var(--border);
    background: var(--surface2); border-radius: 5px;
  }
  .topbar-logo-cell { border-radius: 1px; background: var(--accent); }
  .topbar-logo-cell.dim { background: var(--border); }
  .topbar-title { font-size: 13px; font-weight: 700; color: var(--text); letter-spacing: 0.01em; }
  .topbar-subtitle { font-size: 9.5px; color: var(--text-dim); letter-spacing: 0.12em; text-transform: uppercase; margin-top: 1px; font-family: var(--font-mono); }

  .topbar-kpis { display: flex; align-items: center; gap: 20px; }
  .topbar-kpi { text-align: left; }
  .topbar-kpi-label { font-size: 9px; color: var(--text-dim); letter-spacing: 0.12em; text-transform: uppercase; font-family: var(--font-mono); }
  .topbar-kpi-value { font-size: 12px; font-weight: 600; color: var(--text); margin-top: 1px; font-family: var(--font-mono); }
  .topbar-sep { width: 1px; height: 28px; background: var(--border); }
  .topbar-right { display: flex; align-items: center; gap: 8px; }

  .topbar-badge {
    padding: 3px 9px; border: 1px solid; font-size: 8px; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase; border-radius: 3px; font-family: var(--font-mono);
  }
  .admin-btn {
    padding: 6px 12px; border: 1px solid var(--border); background: transparent;
    color: var(--text-dim); font-size: 9px; font-weight: 500;
    letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer;
    font-family: var(--font-ui); border-radius: 5px; transition: all 0.15s;
  }
  .admin-btn:hover { border-color: var(--border-hover); color: var(--text-muted); }
  .pdf-topbar-btn {
    padding: 7px 16px; border: none; background: var(--accent); color: var(--surface);
    font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    cursor: pointer; font-family: var(--font-ui); border-radius: 5px; transition: all 0.15s;
  }
  .pdf-topbar-btn:hover { opacity: 0.88; }
  .pdf-topbar-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── LAYOUT ── */
  .main-layout {
    display: grid; grid-template-columns: 312px 1fr;
    flex: 1; min-height: 0; height: calc(100vh - 52px);
  }

  /* ── LEFT PANEL ── */
  .left-panel {
    background: var(--surface); border-right: 1px solid var(--border);
    overflow-y: auto; padding: 16px 14px;
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
    display: flex; flex-direction: column; gap: 0;
  }
  .left-panel::-webkit-scrollbar { width: 3px; }
  .left-panel::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  .section-header {
    font-size: 9.5px; font-weight: 600; color: var(--text-dim);
    text-transform: uppercase; letter-spacing: 0.16em;
    margin-bottom: 8px; margin-top: 16px;
    padding-bottom: 5px; border-bottom: 1px solid var(--border);
  }
  .section-header:first-child { margin-top: 0; }

  /* Selects */
  .product-select-wrap { position: relative; margin-bottom: 8px; }
  .product-select {
    width: 100%; appearance: none;
    background: var(--surface2); border: 1px solid var(--border);
    padding: 8px 28px 8px 10px;
    font-family: var(--font-ui); font-size: 12px; font-weight: 500; color: var(--text);
    cursor: pointer; outline: none; border-radius: 6px; transition: border-color 0.15s;
  }
  .product-select:hover { border-color: var(--border-hover); }
  .product-select:focus { border-color: var(--accent); background: var(--surface); box-shadow: 0 0 0 2px oklch(44% 0.188 245 / 0.1); }
  .product-select option { background: var(--surface); color: var(--text); }
  .product-select-chevron {
    position: absolute; right: 9px; top: 50%; transform: translateY(-50%);
    pointer-events: none; color: var(--text-dim);
  }

  /* Mode grid */
  .mode-grid { display: flex; gap: 5px; margin-bottom: 14px; background: var(--surface2); border-radius: 7px; padding: 3px; }
  .mode-btn {
    flex: 1; padding: 7px 4px; border: none;
    border-radius: 5px; cursor: pointer; text-align: center;
    background: transparent; font-family: var(--font-ui); transition: all 0.15s;
  }
  .mode-btn:hover:not(.active) { background: var(--surface3); }
  .mode-btn.active { background: var(--surface); box-shadow: 0 1px 3px oklch(19% 0.026 245 / 0.1); }
  .mode-icon { font-size: 13px; margin-bottom: 2px; }
  .mode-label { font-size: 9.5px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.04em; text-transform: uppercase; }
  .mode-btn.active .mode-label { color: var(--accent); }

  /* Inputs */
  .input-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
  .input-label {
    font-size: 9.5px; color: var(--text-dim); display: block; margin-bottom: 3px;
    font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; font-family: var(--font-mono);
  }
  .spinbox {
    display: flex; align-items: center; border: 1px solid var(--border);
    background: var(--surface2); height: 34px; border-radius: 6px; overflow: hidden; transition: border-color 0.15s, box-shadow 0.15s;
  }
  .spinbox:focus-within { border-color: var(--accent); background: var(--surface); box-shadow: 0 0 0 2px oklch(44% 0.188 245 / 0.1); }
  .spinbox-btn {
    width: 30px; background: transparent; border: none;
    color: var(--text-dim); font-size: 15px; cursor: pointer; height: 100%;
    transition: background 0.1s, color 0.1s;
  }
  .spinbox-btn:hover { background: var(--surface3); color: var(--accent); }
  .spinbox-input {
    flex: 1; text-align: center; background: transparent; border: none;
    color: var(--text); font-size: 13px; font-weight: 500; outline: none; font-family: var(--font-mono);
  }
  .spinbox-unit { color: var(--text-dim); font-size: 9px; padding-right: 8px; letter-spacing: 0.06em; font-family: var(--font-mono); }

  /* Summary */
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 14px; }
  .summary-card {
    background: var(--surface2); border: 1px solid var(--border);
    padding: 9px 10px; border-radius: 6px; transition: all 0.15s; min-width: 0;
  }
  .summary-card:hover { border-color: var(--border-hover); background: var(--surface); }
  .summary-label { font-size: 8.5px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 600; margin-bottom: 3px; font-family: var(--font-mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .summary-value { font-size: 11.5px; font-weight: 600; color: var(--text); font-family: var(--font-mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .summary-sub { font-size: 9px; color: var(--text-muted); margin-top: 1px; font-family: var(--font-mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .pdf-btn {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    width: 100%; padding: 11px 14px; border: none; cursor: pointer;
    font-family: var(--font-ui); font-size: 9.5px; font-weight: 700;
    background: var(--accent); color: var(--surface); letter-spacing: 0.08em; text-transform: uppercase;
    border-radius: 6px; transition: opacity 0.15s; margin-top: auto;
  }
  .pdf-btn:hover { opacity: 0.88; }
  .pdf-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── RIGHT PANEL ── */
  .right-panel { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }

  /* ── VIZ AREA ── */
  .viz-area {
    flex: 0 0 260px; background: oklch(18% 0.028 245);
    border-bottom: 1px solid var(--border); position: relative;
    display: flex; align-items: center; justify-content: center; overflow: hidden;
  }
  .viz-grid-bg {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(oklch(100% 0 0 / 0.03) 1px, transparent 1px),
      linear-gradient(90deg, oklch(100% 0 0 / 0.03) 1px, transparent 1px);
    background-size: 24px 24px;
  }
  .screen-container { position: relative; z-index: 2; }
  .dim-label { text-align: center; margin-bottom: 6px; display: flex; justify-content: center; align-items: center; gap: 8px; }
  .dim-line { height: 1px; background: oklch(100% 0 0 / 0.12); }
  .dim-text { color: oklch(75% 0.02 245); font-size: 9.5px; font-weight: 500; white-space: nowrap; letter-spacing: 0.04em; font-family: var(--font-mono); }
  .dim-diff-ok { color: var(--green); margin-left: 4px; font-size: 8px; }
  .dim-diff-warn { color: var(--orange); margin-left: 4px; font-size: 8px; }

  .screen-row { display: flex; align-items: center; gap: 10px; }
  .height-label { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 52px; }
  .height-line { width: 1px; flex: 1; background: oklch(100% 0 0 / 0.12); }
  .height-text { color: oklch(75% 0.02 245); font-size: 9.5px; font-weight: 500; text-align: center; line-height: 1.5; font-family: var(--font-mono); }

  .led-screen {
    position: relative; border-radius: 3px; overflow: hidden;
    border: 1px solid oklch(100% 0 0 / 0.12);
    box-shadow: 0 12px 48px oklch(10% 0.05 245 / 0.6);
  }
  .led-grid { position: absolute; inset: 0; display: grid; gap: 1px; padding: 1px; }
  .led-panel-cell { background: transparent; border-radius: 1px; border: 1px solid oklch(100% 0 0 / 0.08); }

  .screen-overlay-tl {
    position: absolute; top: 6px; left: 6px; background: oklch(10% 0.02 245 / 0.7);
    padding: 3px 7px; border: 1px solid oklch(100% 0 0 / 0.1); border-radius: 3px; backdrop-filter: blur(6px);
  }
  .screen-overlay-title { color: oklch(92% 0.01 245); font-weight: 600; font-size: 8.5px; letter-spacing: 0.04em; }
  .screen-overlay-sub { color: oklch(65% 0.02 245); font-size: 7.5px; margin-top: 1px; font-family: var(--font-mono); }
  .screen-bottom-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--green), var(--accent)); }

  .viz-badges { text-align: center; margin-top: 8px; display: flex; justify-content: center; gap: 5px; }
  .viz-badge { font-size: 9.5px; font-weight: 500; padding: 3px 9px; border: 1px solid; border-radius: 3px; letter-spacing: 0.04em; font-family: var(--font-mono); }

  /* ── TABS ── */
  .tab-bar { display: flex; border-bottom: 1px solid var(--border); background: var(--surface); flex-shrink: 0; }
  .tab-btn {
    flex: 1; padding: 10px 6px; border: none; cursor: pointer; background: transparent;
    border-bottom: 2px solid transparent; color: var(--text-dim);
    font-size: 10.5px; font-weight: 600; font-family: var(--font-ui);
    letter-spacing: 0.05em; text-transform: uppercase; transition: all 0.15s;
  }
  .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
  .tab-btn:hover:not(.active) { color: var(--text-muted); background: var(--surface2); }

  /* ── TAB CONTENT ── */
  .tab-content {
    flex: 1; overflow-y: auto; padding: 16px 20px; background: var(--bg);
    scrollbar-width: thin; scrollbar-color: var(--border) transparent; min-height: 0;
  }
  .tab-content::-webkit-scrollbar { width: 3px; }
  .tab-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  /* ── STAT CARDS ── */
  .stat-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .stat-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .stat-card {
    background: var(--surface); border: 1px solid var(--border);
    padding: 13px 14px; border-radius: 8px; transition: border-color 0.15s;
  }
  .stat-card:hover { border-color: var(--border-hover); }
  .stat-header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
  .stat-icon { font-size: 13px; }
  .stat-label { color: var(--text-dim); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; font-family: var(--font-mono); }
  .stat-value { color: var(--text); font-size: 22px; font-weight: 600; letter-spacing: -0.03em; line-height: 1; font-family: var(--font-mono); }
  .stat-sub { color: var(--text-muted); font-size: 10px; margin-top: 4px; font-family: var(--font-mono); }

  /* ── TABLES ── */
  .data-table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 12px; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .data-table thead tr { background: var(--surface2); }
  .data-table th { text-align: left; padding: 9px 14px; color: var(--text-dim); font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: 0.14em; font-family: var(--font-mono); border-bottom: 1px solid var(--border); }
  .data-table th:last-child { text-align: right; }
  .data-table td { padding: 8px 14px; border-top: 1px solid var(--border); }
  .data-table td:first-child { color: var(--text-muted); font-size: 11.5px; }
  .data-table td:last-child { color: var(--text); font-weight: 600; text-align: right; font-family: var(--font-mono); }
  .data-table tr:hover td { background: var(--surface2); }

  /* ── POWER BAR ── */
  .power-bar-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 12px; }
  .power-bar-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
  .power-bar-label { color: var(--text-muted); font-size: 10.5px; font-family: var(--font-mono); }
  .power-bar-pct { color: var(--text); font-size: 15px; font-weight: 600; font-family: var(--font-mono); }
  .power-bar-track { height: 5px; background: var(--surface3); border-radius: 3px; overflow: hidden; }
  .power-bar-fill { height: 100%; background: linear-gradient(90deg, var(--green), var(--accent)); border-radius: 3px; transition: width 0.5s ease-out; }

  /* ── CHECKLIST ── */
  .checklist { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
  .checklist-title { font-size: 9px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.16em; margin-bottom: 10px; font-family: var(--font-mono); }
  .checklist-item { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid var(--border); }
  .checklist-item:last-child { border-bottom: none; }
  .checklist-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .checklist-text { font-size: 12px; color: var(--text-muted); line-height: 1.4; }
  .checklist-text.warn { color: var(--orange); }

  /* Responsive */
  @media (max-width: 768px) {
    html, body, #root { overflow: auto; height: auto; }
    .led-app { min-height: 100vh; height: auto; }
    .topbar { position: sticky; top: 0; z-index: 100; }
    .main-layout { grid-template-columns: 1fr; height: auto; display: flex; flex-direction: column; }
    .left-panel { overflow: visible; border-right: none; border-bottom: 1px solid var(--border); }
    .right-panel { overflow: visible; min-height: 0; height: auto; }
    .viz-area { flex: 0 0 240px; }
    .topbar-kpis { display: none; }
    .stat-grid-3 { grid-template-columns: 1fr 1fr; }
  }
`;

// ── HELPERS ──────────────────────────────────────────────────────────────────
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
  const totalWidth   = panelsW * selected.panel_width_m;
  const totalHeight  = panelsH * selected.panel_height_m;
  const resW         = panelsW * selected.resolution_w;
  const resH         = panelsH * selected.resolution_h;
  const totalPixels  = resW * resH;
  const surface      = totalWidth * totalHeight;
  const totalPanels  = panelsW * panelsH;
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

// ── PDF ───────────────────────────────────────────────────────────────────────
async function generatePDF(selected, result, quality) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297, margin = 16, colW = (W - margin * 2 - 8) / 2;
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
    blue:   [37,  99,  235],
    blue2:  [14,  165, 233],
    green:  [16,  185, 129],
    orange: [245, 158, 11],
    white:  [255, 255, 255],
    bg:     [240, 242, 245],
    surface:[247, 248, 250],
    surface2:[226,230, 236],
    dark:   [30,  41,  59],
    text:   [17,  24,  39],
    muted:  [75,  85,  99],
    dim:    [156, 163, 175],
  };
  const setFill = (rgb) => doc.setFillColor(...rgb);
  const setDraw = (rgb) => doc.setDrawColor(...rgb);
  const setFont = (size, style="normal", rgb=C.text) => { doc.setFontSize(size); doc.setFont("helvetica", style); doc.setTextColor(...rgb); };
  const rect = (x, y, w, h, r=0, fill=true) => { if (r>0) doc.roundedRect(x,y,w,h,r,r,fill?"F":"S"); else doc.rect(x,y,w,h,fill?"F":"S"); };
  const text = (str, x, y, opts={}) => doc.text(str, x, y, opts);

  // ── EN-TÊTE ──
  let y = 0;
  setFill(C.white); rect(0,0,W,42,0);
  // Logo 2×2
  const lx=margin, ly=10, lsz=5, lg=1.5;
  [[C.blue,C.blue],[C.surface2,C.blue]].forEach((row,ri)=>
    row.forEach((col,ci)=>{ setFill(col); rect(lx+ci*(lsz+lg),ly+ri*(lsz+lg),lsz,lsz,1); })
  );
  setFont(16,"bold",C.text); text("LED Screen Report", lx+lsz*2+lg*2+4, ly+7);
  setFont(8,"normal",C.muted);
  text("Configurateur professionnel · "+new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"}), lx+lsz*2+lg*2+4, ly+13);
  // Badge qualité
  setFill(C.blue); doc.roundedRect(W-margin-22,ly+1,22,10,2,2,"F");
  setFont(7,"bold",C.white); text(quality.label,W-margin-11,ly+7.5,{align:"center"});
  // Barre dégradée
  setFill(C.blue);  rect(0,40,W*0.55,2,0);
  setFill(C.blue2); rect(W*0.55,40,W*0.28,2,0);
  setFill(C.green); rect(W*0.83,40,W*0.17,2,0);
  y = 48;

  // ── BANDE PRODUIT ──
  setFill(C.surface); rect(margin,y,W-margin*2,14,2);
  setDraw(C.surface2); doc.setLineWidth(0.3); doc.roundedRect(margin,y,W-margin*2,14,2,2,"S");
  setFill(C.blue); rect(margin,y,3,14,0);
  setFont(10,"bold",C.text); text(selected.panel_ref, margin+8, y+6);
  setFont(7,"normal",C.muted);
  text(`${selected.marque||""}  ·  P${selected.pixel_pitch_mm} mm  ·  ${selected.nits} nits  ·  ${selected.resolution_w}×${selected.resolution_h} px  ·  ${selected.refresh_rate_hz} Hz`, margin+8, y+12);
  y += 20;

  // ── KPI CARDS ──
  const kpis = [
    {label:"PANNEAUX",   value:`${pW} × ${pH}`, sub:`${totalPanels} total`,          accent:C.blue},
    {label:"DIMENSIONS", value:`${totalWidth.toFixed(2)}×${totalHeight.toFixed(2)}m`, sub:`${surface.toFixed(2)} m²`, accent:C.blue2},
    {label:"RÉSOLUTION", value:`${(totalPixels/1000000).toFixed(2)} Mpx`, sub:`${rW} × ${rH}`, accent:C.blue2},
    {label:"POIDS",      value:`${totalWeight.toFixed(0)} kg`, sub:`${selected.weight_kgs} kg/u`, accent:C.green},
  ];
  const kpiW = (W-margin*2-9)/4;
  kpis.forEach((kpi,i) => {
    const kx = margin+i*(kpiW+3);
    setFill(C.white); rect(kx,y,kpiW,22,2);
    setDraw(C.surface2); doc.setLineWidth(0.3); doc.roundedRect(kx,y,kpiW,22,2,2,"S");
    setFill(kpi.accent); rect(kx,y,kpiW,2,0);
    setFont(6,"bold",C.dim); text(kpi.label,kx+kpiW/2,y+9,{align:"center"});
    setFont(9,"bold",C.text); text(kpi.value,kx+kpiW/2,y+15.5,{align:"center"});
    setFont(5.5,"normal",C.muted); text(kpi.sub,kx+kpiW/2,y+20.5,{align:"center"});
  });
  y += 28;

  // ── VISUALISATION ÉCRAN ──
  const vizH=52;
  setFill(C.dark); rect(margin,y,W-margin*2,vizH,2);
  // grille de fond subtile
  doc.setDrawColor(255,255,255); doc.setLineWidth(0.1);
  for(let gx=margin;gx<margin+(W-margin*2);gx+=8) doc.line(gx,y,gx,y+vizH);
  for(let gy=y;gy<y+vizH;gy+=8) doc.line(margin,gy,margin+(W-margin*2),gy);

  const maxScrW=76,maxScrH=42,aspect=totalWidth/totalHeight;
  let scrW=maxScrW,scrH=maxScrW/aspect;
  if(scrH>maxScrH){scrH=maxScrH;scrW=maxScrH*aspect;}
  const scrX=margin+14+(W-margin*2)*0.25-scrW/2, scrY=y+(vizH-scrH)/2;
  const cellW=scrW/pW,cellH=scrH/pH;

  // cellules LED avec dégradé bleu
  for(let row=0;row<pH;row++) for(let col=0;col<pW;col++) {
    const cx=scrX+col*cellW+0.3,cy=scrY+row*cellH+0.3,t=col/Math.max(pW-1,1);
    setFill([Math.round(37+t*(-23)),Math.round(99+t*66),Math.round(235-t*2)]);
    rect(cx,cy,cellW-0.6,cellH-0.6,0.4);
  }
  setDraw(C.white); doc.setLineWidth(0.6); doc.roundedRect(scrX,scrY,scrW,scrH,1.5,1.5,"S");
  setFont(6,"bold",[200,210,230]); text(`${totalWidth.toFixed(2)} m · ${rW} px`,scrX+scrW/2,scrY-3,{align:"center"});

  // Info boxes à droite
  const bx=scrX+scrW+6, by=scrY;
  const infos=[
    {label:"Diagonale", val:`${diagonal.toFixed(0)}"`},
    {label:"Recul min.", val:`${viewMin.toFixed(1)} m`},
    {label:"Optimal",   val:`${viewOpt.toFixed(1)} m`},
    {label:"Qualité",   val:quality.label},
  ];
  infos.forEach((b,i)=>{
    setFill([20,30,50]); doc.roundedRect(bx,by+i*11,40,9,1.5,1.5,"F");
    setDraw([60,80,120]); doc.setLineWidth(0.3); doc.roundedRect(bx,by+i*11,40,9,1.5,1.5,"S");
    setFont(5.5,"normal",[150,165,185]); text(b.label,bx+3,by+i*11+4.5);
    setFont(7,"bold",C.white); text(b.val,bx+40-3,by+i*11+4.5,{align:"right"});
  });
  y += vizH+8;

  // ── SECTIONS TABLEAU ──
  const drawSection=(title,rows,x,startY,w)=>{
    const totalH=rows.length*6.5+8;
    setFill(C.white); rect(x,startY,w,totalH,2);
    setDraw(C.surface2); doc.setLineWidth(0.3); doc.roundedRect(x,startY,w,totalH,2,2,"S");
    setFill(C.blue); rect(x,startY,w,7.5,0);
    // coins arrondis seulement en haut
    setFill(C.blue); doc.roundedRect(x,startY,w,7.5,2,2,"F");
    setFont(6.5,"bold",C.white); text(title,x+6,startY+5.5);
    let ty=startY+7.5;
    rows.forEach(([k,v],i)=>{
      setFill(i%2===0?C.white:C.surface); rect(x,ty,w,6.5,0);
      setDraw(C.surface2); doc.setLineWidth(0.15); doc.rect(x,ty,w,6.5,"S");
      setFont(6,"normal",C.muted); text(k,x+5,ty+4.5);
      setFont(6,"bold",C.text); text(v,x+w-4,ty+4.5,{align:"right"});
      ty+=6.5;
    });
    return ty;
  };

  const col1x=margin,col2x=margin+colW+8;
  const endLeft1=drawSection("ÉCRAN",[
    ["Panneaux (L × H)",`${pW} × ${pH} = ${totalPanels} unités`],
    ["Dimensions réelles",`${totalWidth.toFixed(3)} × ${totalHeight.toFixed(3)} m`],
    ["Résolution totale",`${rW} × ${rH} px`],
    ["Mégapixels",`${(totalPixels/1000000).toFixed(3)} Mpx`],
    ["Ratio d'image",getRatio(rW,rH)],
    ["Densité pixels",`${String(pixDensity).replace(/\B(?=(\d{3})+(?!\d))/g," ")} px/m2`],
    ["Surface active",`${surface.toFixed(3)} m²`],
    ["Poids total",`${totalWeight.toFixed(1)} kg`],
    ["Qualité image",quality.label],
  ],col1x,y,colW);
  const endRight1=drawSection("PRODUIT",[
    ["Référence",selected.panel_ref],
    ["Marque",selected.marque||"—"],
    ["Type LED",selected.type_led||"—"],
    ["Pitch pixel",`${selected.pixel_pitch_mm} mm`],
    ["Dimensions cabinet",`${Math.round(selected.panel_width_m*100)} × ${Math.round(selected.panel_height_m*100)} cm`],
    ["Résolution cabinet",`${selected.resolution_w} × ${selected.resolution_h} px`],
    ["Poids unitaire",`${selected.weight_kgs} kg`],
    ["Luminosité",`${selected.nits} nits`],
    ["Refresh rate",`${selected.refresh_rate_hz} Hz`],
  ],col2x,y,colW);
  y=Math.max(endLeft1,endRight1)+8;

  const endLeft2=drawSection("ÉLECTRIQUE",[
    ["Conso max totale",`${Math.round(totalPowerMax)} W`],
    ["Conso moy. totale",`${Math.round(totalPowerAvg)} W`],
    ["Puissance (moy.)",`${kW.toFixed(3)} kW`],
    ["BTU/heure",`${BTU.toFixed(0)} BTU/h`],
    ["Coût/an estimé",`${(costDay*365).toFixed(0)} €`],
  ],col1x,y,colW);
  const endRight2=drawSection("INSTALLATION",[
    ["Lignes électriques",`${powerLines} ligne(s)`],
    ["Ports RJ45 requis",`${rj45Needed} port(s)`],
    ["Recul minimum",`${viewMin.toFixed(2)} m`],
    ["Recul optimal",`${viewOpt.toFixed(2)} m`],
    ["Poids total",`${totalWeight.toFixed(1)} kg`],
    ["Diagonale",`${diagonal.toFixed(1)}"`],
  ],col2x,y,colW);
  y=Math.max(endLeft2,endRight2)+8;

  // ── BARRE DE CHARGE ──
  const pct=totalPowerAvg/totalPowerMax;
  setFill(C.white); rect(margin,y,W-margin*2,18,2);
  setDraw(C.surface2); doc.setLineWidth(0.3); doc.roundedRect(margin,y,W-margin*2,18,2,2,"S");
  setFont(6.5,"bold",C.muted); text("CHARGE MOYENNE VS MAX",margin+5,y+6.5);
  setFont(8,"bold",C.blue); text(`${Math.round(pct*100)}%`,W-margin-5,y+6.5,{align:"right"});
  // track
  setFill(C.surface2); doc.roundedRect(margin+5,y+10,W-margin*2-10,4,2,2,"F");
  // fill vert → bleu
  const barFill=(W-margin*2-10)*pct;
  setFill(C.green); rect(margin+5,y+10,barFill*0.5,4,0);
  setFill(C.blue);  rect(margin+5+barFill*0.5,y+10,barFill*0.5,4,0);
  y+=24;

  // ── CHECKLIST ──
  const checks=[
    {ok:powerLines<=4,  txt:`${powerLines} ligne(s) — ${powerLines<=4?"Standard (OK)":"Prévoir tableau dédié"}`},
    {ok:rj45Needed<=8,  txt:`${rj45Needed} port(s) RJ45 — ${rj45Needed<=8?"Switch standard 8p (OK)":"Switch 16p ou supérieur"}`},
    {ok:totalWeight<300,txt:`${totalWeight.toFixed(0)} kg — ${totalWeight<300?"Structure légère (OK)":"Renforcement mural requis"}`},
    {ok:true,           txt:`Recul optimal recommandé : ${viewOpt.toFixed(1)} m minimum`},
  ];
  setFill(C.white); rect(margin,y,W-margin*2,10+checks.length*8,2);
  setDraw(C.surface2); doc.setLineWidth(0.3); doc.roundedRect(margin,y,W-margin*2,10+checks.length*8,2,2,"S");
  setFont(6.5,"bold",C.muted); text("CHECKLIST INSTALLATION",margin+5,y+6.5);
  y+=10;
  checks.forEach(c=>{
    setFill(c.ok?C.green:C.orange); doc.circle(margin+6,y+3,2.2,"F");
    setFont(7,c.ok?"normal":"bold",c.ok?C.text:C.orange); text(c.txt,margin+12,y+4.5);
    y+=8;
  });

  // ── PIED DE PAGE ──
  setFill(C.surface); rect(0,H-14,W,14,0);
  setFill(C.blue); rect(0,H-14,W,1.5,0);
  setFont(6.5,"normal",C.dim);
  text("LED Calculator · Configurateur professionnel",margin,H-6);
  text(`Généré le ${new Date().toLocaleDateString("fr-FR")} · ${selected.panel_ref} · ${rW}×${rH}px`,W-margin,H-6,{align:"right"});

  doc.save(`LED_Report_${selected.panel_ref}_${rW}x${rH}.pdf`);
}

// ── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────────
export default function LEDCalculator({ onAdmin }) {
  const [products, setProducts]       = useState(STATIC_PRODUCTS);
  const [selIdx, setSelIdx]           = useState(0);
  const [brandFilter, setBrandFilter] = useState("all");
  const [sizeFilter, setSizeFilter]   = useState("60x34");
  const [mode, setMode]               = useState("dimensions");
  const [width, setWidth]             = useState(3);
  const [height, setHeight]           = useState(2);
  const [panelsW, setPanelsW]         = useState(5);
  const [panelsH, setPanelsH]         = useState(3);
  const [resW, setResW]               = useState(1920);
  const [resH, setResH]               = useState(1080);
  const [activeTab, setActiveTab]     = useState("product");
  const [pdfLoading, setPdfLoading]   = useState(false);
  const [bgPreset, setBgPreset]       = useState("off");
  const vizRef = useRef(null);
  const [vizSize, setVizSize]         = useState({ w: 600, h: 260 });

  // Fusion Supabase + statiques
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("marque")
      .order("panel_ref")
      .then(({ data, error }) => {
        if (error) { console.error("Supabase error:", error); return; }
        if (!data || data.length === 0) return;
        const supabaseRefs = new Set(data.map(p => p.panel_ref));
        const staticOnly   = STATIC_PRODUCTS.filter(p => !supabaseRefs.has(p.panel_ref));
        const merged       = [...staticOnly, ...data].sort((a, b) =>
          (a.marque || "").localeCompare(b.marque || "") || a.panel_ref.localeCompare(b.panel_ref)
        );
        setProducts(merged);
      });
  }, []);

  useEffect(() => {
    const tag = document.createElement("style");
    tag.textContent = css;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);

  useEffect(() => {
    if (!window.jspdf) {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const obs = new ResizeObserver(([e]) => setVizSize({ w: e.contentRect.width, h: e.contentRect.height }));
    if (vizRef.current) obs.observe(vizRef.current);
    return () => obs.disconnect();
  }, []);

  // Filtrage
  const brands   = ["all", ...new Set(products.map(p => p.marque).filter(Boolean))];
  const filtered = products.filter(p => {
    const matchBrand = brandFilter === "all" || p.marque === brandFilter;
    const pw = Math.round(p.panel_width_m * 100);
    const ph = Math.round(p.panel_height_m * 100);
    const matchSize =
      sizeFilter === "all"    ? true :
      sizeFilter === "60x34"  ? (Math.abs(p.panel_width_m - 0.6) < 0.01 && Math.abs(p.panel_height_m - 0.337) < 0.01) :
      sizeFilter === "50x100" ? ((pw === 50 && ph === 100) || (pw === 100 && ph === 50)) :
      sizeFilter === "50x50"  ? (pw === 50 && ph === 50) :
      !((pw === 50 && ph === 100) || (pw === 100 && ph === 50) || (pw === 50 && ph === 50));
    return matchBrand && matchSize;
  });
  const selected = filtered[Math.min(selIdx, filtered.length - 1)] || filtered[0] || products[0];

  // Calculs
  const result = computeLED(selected, {
    width: Number(width)||0, height: Number(height)||0,
    panelsW: Number(panelsW)||1, panelsH: Number(panelsH)||1,
    resW: Number(resW)||1920, resH: Number(resH)||1080,
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

  const PAD  = 80;
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

  const BG_PRESETS = [
    { id: "off",       label: "Off",       bg: "oklch(18% 0.028 245)" },
    { id: "mire",      label: "Mire",      bg: "linear-gradient(90deg,#c8c8c8 0% 14.28%,#c8c800 14.28% 28.57%,#00c8c8 28.57% 42.86%,#00c800 42.86% 57.14%,#c800c8 57.14% 71.43%,#c80000 71.43% 85.71%,#0000c8 85.71% 100%)" },
    { id: "scene",     label: "Scène",     bg: "radial-gradient(ellipse 120% 80% at 50% 110%,#6b21a8 0%,#1e1b4b 40%,#080810 100%)" },
    { id: "corporate", label: "Corporate", bg: "linear-gradient(160deg,#0f2a4a 0%,#1e4d8c 45%,#0f2a4a 100%)" },
    { id: "sport",     label: "Sport",     bg: "radial-gradient(ellipse 120% 90% at 50% 110%,#14532d 0%,#052e16 55%,#030a05 100%)" },
  ];
  const screenBg = BG_PRESETS.find(p => p.id === bgPreset)?.bg ?? "oklch(18% 0.028 245)";

  const handlePDF = async () => {
    if (!window.jspdf) { alert("jsPDF charge encore, réessayez."); return; }
    setPdfLoading(true);
    try { await generatePDF(selected, result, quality); }
    catch (e) { alert("Erreur PDF : " + e.message); }
    setPdfLoading(false);
  };

  const chevron = (
    <span className="product-select-chevron">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );

  return (
    <div className="led-app">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">
            <div className="topbar-logo-cell" /><div className="topbar-logo-cell dim" />
            <div className="topbar-logo-cell dim" /><div className="topbar-logo-cell" />
          </div>
          <div>
            <div className="topbar-title">LED Calculator</div>
            <div className="topbar-subtitle">Configurateur professionnel</div>
          </div>
        </div>

        <div className="topbar-kpis">
          <div className="topbar-kpi"><div className="topbar-kpi-label">Résolution</div><div className="topbar-kpi-value">{rW} × {rH} px</div></div>
          <div className="topbar-sep" />
          <div className="topbar-kpi"><div className="topbar-kpi-label">Surface</div><div className="topbar-kpi-value">{surface.toFixed(2)} m²</div></div>
          <div className="topbar-sep" />
          <div className="topbar-kpi"><div className="topbar-kpi-label">Panneaux</div><div className="topbar-kpi-value">{pW} × {pH} = {totalPanels} u.</div></div>
          <div className="topbar-sep" />
          <div className="topbar-kpi"><div className="topbar-kpi-label">Poids</div><div className="topbar-kpi-value">{totalWeight.toFixed(0)} kg</div></div>
        </div>

        <div className="topbar-right">
          <div className="topbar-badge" style={{ color: quality.color, borderColor: quality.color + "55", background: quality.color + "18" }}>
            {quality.label}
          </div>
          {onAdmin && <button onClick={onAdmin} className="admin-btn">Admin</button>}
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
              {chevron}
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label className="input-label">Format cabinet</label>
            <div className="product-select-wrap">
              <select className="product-select" value={sizeFilter} onChange={e => { setSizeFilter(e.target.value); setSelIdx(0); }}>
                <option value="all">Tous les formats</option>
                <option value="60x34">60 × 33,7 cm (QSTECH)</option>
                <option value="50x100">50 × 100 cm</option>
                <option value="50x50">50 × 50 cm</option>
                <option value="other">Autres formats</option>
              </select>
              {chevron}
            </div>
          </div>

          <div className="product-select-wrap">
            <select className="product-select" value={selIdx} onChange={e => setSelIdx(Number(e.target.value))}>
              {filtered.map((p, i) => (
                <option key={i} value={i}>
                  {p.panel_ref} — P{p.pixel_pitch_mm} · {Math.round(p.panel_width_m*100)}×{Math.round(p.panel_height_m*100)}cm · {p.resolution_w}×{p.resolution_h}px · {p.nits}nits
                </option>
              ))}
            </select>
            {chevron}
          </div>

          <div className="section-header">Mode de saisie</div>
          <div className="mode-grid">
            {MODES.map(m => (
              <button key={m.id} className={`mode-btn ${mode === m.id ? "active" : ""}`} onClick={() => {
                if (m.id === "panels") { setPanelsW(result.panelsW); setPanelsH(result.panelsH); }
                else if (m.id === "resolution") { setResW(result.resW); setResH(result.resH); }
                else { setWidth(result.totalWidth.toFixed(2)); setHeight(result.totalHeight.toFixed(2)); }
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
              { label: "Panneaux",   value: `${pW} × ${pH}`,                                         sub: `= ${totalPanels} total`,      accent: "#2563eb" },
              { label: "Dimensions", value: `${totalWidth.toFixed(2)} × ${totalHeight.toFixed(2)} m`, sub: `${surface.toFixed(2)} m²`,    accent: "#0ea5e9" },
              { label: "Résolution", value: `${(totalPixels/1000000).toFixed(1)} Mpx`,                sub: `${rW}×${rH}`,                 accent: "#0ea5e9" },
              { label: "Poids",      value: `${totalWeight.toFixed(0)} kg`,                           sub: `${selected.weight_kgs} kg/u`, accent: "#10b981" },
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
          <div className="viz-area" ref={vizRef}>
            <div className="viz-grid-bg" />
            <div style={{
              position:"absolute", top:8, right:10, zIndex:10,
              display:"flex", gap:3,
            }}>
              {BG_PRESETS.map(p => (
                <button key={p.id} onClick={() => setBgPreset(p.id)} style={{
                  padding:"3px 8px", fontSize:"9px", fontFamily:"var(--font-mono)",
                  fontWeight: bgPreset === p.id ? 700 : 400,
                  letterSpacing:"0.04em", textTransform:"uppercase",
                  border: bgPreset === p.id ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)",
                  borderRadius:"3px", cursor:"pointer",
                  background: bgPreset === p.id ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.3)",
                  color: bgPreset === p.id ? "#fff" : "rgba(255,255,255,0.45)",
                  backdropFilter:"blur(6px)", transition:"all 0.15s",
                }}>{p.label}</button>
              ))}
            </div>
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
                    <span style={{ color: "#686868" }}>{rH} px</span>
                    {mode === "dimensions" && (Number(height)||0) > 0 && (
                      <><br /><span style={{ color: Math.abs(totalHeight-(Number(height)||0)) < 0.01 ? "#34d399" : "#fbbf24", fontSize: 8 }}>
                        ({(totalHeight-(Number(height)||0)).toFixed(2)}m)
                      </span></>
                    )}
                  </span>
                  <div className="height-line" />
                </div>
                <div className="led-screen" style={{ width: scrW, height: scrH, background: screenBg, backgroundSize: "cover", backgroundPosition: "center" }}>
                  <div className="led-grid" style={{ gridTemplateColumns: `repeat(${pW},1fr)`, gridTemplateRows: `repeat(${pH},1fr)` }}>
                    {Array.from({ length: pW * pH }).map((_, i) => (
                      <div key={i} className="led-panel-cell" style={{
                        background: bgPreset === "off" ? "transparent" : "rgba(0,0,0,0.08)",
                        border: bgPreset === "off" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.35)",
                      }} />
                    ))}
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
                <span className="viz-badge" style={{ color: "#fbbf24", background: "rgba(251,191,36,0.15)", borderColor: "rgba(251,191,36,0.35)" }}>👁 Min: {viewMin.toFixed(1)} m</span>
                <span className="viz-badge" style={{ color: "#34d399", background: "rgba(52,211,153,0.15)", borderColor: "rgba(52,211,153,0.35)" }}>✓ Optimal: {viewOpt.toFixed(1)} m</span>
                <span className="viz-badge" style={{ color: "#60a5fa", background: "rgba(96,165,250,0.15)", borderColor: "rgba(96,165,250,0.35)" }}>📐 {diagonal.toFixed(0)}"</span>
                <span className="viz-badge" style={{ color: quality.color, background: quality.color + "25", borderColor: quality.color + "55" }}>◈ {quality.label}</span>
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
                  <StatCard icon="📏" label="Pitch pixel"  value={`${selected.pixel_pitch_mm} mm`} sub="Résolution angulaire" accentColor="#e8ff47" />
                  <StatCard icon="💡" label="Luminosité"   value={`${selected.nits} nits`}         sub="Luminance max"        accentColor="#ffb347" />
                  <StatCard icon="🔄" label="Refresh rate" value={`${selected.refresh_rate_hz} Hz`} sub="Fréquence rafraîch."  accentColor="#47c4ff" />
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Paramètre</th><th>Valeur</th></tr></thead>
                    <tbody>
                      {[
                        ["Référence produit",   selected.panel_ref],
                        ["Type LED",            selected.type_led || "—"],
                        ["Série",               selected.brand    || "—"],
                        ["Marque",              selected.marque   || "—"],
                        ["Pitch pixel",         `${selected.pixel_pitch_mm} mm`],
                        ["Dimensions cabinet",  `${Math.round(selected.panel_width_m*100)} × ${Math.round(selected.panel_height_m*100)} cm`],
                        ["Résolution cabinet",  `${selected.resolution_w} × ${selected.resolution_h} px`],
                        ["Poids unitaire",      `${selected.weight_kgs} kg`],
                        ["Luminosité",          `${selected.nits} nits`],
                        ["Refresh rate",        `${selected.refresh_rate_hz} Hz`],
                        ["Conso max (unité)",   `${selected.power_max_w} W`],
                        ["Conso moy. (unité)",  `${selected.power_avg_w} W`],
                      ].map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === "screen" && (
              <div>
                <div className="stat-grid-3">
                  <StatCard icon="⬛" label="Total panneaux" value={`${pW} × ${pH}`}                        sub={`= ${totalPanels} cabinets`}                           accentColor="#47c4ff" />
                  <StatCard icon="📐" label="Surface totale" value={`${surface.toFixed(2)} m²`}             sub={`${totalWidth.toFixed(2)} × ${totalHeight.toFixed(2)} m`} accentColor="#e8ff47" />
                  <StatCard icon="🎯" label="Résolution"     value={`${(totalPixels/1000000).toFixed(2)} Mpx`} sub={`${rW} × ${rH} px`}                                accentColor={quality.color} />
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <tbody>
                      {[
                        ["Panneaux (L × H)",  `${pW} × ${pH} = ${totalPanels} unités`],
                        ["Dimensions réelles",`${totalWidth.toFixed(3)} × ${totalHeight.toFixed(3)} m`],
                        ["Résolution totale", `${rW} × ${rH} px`],
                        ["Mégapixels",        `${(totalPixels/1000000).toFixed(3)} Mpx`],
                        ["Ratio d'image",     getRatio(rW, rH)],
                        ["Densité pixels",    `${pixDensity.toLocaleString()} px/m²`],
                        ["Diagonale",         `${diagonal.toFixed(1)} pouces`],
                        ["Surface active",    `${surface.toFixed(3)} m²`],
                        ["Poids total",       `${totalWeight.toFixed(1)} kg`],
                        ["Recul minimum",     `${viewMin.toFixed(2)} m`],
                        ["Recul optimal",     `${viewOpt.toFixed(2)} m`],
                      ].map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === "power" && (
              <div>
                <div className="stat-grid-3">
                  <StatCard icon="⚡"  label="Conso max"  value={`${Math.round(totalPowerMax)} W`} sub={`${(totalPowerMax/1000).toFixed(2)} kW`} accentColor="#ff5147" />
                  <StatCard icon="📉" label="Conso moy." value={`${Math.round(totalPowerAvg)} W`} sub={`${(totalPowerAvg/1000).toFixed(2)} kW`} accentColor="#ffb347" />
                  <StatCard icon="🌡️" label="BTU/h"      value={BTU.toFixed(0)}                   sub="Dissipation thermique"                    accentColor="#47c4ff" />
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
                  <StatCard icon="🔌" label="Lignes électriques" value={`${powerLines}`}   sub={`${selected.power_cable_capacity||2200} W/ligne`}                    accentColor="#e8ff47" />
                  <StatCard icon="🌐" label="Ports RJ45"         value={`${rj45Needed}`}   sub={`${(selected.rj45_capacity||535000).toLocaleString()} px/port`}       accentColor="#47c4ff" />
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <tbody>
                      {[
                        ["Nombre de cabinets",    `${totalPanels} unités (${pW} × ${pH})`],
                        ["Poids unitaire",         `${selected.weight_kgs} kg`],
                        ["Poids total",            `${totalWeight.toFixed(1)} kg`],
                        ["Surface totale",         `${surface.toFixed(3)} m²`],
                        ["Lignes électriques",     `${powerLines} ligne(s)`],
                        ["Ports RJ45 requis",      `${rj45Needed} port(s)`],
                        ["Recul min. recommandé",  `${viewMin.toFixed(2)} m`],
                        ["Recul optimal",          `${viewOpt.toFixed(2)} m`],
                      ].map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                    </tbody>
                  </table>
                </div>
                <div className="checklist">
                  <div className="checklist-title">Checklist installation</div>
                  {[
                    { ok: powerLines <= 4,   txt: `${powerLines} ligne(s) — ${powerLines<=4   ? "✓ Standard"          : "⚠ Prévoir tableau dédié"}` },
                    { ok: rj45Needed <= 8,   txt: `${rj45Needed} port(s) RJ45 — ${rj45Needed<=8 ? "✓ Switch standard 8p" : "⚠ Switch 16p ou supérieur"}` },
                    { ok: totalWeight < 300, txt: `${totalWeight.toFixed(0)} kg — ${totalWeight<300 ? "✓ Structure légère"  : "⚠ Renforcement mural requis"}` },
                    { ok: true,              txt: `Recul optimal : ${viewOpt.toFixed(1)} m minimum` },
                  ].map((item, i) => (
                    <div key={i} className="checklist-item">
                      <div className="checklist-dot" style={{ background: item.ok ? "#10b981" : "#f59e0b" }} />
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
