import { ICampaignRuleDecision } from "src/engine/interfaces";
import BaseDailyRule, { dailyConfig } from "./base-daily.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";
import { DailyCampaignBundle } from "src/interfaces/index.type";

/**
 * RULE: Daily Negative Keyword Addition (Daily - 24 Hour)
 * Condition: Single search term gets 20+ clicks with 0 sales in one day
 * Action: Add as negative exact match to prevent repeat wasting
 * NOTE: Real-time quality control
 */
export class DailyNegativeKeywordDetectionRule extends BaseDailyRule implements ICampaignRuleDecision {

  constructor(bundle: DailyCampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.hasSearchTerms) return false;
    
    const badTerms = this.getLowPerformingSearchTerms(dailyConfig.clickThreshold);

    return badTerms.length > 0;
  }

  execute(): AdjustmentLog {
    const badTerms = this.getLowPerformingSearchTerms(dailyConfig.clickThreshold);

    const adjustments: Adjustment[] = [
      { action: EAction.ADD_NEGATIVE, target: ETarget.TERMS }
    ];

    return {
      ruleId: 'DAILY_004',
      ruleName: 'Daily Negative Keywords - Quality Control',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments,
      searchTerms: badTerms.map(st => ({
        searchTerm: st.searchTerm,
        clicks: st.clicks,
        cost: st.cost
      })),
      reasoning:
        `${badTerms.length} search term(s) with ${dailyConfig.clickThreshold}+ clicks, zero sales detected today. ` +
        `Adding to negative exact matches: ${badTerms.map(st => st.searchTerm).join(', ')}`,
    };
  }
}
