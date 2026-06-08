import { useState, useEffect } from "react";
import LEDCalculator from "./LEDCalculator";
import AdminPanels from "./AdminPanels";
import PanelMixer from "./PanelMixer";
import MultiScreen from "./MultiScreen";
import Login from "./Login";
import LandingPage from "./LandingPage";
import { LanguageProvider } from "./LanguageContext";
import { supabase } from "./supabaseClient";

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
