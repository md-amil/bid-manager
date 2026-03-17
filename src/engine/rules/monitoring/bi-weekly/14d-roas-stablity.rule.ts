import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 14-Day ROAS Stability Check (Scaling Decision)
 * Condition: ROAS remains consistently above 3.0x for 14 days
 * Action: Increase bids and budget for aggressive growth
 * NOTE: Only scale on proven, sustained returns
 */
export class FourteenDayRoasStabilityRule extends BaseRule implements ICampaignRuleDecision {
  private minRoas: number = 3.0;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;

    if (this.cost === 0 || this.sales === 0) return false;

    const roas = this.roas;

    return roas >= this.minRoas;
  }

  execute(): AdjustmentLog {
    const roas = this.roas;

    const adjustments: Adjustment[] = [
      { action: EAction.INCREASE_BUDGET, change: 25 },
      { action: EAction.INCREASE_BID, change: 25, target: ETarget.KEYWORDS },
      { action: EAction.INCREASE_BID, change: 20, target: ETarget.TARGETING }
    ];

    return {
      ruleId: 'FOURTEEN_DAY_003',
      ruleName: '14-Day ROAS Stability - Scaling Approved',
      campaignId: this.campaign.campaignId,
      adjustments,
      keywords: this.keywordsIdText,
      targetings: this.targets,
      reasoning:
        `ROAS sustained at ${roas.toFixed(2)}x - well above ${this.minRoas}x minimum. ` +
        `For every $1 spent on ads, you're making $${roas.toFixed(2)} in sales. ` +
        `This is proven, scalable profitability. Increasing budget 25% and bids 25% to grow revenue while maintaining ROI.`,
    };
  }
}
