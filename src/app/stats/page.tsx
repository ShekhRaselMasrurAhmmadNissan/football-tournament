import { StatsBoard } from "@/components/stats-board";

export const metadata = { title: "Statistics" };

export default function StatsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <StatsBoard />
    </div>
  );
}
