import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f5f5f7", fontFamily: "-apple-system, sans-serif"
    }}>
      <div style={{
        background: "white", borderRadius: 14, padding: "40px 36px",
        width: 360, boxShadow: "0 4px 24px rgba(0,0,0,0.08)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, margin: "0 auto 12px",
            background: "linear-gradient(145deg, #0071e3, #40b0ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20
          }}>💡</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1d1d1f", margin: 0 }}>LED Calculator</h1>
          <p style={{ fontSize: 13, color: "#6e6e73", marginTop: 4 }}>Connectez-vous pour continuer</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6e6e73", display: "block", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="votre@email.com"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14,
                border: "1px solid rgba(0,0,0,0.14)", outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6e6e73", display: "block", marginBottom: 6 }}>
              Mot de passe
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14,
                border: "1px solid rgba(0,0,0,0.14)", outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(255,59,48,0.08)", color: "#ff3b30", borderRadius: 8,
              padding: "10px 12px", fontSize: 13, marginBottom: 14
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "12px", borderRadius: 8, border: "none",
            background: "linear-gradient(145deg, #0071e3, #40b0ff)", color: "white",
            fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}