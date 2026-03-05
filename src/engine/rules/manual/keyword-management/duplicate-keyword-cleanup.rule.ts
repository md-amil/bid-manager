import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import { Type } from "src/schemas/campaign.schema";
import BaseRule from "../../base.rule";

/**
 * RULE 004: Duplicate Keywords Across Campaigns
 * Indicators: Same keyword in multiple campaigns, internal competition
 * Action: Keep keyword only in best ACOS campaign, Remove from others
 */
export class DuplicateKeywordCleanupRule extends BaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;

    // This rule requires cross-campaign analysis
    // In real implementation, would check against other campaigns
    return false; // Placeholder
  }

  execute(): AutoCampaignAdjustment {
    return {
      ruleId: 'KEYWORD_MGMT_004',
      ruleName: 'Remove Duplicate Keywords',
      campaignId: this.campaign.campaignId,
      adjustments: {
        action: 'REMOVE',
      },
      reasoning:
        `Duplicate keywords found across multiple campaigns. Consolidate to best ACOS campaign. ` +
        `Remove from lower-performing campaigns to reduce internal competition and focus budget.`,
    };
  }
}
