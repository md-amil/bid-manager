import {  AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import {  ICampaignBundle, ICampaignRuleDecision } from "../../interfaces";
import AutoCampaignBaseRule, { config } from "../base.rule";

export class ProfitableSearchTermsRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }
  
  shouldApply(): boolean {
    const acosAcceptable = this.acos < config.targetAcos
    const highPerformingTerms = this.getProfitableTerms().length > 0;
    const hasConsistentSales = this.hasConsistentSales();
    return hasConsistentSales && acosAcceptable && highPerformingTerms;
  }


  // getProfitableTerm(searchTerms: SearchTermDocument[], minSales: number = 100) {
  //   return searchTerms.filter((term) => term.sales14d >= minSales && this.getAcos(term) <= config.targetAcos);
  // }

  // getAcos(matric: { spend: number, sales7d: number }) {
  //   const acos =  matric.spend && matric.sales7d ? matric.spend / matric.sales7d : Infinity
  //   return acos;
  // }

  execute(): AdjustmentLog {
    const highPerformingTerms = this.getProfitableTerms();
    return {
      ruleId: 'RULE_001',
      ruleName: 'Profitable Search Terms Found',
      campaignId: this.campaign.campaignId,
      adjustments:[
        {
          action: EAction.INCREASE_BUDGET,
          change:this.campaign.budget.budget * 0.25
        },
        {
          action : EAction.MOVE,
          target : ETarget.TERMS
        }
      ],
      searchTerms : highPerformingTerms.map(term => ({term:term.searchTerm,keywordId:term.keywordId})),
      reasoning:
        `Auto campaign is generating consistent profitable sales. ` +
        `ACOS is within target. Found ${highPerformingTerms.length} high-performing search terms. ` +
        `Recommend increasing budget by 25% and moving winning terms to manual campaigns.`,
    };
  }
}
