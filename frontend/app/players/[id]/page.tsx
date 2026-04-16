"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type Surface } from "@/lib/api";
import {
  PageHeader,
  Loading,
  ErrorMsg,
  Card,
  Stat,
  SurfaceBadge,
} from "@/components/ui";
import { SurfaceStatsBar } from "@/components/charts/SurfaceStatsBar";
import { EloHistoryChart } from "@/components/charts/EloHistoryChart";

export default function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const id = Number(idStr);

  const playerQ = useQuery({
    queryKey: ["player", id],
    queryFn: () => api.player(id),
  });
  const splitQ = useQuery({
    queryKey: ["split", id],
    queryFn: () => api.surfaceSplit(id),
    enabled: playerQ.isSuccess,
  });
  const hardQ = useQuery({
    queryKey: ["elo", id, "Hard"],
    queryFn: () => api.eloHistory(id, "Hard" as Surface),
    enabled: playerQ.isSuccess,
    retry: false,
  });
  const clayQ = useQuery({
    queryKey: ["elo", id, "Clay"],
    queryFn: () => api.eloHistory(id, "Clay" as Surface),
    enabled: playerQ.isSuccess,
    retry: false,
  });
  const grassQ = useQuery({
    queryKey: ["elo", id, "Grass"],
    queryFn: () => api.eloHistory(id, "Grass" as Surface),
    enabled: playerQ.isSuccess,
    retry: false,
  });

  if (playerQ.isLoading) return <Loading label="Loading player…" />;
  if (playerQ.error) return <ErrorMsg error={playerQ.error} />;
  if (!playerQ.data) return null;

  const player = playerQ.data;
  const { career, current_elo } = player;

  // Best surface by Elo
  const surfaces = Object.entries(current_elo)
    .filter(([, v]) => v.matches > 0)
    .sort(([, a], [, b]) => b.rating - a.rating);
  const bestSurface = surfaces[0]?.[0] as Surface | undefined;

  const series = [];
  if (hardQ.data && hardQ.data.points.length > 0) {
    series.push({
      name: "Hard",
      surface: "Hard" as Surface,
      data: hardQ.data.points,
    });
  }
  if (clayQ.data && clayQ.data.points.length > 0) {
    series.push({
      name: "Clay",
      surface: "Clay" as Surface,
      data: clayQ.data.points,
    });
  }
  if (grassQ.data && grassQ.data.points.length > 0) {
    series.push({
      name: "Grass",
      surface: "Grass" as Surface,
      data: grassQ.data.points,
    });
  }

  const firstYear = career.first_match
    ? new Date(career.first_match).getFullYear()
    : "—";
  const lastYear = career.last_match
    ? new Date(career.last_match).getFullYear()
    : "—";

  return (
    <div>
      <PageHeader
        eyebrow="Player profile"
        title={player.name}
        subtitle={`${firstYear}—${lastYear}  ·  ${career.matches.toLocaleString()} tour-level matches`}
      />

      {/* Top stats row */}
      <div className="mb-12 grid grid-cols-2 gap-6 border-b border-grid pb-10 md:grid-cols-5">
        <Stat
          label="Win rate"
          value={
            career.win_pct != null
              ? `${(career.win_pct * 100).toFixed(1)}%`
              : "—"
          }
        />
        <Stat label="Wins" value={career.wins.toLocaleString()} />
        <Stat
          label="Hard Elo"
          value={current_elo.Hard.rating.toFixed(0)}
          accent="hard"
        />
        <Stat
          label="Clay Elo"
          value={current_elo.Clay.rating.toFixed(0)}
          accent="clay"
        />
        <Stat
          label="Grass Elo"
          value={current_elo.Grass.rating.toFixed(0)}
          accent="grass"
        />
      </div>

      {/* Best surface chip */}
      {bestSurface && (
        <div className="mb-10 flex items-center gap-3 font-mono text-sm">
          <span className="text-muted">Strongest surface:</span>
          <SurfaceBadge surface={bestSurface} />
        </div>
      )}

      {/* Surface split chart */}
      {splitQ.data && (
        <section className="mb-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-bold">
              Performance by surface
            </h2>
            <div className="font-mono text-xs text-muted">
              Career rates  ·  tour-level only
            </div>
          </div>
          <Card>
            <SurfaceStatsBar surfaces={splitQ.data.surfaces} />
          </Card>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {splitQ.data.surfaces.map((s) => (
              <div
                key={s.surface}
                className="border border-grid p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <SurfaceBadge surface={s.surface} />
                  <span className="font-mono text-xs text-muted">
                    {s.matches} matches
                  </span>
                </div>
                <div className="font-display text-3xl font-bold">
                  {(s.win_pct * 100).toFixed(1)}%
                </div>
                <div className="font-mono text-xs text-muted">
                  {s.wins} wins  ·  {s.matches - s.wins} losses
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Elo trajectories */}
      {series.length > 0 && (
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-bold">
              Elo trajectories
            </h2>
            <div className="font-mono text-xs text-muted">
              Updated after every match
            </div>
          </div>
          <Card>
            <EloHistoryChart series={series} />
          </Card>
        </section>
      )}
    </div>
  );
}
