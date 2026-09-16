import { getDb, schema } from "@/server/db";
import { DataTable } from "@/components/data-table";
import { PageHeader, Panel } from "@/components/ui/panel";

export default async function PeoplePage() {
  const contacts = getDb().select().from(schema.contacts).all();
  const users = getDb().select().from(schema.users).all();
  return (
    <div>
      <PageHeader title="People" description="Contacts and workspace users. Economic figures are not edited here." />
      <Panel>
        <DataTable
          columns={["Name", "Email", "Persona"]}
          rows={users.map((row) => [row.displayName, row.email, row.persona])}
        />
      </Panel>
      {contacts.length ? (
        <Panel className="mt-4">
          <DataTable columns={["Contact", "Email"]} rows={contacts.map((row) => [row.name, row.email ?? "—"])} />
        </Panel>
      ) : null}
    </div>
  );
}
