import { Campaign } from "src/schemas/campaign.schema"
import { Keyword } from "src/schemas/keyword.schema"
import { AdjustmentLog } from "src/schemas/log.schema"
import { KeywordReport } from "src/schemas/reports/keyword-report.schema"
import { CampaignReport, } from "src/schemas/reports/campaign-report"
import { SearchTermDocument, SearchTermReport } from "src/schemas/reports/search-term-report.schema"
import { Target } from "src/schemas/target.schema"
import { TargetReport } from "src/schemas/reports/target-report.schema"
import { Targeting } from "src/interfaces/report.type"


export enum TargetingType {
    // AUTO = 'AUTO',
    CLOSE_MATCH = 'close-match',
    LOOSE_MATCH = 'loose-match',
    
    SUBSTITUTES = 'substitutes',
    COMPLEMENTS = 'complements',
    //manual
    PRODUCT_PAGE = 'PRODUCT_PAGE',
    PRODUCT_PAGE_PLACEMENT = 'PRODUCT_PAGE_PLACEMENT',
    TOP_OF_SEARCH = 'TOP_OF_SEARCH',
    REST_OF_SEARCH = 'REST_OF_SEARCH',
    // EXACT_MATCH = 'EXACT',
    // PHRASE_MATCH = 'PHRASE',
    // BROAD_MATCH = 'BROAD',
}

export interface RecommendationParams {
    keywordOrCampaign?: string
    action?: AdjustmentAction
    currentValue?: number
    recommendedValue?: number
    percentageChange?: number
    reason?: string
    priority?: number
    daysToMonitor?: number
}


export class AdjustmentAction {
    static INCREASE_BID = 'INCREASE_BID';
    static DECREASE_BID = 'DECREASE_BID';
    static INCREASE_BUDGET = 'INCREASE_BUDGET';
    static DECREASE_BUDGET = 'DECREASE_BUDGET';
    static PAUSE_CAMPAIGN = 'PAUSE_CAMPAIGN';
    static PAUSE_KEYWORD = 'PAUSE_KEYWORD';
    static ADD_NEGATIVE = 'ADD_NEGATIVE';
    static MOVE_TO_MANUAL = 'MOVE_TO_MANUAL';
    static REMOVE_KEYWORD = 'REMOVE_KEYWORD';
}


export class Recommendation {
    keywordOrCampaign: string
    action: AdjustmentAction
    currentValue: number
    recommendedValue: number
    percentageChange: number
    reason: string
    priority: number
    daysToMonitor: number
    constructor({
        keywordOrCampaign = '',
        action = AdjustmentAction.INCREASE_BID,
        currentValue = 0,
        recommendedValue = 0,
        percentageChange = 0,
        reason = '',
        priority = 2,
        daysToMonitor = 7
    }: RecommendationParams = {}) {
        this.keywordOrCampaign = keywordOrCampaign
        this.action = action
        this.currentValue = currentValue
        this.recommendedValue = recommendedValue
        this.percentageChange = percentageChange
        this.reason = reason
        this.priority = priority
        this.daysToMonitor = daysToMonitor
    }
}

export interface keywordWithMetrics extends Keyword {
    metrics: KeywordReport
}

export interface TargetWithMetrics extends Target {
    metrics: TargetReport
}

export interface ICampaignDetails extends Campaign {
    keywords: keywordWithMetrics[]
    targetings:Targeting[]
}
export interface IMetrics {
    impressions: number;
    purchase:number;
    clicks: number;
    cost: number;
    sales: number;
}

export interface ICampaignBundle extends ICampaignDetails {
    metrics30d:IMetrics
    metrics7d:IMetrics
    searchTerms: SearchTermDocument[]
    budgetUsage: any
}

export interface AutoCampaignAdjustment {
    ruleId: string;
    ruleName: string;
    campaignId: string;
    adjustments: {
        budgetChange?: number;
        bidChanges?: Array<{ targetingType: TargetingType; change: number }>;
        searchTermsToMove?: SearchTermReport[];
        negativeKeywordsToAdd?: string[];
        action: 'INCREASE' | 'DECREASE' | 'CONTROL' | 'MOVE' | 'ADD_NEGATIVE' | 'REMOVE';
    };
    reasoning: string;
    estimatedImpact?: {
        estimatedSpend?: number;
        estimatedSales?: number;
    };
}


export interface ICampaignRuleDecision {
    shouldApply(): boolean;
    execute(): AutoCampaignAdjustment|AdjustmentLog;
}



export interface IAutoRuleDecision{
    shouldApply(): boolean;
    execute(): AutoCampaignAdjustment;
}