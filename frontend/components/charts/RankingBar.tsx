"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import { SURFACE_COLORS, type Surface } from "@/lib/api";

type Row = {
  player_name: string;
  rating: number;
  matches_on_surface: number;
  rank: number;
};

type Props = {
  data: Row[];
  surface: Surface;
  highlightNames?: Set<string>;
};

export function RankingBar({ data, surface, highlightNames }: Props) {
  const accent = SURFACE_COLORS[surface];
  const min = Math.min(...data.map((d) => d.rating)) - 20;
  const max = Math.max(...data.map((d) => d.rating)) + 20;

  return (
    <div
      className="w-full"
      style={{ height: Math.max(420, data.length * 32 + 60) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 60, bottom: 20, left: 140 }}
        >
          <CartesianGrid horizontal={false} stroke="#D9D2C5" strokeOpacity={0.6} />
          <XAxis
            type="number"
            domain={[min, max]}
            tick={{ fill: "#1F1B16", fontSize: 11 }}
            stroke="#1F1B16"
          />
          <YAxis
            type="category"
            dataKey="player_name"
            tick={{ fill: "#1F1B16", fontSize: 12 }}
            stroke="#1F1B16"
            width={130}
            interval={0}
          />
          <Tooltip
            cursor={{ fill: "#D9D2C5", fillOpacity: 0.3 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as Row;
              return (
                <div className="border border-ink bg-bg px-3 py-2 shadow-lg">
                  <div className="font-display text-base font-bold">
                    #{d.rank} {d.player_name}
                  </div>
                  <div className="font-mono text-xs text-muted">
                    Elo {d.rating.toFixed(0)}  ·  {d.matches_on_surface}{" "}
                    matches
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="rating" radius={0}>
            {data.map((row) => (
              <Cell
                key={row.player_name}
                fill={
                  highlightNames && !highlightNames.has(row.player_name)
                    ? "#9CA3AF"
                    : accent
                }
              />
            ))}
            <LabelList
              dataKey="rating"
              position="right"
              offset={6}
              fontSize={11}
              fill="#1F1B16"
              formatter={(v: number) => v.toFixed(0)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
