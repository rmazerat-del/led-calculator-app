import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

const css = `
  .admin-wrap { min-height: 100vh; background: #f5f5f7; font-family: -apple-system, 'Helvetica Neue', sans-serif; }
  .admin-topbar { background: rgba(245,245,247,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(0,0,0,0.08); padding: 0 28px; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
  .admin-topbar-title { font-size: 17px; font-weight: 600; color: #1d1d1f; }
  .admin-topbar-sub { font-size: 11px; color: #aeaeb2; text-transform: uppercase; letter-spacing: 0.05em; }
  .admin-content { max-width: 1100px; margin: 0 auto; padding: 28px 24px; }
  .admin-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .admin-title { font-size: 22px; font-weight: 700; color: #1d1d1f; }
  .btn-primary { padding: 9px 18px; border-radius: 10px; border: none; background: linear-gradient(145deg, #0071e3, #40b0ff); color: white; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .btn-secondary { padding: 7px 14px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.14); background: white; color: #1d1d1f; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .btn-danger { padding: 7px 14px; border-radius: 8px; border: none; background: rgba(255,59,48,0.1); color: #ff3b30; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .table-wrap { background: white; border-radius: 14px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .panel-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .panel-table th { text-align: left; padding: 10px 16px; color: #aeaeb2; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; background: #f5f5f7; }
  .panel-table td { padding: 11px 16px; border-top: 1px solid rgba(0,0,0,0.06); color: #1d1d1f; vertical-align: middle; }
  .panel-table tr:hover td { background: rgba(0,113,227,0.02); }
  .badge-active { background: rgba(52,199,89,0.1); color: #34c759; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-inactive { background: rgba(142,142,147,0.1); color: #8e8e93; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .actions-row { display: flex; gap: 6px; }
  .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; }
  .modal { background: white; border-radius: 16px; padding: 28px; width: 520px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 8px 40px rgba(0,0,0,0.15); }
  .modal-title { font-size: 18px; font-weight: 700; color: #1d1d1f; margin-bottom: 20px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group.full { grid-column: 1 / -1; }
  .form-label { font-size: 11px; font-weight: 600; color: #6e6e73; text-transform: uppercase; letter-spacing: 0.05em; }
  .form-input { padding: 9px 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.14); font-size: 14px; font-family: inherit; color: #1d1d1f; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
  .form-input:focus { border-color: #0071e3; box-shadow: 0 0 0 3px rgba(0,113,227,0.12); }
  .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
  .alert-success { background: rgba(52,199,89,0.1); color: #34c759; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
  .alert-error { background: rgba(255,59,48,0.1); color: #ff3b30; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
  .loading { text-align: center; padding: 40px; color: #aeaeb2; font-size: 14px; }
  .empty { text-align: center; padding: 40px; color: #aeaeb2; font-size: 14px; }
  .csv-preview { background: #f5f5f7; border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; overflow: auto; max-height: 280px; margin: 12px 0; font-size: 11px; }
  .csv-preview table { width: 100%; border-collapse: collapse; }
  .csv-preview th { background: rgba(0,0,0,0.06); padding: 6px 10px; text-align: left; font-size: 10px; font-weight: 700; color: #6e6e73; text-transform: uppercase; letter-spacing: 0.06em; position: sticky; top: 0; }
  .csv-preview td { padding: 5px 10px; border-top: 1px solid rgba(0,0,0,0.06); color: #1d1d1f; }
  .csv-preview tr:hover td { background: rgba(0,113,227,0.03); }
  .csv-row-error td { background: rgba(255,59,48,0.06) !important; color: #ff3b30 !important; }
`;

const EMPTY_FORM = {
  marque: "", type_led: "", brand: "", panel_ref: "",
  pixel_pitch_mm: "", resolution_w: "", resolution_h: "",
  panel_width_m: "0.6", panel_height_m: "0.337", weight_kgs: "",
  nits: "", power_max_w: "", power_avg_w: "", refresh_rate_hz: "3840",
  rj45_capacity: "535000", power_cable_capacity: "2200", is_active: true, notes: ""
};

const CSV_COLUMNS = [
  "marque","type_led","brand","panel_ref","pixel_pitch_mm","resolution_w","resolution_h",
  "panel_width_m","panel_height_m","weight_kgs","nits","power_max_w","power_avg_w",
  "refresh_rate_hz","rj45_capacity","power_cable_capacity","notes",
];

function parseCSV(text) {
  const allLines = text.trim().split(/\r?\n/);
  // Skip Excel separator hint line (sep=, or sep=;)
  const lines = allLines.filter(l => !l.toLowerCase().startsWith("sep="));
  if (lines.length < 2) return { headers: [], rows: [] };
  // Auto-detect delimiter: semicolon (French Excel) or comma
  const delim = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delim).map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(line => {
    const escaped = new RegExp(`(".*?"|[^${delim}]+|(?<=${delim})(?=${delim})|(?<=${delim})$|^(?=${delim}))`, "g");
    const vals = line.match(escaped) || [];
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || "").trim().replace(/^"|"$/g, ""); });
    return obj;
  });
  return { headers, rows };
}

export default function AdminPanels({ onBack }) {
  const [panels, setPanels]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [alert, setAlert]         = useState(null);
  const [showCSV, setShowCSV]     = useState(false);
  const [csvRows, setCsvRows]     = useState([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const csvInputRef = useRef(null);

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

  useEffect(() => { fetchPanels(); }, []);

  const fetchPanels = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("panel_ref");
    if (!error) setPanels(data || []);
    setLoading(false);
  };

  const handleCSVFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows } = parseCSV(ev.target.result);
      const validated = rows.map(r => {
        const numericFields = ["pixel_pitch_mm","resolution_w","resolution_h","panel_width_m","panel_height_m","weight_kgs","nits","power_max_w","power_avg_w"];
        const hasErrors = !r.panel_ref || numericFields.some(f => r[f] === "" || isNaN(Number(r[f])));
        return { ...r, _error: hasErrors };
      });
      setCsvRows(validated);
      setShowCSV(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleCSVImport = async () => {
    const valid = csvRows.filter(r => !r._error);
    if (valid.length === 0) return;
    setCsvImporting(true);
    const payloads = valid.map(r => ({
      marque: r.marque, type_led: r.type_led, brand: r.brand, panel_ref: r.panel_ref,
      pixel_pitch_mm: parseFloat(r.pixel_pitch_mm), resolution_w: parseInt(r.resolution_w),
      resolution_h: parseInt(r.resolution_h), panel_width_m: parseFloat(r.panel_width_m),
      panel_height_m: parseFloat(r.panel_height_m), weight_kgs: parseFloat(r.weight_kgs),
      nits: parseInt(r.nits), power_max_w: parseInt(r.power_max_w), power_avg_w: parseFloat(r.power_avg_w),
      refresh_rate_hz: r.refresh_rate_hz ? parseInt(r.refresh_rate_hz) : 3840,
      rj45_capacity: r.rj45_capacity ? parseInt(r.rj45_capacity) : 535000,
      power_cable_capacity: r.power_cable_capacity ? parseInt(r.power_cable_capacity) : 2200,
      notes: r.notes || "", is_active: true,
    }));
    const { error } = await supabase.from("products").upsert(payloads, { onConflict: "panel_ref" });
    if (error) {
      setAlert({ type: "error", msg: `Import échoué: ${error.message}` });
    } else {
      setAlert({ type: "success", msg: `${payloads.length} panneau(x) importé(s) !` });
      setCsvRows([]); setShowCSV(false);
      await fetchPanels();
    }
    setCsvImporting(false);
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (panel) => { setEditing(panel.id); setForm({ ...panel }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY_FORM); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setAlert(null);

    const requiredNumeric = ["pixel_pitch_mm", "resolution_w", "resolution_h", "panel_width_m", "panel_height_m", "weight_kgs", "nits", "power_max_w", "power_avg_w"];
    for (const field of requiredNumeric) {
      if (form[field] === "" || form[field] === null || form[field] === undefined || isNaN(Number(form[field]))) {
        setAlert({ type: "error", msg: `Le champ "${field}" est requis et doit être un nombre valide.` });
        setSaving(false);
        return;
      }
    }
    if (!form.panel_ref) {
      setAlert({ type: "error", msg: "La référence panneau est requise." });
      setSaving(false);
      return;
    }

    const payload = {
      marque: form.marque, type_led: form.type_led, brand: form.brand,
      panel_ref: form.panel_ref,
      pixel_pitch_mm: parseFloat(form.pixel_pitch_mm),
      resolution_w: parseInt(form.resolution_w), resolution_h: parseInt(form.resolution_h),
      panel_width_m: parseFloat(form.panel_width_m), panel_height_m: parseFloat(form.panel_height_m),
      weight_kgs: parseFloat(form.weight_kgs), nits: parseInt(form.nits),
      power_max_w: parseInt(form.power_max_w), power_avg_w: parseFloat(form.power_avg_w),
      refresh_rate_hz: parseInt(form.refresh_rate_hz),
      rj45_capacity: parseInt(form.rj45_capacity),
      power_cable_capacity: parseInt(form.power_cable_capacity),
      is_active: form.is_active, notes: form.notes,
    };
    let error, data;
if (editing) {
  ({ error, data } = await supabase.from("products").update(payload).eq("id", editing));
  console.log("UPDATE result:", data, "ERROR:", error, "ID:", editing, "PAYLOAD:", payload);
    } else {
      ({ error } = await supabase.from("products").insert(payload));
    }
    if (error) {
      setAlert({ type: "error", msg: error.message });
    } else {
      setAlert({ type: "success", msg: editing ? "Panneau mis à jour !" : "Panneau ajouté !" });
      await fetchPanels();
      setTimeout(closeModal, 800);
    }
    setSaving(false);
  };

  const toggleActive = async (panel) => {
    await supabase.from("products").update({ is_active: !panel.is_active }).eq("id", panel.id);
    fetchPanels();
  };

  const deletePanel = async (panel) => {
    if (!window.confirm(`Supprimer définitivement "${panel.panel_ref}" ?\nCette action est irréversible.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", panel.id);
    if (error) setAlert({ type: "error", msg: `Erreur : ${error.message}` });
    else { setAlert({ type: "success", msg: `"${panel.panel_ref}" supprimé.` }); fetchPanels(); }
  };

  const purgeInactive = async () => {
    const inactifs = panels.filter(p => !p.is_active);
    if (inactifs.length === 0) { setAlert({ type: "error", msg: "Aucun panneau inactif à supprimer." }); return; }
    if (!window.confirm(`Supprimer définitivement ${inactifs.length} panneau(x) inactif(s) ?\n\n${inactifs.map(p => p.panel_ref).join("\n")}\n\nCette action est irréversible.`)) return;
    const ids = inactifs.map(p => p.id);
    const { error } = await supabase.from("products").delete().in("id", ids);
    if (error) setAlert({ type: "error", msg: `Erreur : ${error.message}` });
    else { setAlert({ type: "success", msg: `${inactifs.length} panneau(x) inactif(s) supprimé(s).` }); fetchPanels(); }
  };

  const downloadTemplate = () => {
    const sep = ";";
    const header = CSV_COLUMNS.join(sep);
    const desc = [
      "VOTRE_MARQUE",
      "SMD",
      "NOM_SERIE",
      "REF-UNIQUE-001",
      "2.5",
      "240",
      "135",
      "0.6",
      "0.3375",
      "8.5",
      "5000",
      "350",
      "150",
      "3840",
      "535000",
      "2200",
      "Exemple — remplacez toutes les valeurs",
    ].join(sep);
    // BOM + sep hint ensures Excel (FR/EN) opens columns correctly
    const bom = "﻿";
    const blob = new Blob([bom + "sep=;\n" + header + "\n" + desc + "\n"], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele-fournisseur.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-wrap">
      <div className="admin-topbar">
        <div>
          <div className="admin-topbar-title">💡 LED Calculator</div>
          <div className="admin-topbar-sub">Back-office · Panneaux</div>
        </div>
        <button className="btn-secondary" onClick={onBack}>← Retour au calculateur</button>
      </div>

      <div className="admin-content">
        <div className="admin-header-row">
          <div className="admin-title">Gestion des panneaux LED</div>
          <div style={{ display:"flex", gap:8 }}>
            <input ref={csvInputRef} type="file" accept=".csv,text/csv" style={{ display:"none" }} onChange={handleCSVFile} />
            <button className="btn-secondary" onClick={downloadTemplate}>⬇ Modèle CSV</button>
            <button className="btn-secondary" onClick={() => csvInputRef.current?.click()}>⬆ Import CSV</button>
            <button className="btn-danger" onClick={purgeInactive}>🗑 Purger les inactifs</button>
            <button className="btn-primary" onClick={openAdd}>+ Ajouter un panneau</button>
          </div>
        </div>
        {alert && !showModal && (
          <div className={alert.type === "success" ? "alert-success" : "alert-error"} style={{ marginBottom:16 }}>{alert.msg}</div>
        )}

        {loading ? (
          <div className="loading">Chargement…</div>
        ) : panels.length === 0 ? (
          <div className="empty">Aucun panneau trouvé</div>
        ) : (
          <div className="table-wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Marque</th>
                  <th>Type LED</th>
                  <th>Référence</th>
                  <th>Série</th>
                  <th>Pitch</th>
                  <th>Résolution</th>
                  <th>Dimensions</th>
                  <th>Nits</th>
                  <th>Conso max</th>
                  <th>Poids</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {panels.map(p => (
                  <tr key={p.id}>
                    <td>{p.marque || '—'}</td>
                    <td>{p.type_led || '—'}</td>
                    <td style={{fontWeight:700}}>{p.panel_ref}</td>
                    <td>{p.brand || '—'}</td>
                    <td>{p.pixel_pitch_mm} mm</td>
                    <td>{p.resolution_w}×{p.resolution_h}</td>
                    <td>{p.panel_width_m}×{p.panel_height_m} m</td>
                    <td>{p.nits}</td>
                    <td>{p.power_max_w} W</td>
                    <td>{p.weight_kgs} kg</td>
                    <td>
                      <span className={p.is_active ? "badge-active" : "badge-inactive"}>
                        {p.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>
                      <div className="actions-row">
                        <button className="btn-secondary" onClick={() => openEdit(p)}>Modifier</button>
                        <button className="btn-danger" onClick={() => toggleActive(p)}>
                          {p.is_active ? "Désactiver" : "Activer"}
                        </button>
                        <button className="btn-danger" onClick={() => deletePanel(p)} title="Supprimer définitivement">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCSV && (
        <div className="modal-bg" onClick={() => setShowCSV(false)}>
          <div className="modal" style={{ width:700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">Import CSV — Aperçu</div>
            <div style={{ fontSize:12, color:"#6e6e73", marginBottom:8 }}>
              {csvRows.filter(r => !r._error).length} valide(s) · {csvRows.filter(r => r._error).length} erreur(s). Les lignes en rouge seront ignorées.
              Les entrées existantes (même <code>panel_ref</code>) seront mises à jour.
            </div>
            <div style={{ fontSize:11, color:"#6e6e73", marginBottom:10 }}>
              Format CSV attendu — colonnes : <code>{CSV_COLUMNS.join(", ")}</code>
            </div>
            <div className="csv-preview">
              <table>
                <thead><tr>
                  {["panel_ref","marque","type_led","pixel_pitch_mm","nits","power_max_w","weight_kgs"].map(h => <th key={h}>{h}</th>)}
                  <th>Statut</th>
                </tr></thead>
                <tbody>
                  {csvRows.map((r, i) => (
                    <tr key={i} className={r._error ? "csv-row-error" : ""}>
                      <td>{r.panel_ref || "—"}</td>
                      <td>{r.marque || "—"}</td>
                      <td>{r.type_led || "—"}</td>
                      <td>{r.pixel_pitch_mm}</td>
                      <td>{r.nits}</td>
                      <td>{r.power_max_w}</td>
                      <td>{r.weight_kgs}</td>
                      <td>{r._error ? "⚠ Erreur" : "✓ OK"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCSV(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleCSVImport} disabled={csvImporting || csvRows.filter(r => !r._error).length === 0}>
                {csvImporting ? "Import en cours…" : `Importer ${csvRows.filter(r => !r._error).length} panneau(x)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-bg" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editing ? "Modifier le panneau" : "Ajouter un panneau"}</div>
            {alert && (
              <div className={alert.type === "success" ? "alert-success" : "alert-error"}>{alert.msg}</div>
            )}
            <div className="form-grid">
              {[
                { name:"marque",               label:"Marque",             full:false },
                { name:"type_led",             label:"Type LED",           full:false },
                { name:"brand",                label:"Série",              full:false },
                { name:"panel_ref",            label:"Référence",          full:false },
                { name:"pixel_pitch_mm",       label:"Pitch pixel (mm)" },
                { name:"nits",                 label:"Luminosité (nits)" },
                { name:"resolution_w",         label:"Résolution largeur" },
                { name:"resolution_h",         label:"Résolution hauteur" },
                { name:"panel_width_m",        label:"Largeur cabinet (m)" },
                { name:"panel_height_m",       label:"Hauteur cabinet (m)" },
                { name:"weight_kgs",           label:"Poids (kg)" },
                { name:"power_max_w",          label:"Conso max (W)" },
                { name:"power_avg_w",          label:"Conso moy. (W)" },
                { name:"refresh_rate_hz",      label:"Refresh rate (Hz)" },
                { name:"rj45_capacity",        label:"Capacité RJ45 (px)" },
                { name:"power_cable_capacity", label:"Cap. câble élec. (W)" },
              ].map(f => (
                <div key={f.name} className={`form-group${f.full ? " full" : ""}`}>
                  <label className="form-label">{f.label}</label>
                  <input
                    className="form-input"
                    name={f.name}
                    value={form[f.name] || ""}
                    onChange={handleChange}
                    type={["marque","type_led","brand","panel_ref"].includes(f.name) ? "text" : "number"}
                    step="any"
                  />
                </div>
              ))}
              <div className="form-group full">
                <label className="form-label">Notes</label>
                <input className="form-input" name="notes" value={form.notes || ""} onChange={handleChange} />
              </div>
              <div className="form-group" style={{flexDirection:"row", alignItems:"center", gap:10}}>
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} id="is_active" />
                <label htmlFor="is_active" className="form-label" style={{margin:0}}>Panneau actif</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Annuler</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}