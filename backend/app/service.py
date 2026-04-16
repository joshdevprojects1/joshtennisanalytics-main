"""
Singleton data service — loads matches and Elo once at startup, keeps in memory.

For production we'd swap in a database (SQLite or Postgres), but an in-memory
pandas DataFrame handles the full Sackmann dataset (~200k matches) easily
and keeps the deployment simple.
"""

import os
from pathlib import Path
from functools import lru_cache
from typing import Optional

import pandas as pd

from .data_loader import load_matches, load_players, download_data
from .elo import EloSystem
from .analytics import surface_translation


# Resolve data directory relative to project root (works in Docker and locally).
BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = os.environ.get("TENNIS_DATA_DIR", str(BACKEND_DIR / "data"))


class DataService:
    """In-memory store for matches, players, and Elo ratings."""

    def __init__(self):
        self.matches: Optional[pd.DataFrame] = None
        self.players: Optional[pd.DataFrame] = None
        self.elo: Optional[EloSystem] = None
        self._loaded = False

    def load(self, years=range(2005, 2027)):
        """Load data and build Elo. Idempotent."""
        if self._loaded:
            return

        Path(DATA_DIR).mkdir(parents=True, exist_ok=True)

        # Auto-download if no data present (useful for first deploy)
        players_path = Path(DATA_DIR) / "atp_players.csv"
        if not players_path.exists():
            print(f"No data found in {DATA_DIR}. Downloading from Sackmann repo...")
            download_data(years=years, data_dir=DATA_DIR)

        print(f"Loading matches from {DATA_DIR}...")
        self.matches = load_matches(years=years, data_dir=DATA_DIR)
        self.players = load_players(data_dir=DATA_DIR)

        print("Building surface-specific Elo...")
        self.elo = EloSystem()
        self.elo.process_matches(self.matches)

        # Attach a canonical display name per player_id
        self._build_name_index()

        self._loaded = True
        print(f"Ready. {len(self.matches):,} matches, "
              f"{self.players_count:,} players with Elo history.")

    def _build_name_index(self):
        """Build player_id -> display_name lookup from match history."""
        w = self.matches[["winner_id", "winner_name"]].rename(
            columns={"winner_id": "player_id", "winner_name": "name"}
        )
        l = self.matches[["loser_id", "loser_name"]].rename(
            columns={"loser_id": "player_id", "loser_name": "name"}
        )
        combined = pd.concat([w, l]).dropna()
        # Use the most recent name for each player (handles name changes, etc.)
        self.name_index = combined.groupby("player_id")["name"].last().to_dict()

    @property
    def players_count(self):
        return len(self.name_index) if hasattr(self, "name_index") else 0

    def player_name(self, player_id: int) -> str:
        return self.name_index.get(player_id, str(player_id))

    def search_players(self, query: str, limit: int = 20):
        """Search players by name fragment. Returns list of dicts."""
        q = query.lower().strip()
        if not q:
            return []

        matches_df = self.matches
        # Count matches per player for ranking
        w_counts = matches_df["winner_id"].value_counts()
        l_counts = matches_df["loser_id"].value_counts()
        total_counts = w_counts.add(l_counts, fill_value=0)

        results = []
        for pid, name in self.name_index.items():
            if q in name.lower():
                results.append({
                    "player_id": int(pid),
                    "name": name,
                    "match_count": int(total_counts.get(pid, 0)),
                })

        # Sort by match count (most active first)
        results.sort(key=lambda r: -r["match_count"])
        return results[:limit]


# Module-level singleton
service = DataService()


def get_service() -> DataService:
    """Dependency-injectable getter for FastAPI routes."""
    if not service._loaded:
        service.load()
    return service
