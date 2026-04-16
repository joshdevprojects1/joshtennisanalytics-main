const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export type Surface = "Hard" | "Clay" | "Grass" | "Carpet";

export type PlayerSearchResult = {
  player_id: number;
  name: string;
  match_count: number;
};

export type RankingsResponse = {
  surface: Surface;
  rankings: {
    rank: number;
    player_id: number;
    player_name: string;
    rating: number;
    matches_on_surface: number;
  }[];
};

export type TranslationResponse = {
  min_matches: number;
  players: {
    player_id: number;
    player_name: string;
    hard_elo: number;
    clay_elo: number;
    clay_minus_hard: number;
    hard_matches: number;
    clay_matches: number;
  }[];
};

export type PlayerSummary = {
  player_id: number;
  name: string;
  career: {
    matches: number;
    wins: number;
    losses: number;
    win_pct: number | null;
    first_match: string | null;
    last_match: string | null;
  };
  current_elo: Record<Surface, { rating: number; matches: number }>;
};

export type SurfaceSplit = {
  player_id: number;
  name: string;
  surfaces: {
    surface: Surface;
    matches: number;
    wins: number;
    win_pct: number;
    first_serve_pct: number | null;
    first_serve_won_pct: number | null;
    second_serve_won_pct: number | null;
    serve_pts_won_pct: number | null;
    return_pts_won_pct: number | null;
    bp_save_pct: number | null;
    dominance_ratio: number | null;
  }[];
};

export type EloHistory = {
  player_id: number;
  name: string;
  surface: Surface;
  points: { date: string; rating: number; opponent: string; result: "W" | "L" }[];
};

export type H2HResponse = {
  player_a: { id: number; name: string };
  player_b: { id: number; name: string };
  overall: { a_wins: number; b_wins: number };
  by_surface: Record<string, { a_wins: number; b_wins: number }>;
  matches: {
    date: string;
    tourney_name: string;
    surface: string;
    winner_name: string;
    loser_name: string;
    score: string | null;
  }[];
};

export const api = {
  searchPlayers: (q: string) =>
    json<{ query: string; results: PlayerSearchResult[] }>(
      `${API_BASE}/players/search?q=${encodeURIComponent(q)}`
    ),
  rankings: (surface: Surface, limit = 25, minMatches = 20) =>
    json<RankingsResponse>(
      `${API_BASE}/rankings/${surface}?limit=${limit}&min_matches=${minMatches}`
    ),
  translation: (minMatches = 30) =>
    json<TranslationResponse>(`${API_BASE}/translation?min_matches=${minMatches}`),
  player: (id: number) => json<PlayerSummary>(`${API_BASE}/players/${id}`),
  surfaceSplit: (id: number) =>
    json<SurfaceSplit>(`${API_BASE}/players/${id}/surface-split`),
  eloHistory: (id: number, surface: Surface) =>
    json<EloHistory>(`${API_BASE}/players/${id}/elo-history?surface=${surface}`),
  h2h: (a: number, b: number) =>
    json<H2HResponse>(`${API_BASE}/h2h?a=${a}&b=${b}`),
};

export const SURFACE_COLORS: Record<Surface, string> = {
  Hard: "#1E40AF",
  Clay: "#C2410C",
  Grass: "#15803D",
  Carpet: "#7A736A",
};
