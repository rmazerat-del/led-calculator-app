import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useLang, LangToggle } from "./LanguageContext";

// ── Algorithm ──────────────────────────────────────────────────────────────

function roundMm(meters) {
  return Math.round(parseFloat(meters) * 1000);
}

function findCombinations(sizesMm, targetMm, toleranceMm = 50) {
  if (targetMm <= 0 || sizesMm.length === 0) return [];
  // Largest first → algo naturally finds fewest-panel solutions earliest
  const sorted = [...new Set(sizesMm)].sort((a, b) => b - a);
  const results = [];
  const seen = new Set();

  function search(idx, remaining, combo) {
    if (results.length > 80) return;
    if (remaining <= toleranceMm && remaining >= 0) {
      const key = sorted.map(s => `${s}:${combo[s] || 0}`).join("|");
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ combo: { ...combo }, waste: remaining });
      }
      if (remaining === 0) return; // fit exact — impossible de faire mieux
      // remaining > 0 : continuer la recherche pour trouver une solution à 0 déchet
    }
    if (remaining < 0 || idx >= sorted.length) return;
    const size = sorted[idx];
    const maxN = Math.min(Math.floor(remaining / size), 50);
    for (let n = maxN; n >= 0; n--) {
      const c = { ...combo };
      if (n > 0) c[size] = n;
      search(idx + 1, remaining - n * size, c);
    }
  }

  search(0, targetMm, {});
  return results.sort((a, b) => {
    if (a.waste !== b.waste) return a.waste - b.waste;
    // Fewer total panels = preferred (favors large panels)
    const aCount = Object.values(a.combo).reduce((s, v) => s + v, 0);
    const bCount = Object.values(b.combo).reduce((s, v) => s + v, 0);
    if (aCount !== bCount) return aCount - bCount;
    return Object.keys(a.combo).length - Object.keys(b.combo).length;
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
        const layout = [];
        let valid = true;
        for (const [ws, wn] of Object.entries(wc.combo)) {
          for (const [hs, hn] of Object.entries(hc.combo)) {
            const wMm = parseInt(ws), hMm = parseInt(hs);
            const panel = pList.find(p => roundMm(p.panel_width_m) === wMm && roundMm(p.panel_height_m) === hMm);
            if (!panel) { valid = false; break; }
            layout.push({ panel, cols: parseInt(wn), rows: parseInt(hn), count: parseInt(wn) * parseInt(hn), wMm, hMm });
          }
          if (!valid) break;
        }
        if (!valid || layout.length === 0) continue;

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

        sols.push({
          wc, hc, layout, totalPanels, totalWeight, totalPowerMax, totalPowerAvg,
          totalPixW, totalPixH,
          actualW: targetW_mm - wc.waste,
          actualH: targetH_mm - hc.waste,
          waste: wc.waste + hc.waste,
          types: layout.length,
        });
      }
    }
    return sols;
  }

  const solKey = sol =>
    sol.layout.map(t => `${t.wMm}x${t.hMm}:${t.cols}x${t.rows}`).sort().join("|");

  // Phase 1: panneaux portrait avec tolérance étendue (au moins la plus grande dimension du
  // panneau portrait) → garantit toujours une solution pure grands panneaux même quand la
  // cible n'est pas un multiple exact de leurs dimensions
  const portraitPanels = panels.filter(p => roundMm(p.panel_height_m) > roundMm(p.panel_width_m));
  let portraitSols = [];
  if (portraitPanels.length > 0) {
    const maxPortraitDim = Math.max(
      ...portraitPanels.flatMap(p => [roundMm(p.panel_width_m), roundMm(p.panel_height_m)])
    );
    const portraitTol = Math.max(toleranceMm, maxPortraitDim);
    portraitSols = buildSolutions(portraitPanels, portraitTol);
  }
  const portraitKeys = new Set(portraitSols.map(solKey));

  // Phase 2: toutes les solutions avec la tolérance normale
  const allSols = buildSolutions(panels);
  const mixedSols = allSols.filter(s => !portraitKeys.has(solKey(s)));

  // Tri unifié : plus grande aire de panneau d'abord (favorise les grands panneaux),
  // puis déchet croissant, puis nb de panneaux croissant.
  // Cela permet à une solution mixte 0-déchet (grands + petits panneaux) de passer avant
  // une solution portrait-only avec du déchet — tout en gardant les grands panneaux en tête.
  const maxArea = sol => Math.max(...sol.layout.map(t => t.wMm * t.hMm));
  return [...portraitSols, ...mixedSols]
    .sort((a, b) =>
      maxArea(a) !== maxArea(b) ? maxArea(b) - maxArea(a) :
      a.waste !== b.waste ? a.waste - b.waste :
      a.totalPanels !== b.totalPanels ? a.totalPanels - b.totalPanels :
      a.types - b.types
    )
    .slice(0, 8);
}

// ── PDF Export ─────────────────────────────────────────────────────────────

async function exportPDF(sol, targetW, targetH, t) {
  const date = new Date().toLocaleDateString("fr-FR");
  const T  = (s) => `padding:8px 10px;border-bottom:1px solid #e0e0e0;${s||""}`;
  const TH = (s) => `background:#f0f0f0;padding:7px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #ccc;${s||""}`;
  const BOX = (label, val, sub) => `<div style="border:1px solid #ccc;border-radius:6px;padding:12px;flex:1">
    <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">${label}</div>
    <div style="font-size:18px;font-weight:700">${val}</div>
    ${sub ? `<div style="font-size:10px;color:#888">${sub}</div>` : ""}
  </div>`;
  const badgeStyle = sol.waste === 0 ? "background:#d4edda;color:#155724" : "background:#fff3cd;color:#856404";

  const rows = sol.layout.map(tile => `<tr>
    <td style="${T()}">${tile.panel.panel_ref}</td>
    <td style="${T()}">${tile.panel.marque||"—"}</td>
    <td style="${T()}">${tile.panel.pixel_pitch_mm} mm</td>
    <td style="${T()}">${tile.wMm}×${tile.hMm} mm</td>
    <td style="${T()}">${tile.cols} col. × ${tile.rows} rang${tile.rows>1?"s":""}</td>
    <td style="${T("font-weight:700;color:#0071e3")}">${tile.count}</td>
    <td style="${T()}">${(tile.count*(tile.panel.weight_kgs||0)).toFixed(1)} kg</td>
    <td style="${T()}">${(tile.count*(tile.panel.power_max_w||0)).toFixed(0)} W</td>
  </tr>`).join("");

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:white;padding:48px;box-sizing:border-box;font-family:Arial,sans-serif;font-size:12px;color:#000;';
  container.innerHTML = `
    <h1 style="font-size:20px;font-weight:700;margin:0 0 6px">${t.mixPdfTitle}</h1>
    <p style="color:#555;font-size:13px;margin:0 0 20px">
      ${t.targetLabel} <b>${parseFloat(targetW).toFixed(3)} m × ${parseFloat(targetH).toFixed(3)} m</b> &nbsp;·&nbsp;
      ${t.realLabel} <b>${(sol.actualW/1000).toFixed(3)} m × ${(sol.actualH/1000).toFixed(3)} m</b> &nbsp;·&nbsp;
      <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;${badgeStyle}">${sol.waste===0 ? t.perfectFit : t.deviation(sol.waste)}</span>
    </p>
    <h2 style="font-size:13px;font-weight:700;border-bottom:2px solid #000;padding-bottom:4px;margin:0 0 12px;text-transform:uppercase;letter-spacing:.05em">${t.globalSummary}</h2>
    <div style="display:flex;gap:10px;margin-bottom:20px">
      ${BOX(t.totalPanels, sol.totalPanels, `${sol.types} type${sol.types>1?"s":""}`)}
      ${BOX(t.resolution, `${sol.totalPixW}×${sol.totalPixH}`, `${((sol.totalPixW*sol.totalPixH)/1e6).toFixed(1)} Mpx`)}
      ${BOX(t.totalWeight, `${sol.totalWeight.toFixed(1)} kg`)}
      ${BOX(t.maxPowerLabel, `${(sol.totalPowerMax/1000).toFixed(2)} kW`, `${t.avg} ${(sol.totalPowerAvg/1000).toFixed(2)} kW`)}
    </div>
    <h2 style="font-size:13px;font-weight:700;border-bottom:2px solid #000;padding-bottom:4px;margin:0 0 12px;text-transform:uppercase;letter-spacing:.05em">${t.panelDetail}</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <thead><tr>
        <th style="${TH()}">${t.reference}</th><th style="${TH()}">${t.brand}</th><th style="${TH()}">${t.pitch}</th>
        <th style="${TH()}">${t.dimensions}</th><th style="${TH()}">${t.layout}</th>
        <th style="${TH()}">${t.qty}</th><th style="${TH()}">${t.weight}</th><th style="${TH()}">${t.maxPower}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:32px;border-top:1px solid #ccc;padding-top:6px;color:#999;font-size:10px">
      ${t.mixPdfFooter(date)}
    </div>`;
  document.body.appendChild(container);
  await new Promise(r => setTimeout(r, 300));

  try {
    const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const canvas = await html2canvas(container, {
      scale: 1.5, backgroundColor: '#ffffff', useCORS: true, allowTaint: true, logging: false,
    });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const A4W = 210, A4H = 297;
    const imgH = (canvas.height / canvas.width) * A4W;
    let top = 0, first = true;
    while (top < imgH) {
      if (!first) pdf.addPage();
      first = false;
      const sliceH = Math.min(A4H, imgH - top);
      const srcY = Math.round((top / imgH) * canvas.height);
      const srcH = Math.round((sliceH / imgH) * canvas.height);
      const slice = document.createElement('canvas');
      slice.width = canvas.width; slice.height = srcH;
      slice.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, A4W, sliceH);
      top += A4H;
    }
    pdf.save(`mix-led-${(sol.actualW/1000).toFixed(2)}x${(sol.actualH/1000).toFixed(2)}m-${date.replace(/\//g,'-')}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

// ── Visual grid ────────────────────────────────────────────────────────────

const COLORS = ["#0071e3","#34c759","#ff9500","#af52de","#ff3b30","#00b4d8","#f72585"];

function PanelGrid({ wc, hc, size = 240 }) {
  const totalW = Object.entries(wc.combo).reduce((s, [w, n]) => s + parseInt(w) * parseInt(n), 0);
  const totalH = Object.entries(hc.combo).reduce((s, [h, n]) => s + parseInt(h) * parseInt(n), 0);
  const scale = Math.min(size / totalW, size / totalH, 0.45);
  const wSecs = Object.entries(wc.combo).flatMap(([w, n]) => Array(parseInt(n)).fill(parseInt(w)));
  const hSecs = Object.entries(hc.combo).flatMap(([h, n]) => Array(parseInt(n)).fill(parseInt(h)));
  const colorMap = {};
  let ci = 0;
  const cells = [];
  let y = 0;
  for (const h of hSecs) {
    let x = 0;
    for (const w of wSecs) {
      const key = `${w}x${h}`;
      if (!(key in colorMap)) colorMap[key] = COLORS[ci++ % COLORS.length];
      cells.push({ x: x * scale, y: y * scale, w: w * scale - 2, h: h * scale - 2, key, wMm: w, hMm: h });
      x += w;
    }
    y += h;
  }
  return (
    <div style={{ display:"flex", justifyContent:"center" }}>
      <div style={{ position:"relative", width: totalW * scale, height: totalH * scale }}>
        {cells.map((c, i) => (
          <div key={i} style={{
            position:"absolute", left:c.x, top:c.y, width:c.w, height:c.h,
            background: colorMap[c.key] + "20",
            border: `2px solid ${colorMap[c.key]}`,
            borderRadius: 3,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize: Math.max(7, Math.min(11, c.h * 0.16)),
            color: colorMap[c.key], fontWeight: 700,
          }}>
            {c.h * scale > 24 ? `${c.wMm}×${c.hMm}` : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CSS ────────────────────────────────────────────────────────────────────

const css = `
  .mixer-wrap { min-height:100vh; background:#f5f5f7; font-family:-apple-system,'Helvetica Neue',sans-serif; }

  .mixer-topbar { background:rgba(245,245,247,.95); backdrop-filter:blur(20px); border-bottom:1px solid rgba(0,0,0,.08); padding:0 28px; height:60px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; }
  .mixer-topbar-left { display:flex; align-items:center; gap:16px; }
  .mixer-back-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; border:1.5px solid rgba(0,0,0,.18); background:white; color:#1d1d1f; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; }
  .mixer-back-btn:hover { background:#f5f5f7; border-color:rgba(0,0,0,.3); }
  .mixer-topbar-title { font-size:17px; font-weight:600; color:#1d1d1f; }
  .mixer-topbar-sub { font-size:11px; color:#aeaeb2; text-transform:uppercase; letter-spacing:.05em; }

  .mixer-content { max-width:1100px; margin:0 auto; padding:28px 24px 60px; }
  .mixer-title { font-size:22px; font-weight:700; color:#1d1d1f; margin-bottom:4px; }
  .mixer-subtitle { font-size:14px; color:#6e6e73; margin-bottom:24px; }

  .mixer-form-card { background:white; border-radius:14px; border:1px solid rgba(0,0,0,.08); padding:24px; box-shadow:0 1px 3px rgba(0,0,0,.06); margin-bottom:20px; }
  .mixer-form-title { font-size:13px; font-weight:700; color:#1d1d1f; text-transform:uppercase; letter-spacing:.05em; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
  .mixer-step-badge { width:22px; height:22px; border-radius:50%; background:#0071e3; color:white; font-size:11px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }

  .mixer-form-grid { display:grid; grid-template-columns:1fr 1fr 1fr auto; gap:16px; align-items:end; }
  .mixer-form-group { display:flex; flex-direction:column; gap:6px; }
  .mixer-label { font-size:13px; font-weight:600; color:#1d1d1f; }
  .mixer-label-hint { font-size:11px; color:#aeaeb2; font-weight:400; margin-left:4px; }
  .mixer-input-wrap { position:relative; }
  .mixer-input { width:100%; padding:10px 40px 10px 12px; border-radius:8px; border:1.5px solid #d1d1d6; font-size:16px; font-family:inherit; color:#1d1d1f; background:#ffffff; outline:none; transition:border-color .15s,box-shadow .15s; box-sizing:border-box; -webkit-appearance:none; appearance:none; }
  .mixer-input::placeholder { color:#b0b0b8; }
  .mixer-input:focus { border-color:#0071e3; box-shadow:0 0 0 3px rgba(0,113,227,.12); background:#ffffff; }
  .mixer-input-unit { position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:14px; font-weight:700; color:#0071e3; pointer-events:none; }
  .mixer-input-hint { font-size:11px; color:#aeaeb2; margin-top:4px; }
  .mixer-select { padding:10px 12px; border-radius:8px; border:1.5px solid #d1d1d6; font-size:14px; font-family:inherit; color:#1d1d1f; outline:none; background:#ffffff; width:100%; -webkit-appearance:none; appearance:none; }
  .mixer-btn-solve { padding:11px 24px; border-radius:10px; border:none; background:linear-gradient(145deg,#0071e3,#40b0ff); color:white; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap; height:44px; }
  .mixer-btn-solve:disabled { opacity:.45; cursor:not-allowed; }

  .mixer-filters { display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap; }
  .mixer-panels-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px; margin-top:12px; }
  .mixer-panel-chip { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; border:1.5px solid rgba(0,0,0,.1); background:white; cursor:pointer; transition:all .15s; }
  .mixer-panel-chip:hover { border-color:rgba(0,113,227,.4); background:rgba(0,113,227,.03); }
  .mixer-panel-chip.selected { border-color:#0071e3; background:rgba(0,113,227,.07); }
  .mixer-panel-chip.selected .chip-dot { background:#0071e3; transform:scale(1.2); }
  .chip-dot { width:9px; height:9px; border-radius:50%; background:#d1d1d6; flex-shrink:0; transition:all .15s; }
  .chip-label { font-size:12px; font-weight:700; color:#1d1d1f; }
  .chip-sub { font-size:10px; color:#aeaeb2; margin-top:1px; }
  .chip-dim { font-size:11px; color:#6e6e73; font-weight:600; margin-top:1px; }

  .mixer-results-header { font-size:14px; font-weight:600; color:#6e6e73; margin-bottom:14px; }
  .mixer-solutions { display:flex; flex-direction:column; gap:16px; }

  .sol-card { background:white; border-radius:14px; border:2px solid rgba(0,0,0,.08); overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.06); transition:border-color .2s; }
  .sol-card.selected-sol { border-color:#0071e3; box-shadow:0 0 0 3px rgba(0,113,227,.12); }
  .sol-header { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:1px solid rgba(0,0,0,.06); background:#f9f9fb; gap:12px; flex-wrap:wrap; }
  .sol-header-left { display:flex; align-items:center; gap:10px; }
  .sol-rank-num { width:28px; height:28px; border-radius:50%; background:#1d1d1f; color:white; font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .sol-rank-num.first { background:linear-gradient(145deg,#0071e3,#40b0ff); }
  .sol-rank-label { font-size:12px; font-weight:600; color:#6e6e73; }
  .sol-header-right { display:flex; align-items:center; gap:8px; }
  .sol-waste-badge { font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; }
  .sol-waste-badge.perfect { background:rgba(52,199,89,.15); color:#1a7a2e; }
  .sol-waste-badge.good { background:rgba(255,149,0,.15); color:#b05e00; }
  .sol-select-btn { padding:7px 16px; border-radius:8px; border:none; background:#0071e3; color:white; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; transition:background .15s; }
  .sol-select-btn:hover { background:#005bbf; }
  .sol-select-btn.active { background:#34c759; }

  .sol-body { display:grid; grid-template-columns:260px 1fr; }
  .sol-viz { padding:20px; border-right:1px solid rgba(0,0,0,.06); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; }
  .sol-viz-label { font-size:11px; color:#aeaeb2; text-align:center; }
  .sol-details { padding:20px; }
  .sol-layout-list { display:flex; flex-direction:column; gap:8px; margin-bottom:16px; }
  .sol-panel-row { display:flex; align-items:center; gap:10px; padding:10px 14px; background:#f5f5f7; border-radius:10px; }
  .sol-panel-dot { width:13px; height:13px; border-radius:3px; flex-shrink:0; }
  .sol-panel-info { flex:1; min-width:0; }
  .sol-panel-name { font-size:13px; font-weight:700; color:#1d1d1f; }
  .sol-panel-dim { font-size:11px; color:#6e6e73; margin-top:1px; }
  .sol-panel-count { font-size:18px; font-weight:800; color:#0071e3; white-space:nowrap; }
  .sol-specs { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; padding-top:14px; border-top:1px solid rgba(0,0,0,.06); }
  .sol-spec { display:flex; flex-direction:column; gap:2px; }
  .sol-spec-label { font-size:10px; font-weight:700; color:#aeaeb2; text-transform:uppercase; letter-spacing:.05em; }
  .sol-spec-val { font-size:16px; font-weight:700; color:#1d1d1f; }
  .sol-spec-sub { font-size:10px; color:#aeaeb2; }

  /* Summary panel */
  .summary-panel { background:white; border-radius:14px; border:2px solid #0071e3; padding:24px; margin-top:24px; box-shadow:0 4px 20px rgba(0,113,227,.12); }
  .summary-title { font-size:16px; font-weight:700; color:#1d1d1f; margin-bottom:16px; display:flex; align-items:center; gap:10px; }
  .summary-actions { display:flex; gap:10px; margin-top:20px; flex-wrap:wrap; }
  .btn-pdf { padding:10px 20px; border-radius:10px; border:none; background:#1d1d1f; color:white; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:6px; }
  .btn-pdf:hover { background:#333; }
  .btn-deselect { padding:10px 20px; border-radius:10px; border:1.5px solid rgba(0,0,0,.16); background:white; color:#6e6e73; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }

  .mixer-empty { text-align:center; padding:48px 24px; color:#aeaeb2; background:white; border-radius:14px; border:1px solid rgba(0,0,0,.08); }
  .mixer-empty-icon { font-size:40px; margin-bottom:12px; }
  .mixer-empty-title { font-size:16px; font-weight:600; color:#1d1d1f; margin-bottom:6px; }
  .mixer-empty-sub { font-size:13px; line-height:1.6; max-width:400px; margin:0 auto; }

  @media(max-width:768px){
    .sol-body{grid-template-columns:1fr}
    .sol-viz{border-right:none;border-bottom:1px solid rgba(0,0,0,.06)}
    .mixer-form-grid{grid-template-columns:1fr 1fr}
    .sol-specs{grid-template-columns:1fr 1fr}
    .mixer-topbar{padding:0 16px}
  }
  @media print { .mixer-topbar{display:none} }
`;

// ── Component ──────────────────────────────────────────────────────────────

export default function PanelMixer({ onBack }) {
  const { t } = useLang();
  const [allPanels, setAllPanels]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterBrand, setFilterBrand] = useState("");
  const [filterPitch, setFilterPitch] = useState("");

  const [targetW, setTargetW]     = useState("");
  const [targetH, setTargetH]     = useState("");
  const [tolerance, setTolerance] = useState("0");

  const [solutions, setSolutions] = useState(null);
  const [solving, setSolving]     = useState(false);
  const [chosenSol, setChosenSol] = useState(null);

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
  const pitches = [...new Set(
    allPanels.filter(p => !filterBrand || p.marque === filterBrand).map(p => p.pixel_pitch_mm)
  )].sort((a, b) => a - b);

  // All visible panels are automatically included — no manual selection needed
  const activePanels = allPanels.filter(p =>
    (!filterBrand || p.marque === filterBrand) &&
    (!filterPitch || String(p.pixel_pitch_mm) === filterPitch)
  );

  const handleSolve = () => {
    if (!activePanels.length || !targetW || !targetH) return;
    setSolving(true); setSolutions(null); setChosenSol(null);
    setTimeout(() => {
      const sols = solvePanelMix(
        activePanels,
        Math.round(parseFloat(targetW) * 1000),
        Math.round(parseFloat(targetH) * 1000),
        parseInt(tolerance) || 0
      );
      setSolutions(sols);
      setSolving(false);
    }, 10);
  };

  const canSolve = activePanels.length > 0 && parseFloat(targetW) > 0 && parseFloat(targetH) > 0;

  return (
    <div className="mixer-wrap">
      {/* Topbar */}
      <div className="mixer-topbar">
        <div className="mixer-topbar-left">
          <button className="mixer-back-btn" onClick={() => onBack && onBack()}>
            {t.backToCalc}
          </button>
          <div>
            <div className="mixer-topbar-title">{t.mixTitle}</div>
            <div className="mixer-topbar-sub">{t.mixSubtitle}</div>
          </div>
        </div>
        <LangToggle />
      </div>

      <div className="mixer-content">
        <div className="mixer-title">{t.mixSubtitle}</div>
        <div className="mixer-subtitle">
          {t.mixDescription}
        </div>

        {/* Étape 1 — Filtre */}
        <div className="mixer-form-card">
          <div className="mixer-form-title">
            <span className="mixer-step-badge">1</span>
            {t.step1Title}
          </div>
          <div style={{fontSize:13,color:"#6e6e73",marginBottom:14}}>
            {t.step1Hint}
          </div>
          <div className="mixer-filters">
            <select className="mixer-select" style={{width:"auto"}} value={filterBrand}
              onChange={e => { setFilterBrand(e.target.value); setFilterPitch(""); setSolutions(null); setChosenSol(null); }}>
              <option value="">{t.allBrands}</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="mixer-select" style={{width:"auto"}} value={filterPitch}
              onChange={e => { setFilterPitch(e.target.value); setSolutions(null); setChosenSol(null); }}>
              <option value="">{t.allPitches}</option>
              {pitches.map(p => <option key={p} value={p}>{p} mm</option>)}
            </select>
          </div>
          {loading ? (
            <div style={{color:"#aeaeb2",fontSize:13}}>{t.loading}</div>
          ) : activePanels.length === 0 ? (
            <div style={{color:"#ff3b30",fontSize:13,fontWeight:600}}>{t.noPanelsFound}</div>
          ) : (
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:4}}>
              {activePanels.map(p => (
                <div key={p.panel_ref} style={{
                  display:"flex",alignItems:"center",gap:7,padding:"6px 12px",
                  borderRadius:20,background:"rgba(0,113,227,.08)",border:"1.5px solid rgba(0,113,227,.25)",
                }}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:"#0071e3",flexShrink:0}} />
                  <span style={{fontSize:12,fontWeight:700,color:"#0071e3"}}>{p.panel_ref}</span>
                  <span style={{fontSize:11,color:"#6e6e73"}}>{Math.round(p.panel_width_m*1000)}×{Math.round(p.panel_height_m*1000)} mm</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Étape 2 — Dimensions */}
        <div className="mixer-form-card">
          <div className="mixer-form-title">
            <span className="mixer-step-badge">2</span>
            {t.step2Title}
          </div>
          <div className="mixer-form-grid">
            <div className="mixer-form-group">
              <label className="mixer-label">{t.desiredWidth} <span className="mixer-label-hint">{t.inMeters}</span></label>
              <div className="mixer-input-wrap">
                <input className="mixer-input" type="number" step="0.001" min="0.1" max="50"
                  placeholder="ex : 1.25"
                  value={targetW}
                  onChange={e => { setTargetW(e.target.value); setSolutions(null); setChosenSol(null); }} />
                <span className="mixer-input-unit">m</span>
              </div>
              <div className="mixer-input-hint">Exemple : 3.5 pour 3,50 mètres</div>
            </div>
            <div className="mixer-form-group">
              <label className="mixer-label">{t.desiredHeight} <span className="mixer-label-hint">{t.inMeters}</span></label>
              <div className="mixer-input-wrap">
                <input className="mixer-input" type="number" step="0.001" min="0.1" max="30"
                  placeholder="ex : 2.00"
                  value={targetH}
                  onChange={e => { setTargetH(e.target.value); setSolutions(null); setChosenSol(null); }} />
                <span className="mixer-input-unit">m</span>
              </div>
              <div className="mixer-input-hint">Exemple : 2.25 pour 2,25 mètres</div>
            </div>
            <div className="mixer-form-group">
              <label className="mixer-label">{t.toleranceLabel} <span className="mixer-label-hint">(mm)</span></label>
              <select className="mixer-select" value={tolerance}
                onChange={e => { setTolerance(e.target.value); setSolutions(null); setChosenSol(null); }}>
                <option value="0">{t.tolExact}</option>
                <option value="10">{t.tol10}</option>
                <option value="25">{t.tol25}</option>
                <option value="50">{t.tol50}</option>
                <option value="100">{t.tol100}</option>
              </select>
            </div>
            <div className="mixer-form-group" style={{justifyContent:"flex-end"}}>
              <button className="mixer-btn-solve" onClick={handleSolve} disabled={!canSolve || solving}>
                {solving ? t.calculating : t.calculateMix}
              </button>
            </div>
          </div>
          {activePanels.length > 0 && (
            <div style={{marginTop:12,fontSize:12,color:"#6e6e73",padding:"10px 14px",background:"#f5f5f7",borderRadius:8}}>
              <b>{t.panelsAvailable(activePanels.length)}</b> ·
              {t.widthsLabel} {[...new Set(activePanels.map(p => Math.round(p.panel_width_m * 1000)))].sort((a,b)=>a-b).map(w=>`${w}mm`).join(", ")} ·
              {t.heightsLabel} {[...new Set(activePanels.map(p => Math.round(p.panel_height_m * 1000)))].sort((a,b)=>a-b).map(h=>`${h}mm`).join(", ")}
            </div>
          )}
        </div>

        {/* Résultats */}
        {solutions !== null && (
          <>
            <div className="mixer-results-header">
              {solutions.length === 0
                ? t.noCombo
                : t.solutionsFound(solutions.length)
              }
            </div>
            <div className="mixer-solutions">
              {solutions.map((sol, idx) => (
                <SolutionCard
                  key={idx}
                  sol={sol}
                  rank={idx + 1}
                  isChosen={chosenSol === idx}
                  onChoose={() => setChosenSol(chosenSol === idx ? null : idx)}
                />
              ))}
            </div>
            {solutions.length === 0 && (
              <div className="mixer-empty">
                <div className="mixer-empty-icon">🔧</div>
                <div className="mixer-empty-title">{t.noValidCombo}</div>
                <div className="mixer-empty-sub">
                  {t.noValidComboHint}
                </div>
              </div>
            )}

            {/* Récapitulatif de la solution choisie */}
            {chosenSol !== null && solutions[chosenSol] && (
              <SummaryPanel
                sol={solutions[chosenSol]}
                rank={chosenSol + 1}
                targetW={targetW}
                targetH={targetH}
                onDeselect={() => setChosenSol(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Solution card ──────────────────────────────────────────────────────────

function SolutionCard({ sol, rank, isChosen, onChoose }) {
  const { t } = useLang();
  return (
    <div className={`sol-card ${isChosen ? "selected-sol" : ""}`}>
      <div className="sol-header">
        <div className="sol-header-left">
          <div className={`sol-rank-num ${rank === 1 ? "first" : ""}`}>{rank}</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#1d1d1f"}}>
              {sol.totalPanels} panneau{sol.totalPanels > 1 ? "x" : ""} · {sol.types} type{sol.types > 1 ? "s" : ""}
            </div>
            <div className="sol-rank-label">
              {(sol.actualW/1000).toFixed(3)} m × {(sol.actualH/1000).toFixed(3)} m · {sol.totalPixW}×{sol.totalPixH} px
            </div>
          </div>
        </div>
        <div className="sol-header-right">
          <span className={`sol-waste-badge ${sol.waste === 0 ? "perfect" : "good"}`}>
            {sol.waste === 0 ? t.perfectFit : t.deviation(sol.waste)}
          </span>
          <button className={`sol-select-btn ${isChosen ? "active" : ""}`} onClick={onChoose}>
            {isChosen ? t.selected : t.select}
          </button>
        </div>
      </div>
      <div className="sol-body">
        <div className="sol-viz">
          <PanelGrid wc={sol.wc} hc={sol.hc} />
          <div className="sol-viz-label">
            {Object.entries(sol.wc.combo).map(([w,n]) => `${n}×${w}mm`).join(" + ")} {t.wideLabel}<br/>
            {Object.entries(sol.hc.combo).map(([h,n]) => `${n}×${h}mm`).join(" + ")} {t.tallLabel}
          </div>
        </div>
        <div className="sol-details">
          <div className="sol-layout-list">
            {sol.layout.map((tile, i) => (
              <div key={i} className="sol-panel-row">
                <div className="sol-panel-dot" style={{background: COLORS[i % COLORS.length]}} />
                <div className="sol-panel-info">
                  <div className="sol-panel-name">{tile.panel.panel_ref}</div>
                  <div className="sol-panel-dim">
                    {tile.wMm}×{tile.hMm} mm · {tile.cols} col{tile.cols>1?"s":""} × {tile.rows} rang{tile.rows>1?"s":""}
                    {tile.panel.marque ? ` · ${tile.panel.marque}` : ""}
                  </div>
                </div>
                <div className="sol-panel-count">{tile.count}×</div>
              </div>
            ))}
          </div>
          <div className="sol-specs">
            <div className="sol-spec">
              <div className="sol-spec-label">{t.realDimShort}</div>
              <div className="sol-spec-val">{(sol.actualW/1000).toFixed(3)} m</div>
              <div className="sol-spec-sub">× {(sol.actualH/1000).toFixed(3)} m</div>
            </div>
            <div className="sol-spec">
              <div className="sol-spec-label">{t.resolution}</div>
              <div className="sol-spec-val">{sol.totalPixW}×{sol.totalPixH}</div>
              <div className="sol-spec-sub">{((sol.totalPixW * sol.totalPixH)/1e6).toFixed(1)} Mpx</div>
            </div>
            <div className="sol-spec">
              <div className="sol-spec-label">{t.totalWeight}</div>
              <div className="sol-spec-val">{sol.totalWeight.toFixed(1)} kg</div>
              <div className="sol-spec-sub">{sol.totalPanels} panneaux</div>
            </div>
            <div className="sol-spec">
              <div className="sol-spec-label">{t.maxPowerLabel}</div>
              <div className="sol-spec-val">{(sol.totalPowerMax/1000).toFixed(2)} kW</div>
              <div className="sol-spec-sub">moy : {(sol.totalPowerAvg/1000).toFixed(2)} kW</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Summary panel ──────────────────────────────────────────────────────────

function SummaryPanel({ sol, rank, targetW, targetH, onDeselect }) {
  const { t } = useLang();
  return (
    <div className="summary-panel">
      <div className="summary-title">
        <span style={{fontSize:20}}>📋</span>
        {t.summaryTitle(rank)}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
        {[
          { label: t.targetDim, val:`${parseFloat(targetW).toFixed(3)} m × ${parseFloat(targetH).toFixed(3)} m` },
          { label: t.realDim, val:`${(sol.actualW/1000).toFixed(3)} m × ${(sol.actualH/1000).toFixed(3)} m` },
          { label: t.gap, val: sol.waste === 0 ? t.perfect : `±${sol.waste} mm`, ok: sol.waste === 0 },
          { label: t.totalPanels, val:`${sol.totalPanels} (${sol.types} type${sol.types>1?"s":""})` },
          { label: t.resolution, val:`${sol.totalPixW} × ${sol.totalPixH} px` },
          { label: t.totalWeight, val:`${sol.totalWeight.toFixed(1)} kg` },
          { label: t.maxPowerLabel, val:`${(sol.totalPowerMax/1000).toFixed(2)} kW` },
          { label: t.avgPowerLabel, val:`${(sol.totalPowerAvg/1000).toFixed(2)} kW` },
        ].map((item, i) => (
          <div key={i} style={{padding:"12px 14px",background:"#f5f5f7",borderRadius:10}}>
            <div style={{fontSize:10,fontWeight:700,color:"#aeaeb2",textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>{item.label}</div>
            <div style={{fontSize:15,fontWeight:700,color: item.ok === false ? "#ff9500" : item.ok ? "#34c759" : "#1d1d1f"}}>{item.val}</div>
          </div>
        ))}
      </div>

      <div style={{fontSize:13,fontWeight:700,color:"#1d1d1f",marginBottom:10,textTransform:"uppercase",letterSpacing:".05em"}}>{t.orderSheet}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:4}}>
        {sol.layout.map((tile, i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#f5f5f7",borderRadius:10}}>
            <div style={{width:13,height:13,borderRadius:3,background:COLORS[i%COLORS.length],flexShrink:0}} />
            <div style={{flex:1}}>
              <span style={{fontWeight:700,fontSize:13}}>{tile.panel.panel_ref}</span>
              <span style={{color:"#6e6e73",fontSize:12,marginLeft:8}}>{tile.wMm}×{tile.hMm} mm · {tile.panel.pixel_pitch_mm}mm pitch · {tile.cols} col. × {tile.rows} rang{tile.rows>1?"s":""}</span>
            </div>
            <div style={{fontSize:18,fontWeight:800,color:"#0071e3"}}>{tile.count}×</div>
          </div>
        ))}
      </div>

      <div className="summary-actions">
        <button className="btn-pdf" onClick={() => exportPDF(sol, targetW, targetH, t)}>
          {t.exportPdfMix}
        </button>
        <button className="btn-deselect" onClick={onDeselect}>
          {t.deselect}
        </button>
      </div>
    </div>
  );
}
