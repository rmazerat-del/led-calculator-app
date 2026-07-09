import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 14, background: "#f5f5f7", fontFamily: "-apple-system, sans-serif",
        padding: 24, textAlign: "center"
      }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1d1d1f" }}>Une erreur est survenue</div>
        <div style={{ fontSize: 13, color: "#6e6e73", maxWidth: 360 }}>
          L'application a rencontré un problème inattendu. Rechargez la page pour continuer.
        </div>
        <button onClick={() => window.location.reload()} style={{
          marginTop: 6, padding: "10px 18px", borderRadius: 8, border: "none",
          background: "linear-gradient(145deg, #0071e3, #40b0ff)", color: "white",
          fontSize: 13, fontWeight: 600, cursor: "pointer"
        }}>
          Recharger la page
        </button>
      </div>
    );
  }
}
