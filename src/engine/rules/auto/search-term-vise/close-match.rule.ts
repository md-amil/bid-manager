import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import AutoCampaignBaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import BaseRule from "../../base.rule";

export class CloseMatchOptimizationRule extends BaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    const closeMatchTerms = this.getSearchTerms(TargetingType.CLOSE_MATCH)
    return closeMatchTerms.length > 0;
  }


  execute(): AdjustmentLog {
    const closeMatchTerms = this.getSearchTerms(TargetingType.CLOSE_MATCH);
    const convertingTerms = closeMatchTerms.filter(st => this.calculateACOS(st) <= config.targetAcos);
    const poorPerformers = closeMatchTerms.filter(st => st.cost >= config.minSpend && st.sales7d === 0);
    let action: EAction = EAction.INCREASE_BID;
    let change = 0;

    if (convertingTerms.length > 0 && convertingTerms > poorPerformers) {
      action = EAction.INCREASE_BID
      change = 20;
    } else if (poorPerformers.length > 0 && convertingTerms < poorPerformers) {
      action = EAction.INCREASE_BID
      change = -50;
    }

    const targetings = this.getTargeting(TargetingType.CLOSE_MATCH)

    return {
      ruleId: 'RULE_006',
      ruleName: 'Close Match Targeting Optimization',
      campaignId: this.campaign.campaignId,
      adjustments: [
        {
          action,
          change,
          target: ETarget.TARGETING
        }
      ],
      targetings,
      reasoning:
        `Close Match targeting analysis: ${convertingTerms.length} converting terms, ` +
        `${poorPerformers.length} poor performers. ${action === EAction.INCREASE_BID ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
    };
  }
}
