"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api, type Surface } from "@/lib/api";
import { PageHeader, Loading, ErrorMsg } from "@/components/ui";
import { RankingBar } from "@/components/charts/RankingBar";
import clsx from "clsx";

const SURFACES: Surface[] = ["Hard", "Clay", "Grass"];

export default function RankingsPage() {
  const [surface, setSurface] = useState<Surface>("Clay");
  const [limit, setLimit] = useState(25);
  const [minMatches, setMinMatches] = useState(20);

  const { data, isLoading, error } = useQuery({
    queryKey: ["rankings", surface, limit, minMatches],
    queryFn: () => api.rankings(surface, limit, minMatches),
  });

  return (
    <div>
      <PageHeader
        eyebrow="Rankings"
        title="Surface-specific Elo"
        subtitle="Elo ratings updated after every tour-level match, tracked separately for each surface."
      />

      {/* Controls */}
      <div className="mb-8 flex flex-wrap items-end gap-6 border-b border-grid pb-8">
        <div>
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
            Surface
          </div>
          <div className="flex border border-grid">
            {SURFACES.map((s) => (
              <button
                key={s}
                onClick={() => setSurface(s)}
                className={clsx(
                  "px-5 py-2 font-body text-sm transition-colors",
                  surface === s
                    ? s === "Clay"
                      ? "bg-clay text-bg"
                      : s === "Hard"
                      ? "bg-hard text-bg"
                      : "bg-grass text-bg"
                    : "bg-transparent text-ink hover:bg-grid/50"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
            Depth
          </div>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-grid bg-bg px-4 py-2 font-body text-sm focus:border-clay focus:outline-none"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                Top {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
            Min matches
          </div>
          <select
            value={minMatches}
            onChange={(e) => setMinMatches(Number(e.target.value))}
            className="border border-grid bg-bg px-4 py-2 font-body text-sm focus:border-clay focus:outline-none"
          >
            {[10, 20, 30, 50].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <Loading label={`Computing ${surface} Elo…`} />}
      {error && <ErrorMsg error={error} />}

      {data && (
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <RankingBar data={data.rankings} surface={surface} />
          </div>
          <div className="lg:col-span-2">
            <div className="border border-grid">
              <div className="border-b border-grid bg-ink px-5 py-3 font-mono text-xs uppercase tracking-widest text-bg">
                Top {data.rankings.length} · {surface}
              </div>
              <div className="max-h-[640px] overflow-y-auto">
                {data.rankings.map((r) => (
                  <Link
                    key={r.player_id}
                    href={`/players/${r.player_id}`}
                    className="flex items-baseline justify-between border-b border-grid px-5 py-3 transition-colors hover:bg-grid/30"
                  >
                    <div className="flex items-baseline gap-4">
                      <span className="w-6 font-mono text-xs text-muted">
                        {String(r.rank).padStart(2, "0")}
                      </span>
                      <span className="font-body text-sm">{r.player_name}</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-xs text-muted">
                        {r.matches_on_surface}m
                      </span>
                      <span className="font-display text-base font-bold">
                        {r.rating.toFixed(0)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
