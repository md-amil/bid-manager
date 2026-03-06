import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
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

  execute(): AdjustmentLog {
    const termsToNegate = this.getLowPerformingSearchTerms();
    const negativeKeywords = termsToNegate.map(st => st.searchTerm);

    return {
      ruleId: 'RULE_010',
      ruleName: 'Add Negative Keywords',
      campaignId: this.campaign.campaignId,
      adjustments:[
        {
          action:EAction.ADD_NEGATIVE,
          target:ETarget.KEYWORDS
        }
      ],
      keywords:negativeKeywords,
      reasoning:
        `Found ${termsToNegate.length} search terms with 20+ clicks/200+ spend and zero sales. ` +
        `Adding ${negativeKeywords.length} terms as negative exact/phrase keywords to reduce wasted spend.`,
    };
  }
}
