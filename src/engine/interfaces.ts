import { Campaign } from 'src/schemas/campaign.schema';
import { Keyword } from 'src/schemas/keyword.schema';
import { KeywordReport } from 'src/schemas/reports/keyword-report.schema';
import { CampaignReport } from 'src/schemas/reports/report.schema';

export interface RecommendationParams {
  keywordOrCampaign?: string;
  action?: AdjustmentAction;
  currentValue?: number;
  recommendedValue?: number;
  percentageChange?: number;
  reason?: string;
  priority?: number;
  daysToMonitor?: number;
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
  keywordOrCampaign: string;
  action: AdjustmentAction;
  currentValue: number;
  recommendedValue: number;
  percentageChange: number;
  reason: string;
  priority: number;
  daysToMonitor: number;
  constructor({
    keywordOrCampaign = '',
    action = AdjustmentAction.INCREASE_BID,
    currentValue = 0,
    recommendedValue = 0,
    percentageChange = 0,
    reason = '',
    priority = 2,
    daysToMonitor = 7,
  }: RecommendationParams = {}) {
    this.keywordOrCampaign = keywordOrCampaign;
    this.action = action;
    this.currentValue = currentValue;
    this.recommendedValue = recommendedValue;
    this.percentageChange = percentageChange;
    this.reason = reason;
    this.priority = priority;
    this.daysToMonitor = daysToMonitor;
  }
}

export interface keywordWithReport extends Keyword {
  keywordReports: KeywordReport;
}

export interface ICampaignBundle extends Campaign {
  campaignReport: CampaignReport;
  keywords: keywordWithReport[];
}
