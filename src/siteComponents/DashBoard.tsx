import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  FileText,
  PieChart,
  User,
  Menu,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { apptInfoType } from "@/types/globalTypes";
import useSocket from "@/hooks/useSocket";
import proSocketListeners from "@/utils/proSocketListeners";
import moment from "moment";
import { useAppDispatch } from "@/hooks/reduxHooks";

// ── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: number;
  name: string;
}

// ── Data ─────────────────────────────────────────────────────────────────────

const clients: Client[] = [
  { id: 1, name: "Jim Jones" },
  { id: 2, name: "Akash Patel" },
  { id: 3, name: "Mike Williams" },
];

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Calendar", icon: Calendar },
  { label: "Settings", icon: Settings },
  { label: "Files", icon: FileText },
  { label: "Reports", icon: PieChart },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-amber-500",
  "bg-blue-400",
  "bg-emerald-500",
  "bg-rose-400",
  "bg-violet-400",
];

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full ${color} text-white font-semibold shrink-0 ${sizeClass}`}
    >
      {initials}
    </span>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-indigo-600 z-30 flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Profile */}
        <div className="flex flex-col items-center pt-10 pb-8 px-4 border-b border-indigo-500">
          <div className="w-20 h-20 rounded-full border-2 border-white/60 flex items-center justify-center bg-indigo-500 mb-1">
            <User className="w-10 h-10 text-white/80" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                ${
                  active
                    ? "bg-indigo-800 text-white"
                    : "text-indigo-100 hover:bg-indigo-500/60 hover:text-white"
                }
              `}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}

// ── Cards ─────────────────────────────────────────────────────────────────────

function ClientsCard() {
  return (
    <div className="bg-amber-500 rounded-2xl p-6 shadow-sm h-full">
      <h2 className="text-white text-lg font-bold mb-5 tracking-wide">
        Clients
      </h2>
      <ul className="space-y-3">
        {clients.map((c) => (
          <li key={c.id} className="flex items-center gap-3">
            <Avatar name={c.name} />
            <span className="text-white text-sm font-medium">{c.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AppointmentsCard({ apptInfo }: { apptInfo: apptInfoType[] }) {
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const handleJoin = (appt: apptInfoType) => {
    navigate(
      `/join-video-pro?token=${token}&uuid=${appt.uuid}&client=${appt.clientName}`,
    );
  };

  return (
    <div className="bg-blue-500 rounded-2xl p-6 shadow-sm h-full">
      <h2 className="text-white text-lg font-bold mb-5 tracking-wide">
        Coming Appointments
      </h2>
      <ul className="space-y-3">
        {apptInfo.map((appt: apptInfoType) => (
          <li
            key={appt.uuid}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={appt.clientName} size="sm" />
              <span className="text-white text-sm font-medium truncate">
                {appt.clientName}{" "}
                <span className="font-normal opacity-80">
                  {moment(appt.apptDate).calendar()}
                </span>
              </span>
            </div>
            {appt.waiting && (
              <button
                onClick={() => handleJoin(appt)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  joiningId === appt.uuid
                    ? "bg-green-500 text-white scale-95"
                    : "bg-red-500 hover:bg-red-600 text-white hover:scale-105 active:scale-95"
                }`}
              >
                {joiningId === appt.uuid ? "Joining…" : "Join"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [apptInfo, setApptData] = useState<apptInfoType[]>([]);
  const { socketRef, isReady } = useSocket("https://localhost:3001", token);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (socketRef && socketRef.current)
      proSocketListeners(socketRef.current, setApptData, dispatch);
  }, [isReady]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-indigo-600 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-white font-semibold text-base">Dashboard</span>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 hidden lg:block">
            Dashboard
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ClientsCard />
            <AppointmentsCard apptInfo={apptInfo} />
          </div>
        </main>
      </div>
    </div>
  );
}
