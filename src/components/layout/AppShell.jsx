import { motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <div className="app-shell__backdrop app-shell__backdrop--one" />
      <div className="app-shell__backdrop app-shell__backdrop--two" />
      <Sidebar />
      <main className="app-shell__main">
        <Topbar />
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="app-shell__content"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
