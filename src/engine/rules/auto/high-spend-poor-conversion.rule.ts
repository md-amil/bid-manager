import { Adjustment, AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { AutoCampaignAdjustment, TargetingType, ICampaignBundle, ICampaignRuleDecision } from "../../interfaces";
import AutoCampaignBaseRule, { config } from "../base.rule";

// RULE 4: High Spend with Poor Conversion
export class HighSpendPoorConversionRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {

  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    const moreClick = this.metrics.clicks > config.minClicks
    const moreSpend = this.metrics.cost > this.minSpendThreshold()
    const lowAcos = this.acos > config.targetAcos
    return moreClick && moreSpend && lowAcos;
  }

  execute(): AdjustmentLog {

    // const targeting = [
    //   { targetingType: TargetingType.CLOSE_MATCH },
    //   { targetingType: TargetingType.LOOSE_MATCH },
    //   { targetingType: TargetingType.SUBSTITUTES },
    //   { targetingType: TargetingType.COMPLEMENTS },
    // ];

    const targetings = this.getTargeting()

    return {
      ruleId: 'RULE_004',
      ruleName: 'High Spend with Poor Conversion',
      campaignId: this.campaign.campaignId,
      adjustments: [
        {
          action: EAction.DECREASE_BUDGET,
          change: -25
        },
        {
          action: EAction.DECREASE_BID,
          change: -25,
          target: ETarget.TARGETING
        }
      ],
      targetings,
      reasoning:
        `High clicks with low/zero sales and rising ACOS detected. ` +
        `Lowering bids and budget by 25% and recommending immediate search term review.`,
    };
  }
}