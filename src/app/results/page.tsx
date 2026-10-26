import { ResultsTable } from "@/components/results-table";

export const metadata = { title: "Results" };

export default function ResultsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <ResultsTable />
    </div>
  );
}
