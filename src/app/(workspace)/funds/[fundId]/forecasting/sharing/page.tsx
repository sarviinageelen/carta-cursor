import { eq } from "drizzle-orm";
import { inviteCollaboratorAction, publishSnapshotAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { PageHeader, Panel, Callout } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";

export default async function SharingPage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const snaps = getDb().select().from(schema.publishedSnapshots).where(eq(schema.publishedSnapshots.fundId, fundId)).all();
  const collabs = getDb().select().from(schema.collaborators).where(eq(schema.collaborators.fundId, fundId)).all();
  return (
    <div className="space-y-4">
      <PageHeader title="Sharing & publishing" description="Publishing creates an immutable versioned snapshot. Collaborator invites require an explicit permission; they do not default to full write." />
      <Panel>
        <DataTable
          columns={["Token", "Investor scope", "Revoked"]}
          rows={snaps.map((row) => [
            <a key={row.id} className="text-accent" href={`/published/${row.token}`}>
              {row.token}
            </a>,
            row.investorId ?? "general",
            row.revokedAt ?? "no",
          ])}
        />
      </Panel>
      <Panel className="p-4">
        <form action={publishSnapshotAction} className="grid max-w-lg gap-2">
          <input type="hidden" name="fundId" value={fundId} />
          <Label>Optional LP scope</Label>
          <Input name="investorId" placeholder="lp_atlantic" />
          <Button type="submit">Publish snapshot</Button>
        </form>
      </Panel>
      <Panel className="p-4">
        <h2 className="mb-2 font-medium">Invite collaborator</h2>
        <form action={inviteCollaboratorAction} className="grid max-w-lg gap-2">
          <input type="hidden" name="fundId" value={fundId} />
          <Label>Email</Label>
          <Input name="email" required />
          <Label>Permission (required)</Label>
          <Select name="permission" defaultValue="">
            <option value="">Select permission…</option>
            <option value="read">Read</option>
            <option value="write">Write</option>
          </Select>
          <Button type="submit">Queue simulated invite</Button>
        </form>
        <DataTable columns={["Email", "Permission", "Status"]} rows={collabs.map((row) => [row.email, row.permission, row.status])} />
      </Panel>
      <Callout title="Outbox">Invitations are local outbox records. No email is sent.</Callout>
    </div>
  );
}
