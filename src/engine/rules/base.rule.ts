import { ICampaignBundle, IMetrics, keywordWithMetrics, TargetingType, TargetWithMetrics } from "src/engine/interfaces";
import { Campaign, Type } from "src/schemas/campaign.schema";
import { MatchType } from "src/schemas/keyword.schema";
// import { CampaignReport } from "src/schemas/reports/campaign-report";
import { AutoMatchType, SearchTermDocument } from "src/schemas/reports/search-term-report.schema";

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
    searchWindow:7,
}



export default class BaseRule {
    protected searchTerms: SearchTermDocument[]
    protected metrics7d: IMetrics
    protected metrics30d: IMetrics
    protected campaign: Campaign
    protected keywords: keywordWithMetrics[]
    protected targets: TargetWithMetrics[]
    protected budgetUsage: any

    constructor(bundle: ICampaignBundle) {
        const { searchTerms, budgetUsage, keywords, targets, metrics30d, metrics7d,...campaign } = bundle
        this.searchTerms = searchTerms
        this.metrics7d = metrics7d
        this.metrics30d = metrics30d
        this.targets = targets
        this.keywords = keywords
        this.campaign = campaign
        this.budgetUsage = budgetUsage
    }

    get metrics() {
        return this.metrics7d
    }

    get totalMetrics() {
        return this.metrics30d
    }
    

    get isLaunchPhase(): boolean {
        if(this.totalMetrics.cost < config.minSpend)return true
        return this.searchTerms.length == 0 && this.clicks <= config.minClicks && this.sales == 0
    }

    get acos(): number {
        return this.metrics.cost && this.metrics.sales ? this.metrics.cost / this.metrics.sales : Infinity
    }
    get roas(): number {
        return this.metrics.sales && this.metrics.cost ? this.metrics.sales / this.metrics.cost : 0
    }
    get roi(): number {
        const profit = this.sales - this.cost;
        return this.cost ? (profit / this.cost) * 100 : 0;
    }

    get cvr(): number {
        return this.metrics.clicks > 0 ? (this.metrics.purchase / this.metrics.clicks) * 100 : 0;
    }

    get ctr(): number {
        if (this.impressions === 0) return 0;
        return (this.clicks / this.impressions) * 100;
    }

    get impressions(): number {
        return this.metrics.impressions
    }

    get utilization(): number {
        if(this.campaign.budget.budget<=0) return 0
        return this.metrics.cost / this.campaign.budget.budget
    }

    get budget() {
        return this.campaign.budget.budget 
    }

    get clicks(): number {
        return this.metrics.clicks
    }

    get cost(): number {
        return this.metrics.cost
    }

    get sales(): number {
        return this.metrics.sales
    }
    get purchases(): number {
        return this.metrics.purchase
    }
    get keywordsIdText(): { keywordId: string, keywordText: string }[] {
        {
            console.log(this.keywords)
            return this.keywords?.map((keyword) => ({
                keywordId: keyword.keywordId,
                bid:keyword.bid,
                matchType:keyword.matchType,
                keywordText: keyword.keywordText,
            })) || []
        }
    }


    getUtilization(): number {
        return this.campaign.budget.budget > 0 ? this.metrics.cost / this.campaign.budget.budget : 0;
    }

    hasConsistentSales(): boolean {
        return true
        // const last7Days = searchTerms.filter(
        //   st => new Date().getTime() - st.lastUpdated.getTime() < 7 * 24 * 60 * 60 * 1000
        // );
        // return last7Days.length > 0 && last7Days.some(st => st.sales7d > 0);
    }

    minSpendThreshold() {
        const { cost, clicks, sales } = this.metrics;
        const avgCpc = clicks > 0 ? cost / clicks : 0;
        const cvr = clicks > 0 ? sales / clicks : 0;
        const expectedClicksBeforeJudgement = cvr > 0 ? Math.ceil((1 / cvr) * 1.5) : config.minSpend;
        return avgCpc * expectedClicksBeforeJudgement;
    }

    getSearchTerms(type: MatchType | AutoMatchType | TargetingType) {
        if (this.campaign.targetingType == Type.AUTO) return this.searchTerms.filter(term => term.keyword == type)
        return this.searchTerms.filter(term => term.matchType == type)
    }

    getTargeting(type?: TargetingType | TargetingType[]) {
        if (!type?.length) return this.targets
        if (Array.isArray(type)) return this.targets.filter(t => type.includes(t.metrics.targeting as TargetingType))
        return this.targets.filter(t => t.metrics.targeting == type)
    }

    getProfitableTerms(minSales: number = config.minSales) {
        return this.searchTerms.filter((term) => term.sales7d >= minSales && this.calculateACOS(term) <= config.targetAcos);
    }

    getLowPerformingSearchTerms() {
        return this.searchTerms.filter(st => st.clicks >= config.minClicks && st.cost >= config.minSpend && st.sales7d === 0)
        // return this.searchTerms.filter((term) => term.sales7d <= minSales && this.calculateACOS(term) >= config.targetAcos);
    }

    // Search terms with 20+ clicks OR 200+ spend and zero sales - for negative keyword rules
    getNegativeWorthySearchTerms() {
        return this.searchTerms.filter(st =>
            (st.clicks >= 20 || st.cost >= 200) && st.sales7d === 0
        );
    }

    // getAcos(matric?: { spend: number, sales7d: number }) {
    //     if (matric) return matric.spend && matric.sales7d ? matric.spend / matric.sales7d : Infinity
    //     return this.metrics.spend && this.metrics.sales7d ? this.metrics.spend / this.metrics.sales7d : Infinity
    // }


    calculateCTR({ clicks, impressions }: { clicks: number, impressions: number }): number {
        if (impressions === 0) return 0;
        return (clicks / impressions) * 100;
    }

    calculateCPC({ cost, clicks }: { cost: number, clicks: number }): number {
        if (clicks === 0) return 0;
        return cost / clicks;
    }

    calculateACOS(matric?: { cost: number, sales7d: number }): number {
        if (matric) return matric.cost && matric.sales7d ? matric.cost / matric.sales7d : Infinity;
        return this.metrics.cost && this.metrics.sales ? this.metrics.cost / this.metrics.sales : Infinity;
    }


    calculateCostPerOrder(spend: number, orders: number): number {
        if (orders === 0) return 0;
        return spend / orders;
    }

    calculateAOV(sales: number, orders: number): number {
        if (orders === 0) return 0;
        return sales / orders;
    }

}