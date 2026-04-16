"use client";

import Link from "next/link";
import { PlayerSearch } from "@/components/PlayerSearch";

const features = [
  {
    href: "/rankings",
    eyebrow: "01",
    title: "Surface rankings",
    body: "Surface-specific Elo ratings for the active ATP tour. Filter by surface, minimum matches, and depth.",
  },
  {
    href: "/translation",
    eyebrow: "02",
    title: "Surface translation",
    body: "Which players carry form across surfaces, and which don't. The clay-vs-hard scatter is the foundation of clay-season reads.",
  },
  {
    href: "/players",
    eyebrow: "03",
    title: "Player profiles",
    body: "Career stats broken down by surface, rolling form, and Elo trajectories across hard, clay, and grass.",
  },
  {
    href: "/h2h",
    eyebrow: "04",
    title: "Head-to-head",
    body: "Complete match history between any two players, filtered by surface and tournament level.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="mb-16 grid gap-10 md:grid-cols-5 md:items-end">
        <div className="md:col-span-3">
          <div className="mb-4 font-mono text-xs uppercase tracking-widest text-clay">
            Descriptive analytics  ·  ATP tour
          </div>
          <h1 className="font-display text-6xl font-black leading-[0.95] tracking-tightest text-ink md:text-7xl">
            What the match{" "}
            <span className="text-clay">actually</span> said.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            A workbench for surface-specific Elo, translation factors, and
            player profiling — built on the full public ATP match history.
          </p>
        </div>
        <div className="md:col-span-2">
          <div className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
            Start with a player
          </div>
          <PlayerSearch placeholder="Sinner, Alcaraz, Ruud…" />
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="mb-6 flex items-baseline justify-between border-b border-grid pb-3">
          <div className="font-mono text-xs uppercase tracking-widest text-muted">
            Explore
          </div>
          <div className="font-mono text-xs text-muted">
            v0.1 · descriptive only
          </div>
        </div>
        <div className="grid gap-0 md:grid-cols-2">
          {features.map((f, i) => (
            <Link
              key={f.href}
              href={f.href}
              className={`group relative flex flex-col justify-between border-grid p-8 transition-colors hover:bg-ink hover:text-bg ${
                i === 0 || i === 2 ? "md:border-r" : ""
              } ${i < 2 ? "border-b" : ""} border-b md:border-b`}
            >
              <div>
                <div className="mb-6 font-mono text-xs uppercase tracking-widest text-clay group-hover:text-clay">
                  {f.eyebrow}
                </div>
                <h3 className="font-display text-3xl font-bold leading-tight tracking-tightest">
                  {f.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted group-hover:text-bg/70">
                  {f.body}
                </p>
              </div>
              <div className="mt-8 font-mono text-xs uppercase tracking-widest">
                Open →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
