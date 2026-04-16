"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const nav = [
  { href: "/", label: "Overview" },
  { href: "/rankings", label: "Rankings" },
  { href: "/translation", label: "Surface translation" },
  { href: "/players", label: "Players" },
  { href: "/h2h", label: "Head-to-head" },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="border-b border-grid">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="font-display text-3xl font-black tracking-tightest">
            Baseline
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            ATP · descriptive
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "border-b-2 pb-1 transition-colors",
                  active
                    ? "border-clay text-ink"
                    : "border-transparent text-muted hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
