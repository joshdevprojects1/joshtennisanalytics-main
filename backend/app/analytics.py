"""
Reusable analytics functions for ATP match data.

These work on a matches DataFrame in Sackmann's format and return tidy
DataFrames ready for charting.

Functions:
    player_matches(matches, player_id) -> matches involving one player
    player_stats(matches, player_id, surface=None) -> aggregated serve/return stats
    surface_split(matches, player_id) -> stats broken out by surface
    head_to_head(matches, player_a_id, player_b_id) -> H2H summary
    rolling_form(matches, player_id, window=20) -> rolling win % over time
    dominance_ratio(matches) -> per-match DR (return pts won / opp return pts won)
    surface_translation(elo_history) -> per-player clay-vs-hard Elo gap

Notes on Sackmann match-stat columns (per-match, both players):
    w_ace, w_df, w_svpt, w_1stIn, w_1stWon, w_2ndWon, w_SvGms, w_bpSaved, w_bpFaced
    l_ace, l_df, l_svpt, l_1stIn, l_1stWon, l_2ndWon, l_SvGms, l_bpSaved, l_bpFaced
"""

import pandas as pd
import numpy as np


def player_matches(matches, player_id):
    """Return all matches involving a player, with a 'won' boolean column."""
    mask = (matches['winner_id'] == player_id) | (matches['loser_id'] == player_id)
    df = matches[mask].copy()
    df['won'] = df['winner_id'] == player_id
    return df.reset_index(drop=True)


def _player_perspective(row, player_id):
    """Pivot a match row into player-perspective stats."""
    won = row['winner_id'] == player_id
    p = 'w' if won else 'l'
    o = 'l' if won else 'w'
    # Note: stat columns use w_/l_ prefix but identity columns use winner_/loser_
    o_full = 'loser' if won else 'winner'
    return {
        'date': row['tourney_date'],
        'tourney': row['tourney_name'],
        'surface': row['surface'],
        'opponent': row[f'{o_full}_name'],
        'opponent_id': row[f'{o_full}_id'],
        'won': won,
        'aces': row.get(f'{p}_ace'),
        'dfs': row.get(f'{p}_df'),
        'svpt': row.get(f'{p}_svpt'),
        'first_in': row.get(f'{p}_1stIn'),
        'first_won': row.get(f'{p}_1stWon'),
        'second_won': row.get(f'{p}_2ndWon'),
        'sv_gms': row.get(f'{p}_SvGms'),
        'bp_saved': row.get(f'{p}_bpSaved'),
        'bp_faced': row.get(f'{p}_bpFaced'),
        'opp_aces': row.get(f'{o}_ace'),
        'opp_svpt': row.get(f'{o}_svpt'),
        'opp_first_in': row.get(f'{o}_1stIn'),
        'opp_first_won': row.get(f'{o}_1stWon'),
        'opp_second_won': row.get(f'{o}_2ndWon'),
        'opp_bp_saved': row.get(f'{o}_bpSaved'),
        'opp_bp_faced': row.get(f'{o}_bpFaced'),
    }


def player_perspective_df(matches, player_id):
    """Return all of a player's matches pivoted to their perspective."""
    pm = player_matches(matches, player_id)
    rows = [_player_perspective(r, player_id) for _, r in pm.iterrows()]
    return pd.DataFrame(rows)


def player_stats(matches, player_id, surface=None):
    """
    Aggregate serve and return stats for a player.
    Returns a dict of derived metrics.
    """
    pp = player_perspective_df(matches, player_id)
    if surface is not None:
        pp = pp[pp['surface'] == surface]
    if len(pp) == 0:
        return None

    # Drop rows with missing serve stats for serve-based aggregates
    pp_serve = pp.dropna(subset=['svpt', 'first_in', 'first_won', 'second_won'])

    total_svpt = pp_serve['svpt'].sum()
    total_first_in = pp_serve['first_in'].sum()
    total_first_won = pp_serve['first_won'].sum()
    total_second_won = pp_serve['second_won'].sum()
    total_aces = pp_serve['aces'].sum()
    total_dfs = pp_serve['dfs'].sum()
    total_bp_saved = pp_serve['bp_saved'].sum()
    total_bp_faced = pp_serve['bp_faced'].sum()

    # Return side
    pp_ret = pp.dropna(subset=['opp_svpt', 'opp_first_in', 'opp_first_won', 'opp_second_won'])
    opp_svpt = pp_ret['opp_svpt'].sum()
    opp_first_in = pp_ret['opp_first_in'].sum()
    opp_first_won = pp_ret['opp_first_won'].sum()
    opp_second_won = pp_ret['opp_second_won'].sum()

    return_pts_won = (opp_first_in - opp_first_won) + ((opp_svpt - opp_first_in) - opp_second_won)
    return_pts = opp_svpt
    serve_pts_won = total_first_won + total_second_won
    serve_pts = total_svpt

    return {
        'matches': len(pp),
        'wins': int(pp['won'].sum()),
        'win_pct': pp['won'].mean(),
        'aces_per_match': total_aces / len(pp_serve) if len(pp_serve) else np.nan,
        'dfs_per_match': total_dfs / len(pp_serve) if len(pp_serve) else np.nan,
        'first_serve_pct': total_first_in / total_svpt if total_svpt else np.nan,
        'first_serve_won_pct': total_first_won / total_first_in if total_first_in else np.nan,
        'second_serve_won_pct': (total_second_won / (total_svpt - total_first_in)
                                  if (total_svpt - total_first_in) else np.nan),
        'serve_pts_won_pct': serve_pts_won / serve_pts if serve_pts else np.nan,
        'return_pts_won_pct': return_pts_won / return_pts if return_pts else np.nan,
        'bp_save_pct': total_bp_saved / total_bp_faced if total_bp_faced else np.nan,
        'dominance_ratio': ((return_pts_won / return_pts) /
                            (1 - serve_pts_won / serve_pts))
                            if (return_pts and serve_pts and serve_pts_won != serve_pts) else np.nan,
    }


def surface_split(matches, player_id):
    """Return a DataFrame of stats split by surface."""
    rows = []
    for surface in ['Hard', 'Clay', 'Grass']:
        s = player_stats(matches, player_id, surface=surface)
        if s is not None:
            s['surface'] = surface
            rows.append(s)
    return pd.DataFrame(rows)


def head_to_head(matches, player_a_id, player_b_id):
    """Return all matches between two players plus a summary."""
    mask = (
        ((matches['winner_id'] == player_a_id) & (matches['loser_id'] == player_b_id)) |
        ((matches['winner_id'] == player_b_id) & (matches['loser_id'] == player_a_id))
    )
    h2h = matches[mask].copy().sort_values('tourney_date')
    a_wins = (h2h['winner_id'] == player_a_id).sum()
    b_wins = (h2h['winner_id'] == player_b_id).sum()
    by_surface = h2h.groupby('surface').apply(
        lambda d: pd.Series({
            'a_wins': (d['winner_id'] == player_a_id).sum(),
            'b_wins': (d['winner_id'] == player_b_id).sum(),
        })
    )
    return {
        'matches': h2h,
        'a_wins': int(a_wins),
        'b_wins': int(b_wins),
        'by_surface': by_surface,
    }


def rolling_form(matches, player_id, window=20):
    """Rolling win-percentage over the player's last N matches."""
    pm = player_matches(matches, player_id).sort_values('tourney_date')
    pm['rolling_winpct'] = pm['won'].rolling(window=window, min_periods=5).mean()
    return pm[['tourney_date', 'surface', 'won', 'rolling_winpct']].reset_index(drop=True)


def surface_translation(elo_system, min_matches=30):
    """
    For each player with enough matches on both Hard and Clay,
    return their (clay_elo - hard_elo) gap. Positive = clay-positive.
    """
    rows = []
    hist = elo_system.history_df()
    names = {}
    for _, r in hist.iterrows():
        names[r['winner_id']] = r['winner_name']
        names[r['loser_id']] = r['loser_name']

    all_ids = set(elo_system.ratings['Hard'].keys()) | set(elo_system.ratings['Clay'].keys())
    for pid in all_ids:
        n_hard = elo_system.current_match_count(pid, 'Hard')
        n_clay = elo_system.current_match_count(pid, 'Clay')
        if n_hard >= min_matches and n_clay >= min_matches:
            r_hard = elo_system.current_rating(pid, 'Hard')
            r_clay = elo_system.current_rating(pid, 'Clay')
            rows.append({
                'player_id': pid,
                'player_name': names.get(pid, str(pid)),
                'hard_elo': r_hard,
                'clay_elo': r_clay,
                'clay_minus_hard': r_clay - r_hard,
                'hard_matches': n_hard,
                'clay_matches': n_clay,
            })
    return pd.DataFrame(rows).sort_values('clay_minus_hard', ascending=False).reset_index(drop=True)
