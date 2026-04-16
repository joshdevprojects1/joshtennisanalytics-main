"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api, type PlayerSearchResult } from "@/lib/api";
import clsx from "clsx";

type Props = {
  placeholder?: string;
  onSelect?: (player: PlayerSearchResult) => void;
  navigateOnSelect?: boolean;
  autoFocus?: boolean;
};

export function PlayerSearch({
  placeholder = "Search for a player…",
  onSelect,
  navigateOnSelect = true,
  autoFocus = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 180);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => api.searchPlayers(debounced),
    enabled: debounced.length >= 2,
  });

  const results = data?.results ?? [];

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handleSelect(player: PlayerSearchResult) {
    setOpen(false);
    setQuery(player.name);
    if (onSelect) onSelect(player);
    if (navigateOnSelect) {
      router.push(`/players/${player.player_id}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full border border-grid bg-bg px-5 py-4 font-body text-lg text-ink placeholder:text-muted focus:border-clay focus:outline-none"
        />
        {isFetching && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">
            …
          </span>
        )}
      </div>

      {open && debounced.length >= 2 && (
        <div className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto border border-grid bg-bg shadow-lg">
          {results.length === 0 && !isFetching && (
            <div className="px-5 py-3 font-mono text-sm text-muted">
              No players found
            </div>
          )}
          {results.map((p, i) => (
            <button
              key={p.player_id}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(p);
              }}
              className={clsx(
                "flex w-full items-baseline justify-between px-5 py-3 text-left transition-colors",
                active === i ? "bg-clay/10" : "hover:bg-grid/50"
              )}
            >
              <span className="font-body text-ink">{p.name}</span>
              <span className="font-mono text-xs text-muted">
                {p.match_count} matches
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
