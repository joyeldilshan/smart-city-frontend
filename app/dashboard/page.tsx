"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { API_URL } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* ============================================================
   TYPES & CONSTANTS
   ============================================================ */

type CityState = {
  tick: number;
  population: number;
  budget: number;
  happiness: number;
  powerPlants: number;
  reservoirs: number;
  wasteTrucks: number;
  powerShortage: boolean;
  waterShortage: boolean;
  wasteOverflow: boolean;
  newEvent: string | null;
};

type HistoryPoint = { tick: number; happiness: number };

const CAN_BUILD = ["SUPER_ADMIN", "CITY_ADMIN"];

// one accent per service — same palette as the landing page
const ACCENT = {
  water: "#22d3ee",
  waste: "#4ade80",
  power: "#f59e0b",
  indigo: "#818cf8",
};

/* ============================================================
   DASHBOARD
   ============================================================ */

export default function Dashboard() {
  const router = useRouter();
  const [city, setCity] = useState<CityState | null>(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [eventBanner, setEventBanner] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    if (!token) {
      router.push("/login");
      return;
    }
    setRole(savedRole);

    const s = io(API_URL, { auth: { token } });
    setSocket(s);
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("action:denied", (d: { reason: string }) => {
      setEventBanner("🚫 " + d.reason);
      setTimeout(() => setEventBanner(null), 3000);
    });
    s.on("city:update", (data: CityState) => {
      setCity(data);
      setHistory((prev) =>
        [...prev, { tick: data.tick, happiness: +data.happiness.toFixed(1) }].slice(-30)
      );
      if (data.newEvent) {
        setEventBanner(data.newEvent);
        setTimeout(() => setEventBanner(null), 4000);
      }
    });
    return () => {
      s.disconnect();
    };
  }, [router]);

  const send = (msg: string) => socket?.emit(msg);
  const canBuild = role ? CAN_BUILD.includes(role) : false;
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 relative">
      {/* background: faint cyan tech grid + top glow, same as landing */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-80"
        style={{
          background:
            "radial-gradient(ellipse 70% 100% at 50% -20%, rgba(34,211,238,0.14), transparent)",
        }}
      />

      {/* ---------- HEADER ---------- */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-lg shadow-[0_0_20px_rgba(34,211,238,0.25)]">
              🏙
            </div>
            <div>
              <div className="font-bold tracking-tight leading-none">
                Smart City{" "}
                <span className="text-cyan-400">Control</span>
              </div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mt-0.5">
                Live operations
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
            <span
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg border"
              style={{
                color: ACCENT.indigo,
                borderColor: `${ACCENT.indigo}55`,
                background: `${ACCENT.indigo}14`,
              }}
            >
              {role}
            </span>
            <span
              className={`flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-lg border ${
                connected
                  ? "text-green-400 border-green-500/40 bg-green-500/10"
                  : "text-red-400 border-red-500/40 bg-red-500/10"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connected ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}
                style={{
                  boxShadow: connected ? "0 0 8px #4ade80" : "0 0 8px #f87171",
                }}
              />
              {connected ? "LIVE" : "OFFLINE"}
            </span>
            <button
              onClick={logout}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-100 hover:border-slate-500 transition-colors"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* ---------- EVENT BANNER ---------- */}
        {eventBanner && (
          <div className="mb-6 px-5 py-3.5 rounded-2xl text-sm font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.12)] animate-pulse">
            📣 {eventBanner}
          </div>
        )}

        {!canBuild && (
          <div className="mb-6 px-4 py-2.5 rounded-xl text-xs text-slate-400 bg-slate-900/60 border border-slate-800">
            👁 Read-only mode ({role}) — only admins can build
          </div>
        )}

        {city ? (
          <div className="space-y-6">
            {/* ---------- ROW 1: gauge + KPIs ---------- */}
            <div className="grid md:grid-cols-4 gap-4">
              <HappinessGauge value={city.happiness} />
              <div className="md:col-span-3 grid sm:grid-cols-3 gap-4">
                <Kpi
                  label="City Tick"
                  value={city.tick.toLocaleString()}
                  hint="simulation cycles"
                  accent={ACCENT.indigo}
                />
                <Kpi
                  label="Population"
                  value={Math.round(city.population).toLocaleString()}
                  hint="citizens"
                  accent={ACCENT.water}
                />
                <Kpi
                  label="Budget"
                  value={"$" + Math.round(city.budget).toLocaleString()}
                  hint="city treasury"
                  accent={ACCENT.waste}
                />
              </div>
            </div>

            {/* ---------- ROW 2: services ---------- */}
            <div>
              <SectionLabel accent={ACCENT.water}>City services</SectionLabel>
              <div className="grid md:grid-cols-3 gap-4 mt-3">
                <ServicePanel
                  icon="💧"
                  name="Smart Water"
                  unit="reservoirs"
                  count={city.reservoirs}
                  shortage={city.waterShortage}
                  onBuild={() => send("build:reservoir")}
                  cost="$4,000"
                  canBuild={canBuild}
                  accent={ACCENT.water}
                />
                <ServicePanel
                  icon="🗑"
                  name="Smart Waste"
                  unit="trucks"
                  count={city.wasteTrucks}
                  shortage={city.wasteOverflow}
                  onBuild={() => send("build:truck")}
                  cost="$3,000"
                  canBuild={canBuild}
                  accent={ACCENT.waste}
                />
                <ServicePanel
                  icon="⚡"
                  name="Smart Electricity"
                  unit="power plants"
                  count={city.powerPlants}
                  shortage={city.powerShortage}
                  onBuild={() => send("build:plant")}
                  cost="$5,000"
                  canBuild={canBuild}
                  accent={ACCENT.power}
                />
              </div>
            </div>

            {/* ---------- ROW 3: chart ---------- */}
            <div>
              <SectionLabel accent={ACCENT.waste}>Happiness index</SectionLabel>
              <div className="mt-3 rounded-2xl p-6 bg-slate-950/60 backdrop-blur-md border border-slate-800 shadow-[0_0_40px_rgba(74,222,128,0.06)]">
                <div className="flex items-end justify-between mb-5">
                  <p className="text-xs text-slate-500">Last 30 ticks · live</p>
                  <span
                    className="text-3xl font-black"
                    style={{
                      color: gaugeColor(city.happiness),
                      textShadow: `0 0 24px ${gaugeColor(city.happiness)}55`,
                    }}
                  >
                    {city.happiness.toFixed(1)}
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="tick" stroke="#1e293b" fontSize={10} tick={{ fill: "#475569" }} />
                    <YAxis domain={[0, 100]} stroke="#1e293b" fontSize={10} tick={{ fill: "#475569" }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(2,8,23,0.95)",
                        border: "1px solid rgba(34,211,238,0.3)",
                        borderRadius: 12,
                      }}
                      labelStyle={{ color: "#64748b", fontSize: 11 }}
                      itemStyle={{ color: "#22d3ee" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="happiness"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      fill="url(#hg)"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-9 h-9 rounded-full border-2 border-cyan-500/25 border-t-cyan-400 animate-spin" />
            <p className="text-[11px] tracking-[0.3em] uppercase text-slate-600">
              Connecting to city…
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

/* ============================================================
   PIECES
   ============================================================ */

function SectionLabel({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-[11px] tracking-[0.3em] uppercase font-semibold"
        style={{ color: accent }}
      >
        {children}
      </span>
      <span
        className="h-px flex-1"
        style={{ background: `linear-gradient(90deg, ${accent}44, transparent)` }}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 bg-slate-950/60 backdrop-blur-md border transition-transform hover:-translate-y-0.5"
      style={{ borderColor: `${accent}44`, boxShadow: `0 0 30px ${accent}12` }}
    >
      <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500">{label}</div>
      <div
        className="mt-2 text-3xl font-black"
        style={{ color: accent, textShadow: `0 0 24px ${accent}44` }}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] text-slate-600">{hint}</div>
    </div>
  );
}

function gaugeColor(v: number) {
  return v > 70 ? "#4ade80" : v > 40 ? "#f59e0b" : "#f87171";
}

/* Radial gauge for happiness */
function HappinessGauge({ value }: { value: number }) {
  const color = gaugeColor(value);
  const R = 52;
  const C = 2 * Math.PI * R;
  const filled = C * (value / 100);

  return (
    <div
      className="rounded-2xl p-5 bg-slate-950/60 backdrop-blur-md border flex flex-col items-center justify-center"
      style={{ borderColor: `${color}44`, boxShadow: `0 0 30px ${color}12` }}
    >
      <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-3">
        Happiness
      </div>
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
          />
          <circle
            cx="64"
            cy="64"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${C - filled}`}
            style={{
              filter: `drop-shadow(0 0 8px ${color})`,
              transition: "stroke-dasharray 0.8s ease, stroke 0.4s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black" style={{ color }}>
            {value.toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-500">/ 100</span>
        </div>
      </div>
    </div>
  );
}

function ServicePanel({
  icon,
  name,
  unit,
  count,
  shortage,
  onBuild,
  cost,
  canBuild,
  accent,
}: {
  icon: string;
  name: string;
  unit: string;
  count: number;
  shortage: boolean;
  onBuild: () => void;
  cost: string;
  canBuild: boolean;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 bg-slate-950/60 backdrop-blur-md border transition-transform hover:-translate-y-0.5"
      style={{
        borderColor: shortage ? "rgba(248,113,113,0.55)" : `${accent}44`,
        boxShadow: shortage
          ? "0 0 34px rgba(248,113,113,0.14)"
          : `0 0 30px ${accent}12`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg border"
            style={{ borderColor: `${accent}55`, background: `${accent}14` }}
          >
            {icon}
          </div>
          <div>
            <div className="text-sm font-bold leading-none">{name}</div>
            <div className="text-[10px] text-slate-500 mt-1">{unit}</div>
          </div>
        </div>
        <span
          className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
            shortage
              ? "text-red-400 border-red-500/40 bg-red-500/10"
              : "text-green-400 border-green-500/30 bg-green-500/10"
          }`}
        >
          {shortage ? "⚠ SHORTAGE" : "✓ OK"}
        </span>
      </div>

      <div
        className="mt-4 text-5xl font-black"
        style={{ color: accent, textShadow: `0 0 28px ${accent}44` }}
      >
        {count}
      </div>

      {/* mini sparkline, landing-page style */}
      <div className="mt-4 flex items-end gap-[3px] h-6">
        {[40, 65, 50, 80, 60, 90, 75].map((h, j) => (
          <div
            key={j}
            className="flex-1 rounded-sm"
            style={{ height: `${h}%`, background: `${accent}45` }}
          />
        ))}
      </div>

      {canBuild && (
        <button
          onClick={onBuild}
          className="mt-4 w-full py-2.5 rounded-xl text-[11px] font-black tracking-[0.15em] uppercase border transition-all active:scale-95"
          style={{
            color: accent,
            borderColor: `${accent}55`,
            background: `${accent}12`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${accent}26`;
            e.currentTarget.style.boxShadow = `0 0 22px ${accent}30`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${accent}12`;
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Build · {cost}
        </button>
      )}
    </div>
  );
}