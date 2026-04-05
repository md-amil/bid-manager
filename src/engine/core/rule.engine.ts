import { Injectable } from "@nestjs/common";
import { AutoCampaignAdjustment, ICampaignDetails, ICampaignRuleDecision, IMetrics, type ICampaignBundle } from "../interfaces";
import { ProfitableSearchTermsRule } from "../rules/auto/profitable-searchterm.rule";
import { NewProductLaunchRule } from "../rules/auto/launch-product.rule";
import { LimitedImpressionsHighConversionRule } from "../rules/auto/limited-impression-high-conversion.rule";
import { HighSpendPoorConversionRule } from "../rules/auto/high-spend-poor-conversion.rule";
import { ListingConversionIssuesRule } from "../rules/auto/listing-issue.rule";
import { NegativeKeywordRule } from "../rules/auto/search-term-vise/negative-keyword.rule";
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
import { CampaignService } from "src/services/campaign.service";
import { DataService } from "src/services/data.service";
import { buildQueryWindow } from "src/utils/query";
import { LowImpressionRule } from "../rules/auto/search-term-vise/low-impression.rule";

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
  constructor(private logService: AdjustmentLogService, private reportService: ReportService, private campaignService: CampaignService, private dataService: DataService) { }

  private runRuleEngine(
    rules: ICampaignRuleDecision[],
    scopeId: string
  ) {
    const adjustments: AdjustmentLog[] = []
    for (const rule of rules) {
      if (rule.shouldApply()) {
        const log = rule.execute() as AdjustmentLog;
        log.scopeId = scopeId;
        adjustments.push(log);
      }
    }

    this.logService.saveLogs(adjustments)
    console.dir({adjustments}, {depth: null})
  }

  async buildBundle(campaign: ICampaignDetails): Promise<ICampaignBundle> {
    const reports = await this.reportService.getBidReports(campaign.campaignId);
    const searchTerms = await this.reportService.getSearchTermReport(campaign.campaignId);
    const targetings = await this.dataService.getTargeting({ campaignId: campaign.campaignId }, buildQueryWindow(6))
    return {
      ...campaign,
      ...reports,
      targetings,
      searchTerms,
      budgetUsage: null
    };
  }



  async run(campaignId: string) {
    const campaign = await this.campaignService.findCampaignBundle(campaignId)
    if (campaign.state == 'PAUSED') return console.log(`campaign ${campaignId} is paused skipping...`)
    const bundle = await this.buildBundle(campaign);
    if (campaign.targetingType === Type.AUTO) return this.runAuto(bundle);
    return this.runManual(bundle);
  }

  runAuto(bundle: ICampaignBundle) {
    const autoCampaignRules = [
      ProfitableSearchTermsRule,
      NewProductLaunchRule,
      LimitedImpressionsHighConversionRule,
      HighSpendPoorConversionRule,
      ListingConversionIssuesRule,
      LowImpressionRule,
      NegativeKeywordRule,
      CloseMatchOptimizationRule,
      ComplementaryTargetingOptimizationRule,
      LooseMatchOptimizationRule,
      SubstituteTargetingOptimizationRule,
    ].map(Class => new Class(bundle))
    this.runRuleEngine(autoCampaignRules, bundle.scopeId)
  }

  runManual(bundle: ICampaignBundle) {
    const manuanCampaignRules = [
      //   //scaling rules
      // NewProductLaunchRule,
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
    ].map(Class => new Class(bundle))
    this.runRuleEngine(manuanCampaignRules, bundle.scopeId)
  }


  threeDaysAgo() {

  }

  sevenDaysAgo() {

  }


}

