"use client";

import * as React from "react";
import { AlertTriangle, Trophy } from "lucide-react";
import { TeamCrest } from "@/components/team-crest";
import { MatchSheet } from "@/components/match-sheet";
import { useTournament } from "@/components/tournament-provider";
import { STAGE_META } from "@/lib/stages";
import {
	championOf,
	formatKickoff,
	scoreline,
	stageMatches,
	winnerOf,
} from "@/lib/tournament-engine";
import { cn } from "@/lib/utils";
import type { Match, Stage, Team } from "@/lib/types";

const COLUMNS: { stage: Stage; heightClass: string }[] = [
	{ stage: "r16", heightClass: "gap-6" },
	{ stage: "qf", heightClass: "gap-14" },
	{ stage: "sf", heightClass: "gap-28" },
	{ stage: "final", heightClass: "gap-0" },
];

export function BracketBoard() {
	const { matches, teams } = useTournament();
	const teamMap = React.useMemo(
		() => Object.fromEntries(teams.map((team) => [team.id, team])),
		[teams],
	);
	const [selected, setSelected] = React.useState<Match | null>(null);
	const [open, setOpen] = React.useState(false);

	const championId = championOf(matches);
	const champion = championId ? teamMap[championId] : null;

	const final = matches.find((match) => match.stage === "final");
	const runnerUp =
		final && final.winnerId && final.teamAId && final.teamBId
			? final.winnerId === final.teamAId
				? final.teamBId
				: final.teamAId
			: null;
	const runnerUpTeam = runnerUp ? teamMap[runnerUp] : null;

	function handleSelect(match: Match) {
		setSelected(match);
		setOpen(true);
	}

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="font-heading text-2xl font-semibold tracking-tight">
						Knockout Bracket
					</h1>
					<p className="text-sm text-muted-foreground">
						16 teams · 4 rounds · 15 matches.
					</p>
				</div>
				<div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/70 px-3 py-2">
					{champion ? (
						<>
							<TeamCrest
								team={champion}
								size="sm"
								glow
							/>
							<div className="leading-tight">
								<p className="text-[0.6rem] tracking-[0.18em] text-muted-foreground uppercase">
									Champion
								</p>
								<p className="text-sm font-semibold">
									{champion.name}
								</p>
							</div>
						</>
					) : (
						<>
							<Trophy className="size-4 text-muted-foreground" />
							<div className="leading-tight">
								<p className="text-[0.6rem] tracking-[0.18em] text-muted-foreground uppercase">
									Champion
								</p>
								<p className="text-sm font-medium text-muted-foreground">
									To be crowned
								</p>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Mobile: one round per card, swipe-free. Desktop: full 4-column tree. */}
			<div className="space-y-4 lg:hidden">
				{COLUMNS.map(({ stage }) => {
					const list = stageMatches(matches, stage);
					return (
						<section
							key={stage}
							aria-label={STAGE_META[stage].label}
						>
							<header className="mb-2 flex items-center justify-between rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1.5">
								<span className="font-heading text-xs font-semibold tracking-[0.14em] uppercase">
									{STAGE_META[stage].label}
								</span>
								<span className="font-mono text-[0.65rem] text-muted-foreground">
									{
										list.filter(
											(match) =>
												match.status === "completed",
										).length
									}
									/{list.length}
								</span>
							</header>
							<div className="space-y-2">
								{list.map((match) => (
									<BracketTie
										key={match.id}
										match={match}
										onSelect={handleSelect}
									/>
								))}
							</div>
						</section>
					);
				})}
			</div>

			<div className="bracket-scroll hidden overflow-x-auto pb-3 lg:block">
				<div className="flex min-w-[62rem] gap-4">
					{COLUMNS.map(({ stage, heightClass }) => {
						const list = stageMatches(matches, stage);
						return (
							<section
								key={stage}
								className="flex min-w-[13rem] flex-1 flex-col"
								aria-label={STAGE_META[stage].label}
							>
								<header className="mb-3 flex items-center justify-between rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1.5">
									<span className="font-heading text-xs font-semibold tracking-[0.14em] uppercase">
										{STAGE_META[stage].label}
									</span>
									<span className="font-mono text-[0.65rem] text-muted-foreground">
										{
											list.filter(
												(match) =>
													match.status ===
													"completed",
											).length
										}
										/{list.length}
									</span>
								</header>
								<div
									className={cn(
										"flex flex-1 flex-col justify-around",
										heightClass,
									)}
								>
									{list.map((match) => (
										<BracketTie
											key={match.id}
											match={match}
											onSelect={handleSelect}
										/>
									))}
								</div>
							</section>
						);
					})}

					<section
						className="flex w-[13rem] flex-col"
						aria-label="Champion"
					>
						<header className="mb-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5">
							<span className="font-heading text-xs font-semibold tracking-[0.14em] text-primary uppercase">
								Champion
							</span>
							<Trophy className="size-3.5 text-primary" />
						</header>
						<div className="flex flex-1 items-center">
							<div className="w-full rounded-xl border border-primary/30 bg-gradient-to-b from-primary/15 to-transparent p-3 text-center">
								{champion ? (
									<div className="flex flex-col items-center gap-2">
										<TeamCrest
											team={champion}
											size="lg"
											glow
										/>
										<p className="font-heading text-sm font-semibold">
											{champion.name}
										</p>
										{runnerUpTeam && (
											<p className="text-[0.65rem] text-muted-foreground">
												Runner-up: {runnerUpTeam.name}
											</p>
										)}
									</div>
								) : (
									<p className="text-xs text-muted-foreground">
										{final?.status === "cancelled"
											? "Final cancelled."
											: "Awaiting the confirmed final result."}
									</p>
								)}
							</div>
						</div>
					</section>
				</div>
			</div>

			<MatchSheet
				match={selected}
				open={open}
				onOpenChange={setOpen}
			/>
		</div>
	);
}

function BracketTie({
	match,
	onSelect,
}: {
	match: Match;
	onSelect: (match: Match) => void;
}) {
	const { teams } = useTournament();
	const teamMap = React.useMemo(
		() => Object.fromEntries(teams.map((team) => [team.id, team])),
		[teams],
	);
	const teamA = match.teamAId ? teamMap[match.teamAId] : null;
	const teamB = match.teamBId ? teamMap[match.teamBId] : null;
	const winner = winnerOf(match);

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => onSelect(match)}
				className={cn(
					"w-full rounded-lg border border-border/70 bg-card/80 px-2 py-1.5 text-left transition-all hover:border-primary/50 hover:bg-card",
					match.status === "postponed" && "border-amber-500/50",
					match.status === "cancelled" && "opacity-70",
				)}
				aria-label={`${STAGE_META[match.stage].label} ${match.id.toUpperCase()}: ${teamA?.name ?? "to be announced"} versus ${teamB?.name ?? "to be announced"}`}
			>
				<div className="mb-1 flex items-center justify-between text-[0.6rem] text-muted-foreground">
					<span className="font-mono">{match.id.toUpperCase()}</span>
					<StatusPill status={match.status} />
				</div>
				<TieRow
					team={teamA}
					score={match.teamAScore}
					pens={match.teamAPens}
					won={winner === teamA?.id}
					tba={match.teamAId === null}
				/>
				<TieRow
					team={teamB}
					score={match.teamBScore}
					pens={match.teamBPens}
					won={winner === teamB?.id}
					tba={match.teamBId === null}
				/>
				{match.needsReview && (
					<p className="mt-1 flex items-center gap-1 text-[0.6rem] font-medium text-amber-600">
						<AlertTriangle className="size-3" /> Needs review
					</p>
				)}
			</button>
			<p className="mt-1 truncate text-[0.6rem] text-muted-foreground/70">
				{scoreline(match) === "vs"
					? "Awaiting manual scheduling"
					: `${scoreline(match)} · ${match.venue}`}
			</p>
		</div>
	);
}

function StatusPill({ status }: { status: Match["status"] }) {
	if (status === "completed")
		return (
			<span className="font-medium tracking-wider text-primary uppercase">
				FT
			</span>
		);
	if (status === "postponed")
		return (
			<span className="font-medium tracking-wider text-amber-600 uppercase">
				Postponed
			</span>
		);
	if (status === "cancelled")
		return (
			<span className="font-medium tracking-wider text-destructive uppercase">
				Cancelled
			</span>
		);
	return <span className="uppercase tracking-wider">Upcoming</span>;
}

function TieRow({
	team,
	score,
	pens,
	won,
	tba,
}: {
	team: Team | null;
	score: number | null;
	pens: number | null;
	won: boolean;
	tba: boolean;
}) {
	return (
		<div className="flex items-center gap-1.5 py-0.5">
			{team ? (
				<TeamCrest
					team={team}
					size="xs"
				/>
			) : (
				<span
					className="size-6 rounded border border-dashed border-border"
					aria-hidden
				/>
			)}
			<span
				className={cn(
					"min-w-0 flex-1 truncate text-[0.8rem] font-medium",
					!team && "italic",
					tba ? "text-amber-600" : !team && "text-muted-foreground",
					won && "text-primary",
				)}
			>
				{team?.shortName ?? (tba ? "TBA" : "TBD")}
			</span>
			{pens !== null && (
				<span className="font-mono text-[0.6rem] text-muted-foreground">
					({pens})
				</span>
			)}
			<span
				className={cn(
					"w-4 text-right font-mono text-[0.8rem] font-semibold tabular-nums",
					won && "text-primary",
				)}
			>
				{score ?? "–"}
			</span>
		</div>
	);
}

export function kickoffLabel(match: Match): string {
	return formatKickoff(match.kickoff);
}
