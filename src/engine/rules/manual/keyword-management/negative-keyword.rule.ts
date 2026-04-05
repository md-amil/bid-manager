import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { Type } from "src/schemas/campaign.schema";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { Target } from "src/schemas/target.schema";
import { SearchTermDocument } from "src/schemas/reports/search-term-report.schema";


/**
 * RULE 005: Negative Keyword Rule
 * Indicators: 20+ clicks OR 200+ spend, Zero sales, Irrelevant intent
 * Action: Add Negative Exact (if close intent), Add Negative Phrase (if irrelevant pattern)
 */
export class NegativeKeywordManualRule extends BaseRule implements ICampaignRuleDecision {
  private terms: SearchTermDocument[]
  constructor(bundle: ICampaignBundle) {
    super(bundle);
    this.terms = this.getLowPerformingSearchTerms();
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;
    if (!this.metrics) return false;
    // const negativeKeywords = this.searchTerms.filter(st => 
    //   (st.clicks >=config.minClicks || st.spend >= config.minSpend) &&
    //   st.sales7d === 0
    // );

    // const negativeKeywords = this.getLowPerformingSearchTerms();
    return this.terms.length > 0;
  }

  execute(): AdjustmentLog {

    // rule apply on search term

    // const negativeKeywords = this.getLowPerformingSearchTerms();
    const closeIntentKeywords = this.terms.filter(st =>
      // Keywords that are closely related but not matching intent
      st.clicks < 50 && st.cost < 300
    );

    const irrelevantKeywords = this.terms.filter(st =>
      // Keywords that are completely irrelevant
      st.clicks >= 50 || st.cost >= 300
    );

    // const negativeExact = closeIntentKeywords.map(st => `-"${st.searchTerm}"`);
    // const negativePhrase = irrelevantKeywords.map(st => `-${st.searchTerm}`);

    return {
      ruleId: 'KEYWORD_MGMT_005',
      ruleName: 'Add Negative Keywords',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      
      adjustments: [
        {
          action: EAction.ADD_NEGATIVE_EXACT,
          target: ETarget.KEYWORDS
        },
        {
          action: EAction.ADD_NEGATIVE_PHARASE,
          target: ETarget.OTHER
        }
      ],
      keywords:closeIntentKeywords,
      searchTerms:irrelevantKeywords,

      reasoning:
        `Found ${this.terms.length} keywords with 20+ clicks or 200+ spend but zero sales. ` +
        `Adding ${closeIntentKeywords.length} as Negative Exact (close intent) and ${irrelevantKeywords.length} as Negative Phrase (irrelevant). ` +
        `This prevents future wasted spend on non-converting search variations.`,
    };
  }
}

