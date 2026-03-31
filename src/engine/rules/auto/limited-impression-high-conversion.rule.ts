// import { AutoCampaign, AutoCampaignAdjustment, AutoTargetingType, IAutoCampaignRuleDecision } from "files (2)/auto-campaign-rules";
import { Adjustment, AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { AutoCampaignAdjustment, TargetingType, ICampaignBundle, ICampaignRuleDecision } from "../../interfaces";
import AutoCampaignBaseRule, { config } from "../base.rule";
import { Action } from "rxjs/internal/scheduler/Action";

// RULE 3: Good Conversion Rate with Limited Impressions
export class LimitedImpressionsHighConversionRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {

  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    const { impressions, clicks, sales, cost } = this.metrics
    if (clicks == 0) return false
    const convRate = sales / clicks
    const budgetNotFullyUtilized = this.utilization < config.budgetUtilizationThreshold;
    return convRate > 0.05 && impressions < 500 && budgetNotFullyUtilized;
  }

  execute(): AdjustmentLog {
    const targetings = this.getTargeting([
      TargetingType.CLOSE_MATCH,
      TargetingType.LOOSE_MATCH,
      TargetingType.SUBSTITUTES,
      TargetingType.COMPLEMENTS,
    ])

    return {
      ruleId: 'RULE_003',
      ruleName: 'Good Conversion Rate with Limited Impressions',
      campaignId: this.campaign.campaignId,
      adjustments: [{
        action: EAction.INCREASE_BID,
        target: ETarget.TARGETING,
        change: 25
      }],
      targetings: targetings,
      reasoning:
        `Auto campaign converting well but has low impression volume and budget not fully utilized. ` +
        `Increasing bids by 25% to unlock more inventory.`,
    };
  }
}