import { useState } from "react";
import LEDCalculator from "./LEDCalculator";
import AdminPanels from "./AdminPanels";

export default function App() {
  const [page, setPage] = useState("calculator");

  if (page === "admin") return <AdminPanels onBack={() => setPage("calculator")} />;
  return <LEDCalculator onAdmin={() => setPage("admin")} />;
}