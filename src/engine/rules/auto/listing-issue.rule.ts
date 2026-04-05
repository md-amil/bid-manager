import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { AutoCampaignAdjustment, TargetingType, ICampaignBundle, ICampaignRuleDecision } from "../../interfaces";
import AutoCampaignBaseRule, { config, TargetType } from "../base.rule";

// RULE 5: Listing Conversion Issues
export class ListingConversionIssuesRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    const goodImpressions = this.impressions >= config.minImpressions;
    const goodClicks = this.clicks >= config.minClicks;
    const lowSales = this.metrics.purchase === 0 || this.metrics.sales === 0;
    return goodImpressions && goodClicks && lowSales;
  }

  execute(): AdjustmentLog {
    const targetings = this.getTargeting([
      TargetType.CLOSE_MATCH,
      TargetType.LOOSE_MATCH,
      TargetType.SUBSTITUTES,
      TargetType.COMPLEMENTS,
    ])
    return {
      ruleId: 'RULE_005',
      ruleName: 'Listing Conversion Issues Detected',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments:[
        {
          action: EAction.DECREASE_BID,
          target: ETarget.TARGETING,
          change: -50
        }
      ],
      targetings: targetings.map(t => ({
        targetId: t.targetId,
        targetingType: t.metrics.targeting,
        expression: t.expression[0].type || '',
        bid: t.bid
      })),
      reasoning:
        `Good impressions and clicks but low sales indicate listing conversion issues ` +
        `(poor reviews, pricing, or content). Reducing bids by 50% until listing improvements are made.`,
    };
  }
}
