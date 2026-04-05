import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 7-Day ACOS Stability Check (Primary Optimization)
 * Condition: ACOS between 30-40% (borderline) for 7 days
 * Action: Small bid reduction (-15%), monitor for escalation
 * NOTE: Early intervention before ACOS gets worse
 */
export class SevenDayBorderlineAcosRule extends BaseRule implements ICampaignRuleDecision {
  private acosLowerBound: number = 0.30;
  private acosUpperBound: number = 0.40;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;

    if (this.sales === 0) return false;

    return this.acos > this.acosLowerBound && this.acos <= this.acosUpperBound;
  }

  execute(): AdjustmentLog {
    const acos = this.acos;

    const adjustments: Adjustment[] = [
      { action: EAction.DECREASE_BID, change: -15, target: ETarget.TARGETING }
    ];

    return {
      ruleId: 'SEVEN_DAY_003',
      ruleName: '7-Day Borderline ACOS - Early Intervention',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments,
      targetings: this.targets.map(t => ({
        targetId: t.targetId,
        targetingType: t.metrics.targeting,
        expression: t.expression[0].type || '',
        bid: t.bid
      })),
      reasoning:
        `ACOS ${(acos * 100).toFixed(2)}% is borderline (${(this.acosLowerBound * 100).toFixed(2)}-${(this.acosUpperBound * 100).toFixed(2)}% range). ` +
        `Not yet critical, but trending toward unprofitability. Making small bid reduction (-15%) to stabilize. ` +
        `Monitor next 7 days closely. If ACOS continues rising, will escalate to -25% reduction.`,
    };
  }
}
