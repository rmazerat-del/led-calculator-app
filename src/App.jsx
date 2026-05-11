import { useState, useEffect } from "react";
import LEDCalculator from "./LEDCalculator";
import AdminPanels from "./AdminPanels";
import PanelMixer from "./PanelMixer";
import MultiScreen from "./MultiScreen";
import Login from "./Login";
import { LanguageProvider } from "./LanguageContext";
import { supabase } from "./supabaseClient";

function AppInner() {
  const [page, setPage] = useState("calculator");
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPage("calculator");
  };

  if (authLoading) return null;

  if (page === "admin") {
    if (!session) return <Login />;
    return <AdminPanels onBack={() => setPage("calculator")} onLogout={handleLogout} />;
  }
  if (page === "mixer") return <PanelMixer onBack={() => setPage("calculator")} />;
  if (page === "multiscreen") return <MultiScreen onBack={() => setPage("calculator")} />;

  return (
    <LEDCalculator
      onAdmin={() => setPage("admin")}
      onMixer={() => setPage("mixer")}
      onMultiScreen={() => setPage("multiscreen")}
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
