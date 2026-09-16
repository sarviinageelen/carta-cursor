import { setClockAction, logoutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { getDemoClock } from "@/server/clock";
import { getSession } from "@/server/auth/session";
import { PROTOTYPE_ACCOUNTING_POLICY, CALCULATION_PROFILES } from "@/domain/profiles";

export default async function SettingsPage() {
  const session = await getSession();
  const clock = getDemoClock();
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Local demo controls. Session cookies are httpOnly and persona is not taken from the client as authority after login." />
      <Panel className="p-4">
        <div className="text-[13px]">Signed in as {session?.displayName} ({session?.persona})</div>
        <form action={logoutAction} className="mt-2">
          <Button variant="secondary">Log out</Button>
        </form>
      </Panel>
      <Panel className="p-4">
        <form action={setClockAction} className="grid max-w-sm gap-2">
          <Label>Demo clock</Label>
          <Input type="date" name="demoClock" defaultValue={clock} />
          <Button type="submit">Update clock</Button>
        </form>
      </Panel>
      <Callout title="Supported calculation profiles">
        {Object.values(CALCULATION_PROFILES)
          .map((row) => row.id)
          .join(", ")}
      </Callout>
      <Callout title="Accounting policy">{PROTOTYPE_ACCOUNTING_POLICY.rules[0]}</Callout>
    </div>
  );
}
