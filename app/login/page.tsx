"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const bgRef = useRef<HTMLDivElement>(null);

  // slow "breathing" zoom on the photo — subtle life, no scroll needed
  useEffect(() => {
    let frame = 0;
    let t = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      t += 0.016;
      const bg = bgRef.current;
      if (bg) {
        const s = 1.06 + Math.sin(t * 0.15) * 0.02;
        bg.style.transform = `scale(${s})`;
      }
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  const login = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      router.push("/dashboard");
    } catch {
      setError("Could not reach the server");
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") login();
  };

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden grid lg:grid-cols-2">
      {/* ---------- LEFT: cityscape photo panel ---------- */}
      <div className="relative hidden lg:block overflow-hidden">
        <div
          ref={bgRef}
          className="absolute inset-0 bg-cover bg-center will-change-transform"
          style={{
            backgroundImage: "url(/images/city.jpg)",
            backgroundColor: "#0b1220",
          }}
        />
        {/* readability + theme overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-slate-950/50 to-slate-950" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative z-10 h-full flex flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-3 w-fit group">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-lg shadow-[0_0_20px_rgba(34,211,238,0.25)]">
              🏙
            </div>
            <span className="font-bold tracking-tight group-hover:text-cyan-300 transition-colors">
              Smart City <span className="text-cyan-400">Platform</span>
            </span>
          </Link>

          <div>
            <span className="text-xs tracking-[0.35em] uppercase text-cyan-300">
              Live operations
            </span>
            <h1 className="mt-3 text-4xl xl:text-5xl font-bold leading-tight max-w-md">
              Your city is running{" "}
              <span className="text-cyan-400">right now</span>
            </h1>
            <p className="mt-4 text-slate-300 max-w-sm">
              Water, waste, and electricity — simulated live on the server,
              waiting for its manager.
            </p>

            {/* mini live-style stats strip */}
            <div className="mt-8 flex gap-3">
              {[
                { icon: "💧", label: "Water", color: "#22d3ee" },
                { icon: "🗑", label: "Waste", color: "#4ade80" },
                { icon: "⚡", label: "Power", color: "#f59e0b" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl backdrop-blur-md bg-slate-950/50 border"
                  style={{ borderColor: `${s.color}55` }}
                >
                  <span>{s.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: s.color }}>
                    {s.label}
                  </span>
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
                  />
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Smart City Service Simulation Platform
          </p>
        </div>
      </div>

      {/* ---------- RIGHT: sign-in form ---------- */}
      <div className="relative flex items-center justify-center p-6">
        {/* faint grid + glow on the form side too */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-64 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 100% at 50% -20%, rgba(34,211,238,0.12), transparent)",
          }}
        />

        <div className="relative z-10 w-full max-w-sm">
          {/* mobile-only brand (left panel hidden on small screens) */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(34,211,238,0.25)] mb-3">
              🏙
            </div>
            <span className="font-bold">
              Smart City <span className="text-cyan-400">Platform</span>
            </span>
          </div>

          <span className="text-[11px] tracking-[0.3em] uppercase text-cyan-400 font-semibold">
            City manager access
          </span>
          <h2 className="mt-2 text-3xl font-bold">Welcome back</h2>
          <p className="text-slate-400 text-sm mt-1 mb-8">
            Sign in to your live dashboard
          </p>

          <label className="block text-[11px] tracking-[0.2em] uppercase text-slate-500 mb-2">
            Email
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKey}
            placeholder="you@example.com"
            className="w-full mb-5 bg-slate-950/60 backdrop-blur-md border border-slate-700 focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] rounded-xl px-4 py-3 outline-none transition-all placeholder:text-slate-600"
          />

          <label className="block text-[11px] tracking-[0.2em] uppercase text-slate-500 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKey}
            placeholder="••••••••"
            className="w-full mb-5 bg-slate-950/60 backdrop-blur-md border border-slate-700 focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] rounded-xl px-4 py-3 outline-none transition-all placeholder:text-slate-600"
          />

          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/40 text-red-300 text-sm px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold py-3.5 rounded-xl transition-all hover:shadow-[0_0_35px_rgba(34,211,238,0.5)] active:scale-[0.98]"
          >
            {loading ? "Signing in…" : "Sign in →"}
          </button>

          <p className="text-center text-sm text-slate-500 mt-7">
            <Link href="/" className="hover:text-cyan-300 transition-colors">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}