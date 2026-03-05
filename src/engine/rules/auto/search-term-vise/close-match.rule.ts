import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import AutoCampaignBaseRule, { config } from "../../base.rule";

export class CloseMatchOptimizationRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    const closeMatchTerms = this.getSearchTerms(TargetingType.CLOSE_MATCH)
    return closeMatchTerms.length > 0;
  }


  execute(): AutoCampaignAdjustment {
    const closeMatchTerms = this.getSearchTerms(TargetingType.CLOSE_MATCH);
    const convertingTerms = closeMatchTerms.filter(st => this.calculateACOS(st) <= config.targetAcos);
    const poorPerformers = closeMatchTerms.filter(st => st.spend >= config.minSpend && st.sales7d === 0);

    let action: 'INCREASE' | 'DECREASE' | 'CONTROL' = 'CONTROL';
    let change = 0;

    if (convertingTerms.length > 0 && poorPerformers.length === 0) {
      action = 'INCREASE';
      change = 20;
    } else if (poorPerformers.length > 0) {
      action = 'DECREASE';
      change = -50;
    }

    return {
      ruleId: 'RULE_006',
      ruleName: 'Close Match Targeting Optimization',
      campaignId: this.campaign.campaignId,
      adjustments: {
        bidChanges: [{ targetingType: TargetingType.CLOSE_MATCH, change }],
        action,
      },
      reasoning:
        `Close Match targeting analysis: ${convertingTerms.length} converting terms, ` +
        `${poorPerformers.length} poor performers. ${action === 'INCREASE' ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
    };
  }
}
