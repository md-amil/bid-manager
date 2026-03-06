import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import { Type } from "src/schemas/campaign.schema";
import AutoCampaignBaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";

/**
 * RULE 001: Campaign Is Profitable (ACOS Below Target)
 * Indicators (7-14 Days): ACOS < Target, ROAS above required, stable/increasing sales, stable conversion
 * Action: Budget +25%, Bids +15%, Top of Search +20%, keep non-performers unchanged
 */
export class ProfitableManualCampaignScalingRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {

  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;
    const acos = this.acos
    // const conversionRate = this.calculateConversionRate()
    const roas = this.roas
    const isStable = true; // Simplified - would compare week-over-week
    return acos < config.targetAcos && roas >= config.minRoas && isStable;
  }

  execute(): AdjustmentLog {
    return {
      ruleId: 'MANUAL_SCALE_001',
      ruleName: 'Scale Profitable Manual Campaign',
      campaignId: this.campaign.campaignId,
      adjustments: [
        {
          action:EAction.INCREASE_BUDGET,
          change: 25,
        },
        {
          action:EAction.INCREASE_BID,
          change: 15,
          target: ETarget.KEYWORDS
        }
      ],
      keywords: this.keywordsIdText,
      // adjustments: {
      //   budgetChange: 25,
      //   bidChanges: [
      //     { targetingType: TargetingType.EXACT_MATCH, change: 15 },
      //     { targetingType: TargetingType.PHRASE_MATCH, change: 15 },
      //     { targetingType: TargetingType.TOP_OF_SEARCH, change: 20 },
      //   ],
      //   action: 'INCREASE',
      // },
      reasoning:
        `Campaign is profitable with ACOS ${(this.acos * 100).toFixed(2)}% (target: ${(config.targetAcos * 100).toFixed(2)}%) ` +
        `and ROAS ${this.roas.toFixed(2)}x. Increasing budget 25%, bids 15%, and Top of Search 20%. ` +
        `Non-performing keywords/ASIN targets remain unchanged.`,
    };
  }
}