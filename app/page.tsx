"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import Link from "next/link";

/* ============================================================
   HOOKS & SMALL UTILITIES
   ============================================================ */

function useScrollTransform(
  ref: RefObject<HTMLDivElement | null>,
  fn: (y: number, vh: number) => { transform?: string; opacity?: number }
) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const el = ref.current;
      if (!el) return;
      const out = fnRef.current(window.scrollY, window.innerHeight);
      if (out.transform !== undefined) el.style.transform = out.transform;
      if (out.opacity !== undefined) el.style.opacity = String(out.opacity);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref]);
}

function useTilt(maxDeg = 8) {
  const onMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const rx = ((e.clientY - r.top - r.height / 2) / r.height) * -maxDeg;
    const ry = ((e.clientX - r.left - r.width / 2) / r.width) * maxDeg;
    el.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
  };
  const onMouseLeave = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform =
      "perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
  };
  return { onMouseMove, onMouseLeave };
}

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transform: visible
          ? "translateY(0) scale(1)"
          : "translateY(36px) scale(0.96)",
        opacity: visible ? 1 : 0,
        transition: `transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms, opacity 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function ParallaxBlob({
  color,
  factor,
  style,
}: {
  color: string;
  factor: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollTransform(ref, (y) => ({
    transform: `translate3d(0, ${y * factor}px, 0)`,
  }));
  return (
    <div
      ref={ref}
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 420,
        height: 420,
        background: color,
        filter: "blur(90px)",
        opacity: 0.16,
        ...style,
      }}
    />
  );
}

/* Counts a number up when it scrolls into view */
function CountUp({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const dur = 1400;
        const tick = (now: number) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(
            (value * eased).toLocaleString(undefined, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })
          );
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, decimals]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

/* ============================================================
   PHOTO HERO — big real cityscape with scroll-driven zoom
   Photo: frontend/public/images/city.jpg
   ============================================================ */

function PhotoHero() {
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const bg = bgRef.current;
      const content = contentRef.current;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const t = Math.min(y / vh, 1);
      if (bg) {
        bg.style.transform = `scale(${1 + t * 0.25}) translateY(${y * 0.25}px)`;
        bg.style.filter = `brightness(${1 - t * 0.5})`;
      }
      if (content) {
        content.style.transform = `translateY(${y * 0.45}px) scale(${1 - t * 0.06})`;
        content.style.opacity = String(1 - t * 1.2);
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section className="relative h-screen overflow-hidden">
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: "url(/images/city.jpg)",
          backgroundColor: "#0b1220",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/30 to-slate-950" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 40%, transparent 30%, rgba(2,6,23,0.6) 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div
        ref={contentRef}
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6"
      >
        <span className="mb-4 text-xs tracking-[0.35em] text-cyan-300 uppercase animate-pulse">
          Real-time city simulation
        </span>
        <h1 className="text-4xl md:text-7xl font-bold max-w-4xl leading-tight drop-shadow-[0_0_35px_rgba(34,211,238,0.35)]">
          Smart City Service{" "}
          <span className="text-cyan-400">Simulation Platform</span>
        </h1>
        <p className="mt-6 text-slate-200 max-w-xl text-lg md:text-xl">
          Manage a living city that runs in real time — water, waste, and
          electricity, all from one live dashboard.
        </p>
        <div className="mt-9 flex gap-4">
          <Link
            href="/login"
            className="bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-semibold px-8 py-3.5 rounded-xl transition-all hover:shadow-[0_0_35px_rgba(34,211,238,0.55)]"
          >
            Launch Dashboard →
          </Link>
          <a
            href="#services"
            className="border border-slate-400/50 hover:border-cyan-400 active:scale-95 px-8 py-3.5 rounded-xl transition-all backdrop-blur-sm"
          >
            Explore services
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-slate-400 text-sm animate-bounce">
        ↓ scroll
      </div>
    </section>
  );
}

/* ============================================================
   ABOUT — what this platform is, in 10 seconds
   ============================================================ */

function AboutSection() {
  return (
    <section className="relative py-24 px-6 bg-slate-950 overflow-hidden">
      <ParallaxBlob color="#22d3ee" factor={0.05} style={{ top: -100, right: -140 }} />
      <div className="relative max-w-5xl mx-auto">
        <Reveal>
          <span className="text-xs tracking-[0.3em] uppercase font-semibold text-cyan-400">
            About the platform
          </span>
        </Reveal>
        <div className="mt-4 grid lg:grid-cols-2 gap-12 items-start">
          {/* left: the explanation */}
          <div>
            <Reveal delay={80}>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                A living city.{" "}
                <span className="text-cyan-400">You keep it alive.</span>
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 text-lg text-slate-300 leading-relaxed">
                A virtual city runs continuously on our servers — citizens are
                born, power is consumed, water is used —{" "}
                <span className="text-slate-100 font-semibold">
                  even when nobody is watching
                </span>
                . As City Manager, you watch it all happen live and make the
                decisions that keep it running: build power plants, add
                reservoirs, expand waste collection.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <p className="mt-4 text-lg text-slate-400 leading-relaxed">
                Heatwaves, droughts, and recessions strike without warning.
                Every choice costs money. Spend wisely, respond fast, and keep
                your citizens happy — or watch your city spiral.
              </p>
            </Reveal>
          </div>

          {/* right: how it works in four beats */}
          <div className="grid gap-4">
            <AboutPoint
              icon="🌐"
              accent="#22d3ee"
              title="Always running"
              text="The simulation lives on the server, 24/7. Close the tab, come back tomorrow — the city kept going without you."
              delay={0}
            />
            <AboutPoint
              icon="📡"
              accent="#4ade80"
              title="Truly live"
              text="Every number streams to your dashboard in real time. No refreshing — the city updates before your eyes every 2 seconds."
              delay={100}
            />
            <AboutPoint
              icon="🏗"
              accent="#f59e0b"
              title="Your decisions matter"
              text="Blackout coming? Build a plant. Drought hit? Add a reservoir. Balance the budget against citizen happiness."
              delay={200}
            />
            <AboutPoint
              icon="🔐"
              accent="#818cf8"
              title="Role-based control"
              text="Admins manage the city. Analysts and guests watch live. Permissions are enforced on the server — no exceptions."
              delay={300}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutPoint({
  icon,
  accent,
  title,
  text,
  delay,
}: {
  icon: string;
  accent: string;
  title: string;
  text: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <div
        className="flex gap-4 rounded-2xl p-5 bg-slate-950/60 backdrop-blur-md border transition-transform hover:-translate-y-0.5"
        style={{ borderColor: `${accent}44`, boxShadow: `0 0 26px ${accent}10` }}
      >
        <div
          className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl border"
          style={{ borderColor: `${accent}55`, background: `${accent}14` }}
        >
          {icon}
        </div>
        <div>
          <div className="font-bold" style={{ color: accent }}>
            {title}
          </div>
          <p className="mt-1 text-sm text-slate-400 leading-relaxed">{text}</p>
        </div>
      </div>
    </Reveal>
  );
}

/* ============================================================
   PHOTOGRAPHIC SERVICE SECTIONS (scroll-driven)
   Photos: /images/water.jpg, /images/waste.jpg, /images/electricity.jpg
   ============================================================ */

type Stat = {
  icon: string;
  label: string;
  value?: number;
  decimals?: number;
  suffix?: string;
  text?: string;
};

function ServiceSection({
  label,
  title,
  tagline,
  img,
  accent,
  stats,
}: {
  label: string;
  title: string;
  tagline: string;
  img: string;
  accent: string;
  stats: Stat[];
}) {
  const bgRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const wrap = wrapRef.current;
      const bg = bgRef.current;
      if (!wrap || !bg) return;
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(Math.max((vh - r.top) / (vh + r.height), 0), 1);
      const scale = 1.18 - p * 0.18;
      const y = (p - 0.5) * 60;
      bg.style.transform = `scale(${scale}) translateY(${y}px)`;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      ref={wrapRef}
      className="relative min-h-screen overflow-hidden flex items-center"
    >
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center will-change-transform"
        style={{ backgroundImage: `url(${img})`, backgroundColor: "#0b1220" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/30" />
      <div
        className="absolute inset-0 mix-blend-overlay opacity-40"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${accent}33, transparent 60%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-8 py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Reveal>
            <span
              className="text-xs tracking-[0.3em] uppercase font-semibold"
              style={{ color: accent }}
            >
              {label}
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-3 text-4xl md:text-6xl font-bold leading-tight">
              {title}
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 text-lg text-slate-300 max-w-md">{tagline}</p>
          </Reveal>
          <Reveal delay={240}>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl font-semibold border transition-all active:scale-95"
              style={{
                borderColor: accent,
                color: accent,
                boxShadow: `0 0 24px ${accent}33`,
              }}
            >
              Explore <span aria-hidden>→</span>
            </Link>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 120}>
              <div
                className="rounded-2xl p-5 backdrop-blur-md bg-slate-950/50 border h-full"
                style={{
                  borderColor: `${accent}66`,
                  boxShadow: `0 0 30px ${accent}1f`,
                }}
              >
                <div className="text-3xl mb-3">{s.icon}</div>
                <div className="text-[11px] tracking-widest uppercase text-slate-400">
                  {s.label}
                </div>
                <div className="mt-1 text-2xl font-bold" style={{ color: accent }}>
                  {s.text ? (
                    s.text
                  ) : (
                    <CountUp
                      value={s.value!}
                      decimals={s.decimals ?? 0}
                      suffix={s.suffix ?? ""}
                    />
                  )}
                </div>
                <div className="mt-3 flex items-end gap-[3px] h-6">
                  {[40, 65, 50, 80, 60, 90, 75].map((h, j) => (
                    <div
                      key={j}
                      className="flex-1 rounded-sm"
                      style={{ height: `${h}%`, background: `${accent}55` }}
                    />
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default function Landing() {
  return (
    <main className="bg-slate-950 text-slate-100">
      {/* ---- BIG PHOTO HERO ---- */}
      <PhotoHero />

      {/* ---- ABOUT ---- */}
      <AboutSection />

      {/* ---- PHOTOGRAPHIC SERVICE SECTIONS ---- */}
      <div id="services" className="relative z-10">
        <ServiceSection
          label="Smart Water Management"
          title="Smart Water"
          tagline="Smart water systems ensure every drop counts — reservoirs, treatment, and usage simulated live."
          img="/images/water.jpg"
          accent="#22d3ee"
          stats={[
            { icon: "💧", label: "Water Quality", text: "Excellent" },
            { icon: "🌊", label: "Reservoir Level", value: 72, suffix: "%" },
            { icon: "🚰", label: "Daily Usage", value: 18650, suffix: " m³" },
          ]}
        />

        <ServiceSection
          label="Smart Waste Management"
          title="Smart Waste"
          tagline="Intelligent waste management for a cleaner tomorrow — routes, recycling, and capacity in real time."
          img="/images/waste.jpg"
          accent="#4ade80"
          stats={[
            { icon: "♻️", label: "Collection Status", text: "On Track" },
            {
              icon: "🗑",
              label: "Waste Collected",
              value: 12.4,
              decimals: 1,
              suffix: " Ton",
            },
            { icon: "🌱", label: "Landfill Diversion", value: 68, suffix: "%" },
          ]}
        />

        <ServiceSection
          label="Smart Electricity Management"
          title="Smart Electricity"
          tagline="Smart energy solutions for a brighter, sustainable future — demand, supply, and renewables tracked live."
          img="/images/electricity.jpg"
          accent="#f59e0b"
          stats={[
            {
              icon: "⚡",
              label: "Energy Consumption",
              value: 24350,
              suffix: " kWh",
            },
            {
              icon: "📈",
              label: "Peak Demand",
              value: 18.6,
              decimals: 1,
              suffix: " MW",
            },
            { icon: "🍃", label: "Renewable Share", value: 45, suffix: "%" },
          ]}
        />

        <HowItWorks />

        <footer className="py-8 text-center text-slate-500 text-sm bg-slate-950">
          Smart City Service Simulation Platform
        </footer>
      </div>
    </main>
  );
}

/* ============================================================
   HOW IT WORKS
   ============================================================ */

function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    const line = lineRef.current;
    if (!el || !line) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          line.style.transform = "scaleX(1)";
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="py-24 px-6 bg-slate-950 relative overflow-hidden">
      <ParallaxBlob color="#818cf8" factor={0.07} style={{ top: -60, right: -140 }} />
      <ParallaxBlob color="#22d3ee" factor={0.05} style={{ bottom: -80, left: -120 }} />
      <div className="max-w-4xl mx-auto relative">
        <Reveal>
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        </Reveal>

        <div ref={sectionRef} className="relative">
          <div
            ref={lineRef}
            className="hidden md:block absolute top-7 left-[16.6%] right-[16.6%] h-px origin-left"
            style={{
              background:
                "linear-gradient(90deg, rgba(34,211,238,0.7), rgba(74,222,128,0.7))",
              transform: "scaleX(0)",
              transition: "transform 1.1s cubic-bezier(.16,1,.3,1)",
            }}
          />
          <div className="grid md:grid-cols-3 gap-8 relative">
            <Step
              n="1"
              title="Sign in"
              text="Log in as a City Manager to take control of your city."
              delay={0}
            />
            <Step
              n="2"
              title="Watch your city"
              text="Live dashboards show every service, metric, and event as it happens."
              delay={120}
            />
            <Step
              n="3"
              title="Take action"
              text="Build infrastructure and handle crises to keep citizens happy."
              delay={240}
            />
          </div>
        </div>

        <Reveal delay={300}>
          <div className="text-center mt-14">
            <Link
              href="/login"
              className="bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-semibold px-8 py-3 rounded-xl transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
            >
              Launch Dashboard →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Step({
  n,
  title,
  text,
  delay,
}: {
  n: string;
  title: string;
  text: string;
  delay: number;
}) {
  const tilt = useTilt(10);
  return (
    <Reveal delay={delay}>
      <div className="text-center relative z-10">
        <div
          {...tilt}
          className="w-14 h-14 mx-auto mb-4 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-lg"
          style={{
            boxShadow: "0 0 20px rgba(34,211,238,0.5), 0 8px 16px rgba(0,0,0,0.3)",
            transition: "transform 0.15s ease",
            transformStyle: "preserve-3d",
            cursor: "default",
          }}
        >
          {n}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-slate-400 text-sm">{text}</p>
      </div>
    </Reveal>
  );
}