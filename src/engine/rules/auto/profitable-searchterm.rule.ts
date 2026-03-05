import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision } from "../../interfaces";
import AutoCampaignBaseRule, { config } from "../base.rule";

export class ProfitableSearchTermsRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {
  constructor (bundle:ICampaignBundle){
    super(bundle)
  }
  shouldApply(): boolean {
    const acosAcceptable = this.acos < config.targetAcos
    const highPerformingTerms =  this.getProfitableTerms().length>0;
    const hasConsistentSales = this.hasConsistentSales();
    console.log(`ProfitableSearchTermsRule: shouldApply check - ACOS acceptable: ${acosAcceptable}, has consistent sales: ${hasConsistentSales}, high performing terms: ${highPerformingTerms}`);
    return hasConsistentSales && acosAcceptable && highPerformingTerms;
  }
   

  // getProfitableTerm(searchTerms: SearchTermDocument[], minSales: number = 100) {
  //   return searchTerms.filter((term) => term.sales14d >= minSales && this.getAcos(term) <= config.targetAcos);
  // }

  // getAcos(matric: { spend: number, sales7d: number }) {
  //   const acos =  matric.spend && matric.sales7d ? matric.spend / matric.sales7d : Infinity
  //   return acos;
  // }

  execute(): AutoCampaignAdjustment {
    const highPerformingTerms = this.getProfitableTerms();
    return {
      ruleId: 'RULE_001',
      ruleName: 'Profitable Search Terms Found',
      campaignId: this.campaign.campaignId,
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
        estimatedSpend: this.campaign.budget.budget * 1.25,
        estimatedSales: highPerformingTerms.reduce((sum, st) => sum + st.sales7d, 0),
      },
    };
  }
}
