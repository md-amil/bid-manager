import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { ICampaignBundle, ICampaignRuleDecision } from "../interfaces";
import AutoCampaignBaseRule, { config } from "./base.rule";

// RULE for Negative Keywords
export class NegativeKeywordRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {

  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    const poorSearchTerms = this.getNegativeWorthySearchTerms();
    return poorSearchTerms.length > 0;
  }

  execute(): AdjustmentLog {
    const termsToNegate = this.getNegativeWorthySearchTerms();
    console.log(termsToNegate)

    return {
      ruleId: 'RULE_010',
      ruleName: 'Add Negative Keywords',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments: [
        {
          action: EAction.ADD_NEGATIVE,
          target: ETarget.TERMS
        }
      ],
      searchTerms: termsToNegate,
      reasoning:
        `Found ${termsToNegate.length} search terms with 20+ clicks or 200+ spend and zero sales. ` +
        `Adding ${termsToNegate.length} terms as negative exact/phrase keywords to reduce wasted spend.`,
    };
  }
}
