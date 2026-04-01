import { useState } from "react";
import LEDCalculator from "./LEDCalculator";
import AdminPanels from "./AdminPanels";

const ADMIN_PASSWORD = "Poisson95."; // changez ceci !

export default function App() {
  const [page, setPage] = useState("calculator");
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  const handleAdminClick = () => {
    if (adminUnlocked) {
      setPage("admin");
      return;
    }
    const pwd = prompt("Mot de passe administrateur :");
    if (pwd === ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      setPage("admin");
    } else if (pwd !== null) {
      alert("Mot de passe incorrect.");
    }
  };

  if (page === "admin" && adminUnlocked) {
    return <AdminPanels onBack={() => setPage("calculator")} />;
  }

  return <LEDCalculator onAdmin={handleAdminClick} />;
}