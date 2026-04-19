import { DailyCampaignBundle } from "src/interfaces/index.type";
import { Campaign } from "src/schemas/campaign.schema";
import { Ad } from "src/schemas/ad.schema";
import { Product } from "src/schemas/product.schema";

export const dailyConfig = {
    clickThreshold: 20,
    spendThreshold: 200,
    acosTarget: 0.30,
    roasTarget: 3,
}

export default class BaseDailyRule {
    protected campaign: Campaign;
    protected targets: any[];
    protected ads: (Ad & { product?: Product })[];
    protected searchTerms: any[];
    protected budgetUsage: any;

    constructor(bundle: DailyCampaignBundle) {
        this.campaign = bundle.campaign;
        this.ads = bundle.ads || [];
        this.searchTerms = bundle.searchTerms || [];
        this.budgetUsage = bundle.budgetUsage;
    }

    get hasAds(): boolean {
        return this.ads.length > 0;
    }

    get hasSearchTerms(): boolean {
        return this.searchTerms.length > 0;
    }

    getTargets(): any[] {
        return this.targets??[];
    }

    get totalCost(): number {
        return this.searchTerms.reduce((sum, st) => sum + (st.cost || 0), 0);
    }

    get totalSales(): number {
        return this.searchTerms.reduce((sum, st) => sum + (st.sales1d || st.sales || 0), 0);
    }

    get totalClicks(): number {
        return this.searchTerms.reduce((sum, st) => sum + (st.clicks || 0), 0);
    }

    get totalImpressions(): number {
        return this.searchTerms.reduce((sum, st) => sum + (st.impressions || 0), 0);
    }

    get acos(): number {
        return this.totalSales > 0 ? this.totalCost / this.totalSales : Infinity;
    }

    get roas(): number {
        return this.totalCost > 0 ? this.totalSales / this.totalCost : 0;
    }

    getAdsWithProduct(): (Ad & { product?: Product })[] {
        return this.ads;
    }

    getOutOfStockProducts(): Product[] {
        return this.ads
            .filter(ad => ad.product && ad.product.availability !== 'IN_STOCK')
            .map(ad => ad.product)
            .filter((p): p is Product => p !== undefined);
    }

    // Get search terms with high clicks but zero sales
    getLowPerformingSearchTerms(minClicks: number = dailyConfig.clickThreshold): any[] {
        return this.searchTerms.filter(st => 
            st.clicks >= minClicks && (st.sales1d || st.sales || 0) === 0
        );
    }
}
