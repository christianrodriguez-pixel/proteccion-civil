import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  Camera,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Loader2,
  User,
  Shield,
  Check,
  ImageIcon,
  FileText,
  Activity,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "./RouterContext";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-aac1ff1a`;

/* ─── Institutional palette ─── */
const GUINDO = "#AB1738";
const DORADO = "#BC955B";
const BEIGE = "#E6D5B5";
const GUINDO_DARK = "#8B1028";

/* ─── iOS 26 system tokens ─── */
const IOS = {
  label: "#1C1C1E",
  separator: "rgba(60,60,67,0.12)",
  sectionHeader: "#86868B",
  cardBg: "rgba(255,255,255,0.92)",
  secondaryText: "#8E8E93",
  pageBg: "#F2F2F7",
};

/* ─── Role metadata ─── */
const ROLE_META: Record<
  string,
  {
    label: string;
    subtitle: string;
    curp: string;
    email: string;
  }
> = {
  "campo-911": {
    label: "Personal de Campo",
    subtitle: "Reacción y Reportes 911",
    curp: "ROMC850412HTSMRH09",
    email: "c.rodriguez@pctamaulipas.gob.mx",
  },
  "campo-monitoreo": {
    label: "Personal de Campo",
    subtitle: "Prevención y Monitoreo",
    curp: "ROMC850412HTSMRH09",
    email: "c.rodriguez@pctamaulipas.gob.mx",
  },
  coordinador: {
    label: "Coordinador Regional",
    subtitle: "Supervisión",
    curp: "ROMC850412HTSMRH09",
    email: "c.rodriguez@pctamaulipas.gob.mx",
  },
};

/* ─── Notification preference types ─── */
export interface NotifPrefs {
  reportes911: boolean;
  r911Alta: boolean;
  r911Media: boolean;
  r911Baja: boolean;
  monitoreo: boolean;
  monAlta: boolean;
  monMedia: boolean;
  monBaja: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  reportes911: true,
  r911Alta: true,
  r911Media: true,
  r911Baja: true,
  monitoreo: true,
  monAlta: true,
  monMedia: true,
  monBaja: true,
};

export function loadNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem("pc-notif-prefs");
    if (raw) {
      const parsed = JSON.parse(raw);
      if ("alta" in parsed && !("r911Alta" in parsed)) {
        const migrated: NotifPrefs = {
          reportes911: parsed.reportes911 ?? true,
          r911Alta: parsed.alta ?? true,
          r911Media: parsed.media ?? true,
          r911Baja: parsed.baja ?? true,
          monitoreo: parsed.monitoreo ?? true,
          monAlta: parsed.alta ?? true,
          monMedia: parsed.media ?? true,
          monBaja: parsed.baja ?? true,
        };
        savePrefs(migrated);
        return migrated;
      }
      if ("priority" in parsed) {
        const migrated: NotifPrefs = {
          reportes911: parsed.reportes911 ?? true,
          r911Alta:
            parsed.priority === "todas" ||
            parsed.priority === "alta",
          r911Media:
            parsed.priority === "todas" ||
            parsed.priority === "media",
          r911Baja:
            parsed.priority === "todas" ||
            parsed.priority === "baja",
          monitoreo: parsed.monitoreo ?? true,
          monAlta:
            parsed.priority === "todas" ||
            parsed.priority === "alta",
          monMedia:
            parsed.priority === "todas" ||
            parsed.priority === "media",
          monBaja:
            parsed.priority === "todas" ||
            parsed.priority === "baja",
        };
        savePrefs(migrated);
        return migrated;
      }
      return { ...DEFAULT_PREFS, ...parsed };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PREFS;
}

function savePrefs(p: NotifPrefs) {
  localStorage.setItem("pc-notif-prefs", JSON.stringify(p));
}

function getCurrentRoleId(): string {
  return (
    localStorage.getItem("pc-current-role") || "coordinador"
  );
}

/* ─── Shared UI primitives ─── */
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[12px] overflow-hidden ${className}`}
      style={{
        background: IOS.cardBg,
        boxShadow:
          "0 0 0 0.33px rgba(0,0,0,0.04), 0 0.5px 2px rgba(0,0,0,0.03)",
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p
      className="text-[13px] mb-[6px] ml-4"
      style={{ fontWeight: 400, color: IOS.sectionHeader }}
    >
      {children}
    </p>
  );
}

function SectionFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p
      className="text-[13px] mt-[6px] mx-4"
      style={{
        fontWeight: 400,
        color: IOS.sectionHeader,
        lineHeight: "18px",
      }}
    >
      {children}
    </p>
  );
}

function Separator({ inset = 16 }: { inset?: number }) {
  return (
    <div
      style={{
        height: 0.33,
        marginLeft: inset,
        background: IOS.separator,
      }}
    />
  );
}

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative shrink-0 transition-colors duration-300 rounded-full"
      style={{
        width: 51,
        height: 31,
        background: on
          ? `linear-gradient(135deg, ${GUINDO}, ${GUINDO_DARK})`
          : "rgba(120,120,128,0.16)",
      }}
    >
      <div
        className="absolute top-[2px] rounded-full bg-white transition-transform duration-300"
        style={{
          width: 27,
          height: 27,
          boxShadow:
            "0 3px 8px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.06)",
          transform: on
            ? "translateX(22px)"
            : "translateX(2px)",
        }}
      />
    </button>
  );
}

/* ─── Photo Action Sheet ─── */
function PhotoActionSheet({
  open,
  onClose,
  onCamera,
  onGallery,
}: {
  open: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />
      <div
        className="relative w-full max-w-[400px] mx-2 mb-2 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation:
            "slideUpSheet 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div
          className="rounded-[14px] overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(50px) saturate(1.8)",
            WebkitBackdropFilter: "blur(50px) saturate(1.8)",
          }}
        >
          <div className="text-center py-3 px-4">
            <p
              className="text-[13px]"
              style={{
                fontWeight: 400,
                color: IOS.sectionHeader,
              }}
            >
              Foto de perfil
            </p>
          </div>
          <Separator inset={0} />
          <button
            onClick={() => {
              onCamera();
              onClose();
            }}
            className="w-full py-[17px] flex items-center justify-center gap-2 active:bg-black/[0.04] transition-colors"
            style={{ minHeight: 56 }}
          >
            <Camera
              className="w-[19px] h-[19px]"
              style={{ color: IOS.label }}
              strokeWidth={1.8}
            />
            <span
              className="text-[17px]"
              style={{ color: IOS.label, fontWeight: 400 }}
            >
              Tomar Foto
            </span>
          </button>
          <Separator inset={0} />
          <button
            onClick={() => {
              onGallery();
              onClose();
            }}
            className="w-full py-[17px] flex items-center justify-center gap-2 active:bg-black/[0.04] transition-colors"
            style={{ minHeight: 56 }}
          >
            <ImageIcon
              className="w-[19px] h-[19px]"
              style={{ color: IOS.label }}
              strokeWidth={1.8}
            />
            <span
              className="text-[17px]"
              style={{ color: IOS.label, fontWeight: 400 }}
            >
              Elegir de Galería
            </span>
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full py-[17px] rounded-[14px] active:bg-black/[0.04] transition-colors"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(50px) saturate(1.8)",
            WebkitBackdropFilter: "blur(50px) saturate(1.8)",
            minHeight: 56,
          }}
        >
          <span
            className="text-[17px]"
            style={{ color: IOS.label, fontWeight: 600 }}
          >
            Cancelar
          </span>
        </button>
      </div>
      <style>{`@keyframes slideUpSheet { from { transform: translateY(100%); opacity: 0.5; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CATEGORY DETAIL — Fullscreen sub-screen for a category
   ═══════════════════════════════════════════════════════════════ */
function CategoryDetail({
  title,
  icon: Icon,
  iconBg,
  enabled,
  onToggle,
  priorities,
  onPriorityToggle,
  onBack,
}: {
  title: string;
  icon: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
    style?: React.CSSProperties;
  }>;
  iconBg: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  priorities: { key: string; label: string; active: boolean }[];
  onPriorityToggle: (key: string) => void;
  onBack: () => void;
}) {
  const activePriCount = priorities.filter(
    (p) => p.active,
  ).length;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{
        type: "spring",
        damping: 28,
        stiffness: 320,
      }}
      className="absolute inset-0 z-30 flex flex-col"
      style={{ background: IOS.pageBg }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-1 px-1 shrink-0"
        style={{
          paddingTop:
            "calc(env(safe-area-inset-top, 0px) + 8px)",
          minHeight: 52,
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-0.5 px-2 py-2 active:opacity-50 transition-opacity"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <ChevronLeft
            className="w-[22px] h-[22px]"
            style={{ color: GUINDO }}
            strokeWidth={2}
          />
          <span
            className="text-[17px]"
            style={{ color: GUINDO, fontWeight: 400 }}
          >
            Ajustes
          </span>
        </button>
        <div className="flex-1 flex justify-center pr-[72px]">
          <span
            className="text-[17px]"
            style={{ color: IOS.label, fontWeight: 600 }}
          >
            {title}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-12">
        {/* Hero */}
        <div className="flex flex-col items-center pt-6 pb-5">
          <div
            className="w-[60px] h-[60px] rounded-[15px] flex items-center justify-center mb-3"
            style={{ background: iconBg }}
          >
            <Icon
              className="w-[30px] h-[30px] text-white"
              strokeWidth={1.8}
            />
          </div>
          <h3
            className="text-[20px] mb-1"
            style={{ color: IOS.label, fontWeight: 600 }}
          >
            {title}
          </h3>
          <p
            className="text-[13px]"
            style={{ color: IOS.secondaryText }}
          >
            {enabled
              ? `${activePriCount} ${activePriCount === 1 ? "prioridad activa" : "prioridades activas"}`
              : "Desactivadas"}
          </p>
        </div>

        {/* Allow toggle */}
        <div className="px-4 mb-6">
          <SectionHeader>General</SectionHeader>
          <Card>
            <div
              className="flex items-center justify-between px-4"
              style={{ minHeight: 44 }}
            >
              <span
                className="text-[17px]"
                style={{ color: IOS.label, fontWeight: 400 }}
              >
                Permitir Notificaciones
              </span>
              <Toggle on={enabled} onChange={onToggle} />
            </div>
          </Card>
          <SectionFooter>
            Recibe alertas en tiempo real para esta categoría.
          </SectionFooter>
        </div>

        {/* Priority filters */}
        {enabled && (
          <div className="px-4 mb-6">
            <SectionHeader>Prioridades</SectionHeader>
            <Card>
              {priorities.map((pri, i) => (
                <div key={pri.key}>
                  {i > 0 && <Separator inset={16} />}
                  <button
                    onClick={() => onPriorityToggle(pri.key)}
                    className="w-full flex items-center px-4 active:bg-black/[0.03] transition-colors"
                    style={{ minHeight: 44 }}
                  >
                    <div
                      className="w-[8px] h-[8px] rounded-full mr-3 shrink-0 transition-colors"
                      style={{
                        background: pri.active
                          ? pri.label === "Alta"
                            ? "#FF3B30"
                            : pri.label === "Media"
                              ? "#FF9500"
                              : "#34C759"
                          : "rgba(0,0,0,0.08)",
                      }}
                    />
                    <span
                      className="flex-1 text-left text-[17px] transition-colors"
                      style={{
                        color: pri.active
                          ? IOS.label
                          : "#C7C7CC",
                        fontWeight: 400,
                      }}
                    >
                      Prioridad {pri.label}
                    </span>
                    {pri.active && (
                      <Check
                        className="w-[18px] h-[18px] shrink-0"
                        style={{ color: GUINDO }}
                        strokeWidth={2.2}
                      />
                    )}
                  </button>
                </div>
              ))}
            </Card>
            <SectionFooter>
              Selecciona al menos una prioridad. Las alertas se
              filtrarán según tu selección.
            </SectionFooter>
          </div>
        )}

        {/* Info card */}
        {enabled && (
          <div className="px-4 mb-6">
            <SectionHeader>Información</SectionHeader>
            <Card>
              <div className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-[29px] h-[29px] rounded-[7px] flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: iconBg }}
                  >
                    <Zap
                      className="w-[14px] h-[14px] text-white"
                      strokeWidth={2}
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-[15px] mb-0.5"
                      style={{
                        color: IOS.label,
                        fontWeight: 500,
                      }}
                    >
                      Alertas en tiempo real
                    </p>
                    <p
                      className="text-[13px] leading-[18px]"
                      style={{ color: IOS.secondaryText }}
                    >
                      {title === "Reportes 911"
                        ? "Recibe notificaciones push inmediatas cuando se registren nuevos reportes de emergencia en tu zona."
                        : "Recibe alertas de monitoreo preventivo incluyendo condiciones climáticas, niveles de ríos y riesgos detectados."}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS VIEW — Main export
   ═══════════════════════════════════════════════════════════════ */
export function SettingsView() {
  const navigate = useNavigate();
  const roleId = getCurrentRoleId();
  const meta = ROLE_META[roleId] || ROLE_META.coordinador;

  /* ─── Avatar state ─── */
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    null,
  );
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  /* ─── Name state ─── */
  const [displayName, setDisplayName] = useState<string | null>(
    null,
  );

  /* ─── Notification prefs + sub-screens ─── */
  const [prefs, setPrefs] =
    useState<NotifPrefs>(loadNotifPrefs);
  const [detailView, setDetailView] = useState<
    "r911" | "mon" | null
  >(null);

  const updatePrefs = useCallback(
    (partial: Partial<NotifPrefs>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...partial };
        savePrefs(next);
        return next;
      });
    },
    [],
  );

  /* ─── Priority counts ─── */
  const r911ActivePri = [
    prefs.r911Alta,
    prefs.r911Media,
    prefs.r911Baja,
  ].filter(Boolean).length;
  const monActivePri = [
    prefs.monAlta,
    prefs.monMedia,
    prefs.monBaja,
  ].filter(Boolean).length;

  /* ─── Load avatar ─── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/settings/avatar/${roleId}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.url) setAvatarUrl(data.url);
      } catch (err) {
        console.log("Error loading avatar:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roleId]);

  /* ─── Load display name ─── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/settings/name/${roleId}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.name) setDisplayName(data.name);
      } catch (err) {
        console.log("Error loading display name:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roleId]);

  /* ─── Upload avatar ─── */
  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setAvatarLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(
          `${API_BASE}/settings/avatar/${roleId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: formData,
          },
        );
        if (!res.ok) {
          console.log(
            "Avatar upload error:",
            await res.json().catch(() => ({})),
          );
          return;
        }
        const data = await res.json();
        if (data.url) setAvatarUrl(data.url);
      } catch (err) {
        console.log("Error uploading avatar:", err);
      } finally {
        setAvatarLoading(false);
        if (fileInputRef.current)
          fileInputRef.current.value = "";
        if (cameraInputRef.current)
          cameraInputRef.current.value = "";
      }
    },
    [roleId],
  );

  const handleLogout = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* ─── Main settings scroll ─── */}
      <div className="h-full pb-32 overflow-y-auto">
        {/* ─── Profile Hero ─── */}
        <div className="flex flex-col items-center pt-6 pb-4 px-4">
          <button
            onClick={() => setShowPhotoSheet(true)}
            className="relative mb-4 active:scale-[0.97] transition-transform"
          >
            <div
              className="w-[88px] h-[88px] rounded-full overflow-hidden flex items-center justify-center"
              style={{
                background: avatarUrl
                  ? "transparent"
                  : `linear-gradient(145deg, ${GUINDO}, ${GUINDO_DARK})`,
                boxShadow:
                  "0 0 0 2.5px rgba(255,255,255,0.9), 0 0 0 3.5px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.08)",
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User
                  className="w-9 h-9 text-white/80"
                  strokeWidth={1.5}
                />
              )}
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-[28px] h-[28px] rounded-full flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.92)",
                boxShadow:
                  "0 1px 4px rgba(0,0,0,0.12), 0 0 0 0.33px rgba(0,0,0,0.06)",
              }}
            >
              {avatarLoading ? (
                <Loader2
                  className="w-[14px] h-[14px] animate-spin"
                  style={{ color: IOS.secondaryText }}
                  strokeWidth={2}
                />
              ) : (
                <Camera
                  className="w-[14px] h-[14px]"
                  style={{ color: IOS.secondaryText }}
                  strokeWidth={2}
                />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </button>

          <div className="text-center mb-0.5">
            <h2
              className="text-[20px]"
              style={{
                color: IOS.label,
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {displayName || meta.label}
            </h2>
            <p
              className="text-[15px] mt-1"
              style={{ color: IOS.secondaryText }}
            >
              {meta.label} · {meta.subtitle}
            </p>
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${BEIGE}25, ${DORADO}12)`,
              border: `0.5px solid ${DORADO}30`,
            }}
          >
            <Shield
              className="w-3 h-3"
              style={{ color: DORADO }}
              strokeWidth={2}
            />
            <span
              className="text-[11px]"
              style={{ color: DORADO, fontWeight: 600 }}
            >
              Protección Civil Tamaulipas
            </span>
          </div>
        </div>

        {/* ─── Información Personal ─── */}
        <div className="px-4 mb-6">
          <SectionHeader>Información Personal</SectionHeader>
          <Card>
            <div
              className="flex items-center justify-between px-4"
              style={{ minHeight: 44 }}
            >
              <span
                className="text-[17px]"
                style={{ color: IOS.label, fontWeight: 400 }}
              >
                CURP
              </span>
              <p
                className="text-[17px] text-right"
                style={{
                  color: IOS.secondaryText,
                  fontWeight: 400,
                  fontFamily: "monospace",
                  letterSpacing: "0.02em",
                }}
              >
                {meta.curp}
              </p>
            </div>
            <Separator inset={16} />
            <div
              className="flex items-center justify-between gap-4 px-4"
              style={{ minHeight: 44 }}
            >
              <span
                className="text-[17px] shrink-0"
                style={{ color: IOS.label, fontWeight: 400 }}
              >
                Correo
              </span>
              <p
                className="text-[17px] truncate text-right"
                style={{
                  color: IOS.secondaryText,
                  fontWeight: 400,
                }}
              >
                {meta.email}
              </p>
            </div>
          </Card>
        </div>

        {/* ─── Categorías — navigable rows ─── */}
        <div className="px-4 mb-6">
          <SectionHeader>
            Notificaciones por Categoría
          </SectionHeader>
          <Card>
            {/* Reportes 911 */}
            <button
              onClick={() => setDetailView("r911")}
              className="w-full flex items-center gap-3 px-4 active:bg-black/[0.03] transition-colors"
              style={{ minHeight: 56 }}
            >
              <div
                className="w-[36px] h-[36px] rounded-[9px] flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${GUINDO}, ${GUINDO_DARK})`,
                }}
              >
                <FileText
                  className="w-[18px] h-[18px] text-white"
                  strokeWidth={1.8}
                />
              </div>
              <div className="flex-1 text-left">
                <p
                  className="text-[17px]"
                  style={{ color: IOS.label, fontWeight: 400 }}
                >
                  Reportes 911
                </p>
                <p
                  className="text-[13px]"
                  style={{ color: IOS.secondaryText }}
                >
                  {prefs.reportes911
                    ? `Banners, Sonidos · ${r911ActivePri} prioridad${r911ActivePri !== 1 ? "es" : ""}`
                    : "Desactivadas"}
                </p>
              </div>
              <ChevronRight
                className="w-[16px] h-[16px] shrink-0"
                style={{ color: "#C7C7CC" }}
                strokeWidth={2.5}
              />
            </button>

            <Separator inset={60} />

            {/* Monitoreo */}
            <button
              onClick={() => setDetailView("mon")}
              className="w-full flex items-center gap-3 px-4 active:bg-black/[0.03] transition-colors"
              style={{ minHeight: 56 }}
            >
              <div
                className="w-[36px] h-[36px] rounded-[9px] flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${DORADO}, #D4AB6E)`,
                }}
              >
                <Activity
                  className="w-[18px] h-[18px] text-white"
                  strokeWidth={1.8}
                />
              </div>
              <div className="flex-1 text-left">
                <p
                  className="text-[17px]"
                  style={{ color: IOS.label, fontWeight: 400 }}
                >
                  Monitoreo
                </p>
                <p
                  className="text-[13px]"
                  style={{ color: IOS.secondaryText }}
                >
                  {prefs.monitoreo
                    ? `Banners, Sonidos · ${monActivePri} prioridad${monActivePri !== 1 ? "es" : ""}`
                    : "Desactivadas"}
                </p>
              </div>
              <ChevronRight
                className="w-[16px] h-[16px] shrink-0"
                style={{ color: "#C7C7CC" }}
                strokeWidth={2.5}
              />
            </button>
          </Card>
          <SectionFooter>
            Configura alertas, sonidos y prioridades para cada
            tipo de notificación.
          </SectionFooter>
        </div>

        {/* ─── Sesión ─── */}
        <div className="px-4 mb-6">
          <Card>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 active:bg-black/[0.03] transition-colors"
              style={{ minHeight: 44 }}
            >
              <LogOut
                className="w-[18px] h-[18px]"
                style={{ color: GUINDO }}
                strokeWidth={1.8}
              />
              <span
                className="text-[17px]"
                style={{ color: GUINDO, fontWeight: 400 }}
              >
                Cerrar Sesión
              </span>
            </button>
          </Card>
        </div>

        <p
          className="text-center text-[13px] mt-2 mb-8"
          style={{ color: IOS.sectionHeader }}
        >
          Protección Civil Tamaulipas v1.0.0
        </p>

        <PhotoActionSheet
          open={showPhotoSheet}
          onClose={() => setShowPhotoSheet(false)}
          onCamera={() => cameraInputRef.current?.click()}
          onGallery={() => fileInputRef.current?.click()}
        />
      </div>

      {/* ─── Category Detail Sub-Screens ─── */}
      <AnimatePresence>
        {detailView === "r911" && (
          <CategoryDetail
            key="r911"
            title="Reportes 911"
            icon={FileText}
            iconBg={`linear-gradient(135deg, ${GUINDO}, ${GUINDO_DARK})`}
            enabled={prefs.reportes911}
            onToggle={(v) => updatePrefs({ reportes911: v })}
            priorities={[
              {
                key: "r911Alta",
                label: "Alta",
                active: prefs.r911Alta,
              },
              {
                key: "r911Media",
                label: "Media",
                active: prefs.r911Media,
              },
              {
                key: "r911Baja",
                label: "Baja",
                active: prefs.r911Baja,
              },
            ]}
            onPriorityToggle={(key) => {
              const k = key as keyof NotifPrefs;
              if (prefs[k] && r911ActivePri <= 1) return;
              updatePrefs({ [k]: !prefs[k] });
            }}
            onBack={() => setDetailView(null)}
          />
        )}

        {detailView === "mon" && (
          <CategoryDetail
            key="mon"
            title="Monitoreo"
            icon={Activity}
            iconBg={`linear-gradient(135deg, ${DORADO}, #D4AB6E)`}
            enabled={prefs.monitoreo}
            onToggle={(v) => updatePrefs({ monitoreo: v })}
            priorities={[
              {
                key: "monAlta",
                label: "Alta",
                active: prefs.monAlta,
              },
              {
                key: "monMedia",
                label: "Media",
                active: prefs.monMedia,
              },
              {
                key: "monBaja",
                label: "Baja",
                active: prefs.monBaja,
              },
            ]}
            onPriorityToggle={(key) => {
              const k = key as keyof NotifPrefs;
              if (prefs[k] && monActivePri <= 1) return;
              updatePrefs({ [k]: !prefs[k] });
            }}
            onBack={() => setDetailView(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default SettingsView;