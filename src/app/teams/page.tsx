import { TeamsBoard } from "@/components/teams-board";

export const metadata = { title: "Teams" };

export default function TeamsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <TeamsBoard />
    </div>
  );
}
