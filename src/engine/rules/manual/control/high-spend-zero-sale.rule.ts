import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import { Type } from "src/schemas/campaign.schema";
import BaseRule, { config } from "../../base.rule";

/**
 * RULE 002: High Spend, Zero Sales (Hard Rule)
 * Indicators: 20+ clicks OR 200+ spend (whichever first), Zero sales
 * Action: Reduce bids 25% immediately, if no improvement in 7 days pause, add negative if irrelevant
 */
export class HighSpendZeroSalesManualRule extends BaseRule implements ICampaignRuleDecision {
  // private clickThreshold: number;
  // private spendThreshold: number;

  // constructor(clickThreshold: number = 20, spendThreshold: number = 200) {
  //   this.clickThreshold = clickThreshold;
  //   this.spendThreshold = spendThreshold;
  // }

  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;
    if (!this.metrics) return false;
    return this.sales === 0 && this.clicks>=config.minClicks && this.spend >= this.minSpendThreshold()
  }

  execute(): AutoCampaignAdjustment {
    const zeroSalesTerms = this.searchTerms.filter(st => st.clicks >= config.minClicks && st.spend >= config.minSpend && st.sales7d === 0)
    return {
      ruleId: 'MANUAL_CONTROL_002',
      ruleName: 'High Spend Zero Sales - Emergency Reduction',
      campaignId:this.campaign.campaignId,
      adjustments: {
        bidChanges: [
          { targetingType:TargetingType.EXACT_MATCH, change: -25 },
          { targetingType: TargetingType.PHRASE_MATCH, change: -25 },
          { targetingType: TargetingType.BROAD_MATCH, change: -25 },
        ],
        negativeKeywordsToAdd: zeroSalesTerms.map(st => st.searchTerm),
        action: 'DECREASE',
      },
      reasoning:
        `${this.clicks} clicks with ${this.spend.toFixed(2)} spend generated zero sales. ` +
        `This is a hard rule violation. Immediately reducing bids 25%. ` +
        `Will pause if no improvement in 7 days. Adding high-spend/no-sales terms as negatives.`,
      // actionAfterDays: 7,
    };
  }
}
