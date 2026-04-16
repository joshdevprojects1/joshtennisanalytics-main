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
  ReferenceLine,
} from "recharts";
import type { TranslationResponse } from "@/lib/api";

type Props = {
  data: TranslationResponse["players"];
  n?: number;
};

export function TranslationGapBar({ data, n = 10 }: Props) {
  const sorted = [...data].sort((a, b) => b.clay_minus_hard - a.clay_minus_hard);
  const top = sorted.slice(0, n);
  const bottom = sorted.slice(-n);
  const combined = [...top, ...bottom].sort(
    (a, b) => a.clay_minus_hard - b.clay_minus_hard
  );

  return (
    <div
      className="w-full"
      style={{ height: Math.max(520, combined.length * 28 + 60) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={combined}
          layout="vertical"
          margin={{ top: 10, right: 40, bottom: 20, left: 140 }}
        >
          <CartesianGrid horizontal={false} stroke="#D9D2C5" strokeOpacity={0.6} />
          <XAxis
            type="number"
            tick={{ fill: "#1F1B16", fontSize: 11 }}
            stroke="#1F1B16"
            label={{
              value: "Clay Elo − Hard Elo",
              position: "bottom",
              offset: 0,
              fill: "#1F1B16",
              fontSize: 12,
            }}
          />
          <YAxis
            type="category"
            dataKey="player_name"
            tick={{ fill: "#1F1B16", fontSize: 12 }}
            stroke="#1F1B16"
            width={130}
            interval={0}
          />
          <ReferenceLine x={0} stroke="#1F1B16" strokeWidth={1} />
          <Tooltip
            cursor={{ fill: "#D9D2C5", fillOpacity: 0.3 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as TranslationResponse["players"][number];
              return (
                <div className="border border-ink bg-bg px-3 py-2 shadow-lg">
                  <div className="font-display text-base font-bold">
                    {d.player_name}
                  </div>
                  <div className="font-mono text-xs text-muted">
                    Hard {d.hard_elo.toFixed(0)}  ·  Clay{" "}
                    {d.clay_elo.toFixed(0)}
                  </div>
                  <div
                    className={`font-mono text-xs font-bold ${
                      d.clay_minus_hard > 0 ? "text-clay" : "text-hard"
                    }`}
                  >
                    Gap: {d.clay_minus_hard > 0 ? "+" : ""}
                    {d.clay_minus_hard.toFixed(0)}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="clay_minus_hard">
            {combined.map((d) => (
              <Cell
                key={d.player_id}
                fill={d.clay_minus_hard > 0 ? "#C2410C" : "#1E40AF"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
