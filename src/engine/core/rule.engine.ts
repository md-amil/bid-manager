import { Injectable } from "@nestjs/common";
import { AutoCampaignAdjustment, ICampaignDetails, ICampaignRuleDecision, IMetrics, type ICampaignBundle } from "../interfaces";
import { ProfitableSearchTermsRule } from "../rules/auto/profitable-searchterm.rule";
import { NewProductLaunchRule } from "../rules/auto/launch-product.rule";
import { LimitedImpressionsHighConversionRule } from "../rules/auto/limited-impression-high-conversion.rule";
import { HighSpendPoorConversionRule } from "../rules/auto/high-spend-poor-conversion.rule";
import { ListingConversionIssuesRule } from "../rules/auto/listing-issue.rule";
import { NegativeKeywordRule } from "../rules/auto/negative-keyword.rule";
import { BudgetExhaustionManualCampaignRule } from "../rules/manual/scale/budget-exhaust.rule";
import { CompetitorASINTargetingConvertingRule } from "../rules/manual/scale/competitor-asin-target-converting.rule";
import { LowImpressionsHighConversionManualRule } from "../rules/manual/scale/low-impression-high-conversion.rule";
import { ProfitableManualCampaignScalingRule } from "../rules/manual/scale/profitable-scaling.rule";
import { TopOfSearchPerformanceManualRule } from "../rules/manual/scale/top-search-performing-better.rule";
import { BudgetWastageManualRule } from "../rules/manual/control/budget-wastage.rule";
import { HighAcosManualReductionRule } from "../rules/manual/control/high-acos-reducing.rule";
import { HighSpendZeroSalesManualRule } from "../rules/manual/control/high-spend-zero-sale.rule";
import { ListingConversionIssueManualRule } from "../rules/manual/control/listing-conversion-issue.rule";
import { ModerateACOSWithSalesManualRule } from "../rules/manual/control/modrate-acos-with-sale.rule";
import { Type } from "src/schemas/campaign.schema";
import { LooseMatchOptimizationRule } from "../rules/auto/search-term-vise/loose-match.rule";
import { CloseMatchOptimizationRule } from "../rules/auto/search-term-vise/close-match.rule";
import { ComplementaryTargetingOptimizationRule } from "../rules/auto/search-term-vise/complementary-targeting.rule";
import { SubstituteTargetingOptimizationRule } from "../rules/auto/search-term-vise/substitute-targeting.rule";
import { AdjustmentLog } from "src/schemas/log.schema";
import { AdjustmentLogService } from "src/services/log.service";
import { ReportService } from "src/services/report.service";

// export const config = {
// targetAcos: parseFloat(process.env.TARGET_ACOS || '0.2'),
// minClicks: parseInt(process.env.MIN_SAMPLE_CLICKS || '20'),
// minSpend: parseFloat(process.env.MIN_SAMPLE_SPEND || '200'),
// minSales: 100,
// fallbackClicks: 20,
// minImpressions: 1000,
// minCvr: 0.08,
// budgetUtilizationThreshold: 0.85
// minSpendThreshold:parseFloat(process.env.MIN_THRESOLD_SPEND||)
// }


@Injectable()
export default class Engine {
  constructor(private logService: AdjustmentLogService, private reportService: ReportService) { }

  private runRuleEngine(
    rules: ICampaignRuleDecision[],
  ) {
    const adjustments: AdjustmentLog[] = []
    for (const rule of rules) {
      if (rule.shouldApply()) {
        adjustments.push(rule.execute() as AdjustmentLog);
      }
    }
    this.logService.saveLogs(adjustments)
    console.log(adjustments, "adjustment")
  }

  async buildBundle(campaign: ICampaignDetails): Promise<ICampaignBundle> {
    const reports = await this.reportService.getBidReports(campaign.campaignId);
    const searchTerms = await this.reportService.getSearchTermReport(campaign.campaignId);
    // const budgetUsage = await this.reportService.getBudgetUsage(campaign.campaignId);
    return { 
      ...campaign, 
      ...reports, 
      searchTerms,
      budgetUsage: null 
    };
  }



  async run(campaign: ICampaignDetails) {
    if (campaign.state == 'PAUSED') return console.log("campaign is paused skipping...")
    const reports = await this.reportService.getBidReports(campaign.campaignId);
    const bundle = await this.buildBundle(campaign);
    if (campaign.targetingType === Type.AUTO) return this.runAuto(bundle);
    return this.runManual(campaign, reports);
  }

  runAuto(bundle: ICampaignBundle) {
    const autoCampaignRules = [
      ProfitableSearchTermsRule,
      NewProductLaunchRule,
      LimitedImpressionsHighConversionRule,
      HighSpendPoorConversionRule,
      ListingConversionIssuesRule,
      NegativeKeywordRule,
      CloseMatchOptimizationRule,
      ComplementaryTargetingOptimizationRule,
      LooseMatchOptimizationRule,
      SubstituteTargetingOptimizationRule
    ].map(Class => new Class(bundle))
    this.runRuleEngine(autoCampaignRules)
  }

  runManual(bundle: ICampaignDetails, reports: any) {
    return
    const manuanCampaignRules = [
      //   //scaling rules
      NewProductLaunchRule,
      BudgetExhaustionManualCampaignRule,
      CompetitorASINTargetingConvertingRule,
      LowImpressionsHighConversionManualRule,
      ProfitableManualCampaignScalingRule,
      TopOfSearchPerformanceManualRule,
      // control rules
      BudgetWastageManualRule,
      HighAcosManualReductionRule,
      HighSpendZeroSalesManualRule,
      ListingConversionIssueManualRule,
      ModerateACOSWithSalesManualRule,
      //    kewyword management rules
      //    AddNewKeywordsFromDiscoveryRule,
      //    BroadKeywordScalingRule,
      //    DuplicateKeywordCleanupRule,
      //    NegativeKeywordManualRule,
      //    PhraseKeywordToExactRule
    ].map(Class => new Class({ ...bundle, ...reports }))
    this.runRuleEngine(manuanCampaignRules)
  }


  threeDaysAgo() {

  }

  sevenDaysAgo() {

  }


}

