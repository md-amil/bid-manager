import {  ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { Type } from "src/schemas/campaign.schema";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { MatchType } from "src/schemas/keyword.schema";

/**
 * RULE 001: When to Add New Keywords (From Auto or Broad)
 * Indicators: 2+ sales, ACOS within target
 * Action: Add as Exact match, Add as Phrase match, Keep discovery campaign running at lower bid
 */

export class AddNewKeywordsFromDiscoveryRule extends BaseRule implements ICampaignRuleDecision {
  private adjustment: {
    ruleId: 'KEYWORD_MGMT_001',
    ruleName: 'Add High-Performing Keywords from Discovery',
  }
  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;

    const promisingKeywords = this.searchTerms.filter(st =>
      st.sales >= config.minSales &&
      this.calculateACOS(st) <= config.targetAcos &&
      st.searchTerm
    );

    return promisingKeywords.length > 0;
  }

  execute(): AdjustmentLog {

    const broad = this.searchTerms.filter(s=>s.matchType == MatchType.BROAD)
    const fromBroad = broad.filter(st =>
      st.sales >= config.minSales &&
      this.calculateACOS(st) <= config.targetAcos
    );

   // adding new keyword from broad match

      return {
      ruleId: 'KEYWORD_MGMT_001',
      ruleName: 'Add High-Performing Keywords from Discovery',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments: [
        {
          action: EAction.ADD_EXACT,
          target: ETarget.TERMS,
        },
        {
          action: EAction.ADD_PHRASE,
          target: ETarget.TERMS,
        },
      ],
      searchTerms:fromBroad,
      reasoning:
        `Found ${fromBroad.length} promising keywords with 2+ sales and acceptable ACOS. ` +
        `Recommend: Add to campaign as Exact match AND Phrase match. ` +
        `Keep discovery campaign running at lower bids to continue testing.`,
    };
  }
}
