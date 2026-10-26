import { FixtureList } from "@/components/fixture-list";

export const metadata = { title: "Fixtures" };

export default function FixturesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <FixtureList />
    </div>
  );
}
