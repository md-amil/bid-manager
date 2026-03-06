import {  ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import { Type } from "src/schemas/campaign.schema";
import BaseRule, { config } from "../../base.rule";
import {  AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";

/**
 * RULE 002: High Spend, Zero Sales (Hard Rule)
 * Indicators: 20+ clicks OR 200+ spend (whichever first), Zero sales
 * Action: Reduce bids 25% immediately, if no improvement in 7 days pause, add negative if irrelevant
 */
export class HighSpendZeroSalesManualRule extends BaseRule implements ICampaignRuleDecision {

  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;
    if (!this.metrics) return false;
    return this.sales === 0 && (this.clicks>=config.minClicks || this.spend >= config.minSpend)
  }

  execute(): AdjustmentLog {
    const zeroSalesTerms = this.searchTerms.filter(st => st.clicks >= config.minClicks && st.spend >= config.minSpend && st.sales7d === 0)
    return {
      ruleId: 'MANUAL_CONTROL_002',
      ruleName: 'High Spend Zero Sales - Emergency Reduction',
      campaignId:this.campaign.campaignId,
      adjustments:[
        {
          action: EAction.DECREASE_BID,
          change: -25,
          target: ETarget.TARGETING,
        },
        {
          action: EAction.ADD_NEGATIVE,
          target: ETarget.KEYWORDS,
        }
      ],
      keywords: zeroSalesTerms.map(st => st.searchTerm),
      reasoning:
        `${this.clicks} clicks with ${this.spend.toFixed(2)} spend generated zero sales. ` +
        `This is a hard rule violation. Immediately reducing bids 25%. ` +
        `Will pause if no improvement in 7 days. Adding high-spend/no-sales terms as negatives.`,
      // actionAfterDays: 7,
    };
  }
}
