"""
FastAPI app exposing the tennis analytics engine as JSON endpoints.

Endpoints:
    GET  /health
    GET  /players/search?q=sinner
    GET  /players/{player_id}                 - bio + career summary
    GET  /players/{player_id}/surface-split   - stats broken down by surface
    GET  /players/{player_id}/elo-history?surface=Clay
    GET  /rankings/{surface}?limit=25         - top N on a surface by Elo
    GET  /translation?min_matches=30          - clay-vs-hard translation data
    GET  /h2h?a=123&b=456                     - head-to-head between two players
"""

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import math

from .service import DataService, get_service
from .analytics import (
    surface_split,
    head_to_head,
    surface_translation,
    player_stats,
)

app = FastAPI(
    title="Tennis Analytics API",
    description="Descriptive ATP tennis analytics",
    version="0.1.0",
)

# CORS - allow the frontend dev server and production domain.
# Tighten these origins before public deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://joshtennisanalytics-josh-hilgers-projects.vercel.app/"
        # Add your production frontend URL here
    ],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _clean(value):
    """Convert numpy/pandas types to JSON-safe Python primitives."""
    if value is None:
        return None
    try:
        import numpy as np
        if isinstance(value, (np.integer,)):
            return int(value)
        if isinstance(value, (np.floating,)):
            v = float(value)
            return None if math.isnan(v) else v
        if isinstance(value, np.ndarray):
            return [_clean(x) for x in value.tolist()]
    except ImportError:
        pass
    if isinstance(value, float) and math.isnan(value):
        return None
    return value


def _clean_dict(d: dict) -> dict:
    return {k: _clean(v) for k, v in d.items()}


# ------------------------------------------------------------------
# Health
# ------------------------------------------------------------------

@app.get("/health")
def health(svc: DataService = Depends(get_service)):
    return {
        "status": "ok",
        "matches_loaded": len(svc.matches) if svc.matches is not None else 0,
        "players_indexed": svc.players_count,
    }


# ------------------------------------------------------------------
# Player search and lookup
# ------------------------------------------------------------------

@app.get("/players/search")
def search_players(
    q: str = Query(..., min_length=2, description="Name fragment"),
    limit: int = Query(20, ge=1, le=50),
    svc: DataService = Depends(get_service),
):
    return {"query": q, "results": svc.search_players(q, limit=limit)}


@app.get("/players/{player_id}")
def get_player(player_id: int, svc: DataService = Depends(get_service)):
    name = svc.player_name(player_id)
    if name == str(player_id):
        raise HTTPException(status_code=404, detail="Player not found")

    # Career totals
    pm = svc.matches[
        (svc.matches["winner_id"] == player_id) |
        (svc.matches["loser_id"] == player_id)
    ]
    wins = (pm["winner_id"] == player_id).sum()
    losses = (pm["loser_id"] == player_id).sum()

    # Current Elo on each surface
    current_elo = {}
    for surface in ["Hard", "Clay", "Grass"]:
        current_elo[surface] = {
            "rating": round(_clean(svc.elo.current_rating(player_id, surface)), 1),
            "matches": int(svc.elo.current_match_count(player_id, surface)),
        }

    first_match = pm["tourney_date"].min()
    last_match = pm["tourney_date"].max()

    return {
        "player_id": player_id,
        "name": name,
        "career": {
            "matches": int(len(pm)),
            "wins": int(wins),
            "losses": int(losses),
            "win_pct": round(wins / len(pm), 3) if len(pm) else None,
            "first_match": first_match.isoformat() if first_match is not None else None,
            "last_match": last_match.isoformat() if last_match is not None else None,
        },
        "current_elo": current_elo,
    }


@app.get("/players/{player_id}/surface-split")
def get_surface_split(player_id: int, svc: DataService = Depends(get_service)):
    df = surface_split(svc.matches, player_id)
    if df.empty:
        raise HTTPException(status_code=404, detail="No matches for this player")
    rows = [_clean_dict(r) for r in df.to_dict(orient="records")]
    return {
        "player_id": player_id,
        "name": svc.player_name(player_id),
        "surfaces": rows,
    }


@app.get("/players/{player_id}/elo-history")
def get_elo_history(
    player_id: int,
    surface: str = Query("Clay", pattern="^(Hard|Clay|Grass|Carpet)$"),
    svc: DataService = Depends(get_service),
):
    history = svc.elo.rating_history(player_id, surface)
    if history.empty:
        raise HTTPException(status_code=404, detail="No history on this surface")
    # Convert to JSON-friendly records with ISO dates
    records = []
    for _, row in history.iterrows():
        records.append({
            "date": row["date"].isoformat() if row["date"] is not None else None,
            "rating": round(_clean(row["rating"]), 1),
            "opponent": row["opponent"],
            "result": row["result"],
        })
    return {
        "player_id": player_id,
        "name": svc.player_name(player_id),
        "surface": surface,
        "points": records,
    }


# ------------------------------------------------------------------
# Rankings
# ------------------------------------------------------------------

@app.get("/rankings/{surface}")
def get_rankings(
    surface: str,
    limit: int = Query(25, ge=1, le=100),
    min_matches: int = Query(20, ge=1),
    svc: DataService = Depends(get_service),
):
    if surface not in {"Hard", "Clay", "Grass", "Carpet"}:
        raise HTTPException(status_code=400, detail="Invalid surface")
    df = svc.elo.top_n(surface, n=limit, min_matches=min_matches)
    rows = []
    for i, row in df.iterrows():
        rows.append({
            "rank": int(i) + 1,
            "player_id": int(row["player_id"]),
            "player_name": row["player_name"],
            "rating": round(_clean(row["rating"]), 1),
            "matches_on_surface": int(row["matches_on_surface"]),
        })
    return {
        "surface": surface,
        "limit": limit,
        "min_matches": min_matches,
        "rankings": rows,
    }


# ------------------------------------------------------------------
# Surface translation (clay vs hard)
# ------------------------------------------------------------------

@app.get("/translation")
def get_translation(
    min_matches: int = Query(30, ge=1),
    svc: DataService = Depends(get_service),
):
    df = surface_translation(svc.elo, min_matches=min_matches)
    rows = []
    for _, row in df.iterrows():
        rows.append({
            "player_id": int(row["player_id"]),
            "player_name": row["player_name"],
            "hard_elo": round(_clean(row["hard_elo"]), 1),
            "clay_elo": round(_clean(row["clay_elo"]), 1),
            "clay_minus_hard": round(_clean(row["clay_minus_hard"]), 1),
            "hard_matches": int(row["hard_matches"]),
            "clay_matches": int(row["clay_matches"]),
        })
    return {"min_matches": min_matches, "players": rows}


# ------------------------------------------------------------------
# Head-to-head
# ------------------------------------------------------------------

@app.get("/h2h")
def get_h2h(
    a: int = Query(..., description="player A id"),
    b: int = Query(..., description="player B id"),
    svc: DataService = Depends(get_service),
):
    result = head_to_head(svc.matches, a, b)
    name_a = svc.player_name(a)
    name_b = svc.player_name(b)

    matches_list = []
    for _, m in result["matches"].iterrows():
        matches_list.append({
            "date": m["tourney_date"].isoformat() if m["tourney_date"] else None,
            "tourney_name": m["tourney_name"],
            "surface": m["surface"],
            "winner_name": m["winner_name"],
            "loser_name": m["loser_name"],
            "score": m.get("score"),
        })

    by_surface = {}
    for surface, row in result["by_surface"].iterrows():
        by_surface[surface] = {
            "a_wins": int(row["a_wins"]),
            "b_wins": int(row["b_wins"]),
        }

    return {
        "player_a": {"id": a, "name": name_a},
        "player_b": {"id": b, "name": name_b},
        "overall": {"a_wins": result["a_wins"], "b_wins": result["b_wins"]},
        "by_surface": by_surface,
        "matches": matches_list,
    }
