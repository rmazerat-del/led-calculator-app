import { useState, useEffect } from "react";
import LEDCalculator from "./LEDCalculator";
import AdminPanels from "./AdminPanels";
import PanelMixer from "./PanelMixer";
import MultiScreen from "./MultiScreen";
import Login from "./Login";
import LandingPage from "./LandingPage";
import { LanguageProvider } from "./LanguageContext";
import { supabase } from "./supabaseClient";

const ADMIN_EMAILS = ["rmazerat@gmail.com"];

function AppInner() {
  const [page, setPage] = useState("home");
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setAuthLoading(false), 4000);
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeout);
        setSession(session);
        setAuthLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        setAuthLoading(false);
      });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPage("home");
  };

  if (authLoading) return null;

  if (page === "home") return <LandingPage onNavigate={setPage} />;

  if (page === "admin") {
    if (!session) return <Login />;
    const isAdmin = ADMIN_EMAILS.includes((session.user?.email || "").toLowerCase());
    if (!isAdmin) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 14, background: "#f5f5f7", fontFamily: "-apple-system, sans-serif"
        }}>
          <div style={{ fontSize: 40 }}>🚫</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1d1d1f" }}>Accès refusé</div>
          <div style={{ fontSize: 13, color: "#6e6e73" }}>
            Ce compte ({session.user?.email}) n'a pas accès à l'administration.
          </div>
          <button onClick={handleLogout} style={{
            marginTop: 6, padding: "10px 18px", borderRadius: 8, border: "none",
            background: "#ff3b30", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer"
          }}>
            Déconnexion
          </button>
        </div>
      );
    }
    return <AdminPanels onBack={() => setPage("home")} onLogout={handleLogout} />;
  }
  if (page === "mixer") return <PanelMixer onBack={() => setPage("home")} />;
  if (page === "multiscreen") return <MultiScreen onBack={() => setPage("home")} />;

  return (
    <LEDCalculator
      onAdmin={() => setPage("admin")}
      onHome={() => setPage("home")}
    />
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
