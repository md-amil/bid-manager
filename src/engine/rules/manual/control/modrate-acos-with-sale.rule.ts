import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { Type } from "src/schemas/campaign.schema";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";

/**
 * RULE 003: High ACOS but Sales Present
 * Indicators: Sales happening, ACOS slightly above target
 * Action: Reduce bids 20%, Monitor 7 days, Repeat max 3 times, Pause if still not profitable
 */
export class ModerateACOSWithSalesManualRule extends BaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;
    if (!this.metrics) return false;

    return (
      this.sales >= config.minSales &&
      this.acos > config.targetAcos &&
      this.acos <= config.targetAcos * 1.5 // Assuming upper limit is 1.5x target ACOS
    );
  }

  execute(): AdjustmentLog {

    return {
      ruleId: 'MANUAL_CONTROL_003',
      ruleName: 'Moderate ACOS Reduction - Gradual Approach',
      campaignId: this.campaign.campaignId,
      adjustments: [
        {
          action: EAction.DECREASE_BID,
          change: -20,
          target:ETarget.KEYWORDS
        },
      ],
      keywords:this.keywordsIdText,
      // adjustments: {
      //   bidChanges: [
      //     { targetingType: TargetingType.EXACT_MATCH, change: -20 },
      //     { targetingType: TargetingType.PHRASE_MATCH, change: -20 },
      //     { targetingType: TargetingType.BROAD_MATCH, change: -20 },
      //   ],
      //   action: 'DECREASE',
      // },
      reasoning:
        `ACOS ${(this.acos * 100).toFixed(2)}% is slightly above target. Sales still happening (${this.sales} orders). ` +
        `Using gradual approach: reducing bids 20%. Will repeat max 3 times. ` +
        `Will pause if ACOS remains above target after all reductions.`,
      // priority: 'MEDIUM',
      // actionAfterDays: 7,
    };
  }
}
