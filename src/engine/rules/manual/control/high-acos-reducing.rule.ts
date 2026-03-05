import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { Type } from "src/schemas/campaign.schema";

/**
 * RULE 001: ACOS Above Target (Risk Zone)
 * Indicators (7 Days Minimum): ACOS consistently above target, ROAS below required
 * Action: Reduce bids 25%, if still high after 7 days reduce again, if still high after 3 reductions pause
 */
export class HighAcosManualReductionRule extends BaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;
    if(!this.metrics) return false;
    console.log(`Evaluating High ACOS Rule: ACOS=${(this.acos).toFixed(2)}%, ROAS=${this.roas.toFixed(2)}x, Target ACOS=${(config.targetAcos * 100).toFixed(2)}%, Min ROAS=${config.minRoas}x`);
    return this.acos > config.targetAcos && this.roas < config.minRoas;
  }

  execute(): AutoCampaignAdjustment {
    return {
      ruleId: 'MANUAL_CONTROL_001',
      ruleName: 'Reduce Bids - High ACOS',
      campaignId: this.campaign.campaignId,
      adjustments: {
        bidChanges: [
          { targetingType:TargetingType.EXACT_MATCH , change: -25 },
          { targetingType: TargetingType.PHRASE_MATCH, change: -25 },
          { targetingType: TargetingType.BROAD_MATCH, change: -25 },
        ],
        action: 'DECREASE',
      },
      reasoning:
        `ACOS ${(this.acos * 100).toFixed(2)}% is above target ${(config.targetAcos * 100).toFixed(2)}%. ` +
        `ROAS ${this.roas.toFixed(2)}x is below required ${config.minRoas}x. ` +
        `Reducing all bids 25%. Will pause after 3 reductions if ACOS remains high.`,
      // actionAfterDays: 7,
    };
  }
}