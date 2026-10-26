import type { Stage } from "@/lib/types";

export const STAGE_META: Record<Stage, { label: string; short: string; matches: number }> = {
  r16: { label: "Round of 16", short: "R16", matches: 8 },
  qf: { label: "Quarter-finals", short: "QF", matches: 4 },
  sf: { label: "Semi-finals", short: "SF", matches: 2 },
  final: { label: "Final", short: "F", matches: 1 },
};

export const STAGE_ORDER: Stage[] = ["r16", "qf", "sf", "final"];
