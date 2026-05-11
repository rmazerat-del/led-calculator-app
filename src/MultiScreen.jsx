import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useLang, LangToggle } from "./LanguageContext";

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
        const totalPanels   = layout.reduce((s, tile) => s + tile.count, 0);
        const totalWeight   = layout.reduce((s, tile) => s + tile.count * (tile.panel.weight_kgs || 0), 0);
        const totalPowerMax = layout.reduce((s, tile) => s + tile.count * (tile.panel.power_max_w || 0), 0);
        const totalPowerAvg = layout.reduce((s, tile) => s + tile.count * (tile.panel.power_avg_w || 0), 0);
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
  const solKey = sol => sol.layout.map(tile => `${tile.wMm}x${tile.hMm}:${tile.cols}x${tile.rows}`).sort().join("|");
  const portraitPanels = panels.filter(p => roundMm(p.panel_height_m) > roundMm(p.panel_width_m));
  let portraitSols = [];
  if (portraitPanels.length > 0) {
    const maxPortraitDim = Math.max(...portraitPanels.flatMap(p => [roundMm(p.panel_width_m), roundMm(p.panel_height_m)]));
    portraitSols = buildSolutions(portraitPanels, Math.max(toleranceMm, maxPortraitDim));
  }
  const portraitKeys = new Set(portraitSols.map(solKey));
  const allSols = buildSolutions(panels);
  const mixedSols = allSols.filter(s => !portraitKeys.has(solKey(s)));
  const maxArea = sol => Math.max(...sol.layout.map(tile => tile.wMm * tile.hMm));
  return [...portraitSols, ...mixedSols]
    .sort((a, b) =>
      maxArea(a) !== maxArea(b) ? maxArea(b) - maxArea(a) :
      a.waste !== b.waste ? a.waste - b.waste :
      a.totalPanels !== b.totalPanels ? a.totalPanels - b.totalPanels :
      a.types - b.types
    )
    .slice(0, 8);
}

// ── Diagram helpers ─────────────────────────────────────────────────────────

function generateDiagramSVG(solved, panAbbr) {
  const MAX_H = 160, GAP = 28, PAD = 16, LABEL_H = 26, DIM_H = 18;
  const C = ["#0071e3","#34c759","#ff9500","#af52de","#ff3b30","#00b4d8","#f72585"];
  const maxH_mm = Math.max(...solved.map(s => s.solution.actualH));
  const scale = MAX_H / maxH_mm;
  const svgH = PAD + LABEL_H + MAX_H + DIM_H + PAD;
  let xCursor = PAD;

  const els = solved.map((s, idx) => {
    const sol = s.solution;
    const color = C[idx % C.length];
    const gridW = sol.actualW * scale;
    const gridH = sol.actualH * scale;
    const x0 = xCursor;
    const y0 = PAD + LABEL_H + (MAX_H - gridH);
    xCursor += gridW + GAP;

    const wSecs = Object.entries(sol.wc.combo).flatMap(([w, n]) => Array(parseInt(n)).fill(parseInt(w)));
    const hSecs = Object.entries(sol.hc.combo).flatMap(([h, n]) => Array(parseInt(n)).fill(parseInt(h)));
    const colorMap = {}; let ci = 0;
    const parts = [];
    let yOff = 0;
    for (const hMm of hSecs) {
      let xOff = 0;
      for (const wMm of wSecs) {
        const key = `${wMm}x${hMm}`;
        if (!(key in colorMap)) colorMap[key] = C[ci++ % C.length];
        const cc = colorMap[key];
        const cx = (x0 + xOff * scale).toFixed(1);
        const cy = (y0 + yOff * scale).toFixed(1);
        const cw = (wMm * scale - 1.5).toFixed(1);
        const ch = (hMm * scale - 1.5).toFixed(1);
        const chN = hMm * scale - 1.5;
        parts.push(`<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="${cc}" fill-opacity="0.13" stroke="${cc}" stroke-width="1.5" rx="2"/>`);
        if (chN > 18) {
          const fs = Math.max(6, Math.min(9, chN * 0.14)).toFixed(1);
          const tx = (x0 + xOff * scale + wMm * scale / 2).toFixed(1);
          const ty = (y0 + yOff * scale + hMm * scale / 2 + parseFloat(fs) * 0.4).toFixed(1);
          parts.push(`<text x="${tx}" y="${ty}" text-anchor="middle" fill="${cc}" font-size="${fs}" font-weight="700" font-family="Arial,sans-serif">${wMm}×${hMm}</text>`);
        }
        xOff += wMm;
      }
      yOff += hMm;
    }
    parts.push(`<rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${gridW.toFixed(1)}" height="${gridH.toFixed(1)}" fill="none" stroke="${color}" stroke-width="2" rx="3"/>`);
    parts.push(`<circle cx="${(x0+11).toFixed(1)}" cy="${(PAD+13).toFixed(1)}" r="10" fill="${color}"/>`);
    parts.push(`<text x="${(x0+11).toFixed(1)}" y="${(PAD+17).toFixed(1)}" text-anchor="middle" fill="white" font-size="10" font-weight="800" font-family="Arial,sans-serif">${idx+1}</text>`);
    const nameText = s.name.length > 18 ? s.name.slice(0,16)+'…' : s.name;
    parts.push(`<text x="${(x0+26).toFixed(1)}" y="${(PAD+17).toFixed(1)}" fill="${color}" font-size="11" font-weight="700" font-family="Arial,sans-serif">${nameText}</text>`);
    parts.push(`<text x="${(x0+gridW/2).toFixed(1)}" y="${(y0+gridH+13).toFixed(1)}" text-anchor="middle" fill="#555" font-size="9" font-family="Arial,sans-serif">${(sol.actualW/1000).toFixed(2)}×${(sol.actualH/1000).toFixed(2)} m · ${sol.totalPanels} ${panAbbr}</text>`);
    return parts.join('');
  });

  const svgW = xCursor - GAP + PAD;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="100%" preserveAspectRatio="xMidYMid meet">${els.join('')}</svg>`;
}

// ── PDF Export ──────────────────────────────────────────────────────────────

async function exportMultiScreenPDF(screens, t) {
  const date = new Date().toLocaleDateString("fr-FR");
  const solved = screens
    .filter(s => s.solutions?.length > 0)
    .map(s => ({ ...s, solution: s.solutions[s.chosenSolIdx] }));
  if (!solved.length) return;

  const T = (s) => `padding:7px 8px;border-bottom:1px solid #e0e0e0;${s||""}`;
  const TH = (s) => `background:#f0f0f0;padding:6px 8px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;border-bottom:2px solid #ccc;${s||""}`;
  const BOX = (label, val, sub) => `<div style="border:1px solid #ccc;border-radius:5px;padding:10px;flex:1">
    <div style="font-size:9px;color:#666;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">${label}</div>
    <div style="font-size:17px;font-weight:700">${val}</div>
    ${sub ? `<div style="font-size:9px;color:#888">${sub}</div>` : ""}
  </div>`;
  const H2 = `font-size:16px;font-weight:700;margin:0 0 10px;border-bottom:2px solid #000;padding-bottom:4px;`;
  const H3 = `font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:16px 0 8px;border-bottom:1px solid #ccc;padding-bottom:3px;`;

  const totalPanels   = solved.reduce((s, sc) => s + sc.solution.totalPanels, 0);
  const totalWeight   = solved.reduce((s, sc) => s + sc.solution.totalWeight, 0);
  const totalPowerMax = solved.reduce((s, sc) => s + sc.solution.totalPowerMax, 0);
  const totalPowerAvg = solved.reduce((s, sc) => s + sc.solution.totalPowerAvg, 0);

  const screenSections = solved.map((s, idx) => {
    const sol = s.solution;
    const badgeStyle = sol.waste === 0
      ? "background:#d4edda;color:#155724"
      : "background:#fff3cd;color:#856404";
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
    return `<div style="${idx>0?"margin-top:36px;padding-top:20px;border-top:2px solid #ddd;":""}">
      <h2 style="${H2}">${t.screenSection(idx+1, s.name)}</h2>
      <p style="color:#555;font-size:12px;margin:0 0 12px">
        ${t.targetLabelMs} <b>${parseFloat(s.targetW).toFixed(3)} m × ${parseFloat(s.targetH).toFixed(3)} m</b> &nbsp;·&nbsp;
        ${t.realLabelMs} <b>${(sol.actualW/1000).toFixed(3)} m × ${(sol.actualH/1000).toFixed(3)} m</b> &nbsp;·&nbsp;
        <span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;${badgeStyle}">${sol.waste===0 ? t.perfectFit : t.deviation(sol.waste)}</span>
      </p>
      <div style="display:flex;gap:8px;margin-bottom:14px">
        ${BOX(t.panelsLabel, sol.totalPanels, `${sol.types} type${sol.types>1?"s":""}`)}
        ${BOX(t.resolution, `${sol.totalPixW}×${sol.totalPixH}`, `${((sol.totalPixW*sol.totalPixH)/1e6).toFixed(1)} Mpx`)}
        ${BOX(t.weight, `${sol.totalWeight.toFixed(1)} kg`)}
        ${BOX(t.maxPower, `${(sol.totalPowerMax/1000).toFixed(2)} kW`, `${t.avg} ${(sol.totalPowerAvg/1000).toFixed(2)} kW`)}
      </div>
      <h3 style="${H3}">${t.panelDetail}</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
        <thead><tr>
          <th style="${TH()}">${t.reference}</th><th style="${TH()}">${t.brand}</th><th style="${TH()}">${t.pitch}</th>
          <th style="${TH()}">${t.dimensions}</th><th style="${TH()}">${t.layout}</th>
          <th style="${TH()}">${t.qty}</th><th style="${TH()}">${t.weight}</th><th style="${TH()}">${t.maxPower}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  });

  const synthRows = solved.map((s, i) => {
    const sol = s.solution;
    return `<tr>
      <td style="${T()}">${i+1}</td>
      <td style="${T()}"><b>${s.name}</b></td>
      <td style="${T()}">${parseFloat(s.targetW).toFixed(3)} × ${parseFloat(s.targetH).toFixed(3)} m</td>
      <td style="${T()}">${(sol.actualW/1000).toFixed(3)} × ${(sol.actualH/1000).toFixed(3)} m</td>
      <td style="${T("font-weight:700;color:#0071e3")}">${sol.totalPanels}</td>
      <td style="${T("font-size:10px")}">${sol.layout.map(tile=>`<b>${tile.panel.panel_ref}</b> ×${tile.count}`).join("<br>")}</td>
      <td style="${T()}">${sol.totalPixW}×${sol.totalPixH}</td>
      <td style="${T()}">${sol.totalWeight.toFixed(1)} kg</td>
      <td style="${T()}">${(sol.totalPowerMax/1000).toFixed(2)} kW</td>
      <td style="${T()}">${(sol.totalPowerAvg/1000).toFixed(2)} kW</td>
    </tr>`;
  }).join("");

  // ── Render dans un conteneur hors-écran ──
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:white;padding:40px;box-sizing:border-box;font-family:Arial,sans-serif;font-size:12px;color:#000;';
  container.innerHTML = `
    <h1 style="font-size:20px;font-weight:700;margin:0 0 4px">${t.msPdfTitle}</h1>
    <p style="color:#555;font-size:12px;margin:0 0 24px"><b>${solved.length} ${t.screensLabel}${solved.length>1?"s":""}</b> · ${t.generatedOn(date)}</p>
    ${screenSections.join("")}
    <div style="margin-top:36px;padding-top:20px;border-top:3px solid #0071e3">
      <h2 style="${H2}">${t.synthSection}</h2>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        ${BOX(t.screensLabel, solved.length)}
        ${BOX(t.panelsTotal, `<span style="color:#0071e3">${totalPanels}</span>`)}
        ${BOX(t.totalWeightLabel, `${totalWeight.toFixed(1)} kg`)}
        ${BOX(t.maxPowerTotal, `${(totalPowerMax/1000).toFixed(2)} kW`, `${t.avg} ${(totalPowerAvg/1000).toFixed(2)} kW`)}
      </div>
      <h3 style="${H3}">${t.scaleRepresentation}</h3>
      <div style="background:#f9f9fb;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #e0e0e0">
        ${generateDiagramSVG(solved, t.panAbbr)}
      </div>
      <h3 style="${H3}">${t.summaryByScreen}</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
        <thead><tr>
          ${["#", t.screenCol, t.targetDimCol, t.realDimCol, t.panelsCol, t.modelsUsed, t.resolution, t.weight, t.maxPower, t.consoMoyLabel].map(h=>`<th style="${TH()}">${h}</th>`).join("")}
        </tr></thead>
        <tbody>${synthRows}</tbody>
        <tfoot><tr style="font-weight:700;background:#f0f7ff">
          <td style="padding:7px 8px;border-top:2px solid #0071e3" colspan="4">${t.total}</td>
          <td style="padding:7px 8px;border-top:2px solid #0071e3">${totalPanels}</td>
          <td style="padding:7px 8px;border-top:2px solid #0071e3;font-size:10px">${[...new Set(solved.flatMap(sc=>sc.solution.layout.map(tile=>tile.panel.panel_ref)))].join(", ")}</td>
          <td style="padding:7px 8px;border-top:2px solid #0071e3">${(solved.reduce((s,sc)=>s+sc.solution.totalPixW*sc.solution.totalPixH,0)/1e6).toFixed(1)} Mpx</td>
          <td style="padding:7px 8px;border-top:2px solid #0071e3">${totalWeight.toFixed(1)} kg</td>
          <td style="padding:7px 8px;border-top:2px solid #0071e3">${(totalPowerMax/1000).toFixed(2)} kW</td>
          <td style="padding:7px 8px;border-top:2px solid #0071e3">${(totalPowerAvg/1000).toFixed(2)} kW</td>
        </tr></tfoot>
      </table>
    </div>
    <div style="margin-top:32px;border-top:1px solid #ccc;padding-top:6px;color:#999;font-size:10px">
      ${t.msPdfFooter(date)}
    </div>`;
  document.body.appendChild(container);
  await new Promise(r => setTimeout(r, 400));

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
    pdf.save(`installation-multi-ecrans-${date.replace(/\//g, '-')}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
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

  .ms-sol-nav { display:flex; align-items:center; gap:10px; padding:10px 20px; background:#f0f0f3; border-top:1px solid rgba(0,0,0,.06); }
  .ms-sol-nav-btn { width:32px; height:32px; border-radius:8px; border:1.5px solid rgba(0,0,0,.15); background:white; cursor:pointer; font-size:18px; font-family:inherit; display:flex; align-items:center; justify-content:center; line-height:1; transition:all .15s; }
  .ms-sol-nav-btn:disabled { opacity:.35; cursor:not-allowed; }
  .ms-sol-nav-btn:hover:not(:disabled) { border-color:#0071e3; color:#0071e3; background:rgba(0,113,227,.06); }
  .ms-sol-nav-label { font-size:13px; font-weight:700; color:#1d1d1f; }
  .ms-sol-nav-count { font-size:11px; color:#aeaeb2; margin-left:4px; }

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
  solutions: [],
  chosenSolIdx: 0,
  solving: false,
  noSolution: false,
});

// ── InstallationDiagram sub-component ───────────────────────────────────────

function InstallationDiagram({ solvedScreens }) {
  const { t } = useLang();
  if (!solvedScreens.length) return null;
  const MAX_H = 160;
  const maxH_mm = Math.max(...solvedScreens.map(s => s.solution.actualH));
  const scale = MAX_H / maxH_mm;

  return (
    <div style={{ background: '#f9f9fb', borderRadius: 10, padding: '16px', marginBottom: 24, border: '1px solid rgba(0,0,0,.06)', overflowX: 'auto' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 14 }}>
        {t.panelGrid}
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', minWidth: 'min-content' }}>
        {solvedScreens.map((s, idx) => {
          const sol = s.solution;
          const color = COLORS[idx % COLORS.length];
          const gridW = sol.actualW * scale;
          const gridH = sol.actualH * scale;

          const wSecs = Object.entries(sol.wc.combo).flatMap(([w, n]) => Array(parseInt(n)).fill(parseInt(w)));
          const hSecs = Object.entries(sol.hc.combo).flatMap(([h, n]) => Array(parseInt(n)).fill(parseInt(h)));
          const colorMap = {}; let ci = 0;
          const cells = [];
          let yOff = 0;
          for (const hMm of hSecs) {
            let xOff = 0;
            for (const wMm of wSecs) {
              const key = `${wMm}x${hMm}`;
              if (!(key in colorMap)) colorMap[key] = COLORS[ci++ % COLORS.length];
              cells.push({ left: xOff * scale, top: yOff * scale, width: wMm * scale - 1.5, height: hMm * scale - 1.5, key, wMm, hMm });
              xOff += wMm;
            }
            yOff += hMm;
          }

          return (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: color, color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1d1d1f', whiteSpace: 'nowrap' }}>{s.name}</span>
              </div>
              <div style={{ position: 'relative', width: gridW, height: gridH, border: `2px solid ${color}`, borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
                {cells.map((c, j) => (
                  <div key={j} style={{
                    position: 'absolute', left: c.left, top: c.top, width: c.width, height: c.height,
                    background: colorMap[c.key] + '22',
                    border: `1.5px solid ${colorMap[c.key]}`,
                    borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: Math.max(6, Math.min(10, c.height * 0.14)),
                    color: colorMap[c.key], fontWeight: 700,
                    boxSizing: 'border-box',
                  }}>
                    {c.height > 20 ? `${c.wMm}×${c.hMm}` : ''}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#6e6e73', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {(sol.actualW / 1000).toFixed(2)} × {(sol.actualH / 1000).toFixed(2)} m · {sol.totalPanels} {t.panAbbr}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ScreenSolution sub-component ────────────────────────────────────────────

function ScreenSolution({ sol }) {
  const { t } = useLang();
  return (
    <div className="ms-solution">
      <div className="ms-sol-header">
        <span className={`ms-waste-badge ${sol.waste === 0 ? "perfect" : "good"}`}>
          {sol.waste === 0 ? t.perfectFit : t.deviation(sol.waste)}
        </span>
        <span className="ms-sol-dims">
          {(sol.actualW/1000).toFixed(3)} m × {(sol.actualH/1000).toFixed(3)} m {t.actualSuffix}
          &nbsp;·&nbsp; {sol.totalPixW}×{sol.totalPixH} px
        </span>
      </div>
      <div className="ms-sol-panels">
        {sol.layout.map((tile, i) => (
          <div key={i} className="ms-sol-panel-row">
            <div className="ms-sol-panel-dot" style={{ background: COLORS[i % COLORS.length] }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="ms-sol-panel-name">{tile.panel.panel_ref}</span>
              <span className="ms-sol-panel-dim"> · {tile.wMm}×{tile.hMm} mm · {tile.cols} col. × {tile.rows} rang{tile.rows > 1 ? "s" : ""}{tile.panel.marque ? ` · ${tile.panel.marque}` : ""}</span>
            </div>
            <div className="ms-sol-panel-count">{tile.count}×</div>
          </div>
        ))}
      </div>
      <div className="ms-sol-specs">
        {[
          { label: t.panels, val: `${sol.totalPanels} (${sol.types} type${sol.types > 1 ? "s" : ""})` },
          { label: t.resolution, val: `${sol.totalPixW}×${sol.totalPixH}` },
          { label: t.weight, val: `${sol.totalWeight.toFixed(1)} kg` },
          { label: t.maxPower, val: `${(sol.totalPowerMax/1000).toFixed(2)} kW` },
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
  const { t } = useLang();
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
            placeholder={t.screenName}
          />
        </div>
        {onRemove && (
          <button className="ms-remove-btn" onClick={onRemove}>{t.removeScreen}</button>
        )}
      </div>

      {/* Filters */}
      <div className="ms-screen-filters">
        <select className="ms-select" style={{ width: "auto" }} value={screen.filterBrand}
          onChange={e => onUpdate({ filterBrand: e.target.value, filterPitch: "", solution: null, noSolution: false })}>
          <option value="">{t.allBrands}</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="ms-select" style={{ width: "auto" }} value={screen.filterPitch}
          onChange={e => onUpdate({ filterPitch: e.target.value, solution: null, noSolution: false })}>
          <option value="">{t.allPitches}</option>
          {pitches.map(p => <option key={p} value={p}>{p} mm</option>)}
        </select>
        {activePanels.length > 0 && (
          <span style={{ fontSize: 12, color: "#aeaeb2", alignSelf: "center" }}>
            {t.panelsAvailable(activePanels.length)}
          </span>
        )}
      </div>

      {/* Dimensions */}
      <div className="ms-screen-dims">
        <div className="ms-form-group">
          <label className="ms-label">{t.widthM} <span style={{ color: "#aeaeb2", fontWeight: 400 }}>(m)</span></label>
          <div className="ms-input-wrap">
            <input className="ms-input" type="number" step="0.001" min="0.1" max="50"
              placeholder="ex : 5.75"
              value={screen.targetW}
              onChange={e => onUpdate({ targetW: e.target.value, solution: null, noSolution: false })} />
            <span className="ms-input-unit">m</span>
          </div>
        </div>
        <div className="ms-form-group">
          <label className="ms-label">{t.heightM} <span style={{ color: "#aeaeb2", fontWeight: 400 }}>(m)</span></label>
          <div className="ms-input-wrap">
            <input className="ms-input" type="number" step="0.001" min="0.1" max="30"
              placeholder="ex : 2.75"
              value={screen.targetH}
              onChange={e => onUpdate({ targetH: e.target.value, solution: null, noSolution: false })} />
            <span className="ms-input-unit">m</span>
          </div>
        </div>
        <div className="ms-form-group">
          <label className="ms-label">{t.toleranceMs}</label>
          <select className="ms-select" value={screen.tolerance}
            onChange={e => onUpdate({ tolerance: e.target.value, solution: null, noSolution: false })}>
            <option value="0">{t.tolExactMs}</option>
            <option value="10">±10 mm</option>
            <option value="25">±25 mm</option>
            <option value="50">±50 mm</option>
            <option value="100">±100 mm</option>
          </select>
        </div>
        <div className="ms-form-group" style={{ justifyContent: "flex-end" }}>
          <button className="ms-btn-solve" disabled={!canSolve || screen.solving} onClick={onSolve}>
            {screen.solving ? t.calculatingMs : t.calculateMs}
          </button>
        </div>
      </div>

      {/* Result */}
      {screen.noSolution && !screen.solving && (
        <div className="ms-no-sol">
          {t.noSolution}
        </div>
      )}
      {screen.solutions?.length > 0 && (() => {
        const sol = screen.solutions[screen.chosenSolIdx];
        return (
          <>
            {screen.solutions.length > 1 && (
              <div className="ms-sol-nav">
                <button
                  className="ms-sol-nav-btn"
                  disabled={screen.chosenSolIdx === 0}
                  onClick={() => onUpdate({ chosenSolIdx: screen.chosenSolIdx - 1 })}
                >‹</button>
                <span className="ms-sol-nav-label">
                  {t.solutionNav} {screen.chosenSolIdx + 1}
                  <span className="ms-sol-nav-count">/ {screen.solutions.length}</span>
                </span>
                <button
                  className="ms-sol-nav-btn"
                  disabled={screen.chosenSolIdx === screen.solutions.length - 1}
                  onClick={() => onUpdate({ chosenSolIdx: screen.chosenSolIdx + 1 })}
                >›</button>
              </div>
            )}
            <ScreenSolution sol={sol} />
          </>
        );
      })()}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function MultiScreen({ onBack }) {
  const { t } = useLang();
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
      update(screen.id, { solutions: sols, chosenSolIdx: 0, noSolution: sols.length === 0, solving: false });
    }, 10);
  };

  const solvedScreens = screens
    .filter(s => s.solutions?.length > 0)
    .map(s => ({ ...s, solution: s.solutions[s.chosenSolIdx] }));

  return (
    <div className="ms-wrap">
      {/* Topbar */}
      <div className="ms-topbar">
        <div className="ms-topbar-left">
          <button className="ms-back-btn" onClick={() => onBack && onBack()}>{t.back}</button>
          <div>
            <div className="ms-topbar-title">{t.msTitle}</div>
            <div className="ms-topbar-sub">{t.msSub}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <LangToggle />
          <button className="ms-btn-add" onClick={addScreen}>{t.addScreen}</button>
          <button
            className="ms-btn-pdf"
            onClick={() => exportMultiScreenPDF(screens, t)}
            disabled={solvedScreens.length === 0}
            style={{ opacity: solvedScreens.length === 0 ? 0.38 : 1, cursor: solvedScreens.length === 0 ? "not-allowed" : "pointer" }}
          >
            {t.exportPdf}
          </button>
        </div>
      </div>

      <div className="ms-content">
        <div className="ms-title">{t.msPageTitle}</div>
        <div className="ms-subtitle">
          {t.msPageSub}
        </div>

        {loading ? (
          <div style={{ color: "#aeaeb2", fontSize: 14, padding: "24px 0" }}>{t.loadingCatalog}</div>
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
            <div className="ms-synthesis-title">{t.synthesis}</div>

            <div className="ms-synth-grid">
              {[
                { label: t.screensConfigured, val: solvedScreens.length,                                                                                                          sub: null },
                { label: t.panelsTotal,       val: solvedScreens.reduce((s, sc) => s + sc.solution.totalPanels, 0),                                                              sub: null },
                { label: t.totalWeightLabel,  val: `${solvedScreens.reduce((s, sc) => s + sc.solution.totalWeight, 0).toFixed(1)} kg`,                                           sub: null },
                { label: t.maxPowerTotal,
                  val: `${(solvedScreens.reduce((s, sc) => s + sc.solution.totalPowerMax, 0) / 1000).toFixed(2)} kW`,
                  sub: `${t.avg} ${(solvedScreens.reduce((s, sc) => s + sc.solution.totalPowerAvg, 0) / 1000).toFixed(2)} kW` },
              ].map((item, i) => (
                <div key={i} className="ms-synth-box">
                  <div className="ms-synth-label">{item.label}</div>
                  <div className="ms-synth-val">{item.val}</div>
                  {item.sub && <div className="ms-synth-sub">{item.sub}</div>}
                </div>
              ))}
            </div>

            <InstallationDiagram solvedScreens={solvedScreens} />

            <div style={{ overflowX: "auto" }}>
              <table className="ms-synth-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t.screenCol}</th>
                    <th>{t.targetDimCol}</th>
                    <th>{t.realDimCol}</th>
                    <th>{t.panelsCol}</th>
                    <th>{t.modelsUsed}</th>
                    <th>{t.resolution}</th>
                    <th>{t.weight}</th>
                    <th>{t.maxPower}</th>
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
                        <td style={{ fontSize: 12, lineHeight: 1.5 }}>
                          {sol.layout.map((tile, i) => (
                            <div key={i}>
                              <b>{tile.panel.panel_ref}</b>
                              <span style={{ color: "#6e6e73" }}> ×{tile.count}</span>
                            </div>
                          ))}
                        </td>
                        <td>{sol.totalPixW}×{sol.totalPixH}</td>
                        <td>{sol.totalWeight.toFixed(1)} kg</td>
                        <td>{(sol.totalPowerMax/1000).toFixed(2)} kW</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4}>{t.total}</td>
                    <td>{solvedScreens.reduce((s, sc) => s + sc.solution.totalPanels, 0)}</td>
                    <td style={{ fontSize: 11 }}>
                      {[...new Set(solvedScreens.flatMap(sc => sc.solution.layout.map(tile => tile.panel.panel_ref)))].join(", ")}
                    </td>
                    <td>{(solvedScreens.reduce((s, sc) => s + sc.solution.totalPixW * sc.solution.totalPixH, 0) / 1e6).toFixed(1)} Mpx</td>
                    <td>{solvedScreens.reduce((s, sc) => s + sc.solution.totalWeight, 0).toFixed(1)} kg</td>
                    <td>{(solvedScreens.reduce((s, sc) => s + sc.solution.totalPowerMax, 0) / 1000).toFixed(2)} kW</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ marginTop: 20 }}>
              <button className="ms-btn-pdf" onClick={() => exportMultiScreenPDF(screens, t)}>
                {t.exportPdf}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
