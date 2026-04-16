"""
Data loader for ATP match data from Jeff Sackmann's tennis_atp repository.

Repo: https://github.com/JeffSackmann/tennis_atp
Files are CSVs named atp_matches_YYYY.csv with one row per match.

Usage:
    from data_loader import load_matches, load_players, download_data

    # Download data once
    download_data(years=range(2010, 2027), data_dir='data')

    # Load into a DataFrame
    matches = load_matches(years=range(2015, 2027), data_dir='data')
    players = load_players(data_dir='data')
"""

import os
import urllib.request
from pathlib import Path
import pandas as pd

SACKMANN_BASE = "https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master"


def download_data(years=range(2010, 2027), data_dir='data', overwrite=False):
    """Download yearly ATP match files plus the player bio file."""
    Path(data_dir).mkdir(parents=True, exist_ok=True)

    # Player bios
    players_path = os.path.join(data_dir, 'atp_players.csv')
    if overwrite or not os.path.exists(players_path):
        url = f"{SACKMANN_BASE}/atp_players.csv"
        print(f"Downloading {url}")
        urllib.request.urlretrieve(url, players_path)

    # Yearly match files
    for year in years:
        fname = f'atp_matches_{year}.csv'
        path = os.path.join(data_dir, fname)
        if overwrite or not os.path.exists(path):
            url = f"{SACKMANN_BASE}/{fname}"
            try:
                print(f"Downloading {url}")
                urllib.request.urlretrieve(url, path)
            except Exception as e:
                print(f"  failed: {e}")


def load_matches(years=range(2010, 2027), data_dir='data', tour_level_only=True):
    """
    Load yearly match CSVs and concatenate into one DataFrame.

    Args:
        years: iterable of years to load
        data_dir: directory containing the CSV files
        tour_level_only: if True, drop Davis Cup and similar non-tour events
                         (keeps Grand Slams, Masters, ATP 500/250, Tour Finals)

    Returns:
        DataFrame sorted by tourney_date with parsed date column.
    """
    frames = []
    for year in years:
        path = os.path.join(data_dir, f'atp_matches_{year}.csv')
        if not os.path.exists(path):
            print(f"  skipping {year} (file not found)")
            continue
        df = pd.read_csv(path, low_memory=False)
        df['year'] = year
        frames.append(df)

    if not frames:
        raise FileNotFoundError(
            f"No match files found in {data_dir}. Run download_data() first."
        )

    matches = pd.concat(frames, ignore_index=True)
    matches['tourney_date'] = pd.to_datetime(
        matches['tourney_date'], format='%Y%m%d', errors='coerce'
    )
    matches = matches.sort_values('tourney_date').reset_index(drop=True)

    if tour_level_only:
        # Sackmann's tourney_level codes: G=Grand Slam, M=Masters 1000,
        # A=ATP tour, F=Tour Finals, D=Davis Cup, C=Challenger, S=Satellite
        keep = {'G', 'M', 'A', 'F'}
        matches = matches[matches['tourney_level'].isin(keep)].reset_index(drop=True)

    return matches


def load_players(data_dir='data'):
    """Load the player bio file."""
    path = os.path.join(data_dir, 'atp_players.csv')
    players = pd.read_csv(path, low_memory=False)
    return players


def summarize(matches):
    """Quick sanity-check summary of a matches DataFrame."""
    print(f"Matches loaded: {len(matches):,}")
    print(f"Date range: {matches['tourney_date'].min().date()} "
          f"to {matches['tourney_date'].max().date()}")
    print(f"Unique players: "
          f"{pd.concat([matches['winner_id'], matches['loser_id']]).nunique():,}")
    print(f"\nBy surface:")
    print(matches['surface'].value_counts())
    print(f"\nBy tournament level:")
    print(matches['tourney_level'].value_counts())
