import { AppHeader } from "./AppHeader";
import { SettingsView } from "./SettingsView";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Clock, ChevronRight, Plus, User } from "lucide-react";
import { useNavigate } from "./RouterContext";
import { useState } from "react";

const mockMonitoreos = [
  { id: "PC-2026-0034", type: "Temporada Lluvias", municipio: "Ciudad Victoria", date: "04/03/2026", user: "Operador López", status: "Activo", statusText: "text-green-700", statusBg: "bg-green-50" },
  { id: "PC-2026-0033", type: "Monitoreo Diario", municipio: "Tampico", date: "03/03/2026", user: "Operador García", status: "Activo", statusText: "text-green-700", statusBg: "bg-green-50" },
  { id: "PC-2026-0031", type: "Incendio Forestal", municipio: "Jaumave", date: "02/03/2026", user: "Operador Ruiz", status: "Cerrado", statusText: "text-gray-600", statusBg: "bg-gray-100" },
  { id: "PC-2026-0029", type: "Temporada Invernal", municipio: "Nuevo Laredo", date: "01/03/2026", user: "Operador Martínez", status: "Cerrado", statusText: "text-gray-600", statusBg: "bg-gray-100" },
];

export function MonitoringDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const filtered = mockMonitoreos.filter(
    (m) =>
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.type.toLowerCase().includes(search.toLowerCase()) ||
      m.municipio.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <AnimatePresence>
        {showSettings && (
          <motion.div
            key="settings-overlay"
            className="fixed inset-0 z-[100] bg-background flex flex-col overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <AppHeader title="Configuración" showBack={true} onBack={() => setShowSettings(false)} />
            <SettingsView />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader title="Monitoreos" showBack={false} onSettingsPress={() => setShowSettings(true)}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" strokeWidth={2} />
          <input
            type="text"
            placeholder="Buscar por folio, tipo o municipio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl text-[15px] text-white placeholder:text-white/35"
            style={{ background: "rgba(255,255,255,0.10)", border: "none", outline: "none" }}
          />
        </div>
      </AppHeader>

      <div className="px-4 py-2">
        <p className="text-[14px] text-muted-foreground">{filtered.length} monitoreos</p>
      </div>

      <div className="flex-1 px-4 pb-24 space-y-2.5">
        {filtered.map((mon) => (
          <div
            key={mon.id}
            className="rounded-2xl p-4"
            style={{
              background: "var(--glass-bg-heavy)",
              boxShadow: "var(--shadow-card), var(--glass-highlight)",
              border: "0.5px solid var(--glass-border)",
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-[13px] text-primary/80 bg-primary/6 px-2 py-0.5 rounded-md tabular-nums">{mon.id}</span>
              <span className={`text-[13px] ${mon.statusText} ${mon.statusBg} px-2.5 py-0.5 rounded-md`}>{mon.status}</span>
            </div>
            <p className="text-[17px] text-foreground tracking-tight mb-1.5">{mon.type}</p>
            <div className="flex items-center gap-1.5 text-[14px] text-muted-foreground mb-2">
              <MapPin className="w-4 h-4" strokeWidth={1.8} /> {mon.municipio}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[13px] text-muted-foreground/70">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" strokeWidth={1.8} />{mon.date}</span>
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" strokeWidth={1.8} />{mon.user}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/30" strokeWidth={2.5} />
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("/monitoreo/nuevo")}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3.5 rounded-full bg-primary text-white active:scale-95 transition-transform z-40"
        style={{ boxShadow: "0 2px 8px rgba(171,23,56,0.25), 0 12px 28px rgba(171,23,56,0.2)" }}
      >
        <Plus className="w-5 h-5" strokeWidth={2} />
        <span className="text-[15px]">Nuevo Monitoreo</span>
      </button>
    </div>
    </>
  );
}