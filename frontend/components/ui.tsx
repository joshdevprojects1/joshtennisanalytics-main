import clsx from "clsx";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10 border-b border-grid pb-8">
      {eyebrow && (
        <div className="mb-3 font-mono text-xs uppercase tracking-widest text-clay">
          {eyebrow}
        </div>
      )}
      <h1 className="font-display text-5xl font-black tracking-tightest text-ink md:text-6xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 max-w-3xl text-lg text-muted">{subtitle}</p>
      )}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "border border-grid bg-bg/60 p-6 backdrop-blur-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-12 font-mono text-sm text-muted">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-clay" />
      {label}
    </div>
  );
}

export function ErrorMsg({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : "Something went wrong";
  return (
    <div className="border border-clay/40 bg-clay/5 p-6 text-sm">
      <div className="mb-1 font-mono text-xs uppercase tracking-widest text-clay">
        Error
      </div>
      <div className="text-ink">{msg}</div>
      <div className="mt-3 text-xs text-muted">
        Check the backend is running on the configured API base URL.
      </div>
    </div>
  );
}

export function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "clay" | "hard" | "grass";
}) {
  const colorClass =
    accent === "clay"
      ? "text-clay"
      : accent === "hard"
      ? "text-hard"
      : accent === "grass"
      ? "text-grass"
      : "text-ink";
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className={clsx("font-display text-4xl font-bold", colorClass)}>
        {value}
      </div>
    </div>
  );
}

export function SurfaceBadge({ surface }: { surface: string }) {
  const color =
    surface === "Clay"
      ? "bg-clay/10 text-clay border-clay/30"
      : surface === "Hard"
      ? "bg-hard/10 text-hard border-hard/30"
      : surface === "Grass"
      ? "bg-grass/10 text-grass border-grass/30"
      : "bg-muted/10 text-muted border-muted/30";
  return (
    <span
      className={clsx(
        "inline-block border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest",
        color
      )}
    >
      {surface}
    </span>
  );
}
