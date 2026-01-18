import { Injectable } from "@nestjs/common";
import { AmazonApiService,  } from "./amazon-api.service";

export interface ICampaignFilter {
  state?: string[];
  campaignId?: string[];
  adGroupId?: string[];
  adId?: string[];
  keywordId?: string[];
}
const CAMPAIGN_MATRICS = [
  "attributedSalesSameSku1d",
  "date",
  "campaignBiddingStrategy",
  "roasClicks14d",
  "unitsSoldClicks1d",
  "attributedSalesSameSku7d",
  "attributedSalesSameSku14d",
  "royaltyQualifiedBorrows",
  "sales1d",
  "sales7d",
  "addToList",
  "attributedSalesSameSku30d",
  "purchasesSameSku14d",
  "kindleEditionNormalizedPagesRoyalties14d",
  "purchasesSameSku1d",
  "spend",
  "unitsSoldSameSku1d",
  "purchases1d",
  "purchasesSameSku7d",
  "unitsSoldSameSku7d",
  "purchases7d",
  "unitsSoldSameSku30d",
  "cost",
  "costPerClick",
  "unitsSoldClicks14d",
  "retailer",
  "sales14d",
  "sales30d",
  "clickThroughRate",
  "impressions",
  "kindleEditionNormalizedPagesRead14d",
  "purchasesSameSku30d",
  "purchases14d",
  "unitsSoldClicks30d",
  "qualifiedBorrows",
  "acosClicks14d",
  "purchases30d",
  "clicks",
  "unitsSoldClicks7d",
  "unitsSoldSameSku14d",
  "campaignRuleBasedBudgetAmount",
  "campaignBudgetCurrencyCode",
  "campaignId",
  "campaignApplicableBudgetRuleId",
  "campaignBudgetType",
  "topOfSearchImpressionShare",
  "campaignStatus",
  "campaignName",
  "campaignApplicableBudgetRuleName",
  "campaignBudgetAmount"
];

interface ReportPayload {
  scopeId: string;
  name: string;
  startDate: string;
  endDate: string;
}

@Injectable()
export class CampaignApiService extends AmazonApiService{
 async getCampaigns(scopeId: string = this.scopeId, filter = {} as ICampaignFilter) {
    try {
      const campaigns = await this.httpClient.post(`/sp/campaigns/list`,
        this.filterBuilder(filter), {
        ...this.scopeBuilder(scopeId)
      });
      return campaigns.data?.campaigns;
    } catch (error) {
      this.logger.error('Failed to get campaign performance report', error.response?.data);
      throw error;
    }
  }

   async generateReport(payload: ReportPayload) {
    try {
      const response = await this.httpClient.post(
        '/reporting/reports',
        {
          "configuration": {
            "adProduct": "SPONSORED_PRODUCTS",
            "reportTypeId": "spCampaigns",
            "groupBy": ["campaign"],
            "columns": CAMPAIGN_MATRICS,
            "timeUnit": "DAILY",
            "format": "GZIP_JSON"
          },
          ...payload,
        },
        {
          ...this.scopeBuilder(payload.scopeId)
        }
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to generate report', error.response?.data || error.message);
      throw error;
    }
  }

  async getReports(reportId: string){
    try {
      const response = await this.httpClient.get(`/reporting/reports/${reportId}`, {
          ...this.scopeBuilder()
        });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get report', error.response?.data || error.message);
      throw error;
    }
  }
}