import { loginAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { getDb, schema } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/home");
  const users = getDb().select().from(schema.users).all();
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="w-full max-w-lg rounded-[8px] border border-line bg-panel p-6">
        <div className="text-[12px] uppercase tracking-[0.08em] text-muted">Independent prototype · Synthetic data</div>
        <h1 className="mt-1 text-[24px] font-semibold">Carta Fund ERP</h1>
        <p className="mt-2 text-[13px] text-muted">
          Local demo identities only. This is not Carta, does not collect real credentials, and does not connect to banking, tax filing, or live integrations.
        </p>
        <form action={loginAction} className="mt-5 space-y-3">
          <label className="block text-[12px] font-medium text-muted">Choose a seeded persona</label>
          <select name="userId" className="h-9 w-full rounded-[6px] border border-line px-2">
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName} · {user.persona}
              </option>
            ))}
          </select>
          <Button type="submit">Enter workspace</Button>
        </form>
      </div>
    </div>
  );
}
