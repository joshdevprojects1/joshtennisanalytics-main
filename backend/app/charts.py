"""
Chart styling and reusable plotting functions.

This module defines a consistent visual identity for all charts so your
published work is instantly recognizable. Edit the COLORS, FONTS, and
defaults here to evolve the brand over time.

Standard output size: 1600x900 px (16:9, looks good on Twitter/X without cropping).

Usage:
    from charts import setup_style, save_chart
    from charts import surface_elo_scatter, top_n_bar, rating_history_lines

    setup_style()
    fig = surface_elo_scatter(translation_df, highlight=['Sinner', 'Ruud'])
    save_chart(fig, 'clay_translation', out_dir='charts')
"""

import os
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patheffects as pe
from matplotlib import rcParams
import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Visual identity
# ---------------------------------------------------------------------------

COLORS = {
    'bg':         '#F4F1EA',   # warm off-white background (clay-court inspired)
    'fg':         '#1F1B16',   # deep ink for text
    'muted':      '#7A736A',   # secondary text
    'grid':       '#D9D2C5',   # subtle grid lines
    'accent':     '#C2410C',   # rust/clay orange — primary highlight
    'accent2':    '#1E40AF',   # contrast blue for hard court
    'accent3':    '#15803D',   # green for grass
    'neutral':    '#9CA3AF',   # for non-highlighted points
}

SURFACE_COLORS = {
    'Hard':   COLORS['accent2'],
    'Clay':   COLORS['accent'],
    'Grass':  COLORS['accent3'],
    'Carpet': COLORS['muted'],
}

FONTS = {
    'display': 'DejaVu Serif',     # swap to a custom font when you brand it
    'body':    'DejaVu Sans',
    'mono':    'DejaVu Sans Mono',
}

WATERMARK = '@your_handle  ·  data: tennis_atp (J. Sackmann)'


def setup_style():
    """Apply the project's default matplotlib style."""
    rcParams.update({
        'figure.facecolor':   COLORS['bg'],
        'axes.facecolor':     COLORS['bg'],
        'savefig.facecolor':  COLORS['bg'],
        'axes.edgecolor':     COLORS['fg'],
        'axes.labelcolor':    COLORS['fg'],
        'axes.titlecolor':    COLORS['fg'],
        'xtick.color':        COLORS['fg'],
        'ytick.color':        COLORS['fg'],
        'text.color':         COLORS['fg'],
        'font.family':        FONTS['body'],
        'font.size':          12,
        'axes.titlesize':     20,
        'axes.titleweight':   'bold',
        'axes.labelsize':     12,
        'axes.spines.top':    False,
        'axes.spines.right':  False,
        'axes.grid':          True,
        'grid.color':         COLORS['grid'],
        'grid.linewidth':     0.8,
        'grid.alpha':         0.7,
        'figure.dpi':         110,
        'savefig.dpi':        180,
        'figure.autolayout':  False,
    })


def _new_fig(figsize=(16, 9)):
    fig, ax = plt.subplots(figsize=figsize)
    return fig, ax


def _add_watermark(fig, text=WATERMARK):
    fig.text(0.99, 0.01, text, ha='right', va='bottom',
             fontsize=9, color=COLORS['muted'], family=FONTS['mono'])


def _title_block(fig, title, subtitle=None):
    fig.suptitle(title, x=0.06, y=0.96, ha='left',
                 fontsize=24, fontweight='bold',
                 family=FONTS['display'], color=COLORS['fg'])
    if subtitle:
        fig.text(0.06, 0.91, subtitle, ha='left', fontsize=13,
                 color=COLORS['muted'], family=FONTS['body'])


def save_chart(fig, name, out_dir='charts'):
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    path = os.path.join(out_dir, f'{name}.png')
    fig.savefig(path, bbox_inches='tight', pad_inches=0.4,
                facecolor=COLORS['bg'])
    plt.close(fig)
    return path


# ---------------------------------------------------------------------------
# Reusable chart types
# ---------------------------------------------------------------------------

def top_n_bar(df, value_col, label_col, title, subtitle=None,
              highlight_names=None, value_label=None, color=None):
    """
    Horizontal bar chart of top N players on some metric.

    Args:
        df: DataFrame already sorted in the order you want top-to-bottom.
        value_col: column with the numeric value.
        label_col: column with the player name.
        highlight_names: optional list of names to color with the accent.
    """
    setup_style()
    fig, ax = _new_fig(figsize=(14, max(6, 0.45 * len(df) + 2)))
    fig.subplots_adjust(left=0.22, right=0.95, top=0.86, bottom=0.10)

    base_color = color or COLORS['accent']
    colors = []
    for name in df[label_col]:
        if highlight_names and name not in highlight_names:
            colors.append(COLORS['neutral'])
        else:
            colors.append(base_color)

    y = np.arange(len(df))
    ax.barh(y, df[value_col].values, color=colors, edgecolor='none', height=0.7)
    ax.set_yticks(y)
    ax.set_yticklabels(df[label_col].values, fontsize=11)
    ax.invert_yaxis()
    ax.set_xlabel(value_label or value_col)
    ax.grid(axis='y', visible=False)

    # Value labels at end of each bar
    xmax = df[value_col].max()
    for i, v in enumerate(df[value_col].values):
        ax.text(v + xmax * 0.005, i, f'{v:,.0f}' if v >= 100 else f'{v:.2f}',
                va='center', ha='left', fontsize=10, color=COLORS['fg'])

    _title_block(fig, title, subtitle)
    _add_watermark(fig)
    return fig


def surface_elo_scatter(translation_df, x='hard_elo', y='clay_elo',
                        label_col='player_name', highlight=None,
                        title='Hard court vs. clay court Elo',
                        subtitle='Above the line = clay-positive  ·  below = clay-negative',
                        top_n_label=15):
    """
    Scatter of hard Elo vs clay Elo with the y=x reference line.

    Args:
        highlight: list of player names to label with the accent color.
        top_n_label: also label the most extreme N players above and below the line.
    """
    setup_style()
    fig, ax = _new_fig(figsize=(13, 11))
    fig.subplots_adjust(left=0.10, right=0.96, top=0.88, bottom=0.10)

    df = translation_df.copy()
    highlight = set(highlight or [])

    # Identify extremes for auto-labeling
    df_sorted = df.reindex(df['clay_minus_hard'].abs().sort_values(ascending=False).index)
    auto_labels = set(df_sorted.head(top_n_label)['player_name'].tolist())
    label_set = highlight | auto_labels

    # Plot all points first (background)
    ax.scatter(df[x], df[y], s=40, color=COLORS['neutral'], alpha=0.55,
               edgecolor='none', zorder=2)
    # Plot highlighted on top
    hl = df[df['player_name'].isin(highlight)]
    ax.scatter(hl[x], hl[y], s=110, color=COLORS['accent'],
               edgecolor=COLORS['fg'], linewidth=1.0, zorder=4)

    # y = x reference line
    lo = min(df[x].min(), df[y].min()) - 50
    hi = max(df[x].max(), df[y].max()) + 50
    ax.plot([lo, hi], [lo, hi], color=COLORS['fg'], linewidth=1.0,
            linestyle='--', alpha=0.6, zorder=1)
    ax.set_xlim(lo, hi)
    ax.set_ylim(lo, hi)

    # Labels
    for _, r in df[df['player_name'].isin(label_set)].iterrows():
        ax.annotate(
            r['player_name'],
            xy=(r[x], r[y]),
            xytext=(6, 4), textcoords='offset points',
            fontsize=10, fontweight='bold',
            color=COLORS['fg'],
            path_effects=[pe.withStroke(linewidth=2.5, foreground=COLORS['bg'])],
            zorder=5,
        )

    ax.set_xlabel('Hard court Elo', fontsize=13)
    ax.set_ylabel('Clay court Elo', fontsize=13)

    # Quadrant annotations
    ax.text(0.02, 0.97, 'Better on clay', transform=ax.transAxes,
            fontsize=11, color=COLORS['accent'], fontweight='bold', va='top')
    ax.text(0.98, 0.03, 'Better on hard', transform=ax.transAxes,
            fontsize=11, color=COLORS['accent2'], fontweight='bold',
            ha='right', va='bottom')

    _title_block(fig, title, subtitle)
    _add_watermark(fig)
    return fig


def translation_gap_bar(translation_df, n=15,
                        title='Biggest clay-vs-hard Elo gaps',
                        subtitle='Positive = better on clay than on hard'):
    """Horizontal bar chart of the largest clay-minus-hard Elo gaps in either direction."""
    setup_style()
    df = translation_df.copy()
    top_pos = df.nlargest(n, 'clay_minus_hard')
    top_neg = df.nsmallest(n, 'clay_minus_hard')
    combined = pd.concat([top_pos, top_neg]).sort_values('clay_minus_hard')

    fig, ax = _new_fig(figsize=(13, max(8, 0.35 * len(combined) + 2)))
    fig.subplots_adjust(left=0.22, right=0.95, top=0.90, bottom=0.08)

    colors = [COLORS['accent'] if v > 0 else COLORS['accent2']
              for v in combined['clay_minus_hard']]
    y = np.arange(len(combined))
    ax.barh(y, combined['clay_minus_hard'].values, color=colors,
            edgecolor='none', height=0.75)
    ax.set_yticks(y)
    ax.set_yticklabels(combined['player_name'].values, fontsize=10)
    ax.axvline(0, color=COLORS['fg'], linewidth=1.0)
    ax.set_xlabel('Clay Elo  −  Hard Elo')
    ax.grid(axis='y', visible=False)

    _title_block(fig, title, subtitle)
    _add_watermark(fig)
    return fig


def rating_history_lines(rating_histories, title, subtitle=None,
                         surface_colors=True):
    """
    Line chart of one or more players' Elo over time.

    Args:
        rating_histories: dict of {label: DataFrame with date, rating columns}
                          Optionally a 'surface' column to color by surface.
    """
    setup_style()
    fig, ax = _new_fig(figsize=(15, 8))
    fig.subplots_adjust(left=0.08, right=0.96, top=0.86, bottom=0.10)

    palette = [COLORS['accent'], COLORS['accent2'], COLORS['accent3'],
               COLORS['fg'], COLORS['muted']]

    for i, (label, df) in enumerate(rating_histories.items()):
        if surface_colors and 'surface' in df.columns and df['surface'].nunique() == 1:
            color = SURFACE_COLORS.get(df['surface'].iloc[0], palette[i % len(palette)])
        else:
            color = palette[i % len(palette)]
        ax.plot(df['date'], df['rating'], label=label, linewidth=2.2,
                color=color, alpha=0.9)

    ax.set_ylabel('Elo rating')
    ax.legend(loc='best', frameon=False, fontsize=11)

    _title_block(fig, title, subtitle)
    _add_watermark(fig)
    return fig


def player_surface_radar(stats_df, player_name, title=None):
    """
    Bar chart comparing a player's key stats across surfaces.

    Args:
        stats_df: DataFrame from analytics.surface_split(...)
    """
    setup_style()
    metrics = ['win_pct', 'first_serve_won_pct', 'second_serve_won_pct',
               'return_pts_won_pct', 'bp_save_pct']
    metric_labels = ['Win %', '1st serve won %', '2nd serve won %',
                     'Return pts won %', 'BP save %']

    fig, ax = _new_fig(figsize=(13, 7))
    fig.subplots_adjust(left=0.08, right=0.96, top=0.86, bottom=0.12)

    x = np.arange(len(metrics))
    width = 0.25
    surfaces_present = stats_df['surface'].tolist()
    for i, surface in enumerate(surfaces_present):
        row = stats_df[stats_df['surface'] == surface].iloc[0]
        vals = [row[m] for m in metrics]
        ax.bar(x + (i - 1) * width, vals, width,
               label=surface, color=SURFACE_COLORS.get(surface, COLORS['neutral']),
               edgecolor='none')

    ax.set_xticks(x)
    ax.set_xticklabels(metric_labels, fontsize=11)
    ax.set_ylabel('Rate')
    ax.set_ylim(0, 1)
    ax.legend(frameon=False, loc='upper right', fontsize=11)

    _title_block(fig, title or f'{player_name}: stats by surface',
                 f'Career to date  ·  rates expressed as decimals')
    _add_watermark(fig)
    return fig
