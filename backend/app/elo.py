"""
Surface-specific Elo rating system for ATP tennis.

Maintains separate Elo ratings per surface (Hard, Clay, Grass, Carpet) and
records the full history so you can query a player's rating at any past date.

The K-factor formula is adapted from FiveThirtyEight / Sackmann's tennis Elo:
    K = 250 / (matches_played + 5) ^ 0.4

This gives new players large rating swings that taper as they accumulate matches.

Usage:
    from elo import EloSystem

    elo = EloSystem(initial_rating=1500)
    elo.process_matches(matches_df)

    # Current ratings
    sinner_id = 206173
    print(elo.current_rating(sinner_id, 'Clay'))

    # Rating history
    history = elo.rating_history(sinner_id, 'Clay')

    # Top N on a surface
    top_clay = elo.top_n('Clay', n=20)
"""

import pandas as pd
import numpy as np
from collections import defaultdict


def _k_factor(matches_played):
    """Sackmann-style K-factor: large for new players, smaller as they mature."""
    return 250.0 / ((matches_played + 5) ** 0.4)


def _expected_score(rating_a, rating_b):
    """Standard Elo expected score for player A vs player B."""
    return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400.0))


class EloSystem:
    def __init__(self, initial_rating=1500.0, surfaces=('Hard', 'Clay', 'Grass', 'Carpet')):
        self.initial_rating = initial_rating
        self.surfaces = surfaces
        # ratings[surface][player_id] -> current rating
        self.ratings = {s: defaultdict(lambda: initial_rating) for s in surfaces}
        # match counts per surface for K-factor
        self.counts = {s: defaultdict(int) for s in surfaces}
        # history: list of dicts, one per match processed
        self.history = []

    def process_matches(self, matches):
        """
        Process a DataFrame of matches in chronological order, updating ratings.

        Required columns: tourney_date, surface, winner_id, loser_id, winner_name, loser_name.
        """
        matches = matches.sort_values('tourney_date').reset_index(drop=True)

        for _, m in matches.iterrows():
            surface = m['surface']
            if surface not in self.ratings:
                continue  # skip unknown surfaces

            w_id = m['winner_id']
            l_id = m['loser_id']

            r_w = self.ratings[surface][w_id]
            r_l = self.ratings[surface][l_id]
            n_w = self.counts[surface][w_id]
            n_l = self.counts[surface][l_id]

            exp_w = _expected_score(r_w, r_l)
            k_w = _k_factor(n_w)
            k_l = _k_factor(n_l)

            new_r_w = r_w + k_w * (1.0 - exp_w)
            new_r_l = r_l + k_l * (0.0 - (1.0 - exp_w))

            self.ratings[surface][w_id] = new_r_w
            self.ratings[surface][l_id] = new_r_l
            self.counts[surface][w_id] = n_w + 1
            self.counts[surface][l_id] = n_l + 1

            self.history.append({
                'date': m['tourney_date'],
                'surface': surface,
                'tourney_name': m.get('tourney_name'),
                'winner_id': w_id,
                'winner_name': m.get('winner_name'),
                'loser_id': l_id,
                'loser_name': m.get('loser_name'),
                'winner_elo_pre': r_w,
                'loser_elo_pre': r_l,
                'winner_elo_post': new_r_w,
                'loser_elo_post': new_r_l,
                'expected_winner_prob': exp_w,
            })

    def history_df(self):
        """Return the full match-by-match Elo history as a DataFrame."""
        return pd.DataFrame(self.history)

    def current_rating(self, player_id, surface):
        return self.ratings[surface].get(player_id, self.initial_rating)

    def current_match_count(self, player_id, surface):
        return self.counts[surface].get(player_id, 0)

    def rating_history(self, player_id, surface):
        """Return a player's rating history on one surface as a DataFrame."""
        hist = self.history_df()
        mask = (hist['surface'] == surface) & (
            (hist['winner_id'] == player_id) | (hist['loser_id'] == player_id)
        )
        rows = []
        for _, r in hist[mask].iterrows():
            if r['winner_id'] == player_id:
                rows.append({'date': r['date'], 'rating': r['winner_elo_post'],
                             'opponent': r['loser_name'], 'result': 'W'})
            else:
                rows.append({'date': r['date'], 'rating': r['loser_elo_post'],
                             'opponent': r['winner_name'], 'result': 'L'})
        return pd.DataFrame(rows)

    def top_n(self, surface, n=20, min_matches=20):
        """
        Return top N players on a surface by current Elo,
        filtered to those with at least min_matches on that surface.
        """
        hist = self.history_df()
        # Get most recent name we've seen for each player_id
        names = {}
        for _, r in hist.iterrows():
            names[r['winner_id']] = r['winner_name']
            names[r['loser_id']] = r['loser_name']

        rows = []
        for pid, rating in self.ratings[surface].items():
            n_matches = self.counts[surface][pid]
            if n_matches >= min_matches:
                rows.append({
                    'player_id': pid,
                    'player_name': names.get(pid, str(pid)),
                    'rating': rating,
                    'matches_on_surface': n_matches,
                })
        df = pd.DataFrame(rows).sort_values('rating', ascending=False).head(n)
        return df.reset_index(drop=True)

    def player_summary(self, player_id):
        """Return a dict with current ratings on all surfaces for one player."""
        return {
            surface: {
                'rating': self.current_rating(player_id, surface),
                'matches': self.current_match_count(player_id, surface),
            }
            for surface in self.surfaces
        }
