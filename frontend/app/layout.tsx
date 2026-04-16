import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Baseline — ATP Analytics",
  description: "Descriptive tennis analytics for the professional tour.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-body text-ink">
        <Providers>
          <Header />
          <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
          <footer className="mx-auto max-w-7xl px-6 py-10 text-sm text-muted font-mono">
            <div className="flex flex-col items-start gap-1 border-t border-grid pt-6 sm:flex-row sm:justify-between">
              <span>
                Baseline  ·  descriptive ATP analytics
              </span>
              <span>
                data: tennis_atp (J. Sackmann)
              </span>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
