"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { useState } from "react";
import type { TranslationResponse } from "@/lib/api";

type Point = TranslationResponse["players"][number];

type Props = {
  data: Point[];
  highlightIds?: Set<number>;
  onSelect?: (p: Point) => void;
};

export function HardClayScatter({ data, highlightIds, onSelect }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  // Auto-label top N by absolute gap
  const sortedByGap = [...data].sort(
    (a, b) => Math.abs(b.clay_minus_hard) - Math.abs(a.clay_minus_hard)
  );
  const autoLabeled = new Set(sortedByGap.slice(0, 12).map((p) => p.player_id));
  const labelSet = new Set([
    ...Array.from(highlightIds ?? []),
    ...Array.from(autoLabeled),
  ]);

  const allElos = data.flatMap((p) => [p.hard_elo, p.clay_elo]);
  const domainMin = Math.min(...allElos) - 30;
  const domainMax = Math.max(...allElos) + 30;

  const enriched = data.map((p) => ({
    ...p,
    highlighted:
      highlightIds?.has(p.player_id) || hovered === p.player_id,
  }));

  return (
    <div className="relative h-[620px] w-full">
      {/* Quadrant labels */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 font-mono text-xs font-bold uppercase tracking-widest text-clay">
        Better on clay
      </div>
      <div className="pointer-events-none absolute bottom-10 right-4 z-10 font-mono text-xs font-bold uppercase tracking-widest text-hard">
        Better on hard
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 30, right: 30, bottom: 40, left: 20 }}>
          <CartesianGrid stroke="#D9D2C5" strokeOpacity={0.7} />
          <XAxis
            type="number"
            dataKey="hard_elo"
            domain={[domainMin, domainMax]}
            tick={{ fill: "#1F1B16", fontSize: 12 }}
            stroke="#1F1B16"
            label={{
              value: "Hard court Elo",
              position: "bottom",
              offset: 10,
              fill: "#1F1B16",
              fontSize: 13,
            }}
          />
          <YAxis
            type="number"
            dataKey="clay_elo"
            domain={[domainMin, domainMax]}
            tick={{ fill: "#1F1B16", fontSize: 12 }}
            stroke="#1F1B16"
            label={{
              value: "Clay court Elo",
              angle: -90,
              position: "left",
              offset: 0,
              fill: "#1F1B16",
              fontSize: 13,
            }}
          />
          <ReferenceLine
            segment={[
              { x: domainMin, y: domainMin },
              { x: domainMax, y: domainMax },
            ]}
            stroke="#1F1B16"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as Point;
              return (
                <div className="border border-ink bg-bg px-3 py-2 shadow-lg">
                  <div className="font-display text-base font-bold">
                    {d.player_name}
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted">
                    Hard {d.hard_elo.toFixed(0)}  ·  Clay{" "}
                    {d.clay_elo.toFixed(0)}
                  </div>
                  <div
                    className={`font-mono text-xs ${
                      d.clay_minus_hard > 0 ? "text-clay" : "text-hard"
                    }`}
                  >
                    Gap:{" "}
                    {d.clay_minus_hard > 0 ? "+" : ""}
                    {d.clay_minus_hard.toFixed(0)}
                  </div>
                </div>
              );
            }}
          />
          <Scatter
            data={enriched}
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              const highlighted = payload.highlighted;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={highlighted ? 7 : 4.5}
                  fill={highlighted ? "#C2410C" : "#9CA3AF"}
                  fillOpacity={highlighted ? 1 : 0.55}
                  stroke={highlighted ? "#1F1B16" : "none"}
                  strokeWidth={highlighted ? 1 : 0}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(payload.player_id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelect?.(payload)}
                />
              );
            }}
          >
            <LabelList
              dataKey="player_name"
              position="top"
              offset={8}
              content={(props: any) => {
                const { x, y, value, index } = props;
                const point = enriched[index];
                if (!labelSet.has(point.player_id)) return null;
                return (
                  <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    fill="#1F1B16"
                    fontSize={11}
                    fontWeight={600}
                    fontFamily="Inter, sans-serif"
                    style={{
                      paintOrder: "stroke",
                      stroke: "#F4F1EA",
                      strokeWidth: 3,
                    }}
                  >
                    {value}
                  </text>
                );
              }}
            />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
