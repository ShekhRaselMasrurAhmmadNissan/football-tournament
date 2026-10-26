import { BracketBoard } from "@/components/bracket-board";

export const metadata = { title: "Bracket" };

export default function BracketPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <BracketBoard />
    </div>
  );
}
