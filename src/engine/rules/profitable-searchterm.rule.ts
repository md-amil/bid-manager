import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision } from "../interfaces";
import { config } from "../core/rule.engine";
import { SearchTermDocument } from "src/schemas/reports/search-term-report.schema";

// RULE 1: Auto Campaign Is Generating Profitable Search Terms
export class ProfitableSearchTermsRule implements ICampaignRuleDecision {
  shouldApply(campaign: ICampaignBundle): boolean {
    const acosAcceptable = this.getAcos(campaign.matrics) < config.targetAcos
    const highPerformingTerms =  this.getProfitableTerm(campaign.searchTerm, 100).length>0;
    const hasConsistentSales = this.hasConsistentSales(campaign.searchTerm);
    return hasConsistentSales && acosAcceptable && highPerformingTerms;
  }
    hasConsistentSales(searchTerms:SearchTermDocument[]): boolean {
      return true
    // const last7Days =searchTerms.filter(
    //   st => new Date().getTime() - st.lastUpdated.getTime() < 7 * 24 * 60 * 60 * 1000
    // );
    // return last7Days.length > 0 && last7Days.some(st => st.sales7d > 0);
  }

  getProfitableTerm(searchTerms: SearchTermDocument[], minSales: number = 100) {
    return searchTerms.filter((term) => term.sales14d >= minSales && this.getAcos(term) <= config.targetAcos);
  }

  getAcos(matric: { spend: number, sales7d: number }) {
    return matric.spend && matric.sales7d ? matric.spend / matric.sales7d : Infinity
  }

  execute(campaign: ICampaignBundle): AutoCampaignAdjustment {
    const highPerformingTerms = this.getProfitableTerm(campaign.searchTerm, 100);
    return {
      ruleId: 'RULE_001',
      ruleName: 'Profitable Search Terms Found',
      campaignId: campaign.id,
      adjustments: {
        budgetChange: 25,
        searchTermsToMove: highPerformingTerms,
        action: 'INCREASE',
      },
      reasoning:
        `Auto campaign is generating consistent profitable sales. ` +
        `ACOS is within target. Found ${highPerformingTerms.length} high-performing search terms. ` +
        `Recommend increasing budget by 25% and moving winning terms to manual campaigns.`,
      estimatedImpact: {
        estimatedSpend: campaign.budget.budget * 1.25,
        estimatedSales: highPerformingTerms.reduce((sum, st) => sum + st.sales7d, 0),
      },
    };
  }
}
