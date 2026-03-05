import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { Type } from "src/schemas/campaign.schema";


/**
 * RULE 005: Negative Keyword Rule
 * Indicators: 20+ clicks OR 200+ spend, Zero sales, Irrelevant intent
 * Action: Add Negative Exact (if close intent), Add Negative Phrase (if irrelevant pattern)
 */
export class NegativeKeywordManualRule extends BaseRule implements ICampaignRuleDecision {

  constructor(bundle:ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;
    if (!this.metrics) return false;

    // const negativeKeywords = this.searchTerms.filter(st => 
    //   (st.clicks >=config.minClicks || st.spend >= config.minSpend) &&
    //   st.sales7d === 0
    // );
    const negativeKeywords = this.getLowPerformingSearchTerms();
    return negativeKeywords.length > 0;
  }

  execute(): AutoCampaignAdjustment {
    const negativeKeywords = this.getLowPerformingSearchTerms();
    const closeIntentKeywords = negativeKeywords.filter(st => 
      // Keywords that are closely related but not matching intent
      st.clicks < 50 && st.spend < 300
    );

    const irrelevantKeywords = negativeKeywords.filter(st => 
      // Keywords that are completely irrelevant
      st.clicks >= 50 || st.spend >= 300
    );

    const negativeExact = closeIntentKeywords.map(st => `-"${st.searchTerm}"`);
    const negativePhrase = irrelevantKeywords.map(st => `-${st.searchTerm}`);

    return {
      ruleId: 'KEYWORD_MGMT_005',
      ruleName: 'Add Negative Keywords',
      campaignId: this.campaign.campaignId,
      adjustments: {
        negativeKeywordsToAdd: [...negativeExact, ...negativePhrase],
        action: 'ADD_NEGATIVE',
      },
      reasoning:
        `Found ${negativeKeywords.length} keywords with 20+ clicks or 200+ spend but zero sales. ` +
        `Adding ${negativeExact.length} as Negative Exact (close intent) and ${negativePhrase.length} as Negative Phrase (irrelevant). ` +
        `This prevents future wasted spend on non-converting search variations.`,
      estimatedImpact: {
        estimatedSpend: negativeKeywords.reduce((sum, kw) => sum + kw.spend, 0) * -0.5,
        estimatedSales: 0, // Negative keywords don't generate sales
      },
    };
  }
}

