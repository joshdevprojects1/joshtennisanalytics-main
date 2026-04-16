"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { SURFACE_COLORS, type SurfaceSplit } from "@/lib/api";

type Props = {
  surfaces: SurfaceSplit["surfaces"];
};

const METRICS = [
  { key: "win_pct", label: "Win %" },
  { key: "first_serve_won_pct", label: "1st serve won %" },
  { key: "second_serve_won_pct", label: "2nd serve won %" },
  { key: "return_pts_won_pct", label: "Return pts won %" },
  { key: "bp_save_pct", label: "BP save %" },
] as const;

export function SurfaceStatsBar({ surfaces }: Props) {
  // Pivot into Recharts-friendly shape: one row per metric,
  // each surface as a series.
  const data = METRICS.map((m) => {
    const row: Record<string, any> = { metric: m.label };
    surfaces.forEach((s) => {
      const v = (s as any)[m.key];
      row[s.surface] = v == null ? null : v;
    });
    return row;
  });

  return (
    <div className="h-[380px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, bottom: 10, left: 10 }}>
          <CartesianGrid stroke="#D9D2C5" strokeOpacity={0.6} vertical={false} />
          <XAxis
            dataKey="metric"
            tick={{ fill: "#1F1B16", fontSize: 11 }}
            stroke="#1F1B16"
          />
          <YAxis
            tick={{ fill: "#1F1B16", fontSize: 11 }}
            stroke="#1F1B16"
            domain={[0, 1]}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
          />
          <Tooltip
            cursor={{ fill: "#D9D2C5", fillOpacity: 0.3 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="border border-ink bg-bg px-3 py-2 shadow-lg">
                  <div className="font-display text-sm font-bold">{label}</div>
                  {payload.map((p) => (
                    <div
                      key={String(p.dataKey)}
                      className="font-mono text-xs"
                      style={{ color: p.color }}
                    >
                      {String(p.dataKey)}: {((p.value as number) * 100).toFixed(1)}%
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Legend iconType="square" wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
          {surfaces.map((s) => (
            <Bar
              key={s.surface}
              dataKey={s.surface}
              fill={SURFACE_COLORS[s.surface]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
