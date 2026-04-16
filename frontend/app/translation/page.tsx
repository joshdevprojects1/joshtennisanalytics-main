"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader, Loading, ErrorMsg, Card } from "@/components/ui";
import { HardClayScatter } from "@/components/charts/HardClayScatter";
import { TranslationGapBar } from "@/components/charts/TranslationGapBar";

export default function TranslationPage() {
  const [minMatches, setMinMatches] = useState(30);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["translation", minMatches],
    queryFn: () => api.translation(minMatches),
  });

  const topClay = useMemo(() => {
    if (!data) return [];
    return [...data.players]
      .sort((a, b) => b.clay_minus_hard - a.clay_minus_hard)
      .slice(0, 5);
  }, [data]);

  const topHard = useMemo(() => {
    if (!data) return [];
    return [...data.players]
      .sort((a, b) => a.clay_minus_hard - b.clay_minus_hard)
      .slice(0, 5);
  }, [data]);

  function togglePlayer(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Surface translation"
        title="Who actually translates to clay?"
        subtitle="Hard court Elo versus clay court Elo for the active ATP tour. Points above the diagonal are clay-positive; below are clay-negative."
      />

      <div className="mb-8 flex items-end justify-between border-b border-grid pb-6">
        <div className="flex items-end gap-6">
          <div>
            <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
              Min matches per surface
            </div>
            <select
              value={minMatches}
              onChange={(e) => setMinMatches(Number(e.target.value))}
              className="border border-grid bg-bg px-4 py-2 font-body text-sm focus:border-clay focus:outline-none"
            >
              {[20, 30, 50, 75, 100].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </div>
          {data && (
            <div className="font-mono text-xs text-muted">
              {data.players.length} players shown
            </div>
          )}
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={() => setSelectedIds(new Set())}
            className="font-mono text-xs uppercase tracking-widest text-clay hover:underline"
          >
            Clear selection ({selectedIds.size})
          </button>
        )}
      </div>

      {isLoading && <Loading label="Computing translation factors…" />}
      {error && <ErrorMsg error={error} />}

      {data && (
        <>
          {/* Headline scatter */}
          <Card className="mb-12">
            <HardClayScatter
              data={data.players}
              highlightIds={selectedIds}
              onSelect={(p) => togglePlayer(p.player_id)}
            />
            <div className="mt-4 border-t border-grid pt-4 font-mono text-xs text-muted">
              Click points to highlight. Click twice to open the player profile.
            </div>
          </Card>

          {/* Top lists */}
          <div className="mb-12 grid gap-6 md:grid-cols-2">
            <div className="border border-grid">
              <div className="border-b border-grid bg-clay px-5 py-3 font-mono text-xs uppercase tracking-widest text-bg">
                Most clay-positive
              </div>
              {topClay.map((p, i) => (
                <button
                  key={p.player_id}
                  onClick={() => router.push(`/players/${p.player_id}`)}
                  className="flex w-full items-baseline justify-between border-b border-grid px-5 py-3 text-left transition-colors last:border-b-0 hover:bg-grid/30"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="w-6 font-mono text-xs text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-body text-sm">{p.player_name}</span>
                  </div>
                  <span className="font-display text-lg font-bold text-clay">
                    +{p.clay_minus_hard.toFixed(0)}
                  </span>
                </button>
              ))}
            </div>
            <div className="border border-grid">
              <div className="border-b border-grid bg-hard px-5 py-3 font-mono text-xs uppercase tracking-widest text-bg">
                Most clay-negative
              </div>
              {topHard.map((p, i) => (
                <button
                  key={p.player_id}
                  onClick={() => router.push(`/players/${p.player_id}`)}
                  className="flex w-full items-baseline justify-between border-b border-grid px-5 py-3 text-left transition-colors last:border-b-0 hover:bg-grid/30"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="w-6 font-mono text-xs text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-body text-sm">{p.player_name}</span>
                  </div>
                  <span className="font-display text-lg font-bold text-hard">
                    {p.clay_minus_hard.toFixed(0)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Gap bar */}
          <div className="mb-6">
            <div className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">
              Largest gaps, both directions
            </div>
            <Card>
              <TranslationGapBar data={data.players} n={10} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
