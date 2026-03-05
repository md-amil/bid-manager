import { AutoCampaignAdjustment, TargetingType, ICampaignBundle, ICampaignRuleDecision } from "../../interfaces";
import AutoCampaignBaseRule, { config } from "../base.rule";

// RULE 4: High Spend with Poor Conversion
export class HighSpendPoorConversionRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {
  
   constructor (bundle:ICampaignBundle){
    super(bundle)
  }
  
  shouldApply(): boolean {
      const moreClick = this.metrics.clicks > config.minClicks
      const moreSpend = this.metrics.spend > this.minSpendThreshold()
      const lowAcos = this.acos > config.targetAcos
      return moreClick &&  moreSpend && lowAcos;
  }

  execute(): AutoCampaignAdjustment {
    return {
      ruleId: 'RULE_004',
      ruleName: 'High Spend with Poor Conversion',
      campaignId: this.campaign.campaignId,
      adjustments: {
        budgetChange: -25,
        bidChanges: [
          { targetingType: TargetingType.CLOSE_MATCH, change: -25 },
          { targetingType: TargetingType.LOOSE_MATCH, change: -25 },
          { targetingType: TargetingType.SUBSTITUTES, change: -25 },
          { targetingType: TargetingType.COMPLEMENTS, change: -25 },
        ],
        action: 'DECREASE',
      },
      reasoning:
        `High clicks with low/zero sales and rising ACOS detected. ` +
        `Lowering bids and budget by 25% and recommending immediate search term review.`,
    };
  }
}