import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision } from "../../interfaces";
import AutoCampaignBaseRule, { config } from "../base.rule";

// RULE for Negative Keywords
export class NegativeKeywordRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {

  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    const poorSearchTerms = this.getLowPerformingSearchTerms();
    console.log(`NegativeKeywordRule: shouldApply check - Found ${poorSearchTerms.length} low performing search terms with clicks >= ${config.minClicks} and spend >= ${config.minSpend} but zero sales.`);
    return poorSearchTerms.length > 0;
  }

  execute(): AutoCampaignAdjustment {
    const termsToNegate = this.getLowPerformingSearchTerms();
    const negativKeywords = termsToNegate.map(st => st.searchTerm);

    return {
      ruleId: 'RULE_010',
      ruleName: 'Add Negative Keywords',
      campaignId: this.campaign.campaignId,
      adjustments: {
        negativeKeywordsToAdd: negativKeywords,
        action: 'ADD_NEGATIVE',
      },
      reasoning:
        `Found ${termsToNegate.length} search terms with 20+ clicks/200+ spend and zero sales. ` +
        `Adding ${negativKeywords.length} terms as negative exact/phrase keywords to reduce wasted spend.`,
    };
  }
}
