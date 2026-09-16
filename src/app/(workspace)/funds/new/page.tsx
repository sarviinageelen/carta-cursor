import { NewFundForm } from "@/components/new-fund-form";
import { PageHeader, Panel } from "@/components/ui/panel";

export default function NewFundPage() {
  return (
    <div>
      <PageHeader
        title="Create a fund"
        description="Synthetic templates only. A no-construction/SPV setting does not file or form a legal entity."
      />
      <Panel className="p-4">
        <NewFundForm />
      </Panel>
    </div>
  );
}
