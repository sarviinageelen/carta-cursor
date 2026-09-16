import { createFundAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function NewFundForm() {
  return (
    <form action={createFundAction} className="max-w-lg space-y-3">
      <div>
        <Label>Name</Label>
        <Input name="name" required placeholder="Northbridge Ventures III" />
      </div>
      <div>
        <Label>Template</Label>
        <Select name="template" defaultValue="venture_construction">
          <option value="venture_construction">Traditional construction</option>
          <option value="spv_no_construction">No-construction / SPV model (does not legally form an SPV)</option>
          <option value="evergreen">Evergreen (no terminal liquidation assumed)</option>
        </Select>
      </div>
      <div>
        <Label>Commitments (USD)</Label>
        <Input name="commitments" defaultValue="50000000" />
      </div>
      <Button type="submit">Create fund</Button>
    </form>
  );
}
