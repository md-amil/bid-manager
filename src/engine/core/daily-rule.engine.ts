import { Injectable } from "@nestjs/common";
import { AutoCampaignAdjustment, ICampaignDetails, ICampaignRuleDecision, IMetrics, type ICampaignBundle, ISearchTerm } from "../interfaces";
// import { ProfitableSearchTermsRule } from "../rules/auto/profitable-searchterm.rule";
// import { NewProductLaunchRule } from "../rules/auto/launch-product.rule";
// import { LimitedImpressionsHighConversionRule } from "../rules/auto/limited-impression-high-conversion.rule";
// import { HighSpendPoorConversionRule } from "../rules/auto/high-spend-poor-conversion.rule";
// import { ListingConversionIssuesRule } from "../rules/auto/listing-issue.rule";
// import { NegativeKeywordRule } from "../rules/negative-keyword.rule";
// import { BudgetExhaustionManualCampaignRule } from "../rules/manual/scale/budget-exhaust.rule";
// import { CompetitorASINTargetingConvertingRule } from "../rules/manual/scale/competitor-asin-target-converting.rule";
// import { LowImpressionsHighConversionManualRule } from "../rules/manual/scale/low-impression-high-conversion.rule";
// import { ProfitableManualCampaignScalingRule } from "../rules/manual/scale/profitable-scaling.rule";
// import { TopOfSearchPerformanceManualRule } from "../rules/manual/scale/top-search-performing-better.rule";
// import { BudgetWastageManualRule } from "../rules/manual/control/budget-wastage.rule";
// import { HighAcosManualReductionRule } from "../rules/manual/control/high-acos-reducing.rule";
// import { HighSpendZeroSalesManualRule } from "../rules/manual/control/high-spend-zero-sale.rule";
// import { ListingConversionIssueManualRule } from "../rules/manual/control/listing-conversion-issue.rule";
// import { ModerateACOSWithSalesManualRule } from "../rules/manual/control/modrate-acos-with-sale.rule";
// import { Campaign, Type } from "src/schemas/campaign.schema";
// import { LooseMatchOptimizationRule } from "../rules/auto/search-term-vise/loose-match.rule";
// import { CloseMatchOptimizationRule } from "../rules/auto/search-term-vise/close-match.rule";
// import { ComplementaryTargetingOptimizationRule } from "../rules/auto/search-term-vise/complementary-targeting.rule";
// import { SubstituteTargetingOptimizationRule } from "../rules/auto/search-term-vise/substitute-targeting.rule";
// import { AdjustmentLog } from "src/schemas/log.schema";
import { AdjustmentLogService } from "src/services/log.service";
import { ReportService } from "src/services/report.service";
import { CampaignService } from "src/services/campaign.service";
import { DataService } from "src/services/data.service";
// import { buildQueryWindow } from "src/utils/query";
// import { LowImpressionRule } from "../rules/auto/search-term-vise/low-impression.rule";
// import { NegativeKeywordManualRule } from "../rules/manual/keyword-management/negative-keyword.rule";
import { DailyBudgetExhaustionRule } from "../rules/monitoring/daily/daily-budget-exhaust.rule";
import { DailyNegativeKeywordDetectionRule } from "../rules/monitoring/daily/daily-negative-key-detection.rule";
import { DailyASINOutOfStockRule } from "../rules/monitoring/daily/daily-out-of-stock.rule";
import { DailyPerformanceAlertRule } from "../rules/monitoring/daily/daily-performance-alert.rule";
import { DailySpendSpikeRule } from "../rules/monitoring/daily/daily-spend-spike.rule";
import { DailyCampaignBundle, IAmazonAuth } from "src/interfaces/index.type";
import { CampaignApiService } from "src/services/amazon/campaign-api.service";
import { AdjustmentLog } from "src/schemas/log.schema";

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
export default class DailyRuleEngine {
    constructor(
        private logService: AdjustmentLogService,
        private reportService: ReportService,
        private campaignService: CampaignService,
        private dataService: DataService,
        private campaignApi: CampaignApiService,
    ) { }

    async run(auth: IAmazonAuth) {
        const bundles = await this.buildBundle(auth);
        bundles.forEach(bundle => this.optimiseCampaign(bundle, auth));
    }

    async buildBundle(auth: IAmazonAuth): Promise<DailyCampaignBundle[]> {
        const campaigns = await this.campaignService.getCampaignBy({ scopeId: auth.scopeId,state:'ENABLED' } as any, ['ads']);
        const campaignIds = campaigns.map(campaign => campaign.campaignId);
        const budgetUsage = await this.campaignApi.getBudgetUses(campaignIds, auth);
        const searchTerms = await this.reportService.getSearchTermsByCampaignIds(campaignIds);
        
        // Get all ASINs from all ads across all campaigns
        const allAsins = campaigns.flatMap(campaign => 
            campaign.ads?.map(ad => ad.asin)
        ).filter(Boolean);
        
        const productMap = await this.dataService.getProductsByAsins(allAsins);
        const campaignBundles = campaigns.map(campaign => ({
            campaign,
            ads: campaign.ads?.map(ad => ({
                ...ad,
                product: productMap[ad.asin]
            })),
            budgetUsage: budgetUsage[campaign.campaignId],
            searchTerms: searchTerms[campaign.campaignId],
        }));
        return campaignBundles as DailyCampaignBundle[];
    }



    async optimiseCampaign(bundle: DailyCampaignBundle, auth: IAmazonAuth) {
        const dailyRules = [
            DailyBudgetExhaustionRule,
            DailyNegativeKeywordDetectionRule,
            DailyASINOutOfStockRule,
        ].map(Class => new Class(bundle))
        const adjustments: AdjustmentLog[] = []
        for (const rule of dailyRules) {
            if (rule.shouldApply()) {
                const log = rule.execute() as AdjustmentLog;
                log.scopeId = auth.scopeId;
                adjustments.push(log);
            }
        }
        this.logService.saveLogs(adjustments)
    }

}

