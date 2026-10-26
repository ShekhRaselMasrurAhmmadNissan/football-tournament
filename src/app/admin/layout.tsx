import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/server/session";
import { readTournament } from "@/lib/server/tournament-store";

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authorised = await isAdminSession();
  if (!authorised) {
    // Middleware normally catches this first; this is the real server-side gate.
    redirect("/signin");
  }

  const { config } = await readTournament();
  void config;

  return <div className="min-h-full bg-background">{children}</div>;
}
