import { eq } from "drizzle-orm";
import {
  saveAllocation,
  saveConstructionSection,
  saveFeeTierAction,
  saveModeledLpAction,
  saveRecyclingAction,
  saveStage,
  saveWaterfallConfigAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Callout, Metric, PageHeader, Panel } from "@/components/ui/panel";
import { Money } from "@/components/money";
import { getDb, schema } from "@/server/db";
import { constructionForecastForFund } from "@/server/services/forecast";
import { validateStageProbabilities } from "@/domain/probabilities";

export default async function ConstructionPage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const config = getDb().select().from(schema.constructionConfigs).where(eq(schema.constructionConfigs.fundId, fundId)).get();
  if (!config) {
    return <Callout title="No construction model">This vehicle has no construction configuration yet.</Callout>;
  }
  const profiles = getDb().select().from(schema.sectorProfiles).where(eq(schema.sectorProfiles.constructionId, config.id)).all();
  const stages = profiles.flatMap((profile) =>
    getDb().select().from(schema.sectorStages).where(eq(schema.sectorStages.profileId, profile.id)).all(),
  );
  const allocations = getDb().select().from(schema.allocations).where(eq(schema.allocations.constructionId, config.id)).all();
  const fees = getDb().select().from(schema.feeProfiles).where(eq(schema.feeProfiles.constructionId, config.id)).all();
  const tiers = fees.flatMap((fee) =>
    getDb().select().from(schema.feeTiers).where(eq(schema.feeTiers.feeProfileId, fee.id)).all(),
  );
  const recycling = getDb().select().from(schema.recyclingPolicies).where(eq(schema.recyclingPolicies.constructionId, config.id)).get();
  const waterfall = getDb().select().from(schema.fundWaterfallConfigs).where(eq(schema.fundWaterfallConfigs.constructionId, config.id)).get();
  const lps = getDb().select().from(schema.modeledLps).where(eq(schema.modeledLps.constructionId, config.id)).all();
  const forecast = constructionForecastForFund(fundId);
  return (
    <div className="space-y-4">
      <PageHeader
        title="Construction"
        description="Seven persisted sections. Invalid stage probabilities are rejected. Construction never instantiates fake companies."
      />
      {forecast?.status === "ok" ? (
        <Panel className="flex flex-wrap">
          <Metric label="Projected deals" value={Number(forecast.value.projectedDealCount).toFixed(2)} />
          <Metric label="Expected invested" value={<Money value={forecast.value.totalExpectedInvested} />} />
        </Panel>
      ) : (
        <Callout tone="warning" title="Construction result">
          {forecast?.status === "unavailable" ? forecast.message : "Unavailable"}
        </Callout>
      )}
      <Panel className="p-4">
        <h2 className="mb-3 text-[15px] font-semibold">1. General</h2>
        <form action={saveConstructionSection} className="grid max-w-xl gap-2">
          <input type="hidden" name="constructionId" value={config.id} />
          <input type="hidden" name="fundId" value={fundId} />
          <Label>Name</Label>
          <Input name="name" defaultValue={config.name} />
          <Label>Commitments</Label>
          <Input name="commitments" defaultValue={config.commitments} />
          <Label>GP commitment</Label>
          <Input name="gpCommitment" defaultValue={config.gpCommitment} />
          <label className="text-[13px]">
            <input type="checkbox" name="evergreen" defaultChecked={config.evergreen} /> Evergreen (no known terminal value)
          </label>
          <label className="text-[13px]">
            <input type="checkbox" name="noConstruction" defaultChecked={config.noConstruction} /> No-construction / SPV model
          </label>
          <Button type="submit">Save general</Button>
        </form>
      </Panel>
      <Panel className="p-4">
        <h2 className="mb-3 text-[15px] font-semibold">2. Sector profiles</h2>
        {stages.map((stage, index) => {
          const check = validateStageProbabilities({
            graduation: stage.graduation,
            exit: stage.exit,
            isTerminal: index === stages.length - 1,
          });
          return (
            <form key={stage.id} action={saveStage} className="mb-3 grid grid-cols-2 gap-2 border-b border-line pb-3 md:grid-cols-6">
              <input type="hidden" name="stageId" value={stage.id} />
              <input type="hidden" name="fundId" value={fundId} />
              <input type="hidden" name="isTerminal" value={index === stages.length - 1 ? "true" : "false"} />
              <div className="col-span-2 text-[13px] font-medium">{stage.name}</div>
              <div>
                <Label>Graduation</Label>
                <Input name="graduation" defaultValue={stage.graduation} />
              </div>
              <div>
                <Label>Exit</Label>
                <Input name="exit" defaultValue={stage.exit} />
              </div>
              <div>
                <Label>Follow-on check</Label>
                <Input name="followOnCheck" defaultValue={stage.followOnCheck} />
              </div>
              <div>
                <Label>Exit value</Label>
                <Input name="exitValue" defaultValue={stage.exitValue} />
              </div>
              <div>
                <Label>Months to next</Label>
                <Input name="monthsToNext" defaultValue={stage.monthsToNext} />
              </div>
              <div>
                <Label>Months to exit</Label>
                <Input name="monthsToExit" defaultValue={stage.monthsToExit} />
              </div>
              <div className="col-span-2 text-[12px] text-muted">
                Failure residual: {check.status === "ok" ? check.value.failure : check.message}
              </div>
              <Button type="submit">Save stage</Button>
            </form>
          );
        })}
      </Panel>
      <Panel className="p-4">
        <h2 className="mb-3 text-[15px] font-semibold">3. Allocations</h2>
        {allocations.map((allocation) => (
          <form key={allocation.id} action={saveAllocation} className="grid max-w-xl gap-2">
            <input type="hidden" name="allocationId" value={allocation.id} />
            <input type="hidden" name="fundId" value={fundId} />
            <Label>Budget</Label>
            <Input name="budget" defaultValue={allocation.budget} />
            <Label>Initial check</Label>
            <Input name="initialCheck" defaultValue={allocation.initialCheck} />
            <Label>Initial ownership</Label>
            <Input name="initialOwnership" defaultValue={allocation.initialOwnership} />
            <Label>Horizon (months)</Label>
            <Input name="horizonMonths" defaultValue={allocation.horizonMonths} />
            <label className="text-[13px]">
              <input type="checkbox" name="followOnParticipation" defaultChecked={allocation.followOnParticipation} /> Follow-on participation
            </label>
            <Button type="submit">Save allocation</Button>
          </form>
        ))}
      </Panel>
      <Panel className="p-4">
        <h2 className="mb-3 text-[15px] font-semibold">4. Fees</h2>
        <p className="mb-2 text-[13px] text-muted">Fee profiles: {fees.map((row) => row.name).join(", ") || "none"}.</p>
        {tiers.map((tier) => (
          <form key={tier.id} action={saveFeeTierAction} className="mb-3 grid max-w-xl grid-cols-2 gap-2">
            <input type="hidden" name="tierId" value={tier.id} />
            <input type="hidden" name="fundId" value={fundId} />
            <div>
              <Label>Rate</Label>
              <Input name="rate" defaultValue={tier.rate} />
            </div>
            <div>
              <Label>Basis</Label>
              <Input name="basis" defaultValue={tier.basis} />
            </div>
            <label className="col-span-2 text-[13px]">
              <input type="checkbox" name="feeRecycling" defaultChecked={tier.feeRecycling} /> Fee recycling (separate from exit recycling cap)
            </label>
            <Button type="submit">Save fee tier</Button>
          </form>
        ))}
      </Panel>
      <Panel className="p-4">
        <h2 className="mb-3 text-[15px] font-semibold">5. Recycling</h2>
        {recycling ? (
          <form action={saveRecyclingAction} className="grid max-w-xl gap-2">
            <input type="hidden" name="recyclingId" value={recycling.id} />
            <input type="hidden" name="fundId" value={fundId} />
            <Label>Recyclable % of exits</Label>
            <Input name="recyclablePct" defaultValue={recycling.recyclablePct} />
            <Label>Cap vs commitments</Label>
            <Input name="capVsCommitments" defaultValue={recycling.capVsCommitments} />
            <Label>Term (months)</Label>
            <Input name="termMonths" defaultValue={recycling.termMonths} />
            <Label>Fee recycling cap</Label>
            <Input name="feeRecyclingCap" defaultValue={recycling.feeRecyclingCap} />
            <label className="text-[13px]">
              <input type="checkbox" name="useAnticipatedProceeds" defaultChecked={recycling.useAnticipatedProceeds} /> Use anticipated proceeds
            </label>
            <Button type="submit">Save recycling</Button>
          </form>
        ) : (
          <p className="text-[13px] text-muted">No recycling policy.</p>
        )}
      </Panel>
      <Panel className="p-4">
        <h2 className="mb-3 text-[15px] font-semibold">6. Fund waterfall assumptions</h2>
        {waterfall ? (
          <form action={saveWaterfallConfigAction} className="grid max-w-xl gap-2">
            <input type="hidden" name="waterfallId" value={waterfall.id} />
            <input type="hidden" name="fundId" value={fundId} />
            <Label>Structure</Label>
            <select name="structure" defaultValue={waterfall.structure} className="h-8 rounded-[6px] border border-line px-2 text-[13px]">
              <option value="european">European whole-fund (supported)</option>
              <option value="american">American / deal-by-deal (unsupported — save will reject)</option>
            </select>
            <Label>Preferred rate</Label>
            <Input name="preferredRate" defaultValue={waterfall.preferredRate} />
            <Label>Carry rate</Label>
            <Input name="carryRate" defaultValue={waterfall.carryRate} />
            <label className="text-[13px]">
              <input type="checkbox" name="catchUp" defaultChecked={waterfall.catchUp} /> Catch-up
            </label>
            <p className="text-[12px] text-muted">Profile {waterfall.profile}. These are construction assumptions, not booked LP economics.</p>
            <Button type="submit">Save waterfall assumptions</Button>
          </form>
        ) : (
          <p className="text-[13px] text-muted">No waterfall assumptions.</p>
        )}
      </Panel>
      <Panel className="p-4">
        <h2 className="mb-3 text-[15px] font-semibold">7. Modeled LPs</h2>
        <p className="mb-2 text-[12px] text-muted">Modeling inputs only. They are not LP Portal identities or legal commitments.</p>
        {lps.map((lp) => (
          <form key={lp.id} action={saveModeledLpAction} className="mb-3 grid max-w-xl gap-2">
            <input type="hidden" name="modeledLpId" value={lp.id} />
            <input type="hidden" name="fundId" value={fundId} />
            <Label>Name</Label>
            <Input name="name" defaultValue={lp.name} />
            <Label>Modeled commitment</Label>
            <Input name="commitment" defaultValue={lp.commitment} />
            <Button type="submit">Save modeled LP</Button>
          </form>
        ))}
      </Panel>
    </div>
  );
}
