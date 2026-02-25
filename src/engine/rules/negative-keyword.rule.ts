import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision } from "../interfaces";

// RULE for Negative Keywords
export class NegativeKeywordRule implements ICampaignRuleDecision {
  shouldApply(campaign: ICampaignBundle): boolean {
    return true
    // const poorSearchTerms = campaign.getLowPerformingSearchTerms();
    // return poorSearchTerms.length > 0;
  }

  execute(campaign: ICampaignBundle): AutoCampaignAdjustment {
    const termsToNegate = campaign.searchTerm
      .filter(st => st.clicks >= 20 && st.spend >= 200 && st.sales7d === 0);

    const negativKeywords = termsToNegate.map(st => st.searchTerm);

    return {
      ruleId: 'RULE_010',
      ruleName: 'Add Negative Keywords',
      campaignId: campaign.id,
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
