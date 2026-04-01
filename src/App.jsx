import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import LEDCalculator from "./LEDCalculator";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f5f5f7",
      fontFamily: "-apple-system, sans-serif", color: "#6e6e73"
    }}>
      Chargement…
    </div>
  );

  if (!session) return <Login />;

  return <LEDCalculator onSignOut={() => supabase.auth.signOut()} />;
}