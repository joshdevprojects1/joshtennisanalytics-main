"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { SURFACE_COLORS, type Surface } from "@/lib/api";

type Series = {
  name: string;
  surface: Surface;
  data: { date: string; rating: number }[];
};

type Props = {
  series: Series[];
};

export function EloHistoryChart({ series }: Props) {
  // Merge series on date for Recharts
  const allDates = new Set<string>();
  series.forEach((s) => s.data.forEach((p) => allDates.add(p.date)));
  const sortedDates = Array.from(allDates).sort();

  const merged = sortedDates.map((date) => {
    const row: Record<string, any> = { date };
    series.forEach((s) => {
      const match = s.data.find((p) => p.date === date);
      if (match) row[s.name] = match.rating;
    });
    return row;
  });

  // Forward-fill for continuous lines
  const carry: Record<string, number | undefined> = {};
  merged.forEach((row) => {
    series.forEach((s) => {
      if (row[s.name] === undefined) {
        row[s.name] = carry[s.name];
      } else {
        carry[s.name] = row[s.name];
      }
    });
  });

  return (
    <div className="h-[440px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={merged} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
          <CartesianGrid stroke="#D9D2C5" strokeOpacity={0.6} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#1F1B16", fontSize: 11 }}
            stroke="#1F1B16"
            tickFormatter={(d: string) => d.slice(0, 7)}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: "#1F1B16", fontSize: 11 }}
            stroke="#1F1B16"
            domain={["auto", "auto"]}
            label={{
              value: "Elo",
              angle: -90,
              position: "left",
              offset: 0,
              fill: "#1F1B16",
              fontSize: 12,
            }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="border border-ink bg-bg px-3 py-2 shadow-lg">
                  <div className="font-mono text-xs text-muted">
                    {String(label).slice(0, 10)}
                  </div>
                  {payload.map((p) => (
                    <div
                      key={String(p.dataKey)}
                      className="font-mono text-xs"
                      style={{ color: p.color }}
                    >
                      {String(p.dataKey)}: {(p.value as number).toFixed(0)}
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
            iconType="plainline"
          />
          {series.map((s) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={SURFACE_COLORS[s.surface]}
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
