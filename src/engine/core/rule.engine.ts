import { Injectable } from "@nestjs/common";
import { AutoCampaignAdjustment, ICampaignRuleDecision, type ICampaignBundle } from "../interfaces";
import { TargetingType } from "src/schemas/campaign.schema";
import { ProfitableSearchTermsRule } from "../rules/profitable-searchterm.rule";
import { NewProductLaunchRule } from "../rules/launch-product.rule";
import { LimitedImpressionsHighConversionRule } from "../rules/limited-impression-high-conversion.rule";
import { HighSpendPoorConversionRule } from "../rules/high-spend-poor-conversion.rule";
import { ListingConversionIssuesRule } from "../rules/listing-issue.rule";
import { NegativeKeywordRule } from "../rules/negative-keyword.rule";
// import { CloseMatchOptimizationRule, ComplementaryTargetingOptimizationRule, LooseMatchOptimizationRule, SubstituteTargetingOptimizationRule } from "../rules/search-term.rules";


export const config = {
  targetAcos: parseFloat(process.env.TARGET_ACOS || '0.30'),
  minClicks: parseInt(process.env.MIN_SAMPLE_CLICKS || '20'),
  minSpend: parseFloat(process.env.MIN_SAMPLE_SPEND || '200'),
  fallbackClicks: 20,
  minImpressions: 1000,
  minCvr: 0.08,
  // minSpendThreshold:parseFloat(process.env.MIN_THRESOLD_SPEND||)
}


// @Injectable()
export default class Engine {
  private adjustments: AutoCampaignAdjustment[] = []
  constructor(private bundle: ICampaignBundle) { }

  private runRuleEngine(
    rules: ICampaignRuleDecision[],
  ) {

    for (const rule of rules) {
      if (rule.shouldApply(this.bundle)) {
        const adjustment = rule.execute(this.bundle);
        this.adjustments.push(adjustment);
      }
    }
    
  }


  async run(bundle: ICampaignBundle) {
    if (bundle.state == 'PAUSED') return console.log("campaign is paused skipping...")
    if (bundle.targetingType === TargetingType.AUTO) return this.runAuto();
    return this.runManual();
  }

  runBySearchTerm() {
    const rules = [
      // new CloseMatchOptimizationRule(),
      // new LooseMatchOptimizationRule(),
      // new SubstituteTargetingOptimizationRule(),
      // new ComplementaryTargetingOptimizationRule(),
    ]
  }

  runAuto() {
    const autoCampaignRules = [
      new ProfitableSearchTermsRule(),
      new NewProductLaunchRule(),
      new LimitedImpressionsHighConversionRule(),
      new HighSpendPoorConversionRule(),
      new ListingConversionIssuesRule(),
      new NegativeKeywordRule(),
    ]
    this.runRuleEngine(autoCampaignRules)
  }

  runManual() {
    const manuanCampaignRules = [
      // new ProfitableSearchTermsRule(),
      // new NewProductLaunchRule(),
      // new LimitedImpressionsHighConversionRule(),
      // new HighSpendPoorConversionRule(),
      // new ListingConversionIssuesRule(),
      // new CloseMatchOptimizationRule(),
      // new LooseMatchOptimizationRule(),
      // new SubstituteTargetingOptimizationRule(),
      // new ComplementaryTargetingOptimizationRule(),
      // new NegativeKeywordRule(),
    ]
    this.runRuleEngine(manuanCampaignRules)
  }
}

