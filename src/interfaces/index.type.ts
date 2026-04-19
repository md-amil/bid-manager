import { Ad } from "src/schemas/ad.schema";
import { Campaign } from "src/schemas/campaign.schema";
import { SearchTermDocument } from "src/schemas/reports/search-term-report.schema";
import { Product } from "src/schemas/product.schema";

export interface IAmazonAuth{
    accessToken: string;
    scopeId:string
}

export interface IBudgetUsage{
    budget: number;
    budgetUsagePercent: number;
    campaignId: string;
    index: number;
    usageUpdatedTimestamp: string;
}

export interface DailyCampaignBundle{
    ads:(Ad & { product?: Product })[]
    campaign: Campaign;
    searchTerms:SearchTermDocument[]
    budgetUsage:IBudgetUsage;
    
}