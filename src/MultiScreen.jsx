import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ── Algorithm (identical to PanelMixer) ────────────────────────────────────

function roundMm(m) { return Math.round(parseFloat(m) * 1000); }

function findCombinations(sizesMm, targetMm, toleranceMm = 50) {
  if (targetMm <= 0 || !sizesMm.length) return [];
  const sorted = [...new Set(sizesMm)].sort((a, b) => b - a);
  const results = [], seen = new Set();
  function search(idx, rem, combo) {
    if (results.length > 80) return;
    if (rem <= toleranceMm && rem >= 0) {
      const key = sorted.map(s => `${s}:${combo[s] || 0}`).join("|");
      if (!seen.has(key)) { seen.add(key); results.push({ combo: { ...combo }, waste: rem }); }
      if (rem === 0) return;
    }
    if (rem < 0 || idx >= sorted.length) return;
    const size = sorted[idx];
    for (let n = Math.min(Math.floor(rem / size), 50); n >= 0; n--) {
      const c = { ...combo }; if (n > 0) c[size] = n;
      search(idx + 1, rem - n * size, c);
    }
  }
  search(0, targetMm, {});
  return results.sort((a, b) => {
    if (a.waste !== b.waste) return a.waste - b.waste;
    const ac = Object.values(a.combo).reduce((s, v) => s + v, 0);
    const bc = Object.values(b.combo).reduce((s, v) => s + v, 0);
    return ac !== bc ? ac - bc : Object.keys(a.combo).length - Object.keys(b.combo).length;
  });
}

function solvePanelMix(panels, targetW_mm, targetH_mm, toleranceMm) {
  function buildSolutions(pList, tol = toleranceMm) {
    const widths  = [...new Set(pList.map(p => roundMm(p.panel_width_m)))];
    const heights = [...new Set(pList.map(p => roundMm(p.panel_height_m)))];
    const widthCombos  = findCombinations(widths,  targetW_mm, tol).slice(0, 20);
    const heightCombos = findCombinations(heights, targetH_mm, tol).slice(0, 20);
    const sols = [];
    for (const wc of widthCombos) {
      for (const hc of heightCombos) {
        const layout = []; let valid = true;
        for (const [ws, wn] of Object.entries(wc.combo)) {
          for (const [hs, hn] of Object.entries(hc.combo)) {
            const wMm = parseInt(ws), hMm = parseInt(hs);
            const panel = pList.find(p => roundMm(p.panel_width_m) === wMm && roundMm(p.panel_height_m) === hMm);
            if (!panel) { valid = false; break; }
            layout.push({ panel, cols: parseInt(wn), rows: parseInt(hn), count: parseInt(wn) * parseInt(hn), wMm, hMm });
          }
          if (!valid) break;
        }
        if (!valid || !layout.length) continue;
        const totalPanels   = layout.reduce((s, t) => s + t.count, 0);
        const totalWeight   = layout.reduce((s, t) => s + t.count * (t.panel.weight_kgs || 0), 0);
        const totalPowerMax = layout.reduce((s, t) => s + t.count * (t.panel.power_max_w || 0), 0);
        const totalPowerAvg = layout.reduce((s, t) => s + t.count * (t.panel.power_avg_w || 0), 0);
        const totalPixW = Object.entries(wc.combo).reduce((s, [ws, wn]) => {
          const p = pList.find(p => roundMm(p.panel_width_m) === parseInt(ws));
          return s + (p ? p.resolution_w * parseInt(wn) : 0);
        }, 0);
        const totalPixH = Object.entries(hc.combo).reduce((s, [hs, hn]) => {
          const p = pList.find(p => roundMm(p.panel_height_m) === parseInt(hs));
          return s + (p ? p.resolution_h * parseInt(hn) : 0);
        }, 0);
        sols.push({ wc, hc, layout, totalPanels, totalWeight, totalPowerMax, totalPowerAvg, totalPixW, totalPixH,
          actualW: targetW_mm - wc.waste, actualH: targetH_mm - hc.waste, waste: wc.waste + hc.waste, types: layout.length });
      }
    }
    return sols;
  }
  const solKey = sol => sol.layout.map(t => `${t.wMm}x${t.hMm}:${t.cols}x${t.rows}`).sort().join("|");
  const portraitPanels = panels.filter(p => roundMm(p.panel_height_m) > roundMm(p.panel_width_m));
  let portraitSols = [];
  if (portraitPanels.length > 0) {
    const maxPortraitDim = Math.max(...portraitPanels.flatMap(p => [roundMm(p.panel_width_m), roundMm(p.panel_height_m)]));
    portraitSols = buildSolutions(portraitPanels, Math.max(toleranceMm, maxPortraitDim));
  }
  const maxArea = sol => Math.max(...sol.layout.map(t => t.wMm * t.hMm));
  const sortPortrait = arr => arr.sort((a, b) =>
    maxArea(a) !== maxArea(b) ? maxArea(b) - maxArea(a) :
    a.waste !== b.waste ? a.waste - b.waste :
    a.totalPanels !== b.totalPanels ? a.totalPanels - b.totalPanels : a.types - b.types);
  const portraitKeys = new Set(portraitSols.map(solKey));
  const allSols = buildSolutions(panels);
  const mixedSols = allSols.filter(s => !portraitKeys.has(solKey(s)));
  const sortMixed = arr => arr.sort((a, b) => a.waste !== b.waste ? a.waste - b.waste : a.totalPanels - b.totalPanels);
  return [...sortPortrait(portraitSols), ...sortMixed(mixedSols)].slice(0, 8);
}

// ── PDF Export ──────────────────────────────────────────────────────────────

function exportMultiScreenPDF(screens) {
  const date = new Date().toLocaleDateString("fr-FR");
  const solved = screens.filter(s => s.solution);

  const screenSections = solved.map((s, idx) => {
    const sol = s.solution;
    const rows = sol.layout.map(t => `
      <tr>
        <td>${t.panel.panel_ref}</td><td>${t.panel.marque || "—"}</td>
        <td>${t.panel.pixel_pitch_mm} mm</td><td>${t.wMm}×${t.hMm} mm</td>
        <td>${t.cols} col. × ${t.rows} rang${t.rows > 1 ? "s" : ""}</td>
        <td style="font-weight:700;color:#0071e3">${t.count}</td>
        <td>${(t.count * (t.panel.weight_kgs || 0)).toFixed(1)} kg</td>
        <td>${(t.count * (t.panel.power_max_w || 0)).toFixed(0)} W</td>
      </tr>`).join("");
    return `<div class="${idx > 0 ? "page-break" : ""}">
      <h2>Écran ${idx + 1} — ${s.name}</h2>
      <p class="sub">Cible : <b>${parseFloat(s.targetW).toFixed(3)} m × ${parseFloat(s.targetH).toFixed(3)} m</b>
        &nbsp;·&nbsp; Réel : <b>${(sol.actualW/1000).toFixed(3)} m × ${(sol.actualH/1000).toFixed(3)} m</b>
        &nbsp;·&nbsp; <span class="badge ${sol.waste === 0 ? "badge-ok" : "badge-tol"}">${sol.waste === 0 ? "✓ Ajustement parfait" : `±${sol.waste}mm d'écart`}</span></p>
      <div class="specs-grid">
        <div class="spec-box"><div class="spec-label">Panneaux</div><div class="spec-val">${sol.totalPanels}</div><div class="spec-sub">${sol.types} type${sol.types > 1 ? "s" : ""}</div></div>
        <div class="spec-box"><div class="spec-label">Résolution</div><div class="spec-val">${sol.totalPixW}×${sol.totalPixH}</div><div class="spec-sub">${((sol.totalPixW * sol.totalPixH)/1e6).toFixed(1)} Mpx</div></div>
        <div class="spec-box"><div class="spec-label">Poids</div><div class="spec-val">${sol.totalWeight.toFixed(1)} kg</div></div>
        <div class="spec-box"><div class="spec-label">Conso max</div><div class="spec-val">${(sol.totalPowerMax/1000).toFixed(2)} kW</div><div class="spec-sub">Moy : ${(sol.totalPowerAvg/1000).toFixed(2)} kW</div></div>
      </div>
      <h3>Détail des panneaux</h3>
      <table><thead><tr><th>Référence</th><th>Marque</th><th>Pitch</th><th>Dimensions</th><th>Disposition</th><th>Qté</th><th>Poids</th><th>Conso max</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </div>`;
  });

  const totalPanels   = solved.reduce((s, sc) => s + sc.solution.totalPanels, 0);
  const totalWeight   = solved.reduce((s, sc) => s + sc.solution.totalWeight, 0);
  const totalPowerMax = solved.reduce((s, sc) => s + sc.solution.totalPowerMax, 0);
  const totalPowerAvg = solved.reduce((s, sc) => s + sc.solution.totalPowerAvg, 0);

  const synthRows = solved.map((s, i) => {
    const sol = s.solution;
    return `<tr>
      <td>${i + 1}</td><td><b>${s.name}</b></td>
      <td>${parseFloat(s.targetW).toFixed(3)} × ${parseFloat(s.targetH).toFixed(3)} m</td>
      <td>${(sol.actualW/1000).toFixed(3)} × ${(sol.actualH/1000).toFixed(3)} m</td>
      <td style="font-weight:700;color:#0071e3">${sol.totalPanels}</td>
      <td>${sol.totalPixW}×${sol.totalPixH}</td>
      <td>${sol.totalWeight.toFixed(1)} kg</td>
      <td>${(sol.totalPowerMax/1000).toFixed(2)} kW</td>
      <td>${(sol.totalPowerAvg/1000).toFixed(2)} kW</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Installation Multi-Écrans LED</title><style>
  body{font-family:Arial,sans-serif;font-size:12px;color:#000;margin:2cm}
  h1{font-size:20px;font-weight:700;margin-bottom:4px}
  h2{font-size:16px;font-weight:700;margin:20px 0 6px;border-bottom:2px solid #000;padding-bottom:4px}
  h3{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:14px 0 8px;border-bottom:1px solid #ccc;padding-bottom:3px}
  .sub{color:#555;font-size:12px;margin-bottom:14px}
  table{width:100%;border-collapse:collapse;margin-bottom:14px}
  th{background:#f0f0f0;padding:6px 8px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;border-bottom:2px solid #ccc}
  td{padding:7px 8px;border-bottom:1px solid #e0e0e0}
  tfoot td{font-weight:700;background:#f0f7ff;border-top:2px solid #0071e3}
  .specs-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:16px}
  .spec-box{border:1px solid #ccc;border-radius:5px;padding:10px}
  .spec-label{font-size:9px;color:#666;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
  .spec-val{font-size:17px;font-weight:700}
  .spec-sub{font-size:9px;color:#888}
  .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700}
  .badge-ok{background:#d4edda;color:#155724}
  .badge-tol{background:#fff3cd;color:#856404}
  .page-break{page-break-before:always}
  footer{margin-top:40px;border-top:1px solid #ccc;padding-top:6px;color:#999;font-size:10px}
</style></head><body>
<h1>Installation Multi-Écrans LED</h1>
<p class="sub"><b>${solved.length} écran${solved.length > 1 ? "s" : ""}</b> · Généré le ${date}</p>
${screenSections.join("\n")}
<div class="page-break">
  <h2>Synthèse de l'installation</h2>
  <div class="specs-grid">
    <div class="spec-box"><div class="spec-label">Écrans</div><div class="spec-val">${solved.length}</div></div>
    <div class="spec-box"><div class="spec-label">Panneaux total</div><div class="spec-val" style="color:#0071e3">${totalPanels}</div></div>
    <div class="spec-box"><div class="spec-label">Poids total</div><div class="spec-val">${totalWeight.toFixed(1)} kg</div></div>
    <div class="spec-box"><div class="spec-label">Conso max totale</div><div class="spec-val">${(totalPowerMax/1000).toFixed(2)} kW</div><div class="spec-sub">Moy : ${(totalPowerAvg/1000).toFixed(2)} kW</div></div>
  </div>
  <h3>Récapitulatif par écran</h3>
  <table>
    <thead><tr><th>#</th><th>Écran</th><th>Dim. cible</th><th>Dim. réelle</th><th>Panneaux</th><th>Résolution</th><th>Poids</th><th>Conso max</th><th>Conso moy.</th></tr></thead>
    <tbody>${synthRows}</tbody>
    <tfoot><tr>
      <td colspan="4">TOTAL</td>
      <td>${totalPanels}</td><td>—</td>
      <td>${totalWeight.toFixed(1)} kg</td>
      <td>${(totalPowerMax/1000).toFixed(2)} kW</td>
      <td>${(totalPowerAvg/1000).toFixed(2)} kW</td>
    </tr></tfoot>
  </table>
</div>
<footer>Généré le ${date} · LED Calculator — Installation Multi-Écrans</footer>
</body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.print();
}

// ── Colors ──────────────────────────────────────────────────────────────────

const COLORS = ["#0071e3","#34c759","#ff9500","#af52de","#ff3b30","#00b4d8","#f72585"];

// ── CSS ─────────────────────────────────────────────────────────────────────

const css = `
  .ms-wrap { min-height:100vh; background:#f5f5f7; font-family:-apple-system,'Helvetica Neue',sans-serif; }

  .ms-topbar { background:rgba(245,245,247,.95); backdrop-filter:blur(20px); border-bottom:1px solid rgba(0,0,0,.08); padding:0 28px; height:60px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; }
  .ms-topbar-left { display:flex; align-items:center; gap:16px; }
  .ms-topbar-title { font-size:17px; font-weight:600; color:#1d1d1f; }
  .ms-topbar-sub { font-size:11px; color:#aeaeb2; text-transform:uppercase; letter-spacing:.05em; }
  .ms-back-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; border:1.5px solid rgba(0,0,0,.18); background:white; color:#1d1d1f; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; }
  .ms-back-btn:hover { background:#f5f5f7; border-color:rgba(0,0,0,.3); }
  .ms-btn-add { padding:10px 18px; border-radius:10px; border:1.5px solid #0071e3; background:rgba(0,113,227,.08); color:#0071e3; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .15s; }
  .ms-btn-add:hover { background:rgba(0,113,227,.14); }
  .ms-btn-pdf { padding:10px 18px; border-radius:10px; border:none; background:#1d1d1f; color:white; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:background .15s; display:flex; align-items:center; gap:6px; }
  .ms-btn-pdf:hover { background:#333; }
  .ms-btn-solve { padding:11px 20px; border-radius:10px; border:none; background:linear-gradient(145deg,#0071e3,#40b0ff); color:white; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap; height:44px; }
  .ms-btn-solve:disabled { opacity:.45; cursor:not-allowed; }

  .ms-content { max-width:1100px; margin:0 auto; padding:28px 24px 80px; }
  .ms-title { font-size:22px; font-weight:700; color:#1d1d1f; margin-bottom:4px; }
  .ms-subtitle { font-size:14px; color:#6e6e73; margin-bottom:24px; }

  .ms-screen-card { background:white; border-radius:14px; border:1px solid rgba(0,0,0,.08); box-shadow:0 1px 3px rgba(0,0,0,.06); overflow:hidden; }
  .ms-screen-header { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; background:#f9f9fb; border-bottom:1px solid rgba(0,0,0,.06); }
  .ms-screen-badge { width:28px; height:28px; border-radius:50%; color:white; font-size:13px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .ms-name-input { border:none; background:transparent; font-size:15px; font-weight:700; color:#1d1d1f; font-family:inherit; outline:none; padding:4px 8px; border-radius:6px; min-width:160px; }
  .ms-name-input:hover { background:rgba(0,0,0,.04); }
  .ms-name-input:focus { background:white; box-shadow:0 0 0 2px rgba(0,113,227,.2); }
  .ms-remove-btn { padding:7px 14px; border-radius:8px; border:1.5px solid rgba(255,59,48,.3); background:rgba(255,59,48,.06); color:#ff3b30; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; }
  .ms-remove-btn:hover { background:rgba(255,59,48,.12); border-color:rgba(255,59,48,.5); }

  .ms-screen-filters { display:flex; gap:10px; padding:14px 20px; border-bottom:1px solid rgba(0,0,0,.06); flex-wrap:wrap; }
  .ms-screen-dims { display:grid; grid-template-columns:1fr 1fr 1fr auto; gap:14px; padding:16px 20px; align-items:end; }
  .ms-form-group { display:flex; flex-direction:column; gap:6px; }
  .ms-label { font-size:13px; font-weight:600; color:#1d1d1f; }
  .ms-input-wrap { position:relative; }
  .ms-input { width:100%; padding:10px 40px 10px 12px; border-radius:8px; border:1.5px solid #d1d1d6; font-size:16px; font-family:inherit; color:#1d1d1f; background:#fff; outline:none; transition:border-color .15s,box-shadow .15s; box-sizing:border-box; -webkit-appearance:none; appearance:none; }
  .ms-input:focus { border-color:#0071e3; box-shadow:0 0 0 3px rgba(0,113,227,.12); }
  .ms-input-unit { position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:14px; font-weight:700; color:#0071e3; pointer-events:none; }
  .ms-select { padding:10px 12px; border-radius:8px; border:1.5px solid #d1d1d6; font-size:14px; font-family:inherit; color:#1d1d1f; outline:none; background:#fff; width:100%; -webkit-appearance:none; appearance:none; }

  .ms-no-sol { margin:0 20px 16px; padding:12px 16px; background:rgba(255,59,48,.06); border:1px solid rgba(255,59,48,.2); border-radius:8px; color:#ff3b30; font-size:13px; font-weight:600; }

  .ms-solution { border-top:1px solid rgba(0,0,0,.06); padding:16px 20px; background:#f9f9fb; }
  .ms-sol-header { display:flex; align-items:center; gap:12px; margin-bottom:12px; flex-wrap:wrap; }
  .ms-waste-badge { font-size:12px; font-weight:700; padding:4px 12px; border-radius:20px; }
  .ms-waste-badge.perfect { background:rgba(52,199,89,.15); color:#1a7a2e; }
  .ms-waste-badge.good { background:rgba(255,149,0,.15); color:#b05e00; }
  .ms-sol-dims { font-size:13px; color:#6e6e73; font-weight:500; }
  .ms-sol-panels { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
  .ms-sol-panel-row { display:flex; align-items:center; gap:10px; padding:8px 12px; background:white; border-radius:8px; border:1px solid rgba(0,0,0,.06); }
  .ms-sol-panel-dot { width:11px; height:11px; border-radius:3px; flex-shrink:0; }
  .ms-sol-panel-name { font-size:13px; font-weight:700; color:#1d1d1f; }
  .ms-sol-panel-dim { font-size:11px; color:#6e6e73; }
  .ms-sol-panel-count { font-size:16px; font-weight:800; color:#0071e3; white-space:nowrap; }
  .ms-sol-specs { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
  .ms-sol-spec { display:flex; flex-direction:column; gap:2px; }
  .ms-sol-spec-label { font-size:10px; font-weight:700; color:#aeaeb2; text-transform:uppercase; letter-spacing:.05em; }
  .ms-sol-spec-val { font-size:15px; font-weight:700; color:#1d1d1f; }

  .ms-synthesis { background:white; border-radius:14px; border:2px solid #0071e3; padding:24px; margin-top:28px; box-shadow:0 4px 20px rgba(0,113,227,.12); }
  .ms-synthesis-title { font-size:18px; font-weight:700; color:#1d1d1f; margin-bottom:20px; }
  .ms-synth-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin-bottom:24px; }
  .ms-synth-box { background:#f5f5f7; border-radius:10px; padding:14px 16px; }
  .ms-synth-label { font-size:10px; font-weight:700; color:#aeaeb2; text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }
  .ms-synth-val { font-size:22px; font-weight:800; color:#0071e3; }
  .ms-synth-sub { font-size:11px; color:#aeaeb2; margin-top:2px; }

  .ms-synth-table { width:100%; border-collapse:collapse; }
  .ms-synth-table th { background:#f5f5f7; padding:9px 12px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#6e6e73; border-bottom:2px solid rgba(0,0,0,.08); }
  .ms-synth-table td { padding:10px 12px; border-bottom:1px solid rgba(0,0,0,.06); font-size:13px; }
  .ms-synth-table tfoot td { font-weight:700; background:#f0f7ff; border-top:2px solid #0071e3; color:#0071e3; font-size:14px; }
  .ms-screen-num { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; color:white; font-size:11px; font-weight:800; }
  .ms-badge-tol { display:inline-block; padding:1px 6px; border-radius:10px; font-size:10px; font-weight:700; background:rgba(255,149,0,.15); color:#b05e00; margin-left:6px; }

  @media(max-width:768px){
    .ms-screen-dims { grid-template-columns:1fr 1fr }
    .ms-topbar { padding:0 16px; flex-wrap:wrap; height:auto; padding:10px 16px; gap:8px; }
    .ms-sol-specs { grid-template-columns:1fr 1fr }
    .ms-synth-table { font-size:11px }
    .ms-synth-table th, .ms-synth-table td { padding:6px 8px }
  }
`;

// ── Screen factory ──────────────────────────────────────────────────────────

let _idCounter = 1;
const makeScreen = (n) => ({
  id: _idCounter++,
  name: `Écran ${n}`,
  targetW: "",
  targetH: "",
  tolerance: "0",
  filterBrand: "",
  filterPitch: "",
  solution: null,
  solving: false,
  noSolution: false,
});

// ── ScreenSolution sub-component ────────────────────────────────────────────

function ScreenSolution({ sol }) {
  return (
    <div className="ms-solution">
      <div className="ms-sol-header">
        <span className={`ms-waste-badge ${sol.waste === 0 ? "perfect" : "good"}`}>
          {sol.waste === 0 ? "✓ Ajustement parfait" : `±${sol.waste} mm d'écart`}
        </span>
        <span className="ms-sol-dims">
          {(sol.actualW/1000).toFixed(3)} m × {(sol.actualH/1000).toFixed(3)} m réels
          &nbsp;·&nbsp; {sol.totalPixW}×{sol.totalPixH} px
        </span>
      </div>
      <div className="ms-sol-panels">
        {sol.layout.map((t, i) => (
          <div key={i} className="ms-sol-panel-row">
            <div className="ms-sol-panel-dot" style={{ background: COLORS[i % COLORS.length] }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="ms-sol-panel-name">{t.panel.panel_ref}</span>
              <span className="ms-sol-panel-dim"> · {t.wMm}×{t.hMm} mm · {t.cols} col. × {t.rows} rang{t.rows > 1 ? "s" : ""}{t.panel.marque ? ` · ${t.panel.marque}` : ""}</span>
            </div>
            <div className="ms-sol-panel-count">{t.count}×</div>
          </div>
        ))}
      </div>
      <div className="ms-sol-specs">
        {[
          { label: "Panneaux", val: `${sol.totalPanels} (${sol.types} type${sol.types > 1 ? "s" : ""})` },
          { label: "Résolution", val: `${sol.totalPixW}×${sol.totalPixH}` },
          { label: "Poids", val: `${sol.totalWeight.toFixed(1)} kg` },
          { label: "Conso max", val: `${(sol.totalPowerMax/1000).toFixed(2)} kW` },
        ].map((item, i) => (
          <div key={i} className="ms-sol-spec">
            <div className="ms-sol-spec-label">{item.label}</div>
            <div className="ms-sol-spec-val">{item.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ScreenCard sub-component ────────────────────────────────────────────────

function ScreenCard({ screen, idx, brands, allPanels, onUpdate, onSolve, onRemove }) {
  const pitches = [...new Set(
    allPanels
      .filter(p => !screen.filterBrand || p.marque === screen.filterBrand)
      .map(p => p.pixel_pitch_mm)
  )].sort((a, b) => a - b);

  const activePanels = allPanels.filter(p =>
    (!screen.filterBrand || p.marque === screen.filterBrand) &&
    (!screen.filterPitch || String(p.pixel_pitch_mm) === screen.filterPitch)
  );

  const canSolve = activePanels.length > 0 && parseFloat(screen.targetW) > 0 && parseFloat(screen.targetH) > 0;

  return (
    <div className="ms-screen-card">
      {/* Header */}
      <div className="ms-screen-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="ms-screen-badge" style={{ background: COLORS[idx % COLORS.length] }}>{idx + 1}</div>
          <input
            className="ms-name-input"
            value={screen.name}
            onChange={e => onUpdate({ name: e.target.value })}
            placeholder="Nom de l'écran"
          />
        </div>
        {onRemove && (
          <button className="ms-remove-btn" onClick={onRemove}>✕ Supprimer</button>
        )}
      </div>

      {/* Filters */}
      <div className="ms-screen-filters">
        <select className="ms-select" style={{ width: "auto" }} value={screen.filterBrand}
          onChange={e => onUpdate({ filterBrand: e.target.value, filterPitch: "", solution: null, noSolution: false })}>
          <option value="">Toutes les marques</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="ms-select" style={{ width: "auto" }} value={screen.filterPitch}
          onChange={e => onUpdate({ filterPitch: e.target.value, solution: null, noSolution: false })}>
          <option value="">Tous les pitches</option>
          {pitches.map(p => <option key={p} value={p}>{p} mm</option>)}
        </select>
        {activePanels.length > 0 && (
          <span style={{ fontSize: 12, color: "#aeaeb2", alignSelf: "center" }}>
            {activePanels.length} panneau{activePanels.length > 1 ? "x" : ""} disponible{activePanels.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Dimensions */}
      <div className="ms-screen-dims">
        <div className="ms-form-group">
          <label className="ms-label">Largeur <span style={{ color: "#aeaeb2", fontWeight: 400 }}>(m)</span></label>
          <div className="ms-input-wrap">
            <input className="ms-input" type="number" step="0.001" min="0.1" max="50"
              placeholder="ex : 5.75"
              value={screen.targetW}
              onChange={e => onUpdate({ targetW: e.target.value, solution: null, noSolution: false })} />
            <span className="ms-input-unit">m</span>
          </div>
        </div>
        <div className="ms-form-group">
          <label className="ms-label">Hauteur <span style={{ color: "#aeaeb2", fontWeight: 400 }}>(m)</span></label>
          <div className="ms-input-wrap">
            <input className="ms-input" type="number" step="0.001" min="0.1" max="30"
              placeholder="ex : 2.75"
              value={screen.targetH}
              onChange={e => onUpdate({ targetH: e.target.value, solution: null, noSolution: false })} />
            <span className="ms-input-unit">m</span>
          </div>
        </div>
        <div className="ms-form-group">
          <label className="ms-label">Tolérance</label>
          <select className="ms-select" value={screen.tolerance}
            onChange={e => onUpdate({ tolerance: e.target.value, solution: null, noSolution: false })}>
            <option value="0">Exacte — 0 mm</option>
            <option value="10">±10 mm</option>
            <option value="25">±25 mm</option>
            <option value="50">±50 mm</option>
            <option value="100">±100 mm</option>
          </select>
        </div>
        <div className="ms-form-group" style={{ justifyContent: "flex-end" }}>
          <button className="ms-btn-solve" disabled={!canSolve || screen.solving} onClick={onSolve}>
            {screen.solving ? "⏳ Calcul…" : "🔍 Calculer"}
          </button>
        </div>
      </div>

      {/* Result */}
      {screen.noSolution && !screen.solving && (
        <div className="ms-no-sol">
          Aucune combinaison valide — augmentez la tolérance ou ajoutez des panneaux au catalogue
        </div>
      )}
      {screen.solution && <ScreenSolution sol={screen.solution} />}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function MultiScreen({ onBack }) {
  const [allPanels, setAllPanels] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [screens, setScreens]     = useState(() => [makeScreen(1)]);

  useEffect(() => {
    const tag = document.createElement("style");
    tag.textContent = css;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);

  useEffect(() => {
    supabase.from("products").select("*").eq("is_active", true).order("marque").order("panel_ref")
      .then(({ data }) => { setAllPanels(data || []); setLoading(false); });
  }, []);

  const brands = [...new Set(allPanels.map(p => p.marque).filter(Boolean))].sort();

  const update = (id, patch) =>
    setScreens(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));

  const addScreen = () =>
    setScreens(prev => [...prev, makeScreen(prev.length + 1)]);

  const removeScreen = (id) =>
    setScreens(prev => prev.filter(s => s.id !== id));

  const handleSolve = (screen) => {
    const panels = allPanels.filter(p =>
      (!screen.filterBrand || p.marque === screen.filterBrand) &&
      (!screen.filterPitch || String(p.pixel_pitch_mm) === screen.filterPitch)
    );
    if (!panels.length || !screen.targetW || !screen.targetH) return;
    update(screen.id, { solving: true, solution: null, noSolution: false });
    setTimeout(() => {
      const sols = solvePanelMix(
        panels,
        Math.round(parseFloat(screen.targetW) * 1000),
        Math.round(parseFloat(screen.targetH) * 1000),
        parseInt(screen.tolerance) || 0
      );
      update(screen.id, { solution: sols[0] || null, noSolution: sols.length === 0, solving: false });
    }, 10);
  };

  const solvedScreens = screens.filter(s => s.solution);

  return (
    <div className="ms-wrap">
      {/* Topbar */}
      <div className="ms-topbar">
        <div className="ms-topbar-left">
          <button className="ms-back-btn" onClick={() => onBack && onBack()}>← Retour</button>
          <div>
            <div className="ms-topbar-title">📺 Multi-Écrans</div>
            <div className="ms-topbar-sub">Configuration d'installation</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="ms-btn-add" onClick={addScreen}>+ Ajouter un écran</button>
          {solvedScreens.length > 0 && (
            <button className="ms-btn-pdf" onClick={() => exportMultiScreenPDF(screens)}>
              ⬇ Exporter PDF
            </button>
          )}
        </div>
      </div>

      <div className="ms-content">
        <div className="ms-title">Configuration Multi-Écrans</div>
        <div className="ms-subtitle">
          Configurez chaque écran indépendamment, puis exportez la synthèse complète de l'installation en PDF.
        </div>

        {loading ? (
          <div style={{ color: "#aeaeb2", fontSize: 14, padding: "24px 0" }}>Chargement du catalogue…</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {screens.map((screen, idx) => (
              <ScreenCard
                key={screen.id}
                screen={screen}
                idx={idx}
                brands={brands}
                allPanels={allPanels}
                onUpdate={(patch) => update(screen.id, patch)}
                onSolve={() => handleSolve(screen)}
                onRemove={screens.length > 1 ? () => removeScreen(screen.id) : null}
              />
            ))}
          </div>
        )}

        {/* Synthesis */}
        {solvedScreens.length > 0 && (
          <div className="ms-synthesis">
            <div className="ms-synthesis-title">📊 Synthèse de l'installation</div>

            <div className="ms-synth-grid">
              {[
                { label: "Écrans configurés",  val: solvedScreens.length,                                                                         sub: null },
                { label: "Panneaux total",      val: solvedScreens.reduce((s, sc) => s + sc.solution.totalPanels, 0),                              sub: null },
                { label: "Poids total",         val: `${solvedScreens.reduce((s, sc) => s + sc.solution.totalWeight, 0).toFixed(1)} kg`,           sub: null },
                { label: "Conso. max totale",
                  val: `${(solvedScreens.reduce((s, sc) => s + sc.solution.totalPowerMax, 0) / 1000).toFixed(2)} kW`,
                  sub: `Moy : ${(solvedScreens.reduce((s, sc) => s + sc.solution.totalPowerAvg, 0) / 1000).toFixed(2)} kW` },
              ].map((item, i) => (
                <div key={i} className="ms-synth-box">
                  <div className="ms-synth-label">{item.label}</div>
                  <div className="ms-synth-val">{item.val}</div>
                  {item.sub && <div className="ms-synth-sub">{item.sub}</div>}
                </div>
              ))}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="ms-synth-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Écran</th>
                    <th>Dim. cible</th>
                    <th>Dim. réelle</th>
                    <th>Panneaux</th>
                    <th>Résolution</th>
                    <th>Poids</th>
                    <th>Conso max</th>
                  </tr>
                </thead>
                <tbody>
                  {solvedScreens.map((s, i) => {
                    const sol = s.solution;
                    return (
                      <tr key={s.id}>
                        <td>
                          <span className="ms-screen-num" style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</span>
                        </td>
                        <td><b>{s.name}</b></td>
                        <td>{parseFloat(s.targetW).toFixed(3)} × {parseFloat(s.targetH).toFixed(3)} m</td>
                        <td>
                          {(sol.actualW/1000).toFixed(3)} × {(sol.actualH/1000).toFixed(3)} m
                          {sol.waste > 0 && <span className="ms-badge-tol">±{sol.waste}mm</span>}
                        </td>
                        <td style={{ fontWeight: 700, color: "#0071e3" }}>{sol.totalPanels}</td>
                        <td>{sol.totalPixW}×{sol.totalPixH}</td>
                        <td>{sol.totalWeight.toFixed(1)} kg</td>
                        <td>{(sol.totalPowerMax/1000).toFixed(2)} kW</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4}>TOTAL</td>
                    <td>{solvedScreens.reduce((s, sc) => s + sc.solution.totalPanels, 0)}</td>
                    <td>—</td>
                    <td>{solvedScreens.reduce((s, sc) => s + sc.solution.totalWeight, 0).toFixed(1)} kg</td>
                    <td>{(solvedScreens.reduce((s, sc) => s + sc.solution.totalPowerMax, 0) / 1000).toFixed(2)} kW</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ marginTop: 20 }}>
              <button className="ms-btn-pdf" onClick={() => exportMultiScreenPDF(screens)}>
                ⬇ Exporter en PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
