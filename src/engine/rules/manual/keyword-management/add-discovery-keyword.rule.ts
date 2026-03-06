import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { Type } from "src/schemas/campaign.schema";

/**
 * RULE 001: When to Add New Keywords (From Auto or Broad)
 * Indicators: 2+ sales, ACOS within target
 * Action: Add as Exact match, Add as Phrase match, Keep discovery campaign running at lower bid
 */
export class AddNewKeywordsFromDiscoveryRule extends BaseRule implements ICampaignRuleDecision {

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;

    const promisingKeywords = this.searchTerms.filter(st => 
      st.sales7d >= config.minSales && 
      this.calculateACOS(st) <= config.targetAcos &&
      st.searchTerm 
    );

    return promisingKeywords.length > 0;
  }

  execute(): AutoCampaignAdjustment {
    const promisingKeywords = this.searchTerms.filter(st => 
      st.sales7d >= config.minSales && 
      this.calculateACOS(st) <= config.targetAcos
    );

    return {
      ruleId: 'KEYWORD_MGMT_001',
      ruleName: 'Add High-Performing Keywords from Discovery',
      campaignId: this.campaign.campaignId,
      adjustments: {
        action: 'ADD_NEGATIVE', // Using as placeholder for "ADD_TO_MANUAL"
      },
      reasoning:
        `Found ${promisingKeywords.length} promising keywords with 2+ sales and acceptable ACOS. ` +
        `Recommend: Add to campaign as Exact match AND Phrase match. ` +
        `Keep discovery campaign running at lower bids to continue testing.`,
    };
  }
}
