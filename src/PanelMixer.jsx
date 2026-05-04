import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ── Algorithm ──────────────────────────────────────────────────────────────

function roundMm(meters) {
  return Math.round(parseFloat(meters) * 1000);
}

// Find all combinations (with repetition) of sizes that sum to targetMm ± toleranceMm
// Sorted by: waste ASC, then nb types ASC, then nb panels ASC
function findCombinations(sizesMm, targetMm, toleranceMm = 50) {
  if (targetMm <= 0 || sizesMm.length === 0) return [];
  const sorted = [...new Set(sizesMm)].sort((a, b) => a - b);
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
      return;
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
    const at = Object.keys(a.combo).length, bt = Object.keys(b.combo).length;
    if (at !== bt) return at - bt;
    return Object.values(a.combo).reduce((s, v) => s + v, 0) -
           Object.values(b.combo).reduce((s, v) => s + v, 0);
  });
}

// Build all valid (width-combo × height-combo) solutions where every cell (w×h) exists in panels
function solvePanelMix(panels, targetW_mm, targetH_mm, toleranceMm) {
  const widths  = [...new Set(panels.map(p => roundMm(p.panel_width_m)))];
  const heights = [...new Set(panels.map(p => roundMm(p.panel_height_m)))];

  const widthCombos  = findCombinations(widths,  targetW_mm, toleranceMm).slice(0, 20);
  const heightCombos = findCombinations(heights, targetH_mm, toleranceMm).slice(0, 20);

  const solutions = [];

  for (const wc of widthCombos) {
    for (const hc of heightCombos) {
      const layout = [];
      let valid = true;

      for (const [ws, wn] of Object.entries(wc.combo)) {
        for (const [hs, hn] of Object.entries(hc.combo)) {
          const wMm = parseInt(ws), hMm = parseInt(hs);
          const panel = panels.find(
            p => roundMm(p.panel_width_m) === wMm && roundMm(p.panel_height_m) === hMm
          );
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
      const totalPixW     = Object.entries(wc.combo).reduce((s, [ws, wn]) => {
        const p = panels.find(p => roundMm(p.panel_width_m) === parseInt(ws));
        return s + (p ? p.resolution_w * parseInt(wn) : 0);
      }, 0);
      const totalPixH     = Object.entries(hc.combo).reduce((s, [hs, hn]) => {
        const p = panels.find(p => roundMm(p.panel_height_m) === parseInt(hs));
        return s + (p ? p.resolution_h * parseInt(hn) : 0);
      }, 0);

      solutions.push({
        wc, hc, layout,
        totalPanels, totalWeight, totalPowerMax, totalPowerAvg,
        totalPixW, totalPixH,
        actualW: targetW_mm - wc.waste,
        actualH: targetH_mm - hc.waste,
        waste: wc.waste + hc.waste,
        types: layout.length,
      });
    }
  }

  return solutions
    .sort((a, b) => a.waste - b.waste || a.types - b.types || a.totalPanels - b.totalPanels)
    .slice(0, 8);
}

// ── Visual grid ────────────────────────────────────────────────────────────

const COLORS = ["#0071e3","#34c759","#ff9500","#af52de","#ff3b30","#00b4d8","#f72585"];

function PanelGrid({ wc, hc }) {
  const totalW = Object.entries(wc.combo).reduce((s, [w, n]) => s + parseInt(w) * parseInt(n), 0);
  const totalH = Object.entries(hc.combo).reduce((s, [h, n]) => s + parseInt(h) * parseInt(n), 0);

  const maxW = 260, maxH = 180;
  const scale = Math.min(maxW / totalW, maxH / totalH, 0.5);

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

  const dW = totalW * scale, dH = totalH * scale;

  return (
    <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
      <div style={{ position:"relative", width:dW, height:dH }}>
        {cells.map((c, i) => (
          <div key={i} style={{
            position:"absolute", left:c.x, top:c.y, width:c.w, height:c.h,
            background: colorMap[c.key] + "18",
            border: `2px solid ${colorMap[c.key]}`,
            borderRadius: 3,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize: Math.max(7, Math.min(11, c.h * 0.18)),
            color: colorMap[c.key], fontWeight:700,
          }}>
            {c.h > 30 * (1/scale) ? `${c.wMm}×${c.hMm}` : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CSS ────────────────────────────────────────────────────────────────────

const css = `
  .mixer-wrap { min-height:100vh; background:#f5f5f7; font-family:-apple-system,'Helvetica Neue',sans-serif; }
  .mixer-topbar { background:rgba(245,245,247,.9); backdrop-filter:blur(20px); border-bottom:1px solid rgba(0,0,0,.08); padding:0 28px; height:60px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; }
  .mixer-topbar-title { font-size:17px; font-weight:600; color:#1d1d1f; }
  .mixer-topbar-sub { font-size:11px; color:#aeaeb2; text-transform:uppercase; letter-spacing:.05em; }
  .mixer-content { max-width:1100px; margin:0 auto; padding:28px 24px; }
  .mixer-title { font-size:22px; font-weight:700; color:#1d1d1f; margin-bottom:4px; }
  .mixer-subtitle { font-size:14px; color:#6e6e73; margin-bottom:24px; }
  .mixer-form-card { background:white; border-radius:14px; border:1px solid rgba(0,0,0,.08); padding:24px; box-shadow:0 1px 3px rgba(0,0,0,.06); margin-bottom:20px; }
  .mixer-form-title { font-size:13px; font-weight:700; color:#1d1d1f; text-transform:uppercase; letter-spacing:.05em; margin-bottom:16px; }
  .mixer-form-grid { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:14px; align-items:end; }
  .mixer-form-group { display:flex; flex-direction:column; gap:6px; }
  .mixer-label { font-size:11px; font-weight:600; color:#6e6e73; text-transform:uppercase; letter-spacing:.05em; }
  .mixer-input { padding:9px 12px; border-radius:8px; border:1px solid rgba(0,0,0,.14); font-size:14px; font-family:inherit; color:#1d1d1f; outline:none; transition:border-color .15s,box-shadow .15s; }
  .mixer-input:focus { border-color:#0071e3; box-shadow:0 0 0 3px rgba(0,113,227,.12); }
  .mixer-select { padding:9px 12px; border-radius:8px; border:1px solid rgba(0,0,0,.14); font-size:13px; font-family:inherit; color:#1d1d1f; outline:none; background:white; }
  .mixer-btn-solve { padding:10px 22px; border-radius:10px; border:none; background:linear-gradient(145deg,#0071e3,#40b0ff); color:white; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; width:100%; margin-top:4px; }
  .mixer-btn-solve:disabled { opacity:.5; cursor:not-allowed; }
  .mixer-panels-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px; margin-top:12px; }
  .mixer-panel-chip { display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:10px; border:1.5px solid rgba(0,0,0,.1); background:white; cursor:pointer; transition:all .15s; }
  .mixer-panel-chip.selected { border-color:#0071e3; background:rgba(0,113,227,.06); }
  .mixer-panel-chip.selected .chip-dot { background:#0071e3; }
  .chip-dot { width:8px; height:8px; border-radius:50%; background:#d1d1d6; flex-shrink:0; transition:background .15s; }
  .chip-label { font-size:12px; font-weight:600; color:#1d1d1f; }
  .chip-sub { font-size:10px; color:#aeaeb2; }
  .mixer-solutions { display:flex; flex-direction:column; gap:16px; }
  .sol-card { background:white; border-radius:14px; border:1px solid rgba(0,0,0,.08); overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.06); }
  .sol-header { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:1px solid rgba(0,0,0,.06); background:#f5f5f7; }
  .sol-rank { font-size:11px; font-weight:700; color:#6e6e73; text-transform:uppercase; letter-spacing:.05em; }
  .sol-waste-badge { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; }
  .sol-waste-badge.perfect { background:rgba(52,199,89,.12); color:#28a745; }
  .sol-waste-badge.good { background:rgba(255,149,0,.12); color:#c45e00; }
  .sol-body { display:grid; grid-template-columns:280px 1fr; }
  .sol-viz { padding:20px; border-right:1px solid rgba(0,0,0,.06); display:flex; align-items:center; justify-content:center; background:white; }
  .sol-details { padding:20px; }
  .sol-layout-list { display:flex; flex-direction:column; gap:10px; margin-bottom:16px; }
  .sol-panel-row { display:flex; align-items:center; gap:10px; padding:10px 12px; background:#f5f5f7; border-radius:10px; }
  .sol-panel-dot { width:12px; height:12px; border-radius:3px; flex-shrink:0; }
  .sol-panel-info { flex:1; }
  .sol-panel-name { font-size:13px; font-weight:700; color:#1d1d1f; }
  .sol-panel-dim { font-size:11px; color:#6e6e73; }
  .sol-panel-count { font-size:14px; font-weight:800; color:#0071e3; }
  .sol-specs { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:10px; padding-top:14px; border-top:1px solid rgba(0,0,0,.06); }
  .sol-spec { display:flex; flex-direction:column; gap:2px; }
  .sol-spec-label { font-size:10px; font-weight:700; color:#aeaeb2; text-transform:uppercase; letter-spacing:.05em; }
  .sol-spec-val { font-size:15px; font-weight:700; color:#1d1d1f; }
  .sol-spec-sub { font-size:10px; color:#aeaeb2; }
  .mixer-empty { text-align:center; padding:48px 24px; color:#aeaeb2; }
  .mixer-empty-icon { font-size:40px; margin-bottom:12px; }
  .mixer-empty-title { font-size:16px; font-weight:600; color:#1d1d1f; margin-bottom:6px; }
  .mixer-empty-sub { font-size:13px; line-height:1.5; }
  .mixer-filters { display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap; }
  @media(max-width:768px){ .sol-body{grid-template-columns:1fr} .sol-viz{border-right:none;border-bottom:1px solid rgba(0,0,0,.06)} .mixer-form-grid{grid-template-columns:1fr 1fr} .sol-specs{grid-template-columns:1fr 1fr} }
`;

// ── Component ──────────────────────────────────────────────────────────────

export default function PanelMixer({ onBack }) {
  const [allPanels, setAllPanels] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterBrand, setFilterBrand] = useState("");
  const [filterPitch, setFilterPitch] = useState("");
  const [selectedRefs, setSelectedRefs] = useState(new Set());

  const [targetW, setTargetW] = useState("");
  const [targetH, setTargetH] = useState("");
  const [tolerance, setTolerance] = useState("0");

  const [solutions, setSolutions] = useState(null);
  const [solving, setSolving] = useState(false);

  useEffect(() => {
    const tag = document.createElement("style");
    tag.textContent = css;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);

  useEffect(() => {
    supabase.from("products").select("*").eq("is_active", true).order("marque").order("panel_ref")
      .then(({ data }) => {
        setAllPanels(data || []);
        setLoading(false);
      });
  }, []);

  const brands  = [...new Set(allPanels.map(p => p.marque).filter(Boolean))].sort();
  const pitches = [...new Set(
    allPanels.filter(p => !filterBrand || p.marque === filterBrand).map(p => p.pixel_pitch_mm)
  )].sort((a, b) => a - b);

  const visiblePanels = allPanels.filter(p =>
    (!filterBrand || p.marque === filterBrand) &&
    (!filterPitch || String(p.pixel_pitch_mm) === filterPitch)
  );

  const togglePanel = (ref) => {
    setSelectedRefs(prev => {
      const next = new Set(prev);
      next.has(ref) ? next.delete(ref) : next.add(ref);
      return next;
    });
    setSolutions(null);
  };

  const toggleAll = () => {
    const allVisible = visiblePanels.map(p => p.panel_ref);
    const allSelected = allVisible.every(r => selectedRefs.has(r));
    setSelectedRefs(prev => {
      const next = new Set(prev);
      allVisible.forEach(r => allSelected ? next.delete(r) : next.add(r));
      return next;
    });
    setSolutions(null);
  };

  const handleFilterChange = (brand, pitch) => {
    setFilterBrand(brand);
    setFilterPitch(pitch);
    setSelectedRefs(new Set());
    setSolutions(null);
  };

  const handleSolve = () => {
    const panels = allPanels.filter(p => selectedRefs.has(p.panel_ref));
    if (panels.length === 0 || !targetW || !targetH) return;
    setSolving(true);
    setSolutions(null);
    setTimeout(() => {
      const wMm = Math.round(parseFloat(targetW) * 1000);
      const hMm = Math.round(parseFloat(targetH) * 1000);
      const tol = parseInt(tolerance) || 0;
      const sols = solvePanelMix(panels, wMm, hMm, tol);
      setSolutions(sols);
      setSolving(false);
    }, 10);
  };

  const canSolve = selectedRefs.size > 0 && targetW && targetH && parseFloat(targetW) > 0 && parseFloat(targetH) > 0;

  return (
    <div className="mixer-wrap">
      <div className="mixer-topbar">
        <div>
          <div className="mixer-topbar-title">💡 LED Calculator</div>
          <div className="mixer-topbar-sub">Mix de panneaux sur mesure</div>
        </div>
        <button
          style={{ padding:"7px 14px", borderRadius:8, border:"1px solid rgba(0,0,0,.14)", background:"white", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
          onClick={onBack}
        >← Retour au calculateur</button>
      </div>

      <div className="mixer-content">
        <div className="mixer-title">Mix de panneaux sur mesure</div>
        <div className="mixer-subtitle">
          Trouvez la combinaison optimale de panneaux pour remplir n'importe quelle dimension
        </div>

        {/* Sélection des panneaux */}
        <div className="mixer-form-card">
          <div className="mixer-form-title">1 — Sélectionner les panneaux disponibles</div>
          <div className="mixer-filters">
            <select className="mixer-select" value={filterBrand} onChange={e => handleFilterChange(e.target.value, "")}>
              <option value="">Toutes les marques</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="mixer-select" value={filterPitch} onChange={e => { setFilterPitch(e.target.value); setSelectedRefs(new Set()); setSolutions(null); }}>
              <option value="">Tous les pitches</option>
              {pitches.map(p => <option key={p} value={p}>{p} mm</option>)}
            </select>
            {visiblePanels.length > 0 && (
              <button
                style={{ padding:"7px 12px", borderRadius:8, border:"1px solid rgba(0,0,0,.14)", background:"white", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
                onClick={toggleAll}
              >
                {visiblePanels.every(p => selectedRefs.has(p.panel_ref)) ? "Désélectionner tout" : "Sélectionner tout"}
              </button>
            )}
          </div>
          {loading ? (
            <div style={{ color:"#aeaeb2", fontSize:13, padding:"16px 0" }}>Chargement…</div>
          ) : visiblePanels.length === 0 ? (
            <div style={{ color:"#aeaeb2", fontSize:13, padding:"16px 0" }}>Aucun panneau correspondant</div>
          ) : (
            <div className="mixer-panels-grid">
              {visiblePanels.map(p => (
                <div key={p.panel_ref} className={`mixer-panel-chip ${selectedRefs.has(p.panel_ref) ? "selected" : ""}`} onClick={() => togglePanel(p.panel_ref)}>
                  <div className="chip-dot" />
                  <div>
                    <div className="chip-label">{p.panel_ref}</div>
                    <div className="chip-sub">{(p.panel_width_m*100).toFixed(0)}×{(p.panel_height_m*100).toFixed(0)} cm · {p.pixel_pitch_mm}mm</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dimensions cibles */}
        <div className="mixer-form-card">
          <div className="mixer-form-title">2 — Définir les dimensions cibles</div>
          <div className="mixer-form-grid">
            <div className="mixer-form-group">
              <label className="mixer-label">Largeur cible (m)</label>
              <input className="mixer-input" type="number" step="0.001" min="0.1" placeholder="ex: 1.25" value={targetW} onChange={e => { setTargetW(e.target.value); setSolutions(null); }} />
            </div>
            <div className="mixer-form-group">
              <label className="mixer-label">Hauteur cible (m)</label>
              <input className="mixer-input" type="number" step="0.001" min="0.1" placeholder="ex: 2.00" value={targetH} onChange={e => { setTargetH(e.target.value); setSolutions(null); }} />
            </div>
            <div className="mixer-form-group">
              <label className="mixer-label">Tolérance (mm)</label>
              <select className="mixer-select" value={tolerance} onChange={e => { setTolerance(e.target.value); setSolutions(null); }}>
                <option value="0">Exacte (0 mm)</option>
                <option value="10">±10 mm</option>
                <option value="25">±25 mm</option>
                <option value="50">±50 mm</option>
                <option value="100">±100 mm</option>
              </select>
            </div>
            <div className="mixer-form-group">
              <label className="mixer-label">&nbsp;</label>
              <button className="mixer-btn-solve" onClick={handleSolve} disabled={!canSolve || solving}>
                {solving ? "Calcul en cours…" : "🔍 Calculer le mix optimal"}
              </button>
            </div>
          </div>
          {selectedRefs.size > 0 && (
            <div style={{ marginTop:10, fontSize:12, color:"#6e6e73" }}>
              {selectedRefs.size} panneau{selectedRefs.size > 1 ? "x" : ""} sélectionné{selectedRefs.size > 1 ? "s" : ""} ·{" "}
              {[...new Set(allPanels.filter(p => selectedRefs.has(p.panel_ref)).map(p => roundMm(p.panel_width_m)))].sort((a,b)=>a-b).map(w => `${w}mm`).join(", ")} de large ·{" "}
              {[...new Set(allPanels.filter(p => selectedRefs.has(p.panel_ref)).map(p => roundMm(p.panel_height_m)))].sort((a,b)=>a-b).map(h => `${h}mm`).join(", ")} de haut
            </div>
          )}
        </div>

        {/* Résultats */}
        {solutions !== null && (
          <>
            <div style={{ fontSize:13, fontWeight:600, color:"#6e6e73", marginBottom:12 }}>
              {solutions.length === 0
                ? "Aucune combinaison trouvée — essayez d'augmenter la tolérance ou d'ajouter des panneaux"
                : `${solutions.length} combinaison${solutions.length > 1 ? "s" : ""} trouvée${solutions.length > 1 ? "s" : ""}`
              }
            </div>
            <div className="mixer-solutions">
              {solutions.map((sol, idx) => (
                <SolutionCard key={idx} sol={sol} rank={idx + 1} />
              ))}
            </div>
            {solutions.length === 0 && (
              <div className="mixer-empty">
                <div className="mixer-empty-icon">🔧</div>
                <div className="mixer-empty-title">Aucune combinaison valide</div>
                <div className="mixer-empty-sub">
                  Vérifiez que vous avez des panneaux avec différentes dimensions dans votre sélection,<br/>
                  ou augmentez la tolérance pour accepter un léger écart.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SolutionCard({ sol, rank }) {
  const isExact = sol.waste === 0;

  return (
    <div className="sol-card">
      <div className="sol-header">
        <div className="sol-rank">Solution #{rank} — {sol.types} type{sol.types > 1 ? "s" : ""} de panneau · {sol.totalPanels} panneaux</div>
        <span className={`sol-waste-badge ${isExact ? "perfect" : "good"}`}>
          {isExact ? "✓ Ajustement parfait" : `±${sol.waste}mm d'écart`}
        </span>
      </div>
      <div className="sol-body">
        <div className="sol-viz">
          <PanelGrid wc={sol.wc} hc={sol.hc} />
        </div>
        <div className="sol-details">
          <div className="sol-layout-list">
            {sol.layout.map((t, i) => (
              <div key={i} className="sol-panel-row">
                <div className="sol-panel-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <div className="sol-panel-info">
                  <div className="sol-panel-name">{t.panel.panel_ref}</div>
                  <div className="sol-panel-dim">
                    {t.wMm}×{t.hMm} mm · {t.cols} col{t.cols > 1 ? "s" : ""} × {t.rows} rang{t.rows > 1 ? "s" : ""}
                    {t.panel.marque ? ` · ${t.panel.marque}` : ""}
                  </div>
                </div>
                <div className="sol-panel-count">{t.count}×</div>
              </div>
            ))}
          </div>
          <div className="sol-specs">
            <div className="sol-spec">
              <div className="sol-spec-label">Dimensions réelles</div>
              <div className="sol-spec-val">{(sol.actualW/1000).toFixed(3)} m</div>
              <div className="sol-spec-sub">× {(sol.actualH/1000).toFixed(3)} m</div>
            </div>
            <div className="sol-spec">
              <div className="sol-spec-label">Résolution</div>
              <div className="sol-spec-val">{sol.totalPixW}×{sol.totalPixH}</div>
              <div className="sol-spec-sub">{((sol.totalPixW * sol.totalPixH) / 1_000_000).toFixed(1)} Mpx</div>
            </div>
            <div className="sol-spec">
              <div className="sol-spec-label">Poids total</div>
              <div className="sol-spec-val">{sol.totalWeight.toFixed(1)} kg</div>
              <div className="sol-spec-sub">{sol.totalPanels} panneaux</div>
            </div>
            <div className="sol-spec">
              <div className="sol-spec-label">Conso. max</div>
              <div className="sol-spec-val">{(sol.totalPowerMax / 1000).toFixed(1)} kW</div>
              <div className="sol-spec-sub">moy: {(sol.totalPowerAvg / 1000).toFixed(1)} kW</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
