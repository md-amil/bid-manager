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
    const { impressions, clicks, sales7d } = this.metrics
    if (clicks == 0) return false
    const convRate = sales7d / clicks
    return convRate > 0.05 && impressions < 500 && this.utilization < config.budgetUtilizationThreshold;
  }

  execute(): AdjustmentLog {
    const targetings = [
      { targetingType: TargetingType.CLOSE_MATCH, change: 25 },
      { targetingType: TargetingType.LOOSE_MATCH, change: 25 },
    ]

    return {
      ruleId: 'RULE_003',
      ruleName: 'Increase Bids for Limited Impressions',
      campaignId: this.campaign.campaignId,
      adjustments: [{
        action: EAction.INCREASE_BID,
        target: ETarget.TARGETING,
        change: 25
      }],
      targetings: targetings,
      reasoning:
        `Campaign converting well but has limited impression volume and unused budget. ` +
        `Increasing bids by 25% to unlock more inventory and maximize sales potential.`,
    };
  }
}