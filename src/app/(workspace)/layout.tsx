import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getDb, schema } from "@/server/db";
import { getSession } from "@/server/auth/session";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const users = getDb()
    .select()
    .from(schema.users)
    .all()
    .map((user) => ({ id: user.id, displayName: user.displayName, persona: user.persona }));
  return (
    <AppShell user={session} users={users}>
      {children}
    </AppShell>
  );
}
