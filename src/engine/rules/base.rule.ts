import { ICampaignBundle, keywordWithReport, TargetingType } from "src/engine/interfaces";
import { Campaign } from "src/schemas/campaign.schema";
import { CampaignReport } from "src/schemas/reports/report.schema";
import { SearchTermDocument } from "src/schemas/reports/search-term-report.schema";

export const config = {
    targetAcos: 0.2,
    minSales: 100,
    minClicks: 20,
    minSpend: 200,
    minRoas: 5,
    minImpressions: 500,
    minCvr: 8,
    budgetUtilizationThreshold: 0.85,
    expectedConversionRate: 3,
}

export default class BaseRule {
    protected searchTerms: SearchTermDocument[]
    protected metrics: CampaignReport
    protected campaign: Campaign
    protected keywords:keywordWithReport[]
    protected budgetUsage: any

    constructor(bundle: ICampaignBundle) {
        const { searchTerms, matrics, budgetUsage, keywords, ...campaign } = bundle
        this.searchTerms = searchTerms
        this.metrics = matrics
        this.campaign = campaign
        this.budgetUsage = budgetUsage
    }
    get isLaunchPhase(): boolean {
        return this.searchTerms.length == 0 && this.clicks <= config.minClicks && this.sales == 0
    }

    get acos(): number {
        return this.metrics.spend && this.metrics.sales7d ? this.metrics.spend / this.metrics.sales7d : Infinity
    }
    get roas(): number {
        return this.metrics.sales7d && this.metrics.spend ? this.metrics.sales7d / this.metrics.spend : 0
    }
    get roi(): number {
        const profit = this.sales - this.spend;
        return this.spend ? (profit / this.spend) * 100 : 0;
    }

    get cvr(): number {
        return this.metrics.clicks > 0 ? (this.metrics.purchases7d / this.metrics.clicks) * 100 : 0;
    }

    get ctr() {
        if (this.impressions === 0) return 0;
        return (this.clicks / this.impressions) * 100;
    }

    get impressions() {
        return this.metrics.impressions
    }

    get utilization(): number {
        return this.campaign.budget.budget > 0 ? this.metrics.spend / this.campaign.budget.budget : 0;
    }

    get budget() {
        return this.campaign.budget.budget ?? this.metrics.campaignBudgetAmount
    }

    get clicks() {
        return this.metrics.clicks
    }

    get spend() {
        return this.metrics.spend
    }

    get sales() {
        return this.metrics.sales7d
    }
    get keywordsIdText(){{
        return this.keywords?.map((keyword) => ({ 
        keywordId: keyword.keywordId,
        keywordText: keyword.keywordText,
      }))||[]
    }}


    getUtilization(): number {
        return this.campaign.budget.budget > 0 ? this.metrics.spend / this.campaign.budget.budget : 0;
    }

    hasConsistentSales(): boolean {
        return true
        // const last7Days = searchTerms.filter(
        //   st => new Date().getTime() - st.lastUpdated.getTime() < 7 * 24 * 60 * 60 * 1000
        // );
        // return last7Days.length > 0 && last7Days.some(st => st.sales7d > 0);
    }

    minSpendThreshold() {
        const { spend, clicks, sales7d } = this.metrics;
        const avgCpc = clicks > 0 ? spend / clicks : 0;
        const cvr = clicks > 0 ? sales7d / clicks : 0;
        const expectedClicksBeforeJudgement = cvr > 0 ? Math.ceil((1 / cvr) * 1.5) : config.minSpend;
        return avgCpc * expectedClicksBeforeJudgement;
    }

    getSearchTerms(type: TargetingType) {
        return this.searchTerms.filter(term => term.matchType == type)
    }

    getProfitableTerms(minSales: number = config.minSales) {
        return this.searchTerms.filter((term) => term.sales7d >= minSales && this.calculateACOS(term) <= config.targetAcos);
    }

    getLowPerformingSearchTerms() {
        return this.searchTerms.filter(st => st.clicks >= config.minClicks && st.spend >= config.minSpend && st.sales7d === 0)
        // return this.searchTerms.filter((term) => term.sales7d <= minSales && this.calculateACOS(term) >= config.targetAcos);
    }

    // getAcos(matric?: { spend: number, sales7d: number }) {
    //     if (matric) return matric.spend && matric.sales7d ? matric.spend / matric.sales7d : Infinity
    //     return this.metrics.spend && this.metrics.sales7d ? this.metrics.spend / this.metrics.sales7d : Infinity
    // }


    calculateCTR({ clicks, impressions }: { clicks: number, impressions: number }): number {
        if (impressions === 0) return 0;
        return (clicks / impressions) * 100;
    }
    calculateCPC({ spend, clicks }: { spend: number, clicks: number }): number {
        if (clicks === 0) return 0;
        return spend / clicks;
    }

    calculateACOS(matric?: { spend: number, sales7d: number }): number {
        if (matric) return matric.spend && matric.sales7d ? matric.spend / matric.sales7d : Infinity;
        return this.metrics.spend && this.metrics.sales7d ? this.metrics.spend / this.metrics.sales7d : Infinity;
    }


    // calculateROAS(): number {
    //     if (this.matrics.spend === 0) return 0;
    //     return this.matrics.sales7d / this.matrics.spend;
    // }


    // calculateConversionRate(): number {
    //     if (this.metrics.clicks === 0) return 0;
    //     return (this.metrics.purchases7d / this.metrics.clicks) * 100;
    // }

    calculateCostPerOrder(spend: number, orders: number): number {
        if (orders === 0) return 0;
        return spend / orders;
    }

    calculateAOV(sales: number, orders: number): number {
        if (orders === 0) return 0;
        return sales / orders;
    }


    // calculateROI(sales: number, spend: number): number {
    //     const profit = sales - spend;
    //     if (spend === 0) return 0;
    //     return (profit / spend) * 100;
    // }
}