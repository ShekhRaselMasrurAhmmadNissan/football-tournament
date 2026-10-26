import { cn } from "@/lib/utils";
import type { Team } from "@/lib/types";

interface TeamCrestProps {
  team: Pick<Team, "crest" | "primary" | "accent" | "name">;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  glow?: boolean;
}

const sizeMap = {
  xs: "size-6 text-[0.55rem]",
  sm: "size-8 text-[0.65rem]",
  md: "size-10 text-xs",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
};

export function TeamCrest({ team, size = "md", className, glow = false }: TeamCrestProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg font-heading font-bold tracking-tight text-white ring-1 ring-black/20",
        sizeMap[size],
        glow && "shadow-[0_0_20px_-4px_var(--crest)]",
        className,
      )}
      style={
        {
          backgroundImage: `linear-gradient(140deg, ${team.primary} 0%, ${team.primary} 52%, ${team.accent} 100%)`,
          "--crest": team.primary,
        } as React.CSSProperties
      }
    >
      <span className="absolute inset-0 opacity-30 mix-blend-overlay [background-image:radial-gradient(circle_at_25%_20%,white,transparent_55%)]" />
      <span className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">{team.crest}</span>
    </span>
  );
}
