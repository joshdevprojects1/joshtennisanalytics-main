"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type PlayerSearchResult } from "@/lib/api";
import { PageHeader, Loading, ErrorMsg, Card, SurfaceBadge } from "@/components/ui";
import { PlayerSearch } from "@/components/PlayerSearch";

export default function H2HPage() {
  const [a, setA] = useState<PlayerSearchResult | null>(null);
  const [b, setB] = useState<PlayerSearchResult | null>(null);

  const h2hQ = useQuery({
    queryKey: ["h2h", a?.player_id, b?.player_id],
    queryFn: () => api.h2h(a!.player_id, b!.player_id),
    enabled: !!a && !!b,
  });

  const data = h2hQ.data;
  const totalMatches = data ? data.overall.a_wins + data.overall.b_wins : 0;
  const aPct =
    totalMatches > 0 ? (data!.overall.a_wins / totalMatches) * 100 : 50;

  return (
    <div>
      <PageHeader
        eyebrow="Head-to-head"
        title="Two players, all the tape"
        subtitle="Full tour-level match history between any two players, broken down by surface."
      />

      <div className="mb-10 grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
            Player A
          </div>
          <PlayerSearch
            placeholder={a ? a.name : "First player…"}
            navigateOnSelect={false}
            onSelect={setA}
          />
          {a && (
            <div className="mt-2 font-mono text-xs text-ink">
              Selected: <span className="font-bold">{a.name}</span>{" "}
              <button
                onClick={() => setA(null)}
                className="ml-2 text-clay hover:underline"
              >
                clear
              </button>
            </div>
          )}
        </div>
        <div>
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
            Player B
          </div>
          <PlayerSearch
            placeholder={b ? b.name : "Second player…"}
            navigateOnSelect={false}
            onSelect={setB}
          />
          {b && (
            <div className="mt-2 font-mono text-xs text-ink">
              Selected: <span className="font-bold">{b.name}</span>{" "}
              <button
                onClick={() => setB(null)}
                className="ml-2 text-clay hover:underline"
              >
                clear
              </button>
            </div>
          )}
        </div>
      </div>

      {!a || !b ? (
        <div className="border border-grid bg-bg/50 p-10 text-center font-mono text-sm text-muted">
          Select two players to compare
        </div>
      ) : h2hQ.isLoading ? (
        <Loading label="Fetching match history…" />
      ) : h2hQ.error ? (
        <ErrorMsg error={h2hQ.error} />
      ) : data ? (
        <div>
          {/* Score */}
          <div className="mb-12 border border-grid">
            <div className="grid grid-cols-2">
              <div className="p-10 text-center">
                <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
                  {data.player_a.name}
                </div>
                <div className="font-display text-7xl font-black text-ink">
                  {data.overall.a_wins}
                </div>
              </div>
              <div className="border-l border-grid p-10 text-center">
                <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
                  {data.player_b.name}
                </div>
                <div className="font-display text-7xl font-black text-ink">
                  {data.overall.b_wins}
                </div>
              </div>
            </div>
            {totalMatches > 0 && (
              <div className="relative h-2 overflow-hidden border-t border-grid">
                <div
                  className="absolute inset-y-0 left-0 bg-clay"
                  style={{ width: `${aPct}%` }}
                />
                <div
                  className="absolute inset-y-0 right-0 bg-hard"
                  style={{ width: `${100 - aPct}%` }}
                />
              </div>
            )}
          </div>

          {/* By surface */}
          {Object.keys(data.by_surface).length > 0 && (
            <section className="mb-12">
              <h2 className="mb-4 font-display text-2xl font-bold">
                By surface
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(data.by_surface).map(([surface, counts]) => {
                  const total = counts.a_wins + counts.b_wins;
                  if (total === 0) return null;
                  const pct = (counts.a_wins / total) * 100;
                  return (
                    <Card key={surface}>
                      <div className="mb-4">
                        <SurfaceBadge surface={surface} />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="font-display text-3xl font-bold">
                            {counts.a_wins}
                          </div>
                          <div className="font-mono text-xs text-muted">
                            {data.player_a.name.split(" ")[0]}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-3xl font-bold">
                            {counts.b_wins}
                          </div>
                          <div className="font-mono text-xs text-muted">
                            {data.player_b.name.split(" ")[0]}
                          </div>
                        </div>
                      </div>
                      <div className="relative mt-4 h-1.5 overflow-hidden bg-grid">
                        <div
                          className="absolute inset-y-0 left-0 bg-clay"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Match list */}
          {data.matches.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-2xl font-bold">
                All matches
              </h2>
              <div className="border border-grid">
                <div className="grid grid-cols-[100px_1fr_80px_1fr_1fr] border-b border-grid bg-ink px-4 py-2 font-mono text-xs uppercase tracking-widest text-bg">
                  <div>Date</div>
                  <div>Tournament</div>
                  <div>Surface</div>
                  <div>Winner</div>
                  <div>Score</div>
                </div>
                {data.matches
                  .slice()
                  .reverse()
                  .map((m, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[100px_1fr_80px_1fr_1fr] border-b border-grid px-4 py-3 text-sm last:border-b-0"
                    >
                      <div className="font-mono text-xs text-muted">
                        {m.date?.slice(0, 10)}
                      </div>
                      <div>{m.tourney_name}</div>
                      <div>
                        <SurfaceBadge surface={m.surface} />
                      </div>
                      <div className="font-medium">{m.winner_name}</div>
                      <div className="font-mono text-xs text-muted">
                        {m.score ?? "—"}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {data.matches.length === 0 && (
            <div className="border border-grid bg-bg/50 p-10 text-center font-mono text-sm text-muted">
              These players have no tour-level matches in the dataset
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
