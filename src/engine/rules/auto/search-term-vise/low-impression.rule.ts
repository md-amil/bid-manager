import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { ICampaignBundle, ICampaignRuleDecision, TargetWithMetrics } from "../../../interfaces";
import BaseRule from "../../base.rule";
import { Targeting } from "src/interfaces/report.type";

// RULE for Low Impression Target
export class LowImpressionRule extends BaseRule implements ICampaignRuleDecision {
 private lowImpTarget:Targeting[]
  constructor(bundle: ICampaignBundle) {
    super(bundle)
    this.lowImpTarget = this.getLowImpressionTarget();
  }

  shouldApply(): boolean {
    if(this.isLaunchPhase) return false
    return this.lowImpTarget.length > 0;
  }

  execute(): AdjustmentLog {
    return {
      ruleId: 'RULE_011',
      ruleName: 'Low Impression Target',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments: [
        {
          action: EAction.INCREASE_BID,
          change:25,
          target: ETarget.TARGETING
        }
      ],
      targetings: this.lowImpTarget.map(t => ({
        targetId: t.targetId,
        targetingType: t.metrics?.targeting,
        expression: t.expression[0].type || '',
        bid: t.bid
      })),
      reasoning: `Found ${this.lowImpTarget.length} targetings with low impressions. Increasing bid to improve performance.`,
    };
  }
}
