"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ── CONTRÔLEURS NOVASTAR ──────────────────────────────────────────────────────
// ports = sorties Ethernet RJ45 vers panneaux LED
// maxPixels = capacité totale de chargement pixels du contrôleur
const NOVASTAR_CONTROLLERS = [
  // ── Gamme MCTRL (cartes d'envoi PCIe) ──
  {
    model: "MCTRL300", serie: "MCTRL", category: "Carte d'envoi PCIe",
    ports: 1, maxPixels: 650_000, maxResW: 1920, maxResH: 1080,
    inputs: ["HDMI 1.4", "DVI"],
    features: ["1 sortie ETH", "Format PCIe x1"],
    notes: "Carte PCIe entrée de gamme. 1 sortie Ethernet. Idéale pour petites installations permanentes sur PC dédié (vitrine, affichage fixe).",
  },
  {
    model: "MCTRL660 Pro", serie: "MCTRL", category: "Carte d'envoi PCIe",
    ports: 2, maxPixels: 2_300_000, maxResW: 3840, maxResH: 1080,
    inputs: ["HDMI 2.0", "DP 1.2", "DVI"],
    features: ["2 sorties ETH indép.", "Dual output", "Format PCIe x4"],
    notes: "Carte PCIe. 2 sorties Ethernet indépendantes. Scaler intégré. Polyvalente pour touring léger et installations moyennes sur PC dédié.",
  },
  {
    model: "MCTRL4K", serie: "MCTRL", category: "Carte d'envoi PCIe",
    ports: 4, maxPixels: 3_900_000, maxResW: 3840, maxResH: 2160,
    inputs: ["HDMI 2.0", "DP 1.4"],
    features: ["4K natif", "4 sorties ETH", "Format PCIe x8"],
    notes: "Carte PCIe haut de gamme. 4K natif UHD. 4 sorties Ethernet indépendantes. Installations permanentes haute résolution sur PC dédié.",
  },

  // ── Gamme VX (boîtiers tout-en-un) ──
  {
    model: "VX1S", serie: "VX", category: "Boîtier tout-en-un",
    ports: 4, maxPixels: 2_300_000, maxResW: 3840, maxResH: 1080,
    inputs: ["HDMI 2.0", "DP 1.2"],
    features: ["1U", "4 sorties ETH", "Media player"],
    notes: "Boîtier 1U compact. 4 sorties Ethernet. Entrées HDMI/DP. Media player intégré. Salles fixes, petites scènes et événements légers.",
  },
  {
    model: "VX600", serie: "VX", category: "Boîtier tout-en-un",
    ports: 6, maxPixels: 2_600_000, maxResW: 3840, maxResH: 1080,
    inputs: ["HDMI 2.0", "DP 1.2", "SDI"],
    features: ["2U", "6 sorties ETH", "SDI", "Scaler"],
    notes: "Boîtier 2U. 6 sorties Ethernet. Entrées HDMI/DP/SDI. Scaler intégré. Référence événementielle pour salles moyennes et scènes mid-scale.",
  },
  {
    model: "VX1000", serie: "VX", category: "Boîtier tout-en-un",
    ports: 10, maxPixels: 6_500_000, maxResW: 7680, maxResH: 1080,
    inputs: ["HDMI 2.0", "DP 1.4", "SDI"],
    features: ["2U", "10 sorties ETH", "Ultra-wide", "Scaler"],
    notes: "Boîtier 2U. 10 sorties Ethernet. Résolution max 7680×1080. Idéal grandes scènes, bannières LED et murs panoramiques ultra-larges.",
  },
  {
    model: "VX4S", serie: "VX", category: "Boîtier tout-en-un",
    ports: 4, maxPixels: 3_900_000, maxResW: 3840, maxResH: 2160,
    inputs: ["HDMI 2.0", "DP 1.4", "12G-SDI"],
    features: ["2U", "4K natif", "Media player", "Scaler avancé", "Multi-source"],
    notes: "Boîtier 2U. 4 sorties + media player intégré. 4K UHD natif, scaler avancé, gestion multi-source. La référence événementielle 4K.",
  },
  {
    model: "VX16S", serie: "VX", category: "Boîtier tout-en-un",
    ports: 16, maxPixels: 10_400_000, maxResW: 7680, maxResH: 2160,
    inputs: ["HDMI 2.0", "DP 1.4", "12G-SDI"],
    features: ["3U", "16 sorties ETH", "Multi-zones", "8K-ready"],
    notes: "Boîtier 3U. 16 sorties Ethernet. Résolution max 7680×2160. Très grandes installations permanentes et configurations multi-zones complexes.",
  },

  // ── Gamme H (processeurs vidéo broadcast) ──
  {
    model: "H2", serie: "H", category: "Processeur vidéo",
    ports: 4, maxPixels: 2_300_000, maxResW: 3840, maxResH: 1080,
    inputs: ["HDMI 2.0", "DP 1.2", "DVI", "SDI"],
    features: ["Scaler broadcast", "Multi-layer", "Failover auto", "Multiviewer"],
    notes: "Processeur compact H-series. Scaler broadcast, traitement multi-layer et failover automatique intégrés. 4 entrées simultanées. Idéal événements mid-scale avec sources mixtes.",
  },
  {
    model: "H5", serie: "H", category: "Processeur vidéo",
    ports: 12, maxPixels: 6_500_000, maxResW: 3840, maxResH: 2160,
    inputs: ["HDMI 2.0", "DP 1.4", "12G-SDI", "Fibre optique"],
    features: ["4K natif", "12 sorties ETH", "Multi-source", "Broadcast grade", "Multi-layer", "Failover"],
    notes: "12 sorties Ethernet. 4K natif UHD. Multi-source broadcast, traitement multi-layer avancé, failover. Référence productions événementielles et broadcast mid à large scale.",
  },
  {
    model: "H9", serie: "H", category: "Processeur vidéo",
    ports: 18, maxPixels: 13_000_000, maxResW: 7680, maxResH: 4320,
    inputs: ["HDMI 2.0", "DP 1.4", "12G-SDI", "Fibre optique", "4K HDMI"],
    features: ["8K natif", "18 sorties ETH", "Multi-source", "Flagship", "Broadcast premium", "Failover"],
    notes: "18 sorties Ethernet. 8K natif. Multi-source broadcast haut de gamme, traitement multi-layer maximal, failover avancé. Flagship de la gamme H pour productions premium et grandes tournées.",
  },
];

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

  /* ── TAB BAR SCROLL ── */
  .tab-bar { overflow-x: auto; scrollbar-width: none; }
  .tab-bar::-webkit-scrollbar { display: none; }
  .tab-btn { white-space: nowrap; flex-shrink: 0; min-width: 0; }

  /* ── COMPARE ── */
  .compare-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .compare-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  .compare-card-header { background: var(--surface2); padding: 9px 14px; border-bottom: 1px solid var(--border); }
  .compare-card-title { font-size: 11px; font-weight: 700; color: var(--text); font-family: var(--font-mono); }
  .compare-card-sub { font-size: 9px; color: var(--text-dim); margin-top: 2px; }
  .compare-win td { background: oklch(60% 0.170 155 / 0.08) !important; color: var(--green) !important; }
  .compare-separator td { border-top: 2px solid var(--border); font-size: 9px !important; color: var(--text-dim) !important; text-transform: uppercase; letter-spacing: 0.1em; }

  /* ── PROJECT ── */
  .proj-screen-item { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .proj-screen-info { flex: 1; min-width: 0; }
  .proj-screen-name { font-size: 11px; font-weight: 600; color: var(--text); font-family: var(--font-mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .proj-screen-sub { font-size: 10px; color: var(--text-dim); margin-top: 2px; }
  .proj-total-box { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-top: 10px; }
  .proj-total-title { font-size: 9px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 10px; font-family: var(--font-mono); }
  .proj-empty { text-align: center; padding: 40px 20px; color: var(--text-dim); font-size: 13px; }
  .proj-add-btn { width: 100%; padding: 10px; border: 1.5px dashed var(--border); background: transparent; border-radius: 8px; cursor: pointer; font-family: var(--font-ui); font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 14px; transition: all 0.15s; }
  .proj-add-btn:hover { border-color: var(--accent); color: var(--accent); background: oklch(44% 0.188 245 / 0.04); }

  /* ── HISTORY ── */
  .hist-item { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .hist-info { flex: 1; min-width: 0; }
  .hist-name { font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hist-date { font-size: 10px; color: var(--text-dim); margin-top: 2px; font-family: var(--font-mono); }
  .hist-actions { display: flex; gap: 6px; flex-shrink: 0; }
  .btn-xs { padding: 4px 10px; border-radius: 5px; font-size: 10px; font-weight: 600; cursor: pointer; font-family: var(--font-ui); border: 1px solid var(--border); background: transparent; color: var(--text-muted); transition: all 0.12s; }
  .btn-xs:hover { border-color: var(--border-hover); color: var(--text); }
  .btn-xs.danger { border-color: transparent; background: oklch(56% 0.195 25 / 0.1); color: var(--red); }
  .btn-xs.primary { border-color: oklch(44% 0.188 245 / 0.4); background: oklch(44% 0.188 245 / 0.08); color: var(--accent); }
  .save-cfg-btn { width: 100%; padding: 9px; border: 1.5px dashed var(--border); background: transparent; border-radius: 7px; cursor: pointer; font-size: 11px; font-weight: 600; color: var(--text-muted); font-family: var(--font-ui); transition: all 0.15s; margin-bottom: 14px; }
  .save-cfg-btn:hover { border-color: var(--accent); color: var(--accent); background: oklch(44% 0.188 245 / 0.04); }
  .hist-empty { text-align: center; padding: 40px 20px; color: var(--text-dim); font-size: 13px; }

  /* ── SECTION LABEL ── */
  .section-label { font-size: 9px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.14em; font-family: var(--font-mono); margin-bottom: 8px; margin-top: 4px; }

  /* ── NOVASTAR CONTROLLERS ── */
  .ctrl-series-group { margin-bottom: 14px; }
  .ctrl-series-title {
    font-size: 9px; font-weight: 700; color: var(--text-dim);
    text-transform: uppercase; letter-spacing: 0.16em; font-family: var(--font-mono);
    padding: 5px 0; border-bottom: 1px solid var(--border); margin-bottom: 6px;
    display: flex; align-items: center; gap: 7px;
  }
  .ctrl-serie-pip { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .ctrl-grid { display: flex; flex-direction: column; gap: 5px; }
  .ctrl-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
    padding: 9px 12px; display: grid; grid-template-columns: auto 1fr auto; gap: 9px;
    align-items: flex-start; transition: border-color 0.15s;
  }
  .ctrl-card.ok      { border-color: oklch(60% 0.170 155 / 0.4); background: oklch(60% 0.170 155 / 0.03); }
  .ctrl-card.ok.best { border-color: var(--green); box-shadow: 0 0 0 1px oklch(60% 0.170 155 / 0.2); }
  .ctrl-card.premium { border-color: oklch(72% 0.15 295 / 0.4); background: oklch(72% 0.15 295 / 0.03); }
  .ctrl-card.premium.best { border-color: oklch(72% 0.15 295 / 0.8); box-shadow: 0 0 0 1px oklch(72% 0.15 295 / 0.2); }
  .ctrl-card.warn    { border-color: oklch(70% 0.155 55 / 0.4); background: oklch(70% 0.155 55 / 0.03); }
  .ctrl-card.fail    { border-color: var(--border); background: var(--surface2); opacity: 0.5; }
  .ctrl-status-dot   { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
  .ctrl-body         { min-width: 0; }
  .ctrl-head         { display: flex; align-items: baseline; gap: 7px; flex-wrap: wrap; }
  .ctrl-model        { font-size: 12px; font-weight: 700; color: var(--text); font-family: var(--font-mono); }
  .ctrl-category     { font-size: 9px; color: var(--text-dim); }
  .ctrl-meta         { display: flex; gap: 10px; margin-top: 3px; flex-wrap: wrap; }
  .ctrl-meta-item    { font-size: 9px; color: var(--text-dim); font-family: var(--font-mono); }
  .ctrl-meta-item strong { color: var(--text-muted); font-weight: 600; }
  .ctrl-chips        { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 5px; }
  .ctrl-chip {
    font-size: 7.5px; font-weight: 600; padding: 1.5px 5px; border-radius: 3px;
    font-family: var(--font-mono); border: 1px solid; letter-spacing: 0.03em;
  }
  .ctrl-chip.feat    { background: oklch(60% 0.170 155 / 0.08); color: var(--green); border-color: oklch(60% 0.170 155 / 0.2); }
  .ctrl-chip.inp     { background: oklch(44% 0.188 245 / 0.08); color: var(--accent); border-color: oklch(44% 0.188 245 / 0.2); }
  .ctrl-chip.prem    { background: oklch(72% 0.15 295 / 0.1); color: oklch(72% 0.15 295); border-color: oklch(72% 0.15 295 / 0.25); }
  .ctrl-notes        { font-size: 9.5px; color: var(--text-dim); margin-top: 5px; line-height: 1.5; }
  .ctrl-specs        { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; padding-top: 1px; }
  .ctrl-spec-pair    { display: flex; flex-direction: column; align-items: flex-end; }
  .ctrl-spec-val     { font-size: 12px; font-weight: 700; font-family: var(--font-mono); color: var(--text); line-height: 1; }
  .ctrl-spec-label   { font-size: 8px; color: var(--text-dim); font-family: var(--font-mono); margin-top: 1px; }
  .ctrl-badge        { font-size: 8px; font-weight: 700; padding: 2px 7px; border-radius: 3px; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; }
  .ctrl-badge.best   { background: oklch(60% 0.170 155 / 0.15); color: var(--green); }
  .ctrl-badge.prem   { background: oklch(72% 0.15 295 / 0.12); color: oklch(72% 0.15 295); }
  .ctrl-badge.ok     { background: oklch(60% 0.170 155 / 0.08); color: var(--green); opacity: 0.7; }
  .ctrl-badge.warn   { background: oklch(70% 0.155 55 / 0.12); color: var(--orange); }
  .ctrl-badge.fail   { background: var(--surface3); color: var(--text-dim); }
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
  const [customBg, setCustomBg]       = useState(null);
  const [showSilhouette, setShowSilhouette] = useState(false);
  const [brandFilter2, setBrandFilter2] = useState("all");
  const [selIdx2, setSelIdx2]         = useState(0);
  const [projectScreens, setProjectScreens] = useState(() => {
    try { return JSON.parse(localStorage.getItem("led-project") || "[]"); } catch { return []; }
  });
  const [savedConfigs, setSavedConfigs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("led-configs") || "[]"); } catch { return []; }
  });
  const fileInputRef = useRef(null);
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

  // Comparateur
  const filtered2 = products.filter(p => brandFilter2 === "all" || p.marque === brandFilter2);
  const selected2  = filtered2[Math.min(selIdx2, filtered2.length - 1)] || filtered2[0] || products[0];
  const result2    = computeLED(selected2, {
    width: Number(width)||0, height: Number(height)||0,
    panelsW: Number(panelsW)||1, panelsH: Number(panelsH)||1,
    resW: Number(resW)||1920, resH: Number(resH)||1080,
  }, mode);

  // Historique
  const saveConfig = () => {
    const cfg = {
      id: Date.now(),
      name: `${selected.panel_ref} · ${totalWidth.toFixed(2)}×${totalHeight.toFixed(2)} m`,
      date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
      panelRef: selected.panel_ref, marque: selected.marque,
      mode, width, height, panelsW, panelsH, resW, resH,
      selIdx, brandFilter, sizeFilter,
      summary: `${totalPanels} cabinets · ${rW}×${rH} px · ${Math.round(totalPowerAvg)} W`,
    };
    const next = [cfg, ...savedConfigs].slice(0, 30);
    setSavedConfigs(next);
    localStorage.setItem("led-configs", JSON.stringify(next));
  };
  const deleteConfig = (id) => {
    const next = savedConfigs.filter(c => c.id !== id);
    setSavedConfigs(next);
    localStorage.setItem("led-configs", JSON.stringify(next));
  };
  const loadConfig = (cfg) => {
    setBrandFilter(cfg.brandFilter || "all");
    setSizeFilter(cfg.sizeFilter || "60x34");
    setSelIdx(cfg.selIdx || 0);
    setMode(cfg.mode || "dimensions");
    setWidth(cfg.width); setHeight(cfg.height);
    setPanelsW(cfg.panelsW); setPanelsH(cfg.panelsH);
    setResW(cfg.resW); setResH(cfg.resH);
    setActiveTab("screen");
  };

  // Projet
  const addToProject = () => {
    const screen = {
      id: Date.now(),
      panelRef: selected.panel_ref, marque: selected.marque,
      panelsW: pW, panelsH: pH, totalPanels,
      totalWidth: totalWidth.toFixed(2), totalHeight: totalHeight.toFixed(2),
      resW: rW, resH: rH, totalPowerMax: Math.round(totalPowerMax),
      totalPowerAvg: Math.round(totalPowerAvg), totalWeight: totalWeight.toFixed(1),
      label: `${selected.panel_ref} · ${totalWidth.toFixed(2)}×${totalHeight.toFixed(2)} m`,
    };
    const next = [...projectScreens, screen];
    setProjectScreens(next);
    localStorage.setItem("led-project", JSON.stringify(next));
  };
  const removeFromProject = (id) => {
    const next = projectScreens.filter(s => s.id !== id);
    setProjectScreens(next);
    localStorage.setItem("led-project", JSON.stringify(next));
  };

  // Image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setCustomBg(ev.target.result); setBgPreset("custom"); };
    reader.readAsDataURL(file);
  };

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
    { id: "product",  label: "Produit",   icon: "📦" },
    { id: "screen",   label: "Écran",     icon: "🖥️" },
    { id: "power",    label: "Élec.",     icon: "⚡" },
    { id: "install",  label: "Install.",  icon: "🔧" },
    { id: "compare",  label: "Comparer",  icon: "⚖️" },
    { id: "project",  label: "Projet",    icon: "📋" },
    { id: "history",  label: "Historique",icon: "🕐" },
  ];

  const BG_PRESETS = [
    { id: "off",       label: "Off",       bg: "oklch(18% 0.028 245)" },
    { id: "mire",      label: "Mire",      bg: "linear-gradient(90deg,#c8c8c8 0% 14.28%,#c8c800 14.28% 28.57%,#00c8c8 28.57% 42.86%,#00c800 42.86% 57.14%,#c800c8 57.14% 71.43%,#c80000 71.43% 85.71%,#0000c8 85.71% 100%)" },
    { id: "scene",     label: "Scène",     bg: "radial-gradient(ellipse 120% 80% at 50% 110%,#6b21a8 0%,#1e1b4b 40%,#080810 100%)" },
    { id: "corporate", label: "Corporate", bg: "linear-gradient(160deg,#0f2a4a 0%,#1e4d8c 45%,#0f2a4a 100%)" },
    { id: "sport",     label: "Sport",     bg: "radial-gradient(ellipse 120% 90% at 50% 110%,#14532d 0%,#052e16 55%,#030a05 100%)" },
    { id: "custom",    label: "Image",     bg: customBg || "oklch(18% 0.028 245)" },
  ];
  const screenBgStyle = bgPreset === "custom"
    ? { background: "oklch(18% 0.028 245)" }
    : { background: BG_PRESETS.find(p => p.id === bgPreset)?.bg ?? "oklch(18% 0.028 245)" };

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
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleImageUpload} />
            <div style={{
              position:"absolute", top:8, right:10, zIndex:10,
              display:"flex", gap:3, flexWrap:"wrap", justifyContent:"flex-end",
            }}>
              {BG_PRESETS.map(p => (
                <button key={p.id} onClick={() => {
                  if (p.id === "custom") { fileInputRef.current?.click(); }
                  else setBgPreset(p.id);
                }} style={{
                  padding:"3px 8px", fontSize:"9px", fontFamily:"var(--font-mono)",
                  fontWeight: bgPreset === p.id ? 700 : 400,
                  letterSpacing:"0.04em", textTransform:"uppercase",
                  border: bgPreset === p.id ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)",
                  borderRadius:"3px", cursor:"pointer",
                  background: bgPreset === p.id ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.3)",
                  color: bgPreset === p.id ? "#fff" : "rgba(255,255,255,0.45)",
                  backdropFilter:"blur(6px)", transition:"all 0.15s",
                }}>{p.id === "custom" && customBg ? "✓ Image" : p.label}</button>
              ))}
              <button onClick={() => setShowSilhouette(s => !s)} title="Silhouette humaine (1.75 m)" style={{
                padding:"3px 8px", fontSize:"9px", fontFamily:"var(--font-mono)",
                fontWeight: showSilhouette ? 700 : 400,
                letterSpacing:"0.04em",
                border: showSilhouette ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)",
                borderRadius:"3px", cursor:"pointer",
                background: showSilhouette ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.3)",
                color: showSilhouette ? "#fff" : "rgba(255,255,255,0.45)",
                backdropFilter:"blur(6px)", transition:"all 0.15s",
              }}>👤 Échelle</button>
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
                <div className="led-screen" style={{ width: scrW, height: scrH, ...screenBgStyle }}>
                  {bgPreset === "custom" && customBg && (
                    <img src={customBg} alt="" style={{
                      position: "absolute", inset: 0,
                      width: "100%", height: "100%",
                      objectFit: "cover", objectPosition: "center",
                      display: "block", zIndex: 0,
                    }} />
                  )}
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
                <div style={{ width: 64, height: scrH, display:"flex", flexDirection:"column", justifyContent:"flex-end", alignItems:"center" }}>
                  {showSilhouette && (() => {
                    const pH2 = Math.min(Math.max(20, 1.75 * scale), vizSize.h - 20);
                    const pW2 = pH2 * 0.38;
                    return (
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                        <svg viewBox="0 0 35 100" width={pW2} height={pH2} style={{ display:"block", overflow:"visible" }}>
                          <ellipse cx="17.5" cy="8" rx="7" ry="7" fill="rgba(255,255,255,0.45)" />
                          <rect x="10" y="17" width="15" height="28" rx="3" fill="rgba(255,255,255,0.38)" />
                          <rect x="3"  y="18" width="7"  height="20" rx="3" fill="rgba(255,255,255,0.28)" />
                          <rect x="25" y="18" width="7"  height="20" rx="3" fill="rgba(255,255,255,0.28)" />
                          <rect x="11" y="44" width="6"  height="30" rx="3" fill="rgba(255,255,255,0.38)" />
                          <rect x="18" y="44" width="6"  height="30" rx="3" fill="rgba(255,255,255,0.38)" />
                          <rect x="9"  y="72" width="8"  height="10" rx="2" fill="rgba(255,255,255,0.28)" />
                          <rect x="18" y="72" width="8"  height="10" rx="2" fill="rgba(255,255,255,0.28)" />
                          <line x1="0" y1="83" x2="35" y2="83" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" strokeDasharray="2 2" />
                        </svg>
                        <div style={{ color:"rgba(255,255,255,0.5)", fontSize:8, fontFamily:"var(--font-mono)", marginTop:3, textAlign:"center" }}>1.75 m</div>
                      </div>
                    );
                  })()}
                </div>
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
                {/* ── CONTRÔLEURS NOVASTAR ── */}
                <div style={{ marginBottom: 12 }}>
                  <div className="section-label" style={{ marginBottom: 10 }}>Contrôleur Novastar — compatibilité</div>
                  {(() => {
                    const allSorted = [...NOVASTAR_CONTROLLERS].sort((a, b) => a.maxPixels - b.maxPixels);
                    const bestModel = allSorted.find(c => c.maxPixels >= totalPixels && c.ports >= rj45Needed)?.model ?? null;
                    const SERIES = [
                      { id: "MCTRL", label: "Cartes d'envoi PCIe",       pip: "var(--accent)" },
                      { id: "VX",    label: "Boîtiers tout-en-un",        pip: "var(--accent2)" },
                      { id: "H",     label: "Processeurs vidéo · H-Series", pip: "oklch(72% 0.15 295)" },
                    ];
                    return SERIES.map(({ id, label, pip }) => {
                      const controllers = NOVASTAR_CONTROLLERS
                        .filter(c => c.serie === id)
                        .sort((a, b) => a.maxPixels - b.maxPixels);
                      return (
                        <div key={id} className="ctrl-series-group">
                          <div className="ctrl-series-title">
                            <div className="ctrl-serie-pip" style={{ background: pip }} />
                            {label}
                          </div>
                          <div className="ctrl-grid">
                            {controllers.map(c => {
                              const pixOk    = c.maxPixels >= totalPixels;
                              const portOk   = c.ports >= rj45Needed;
                              const isBest   = c.model === bestModel;
                              const isPremium = c.serie === "H";
                              const compat   = pixOk && portOk;
                              const cardClass = compat
                                ? (isPremium ? "premium" : "ok") + (isBest ? " best" : "")
                                : (!pixOk && !portOk) ? "fail" : "warn";
                              const dotColor = isBest
                                ? (isPremium ? "oklch(72% 0.15 295)" : "var(--green)")
                                : compat
                                  ? (isPremium ? "oklch(72% 0.15 295 / 0.7)" : "oklch(60% 0.170 155 / 0.6)")
                                  : (pixOk || portOk) ? "var(--orange)" : "var(--border)";
                              const badgeClass = isBest ? (isPremium ? "prem" : "best")
                                : compat ? (isPremium ? "prem" : "ok")
                                : compat === false && (pixOk || portOk) ? "warn" : "fail";
                              const badgeLabel = isBest
                                ? (isPremium ? "★ Recommandé" : "Recommandé")
                                : compat
                                  ? (isPremium ? "Premium" : "Compatible")
                                  : (pixOk || portOk) ? "Partiel" : "Insuffisant";
                              return (
                                <div key={c.model} className={`ctrl-card ${cardClass}`}>
                                  <div className="ctrl-status-dot" style={{ background: dotColor }} />
                                  <div className="ctrl-body">
                                    <div className="ctrl-head">
                                      <span className="ctrl-model">{c.model}</span>
                                      <span className="ctrl-category">{c.category}</span>
                                    </div>
                                    <div className="ctrl-meta">
                                      <span className="ctrl-meta-item"><strong style={{ color: portOk ? undefined : "var(--orange)" }}>{c.ports}</strong> port{c.ports > 1 ? "s" : ""} ETH</span>
                                      <span className="ctrl-meta-item"><strong style={{ color: pixOk ? undefined : "var(--orange)" }}>{(c.maxPixels / 1_000_000).toFixed(1)}</strong> Mpx max</span>
                                      <span className="ctrl-meta-item">{c.maxResW}×{c.maxResH}</span>
                                    </div>
                                    {!compat && (
                                      <div className="ctrl-notes" style={{ color: "var(--orange)", marginTop: 4 }}>
                                        {!pixOk && <span>⚠ {(totalPixels/1_000_000).toFixed(2)} Mpx requis · max {(c.maxPixels/1_000_000).toFixed(1)} Mpx. </span>}
                                        {!portOk && <span>⚠ {rj45Needed} ports requis · {c.ports} disponibles.</span>}
                                      </div>
                                    )}
                                    {compat && (
                                      <div className="ctrl-chips">
                                        {c.features.map(f => <span key={f} className={`ctrl-chip ${isPremium ? "prem" : "feat"}`}>{f}</span>)}
                                      </div>
                                    )}
                                    {compat && (
                                      <div className="ctrl-chips">
                                        {c.inputs.map(inp => <span key={inp} className="ctrl-chip inp">{inp}</span>)}
                                      </div>
                                    )}
                                    {(isBest || (isPremium && compat)) && (
                                      <div className="ctrl-notes">{c.notes}</div>
                                    )}
                                  </div>
                                  <div className="ctrl-specs">
                                    <div className="ctrl-spec-pair">
                                      <span className="ctrl-spec-val" style={{ color: portOk ? undefined : "var(--orange)" }}>{c.ports}</span>
                                      <span className="ctrl-spec-label">ports</span>
                                    </div>
                                    <div className="ctrl-spec-pair">
                                      <span className="ctrl-spec-val" style={{ color: pixOk ? undefined : "var(--orange)" }}>{(c.maxPixels/1_000_000).toFixed(1)}</span>
                                      <span className="ctrl-spec-label">Mpx</span>
                                    </div>
                                    <span className={`ctrl-badge ${badgeClass}`}>{badgeLabel}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
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

            {/* ── COMPARER ── */}
            {activeTab === "compare" && (
              <div>
                <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, padding:"12px 14px", marginBottom:14 }}>
                  <div className="section-label">Panneau B à comparer (mêmes dimensions)</div>
                  <div className="product-select-wrap" style={{ marginBottom:6 }}>
                    <select className="product-select" value={brandFilter2} onChange={e => { setBrandFilter2(e.target.value); setSelIdx2(0); }}>
                      <option value="all">Toutes les marques</option>
                      {brands.filter(b => b !== "all").map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    {chevron}
                  </div>
                  <div className="product-select-wrap">
                    <select className="product-select" value={selIdx2} onChange={e => setSelIdx2(Number(e.target.value))}>
                      {filtered2.map((p, i) => (
                        <option key={i} value={i}>{p.panel_ref} — P{p.pixel_pitch_mm} · {Math.round(p.panel_width_m*100)}×{Math.round(p.panel_height_m*100)}cm · {p.nits}nits</option>
                      ))}
                    </select>
                    {chevron}
                  </div>
                </div>

                <div className="compare-cols">
                  {[
                    { sel: selected,  res: result,  tag: "A — Sélection" },
                    { sel: selected2, res: result2, tag: "B — Comparé" },
                  ].map(({ sel, res, tag }, idx) => {
                    const other = idx === 0 ? result2 : result;
                    const otherSel = idx === 0 ? selected2 : selected;
                    const wins = (a, b, lowerBetter) => lowerBetter ? a < b : a > b;
                    return (
                      <div key={tag} className="compare-card">
                        <div className="compare-card-header">
                          <div className="compare-card-title">{tag}</div>
                          <div className="compare-card-sub">{sel.panel_ref} · {sel.marque}</div>
                        </div>
                        <table className="data-table" style={{ fontSize:11 }}>
                          <tbody>
                            {[
                              { k:"Pitch",     v:`${sel.pixel_pitch_mm} mm`,      win: wins(sel.pixel_pitch_mm, otherSel.pixel_pitch_mm, true) },
                              { k:"Luminosité",v:`${sel.nits} nits`,              win: wins(sel.nits, otherSel.nits, false) },
                              { k:"Refresh",   v:`${sel.refresh_rate_hz} Hz`,     win: wins(sel.refresh_rate_hz, otherSel.refresh_rate_hz, false) },
                              { k:"Type LED",  v:sel.type_led || "—",             win: false },
                              { k:"Poids/u",   v:`${sel.weight_kgs} kg`,          win: wins(sel.weight_kgs, otherSel.weight_kgs, true) },
                              { k:"Conso max/u",v:`${sel.power_max_w} W`,         win: wins(sel.power_max_w, otherSel.power_max_w, true) },
                              { k:"───",       v:"─ Résultat config ─", sep:true },
                              { k:"Panneaux",  v:`${res.panelsW}×${res.panelsH} = ${res.totalPanels}`, win: wins(res.totalPanels, other.totalPanels, true) },
                              { k:"Résolution",v:`${res.resW}×${res.resH}`,       win: wins(res.totalPixels, other.totalPixels, false) },
                              { k:"Conso moy.",v:`${Math.round(res.totalPowerAvg)} W`, win: wins(res.totalPowerAvg, other.totalPowerAvg, true) },
                              { k:"Poids total",v:`${(res.totalPanels * sel.weight_kgs).toFixed(0)} kg`, win: wins(res.totalPanels * sel.weight_kgs, other.totalPanels * otherSel.weight_kgs, true) },
                            ].map((row) => (
                              <tr key={row.k} className={row.sep ? "compare-separator" : row.win ? "compare-win" : ""}>
                                <td>{row.k}</td><td>{row.v}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── PROJET ── */}
            {activeTab === "project" && (
              <div>
                <button className="proj-add-btn" onClick={addToProject}>
                  + Ajouter l'écran actuel au projet ({selected.panel_ref} · {totalWidth.toFixed(2)}×{totalHeight.toFixed(2)} m)
                </button>

                {projectScreens.length === 0 ? (
                  <div className="proj-empty">Aucun écran dans le projet.<br />Configurez un écran puis cliquez sur "Ajouter".</div>
                ) : (<>
                  {projectScreens.map((s, i) => (
                    <div key={s.id} className="proj-screen-item">
                      <div style={{ width:28, height:28, background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"var(--text-dim)", fontFamily:"var(--font-mono)", flexShrink:0 }}>{i+1}</div>
                      <div className="proj-screen-info">
                        <div className="proj-screen-name">{s.label}</div>
                        <div className="proj-screen-sub">{s.panelsW}×{s.panelsH} cabinets · {s.resW}×{s.resH}px · {s.totalPowerAvg} W moy.</div>
                      </div>
                      <button className="btn-xs danger" onClick={() => removeFromProject(s.id)}>✕</button>
                    </div>
                  ))}

                  <div className="proj-total-box">
                    <div className="proj-total-title">Totaux du projet</div>
                    <table className="data-table">
                      <tbody>
                        {[
                          ["Écrans",           `${projectScreens.length}`],
                          ["Cabinets total",   `${projectScreens.reduce((s,x) => s + x.totalPanels, 0)}`],
                          ["Conso max totale", `${projectScreens.reduce((s,x) => s + x.totalPowerMax, 0)} W`],
                          ["Conso moy. totale",`${projectScreens.reduce((s,x) => s + x.totalPowerAvg, 0)} W`],
                          ["Poids total",      `${projectScreens.reduce((s,x) => s + parseFloat(x.totalWeight), 0).toFixed(1)} kg`],
                        ].map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                      </tbody>
                    </table>
                    <button className="btn-xs danger" style={{ marginTop:12, width:"100%", textAlign:"center" }} onClick={() => {
                      setProjectScreens([]); localStorage.removeItem("led-project");
                    }}>Vider le projet</button>
                  </div>
                </>)}
              </div>
            )}

            {/* ── HISTORIQUE ── */}
            {activeTab === "history" && (
              <div>
                <button className="save-cfg-btn" onClick={saveConfig}>
                  ＋ Sauvegarder la configuration actuelle ({selected.panel_ref} · {totalWidth.toFixed(2)}×{totalHeight.toFixed(2)} m)
                </button>

                {savedConfigs.length === 0 ? (
                  <div className="hist-empty">Aucune configuration sauvegardée.<br />Cliquez sur "Sauvegarder" pour en créer une.</div>
                ) : (
                  savedConfigs.map(cfg => (
                    <div key={cfg.id} className="hist-item">
                      <div className="hist-info">
                        <div className="hist-name">{cfg.name}</div>
                        <div className="hist-date">{cfg.date} · {cfg.summary}</div>
                      </div>
                      <div className="hist-actions">
                        <button className="btn-xs primary" onClick={() => loadConfig(cfg)}>Charger</button>
                        <button className="btn-xs danger"  onClick={() => deleteConfig(cfg.id)}>✕</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
