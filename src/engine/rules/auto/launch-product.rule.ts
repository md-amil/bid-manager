import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { ICampaignBundle, ICampaignRuleDecision, TargetingType } from "../../interfaces";
import BaseRule, { config, TargetType } from "../base.rule";

export class NewProductLaunchRule extends BaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    return this.isLaunchPhase
  }

  getAdjustment() {
    const budgetNotFullyUtilized = this.utilization < config.budgetUtilizationThreshold;
    if (budgetNotFullyUtilized) return {
      action: EAction.INCREASE_BID,
      change: 25,
      target: ETarget.TARGETING
    }
    return {
      action: EAction.SUGGESTED,
      target: ETarget.TARGETING
    }
  }

  execute(): AdjustmentLog {
    const allTargetingTypes = [
      TargetType.CLOSE_MATCH,
      TargetType.LOOSE_MATCH,
      TargetType.SUBSTITUTES,
      TargetType.COMPLEMENTS
    ];
    const targetings = this.getTargeting(allTargetingTypes);

    return {
      ruleId: 'RULE_002',
      ruleName: 'New Product Launch Phase',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments: [this.getAdjustment()],
      targetings: targetings.map(t => ({
        targetId: t.targetId,
        targetingType:t.metrics?.targeting,
        expression: t.expression[0].type || '',
        bid: t.bid
      })),
      reasoning:
        `New ASIN with no keyword data and no ranking history detected. ` +
        `Running auto campaign with suggested bids using all four auto targeting types ` +
        `(Close Match, Loose Match, Substitute, and Complementary) for traffic discovery.`,
    };
  }
}

