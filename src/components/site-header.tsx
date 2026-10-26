"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChartBar, Goal, LayoutGrid, Trophy, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTournament } from "@/components/tournament-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/bracket", label: "Bracket", icon: Trophy },
  { href: "/fixtures", label: "Fixtures", icon: CalendarDays },
  { href: "/results", label: "Results", icon: Goal },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/stats", label: "Stats", icon: ChartBar },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { config } = useTournament();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        <BrandLogo title={config.name} subtitle={`${config.edition} · Knockout`} size={38} />

        <nav className="bracket-scroll ml-auto flex items-center gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-muted text-foreground shadow-sm",
                )}
              >
                <item.icon className="size-3.5" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
          <ThemeToggle className="ml-1 shrink-0" />
        </nav>
      </div>
    </header>
  );
}
