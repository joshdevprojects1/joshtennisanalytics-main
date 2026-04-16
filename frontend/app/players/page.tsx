"use client";

import { PageHeader } from "@/components/ui";
import { PlayerSearch } from "@/components/PlayerSearch";

export default function PlayersIndexPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Players"
        title="Find a player"
        subtitle="Career stats by surface, Elo trajectories, and match history for every player on tour since 2005."
      />
      <div className="max-w-2xl">
        <PlayerSearch autoFocus placeholder="Start typing a name…" />
        <p className="mt-6 font-mono text-xs text-muted">
          Tip: use ↑/↓ to navigate results and enter to select.
        </p>
      </div>
    </div>
  );
}
