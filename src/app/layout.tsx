import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Oxanium } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TournamentProvider } from "@/components/tournament-provider";
import { SiteHeader } from "@/components/site-header";
import { BrandLogo } from "@/components/brand-logo";
import { readTournament } from "@/lib/server/tournament-store";
import "./globals.css";
import { cn } from "@/lib/utils";

const oxanium = Oxanium({subsets:['latin'],variable:'--font-sans'});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { config } = await readTournament();
  return {
    title: {
      default: `${config.name} ${config.edition} · 16-Team Knockout`,
      template: `%s · ${config.name}`,
    },
    description: `Live bracket, fixtures, results and statistics for the 16-team single-elimination ${config.name}, organised by ${config.organiser}.`,
    icons: { icon: "/Logo.png", apple: "/Logo.png" },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { config, matches, teams, venues } = await readTournament();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistMono.variable, "font-sans", oxanium.variable)}
    >
      <body className="min-h-full flex flex-col bg-background">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <TournamentProvider matches={matches} teams={teams} venues={venues} config={config}>
          <TooltipProvider delayDuration={120}>
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_60%)]" />
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-border/70 py-6">
              <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6">
                <div className="flex items-center gap-3">
                  <BrandLogo size={34} withText={false} href={null} />
                  <p>
                    {config.name} {config.edition} · Organised by {config.organiser}
                  </p>
                </div>
                <p>16 teams · 15 matches · one trophy</p>
              </div>
            </footer>
          </TooltipProvider>
        </TournamentProvider>
        <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
