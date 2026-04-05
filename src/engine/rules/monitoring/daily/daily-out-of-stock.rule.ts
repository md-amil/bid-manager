import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: ASIN Out of Stock (Daily - 24 Hour)
 * Condition: Product marked as out of stock or inventory = 0
 * Action: PAUSE all campaigns for this ASIN immediately
 * NOTE: Prevents wasted spend on unavailable product
 */
export class DailyASINOutOfStockRule extends BaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;
    // In real implementation, would check inventory system
    // For now, check if campaign has high traffic but zero sales
    const expectedSalesWindow = this.clicks > 50; // Enough traffic to expect sales
    // Simple heuristic: high traffic, zero sales for extended period
    const zeroSalesLongTime = this.sales === 0 && expectedSalesWindow;
    return zeroSalesLongTime;
  }

  execute(): AdjustmentLog {
    const adjustments: Adjustment[] = [
      { action: EAction.PAUSE_CAMPAIGN, target: ETarget.OTHER }
    ];

    return {
      ruleId: 'DAILY_003',
      ruleName: 'ASIN Out of Stock - Emergency Pause',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments,
      reasoning:
        `ASIN potentially out of stock: ${this.clicks} clicks with zero sales. ` +
        `Pausing campaign immediately to prevent wasted spend. ` +
        `Resume when inventory is available.`,
    };
  }
}
