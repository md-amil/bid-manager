import { Injectable } from "@nestjs/common";
import { AmazonApiService, ReportPayload, } from "./amazon-api.service";
import { IAmazonAuth } from "src/interfaces/index.type";

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


const TARGETING_MATRICS =  [
    "impressions",
    "addToList",
    "qualifiedBorrows",
    "royaltyQualifiedBorrows",
    "clicks",
    "costPerClick",
    "clickThroughRate",
    "cost",
    "purchases1d",
    "purchases7d",
    "purchases14d",
    "purchases30d",
    "purchasesSameSku1d",
    "purchasesSameSku7d",
    "purchasesSameSku14d",
    "purchasesSameSku30d",
    "unitsSoldClicks1d",
    "unitsSoldClicks7d",
    "unitsSoldClicks14d",
    "unitsSoldClicks30d",
    "sales1d",
    "sales7d",
    "sales14d",
    "sales30d",
    "attributedSalesSameSku1d",
    "attributedSalesSameSku7d",
    "attributedSalesSameSku14d",
    "attributedSalesSameSku30d",
    "unitsSoldSameSku1d",
    "unitsSoldSameSku7d",
    "unitsSoldSameSku14d",
    "unitsSoldSameSku30d",
    "kindleEditionNormalizedPagesRead14d",
    "kindleEditionNormalizedPagesRoyalties14d",
    "salesOtherSku7d",
    "unitsSoldOtherSku7d",
    "acosClicks7d",
    "acosClicks14d",
    "roasClicks7d",
    "roasClicks14d",
    "keywordId",
    "keyword",
    "campaignBudgetCurrencyCode",
    "date",
    // "startDate",
    // "endDate",
    "portfolioId",
    "campaignName",
    "campaignId",
    "campaignBudgetType",
    "campaignBudgetAmount",
    "campaignStatus",
    "keywordBid",
    "adGroupName",
    "adGroupId",
    "keywordType",
    "matchType",
    "targeting",
    "topOfSearchImpressionShare"
  ]



@Injectable()
export class CampaignApiService extends AmazonApiService {
  async getCampaigns(auth: IAmazonAuth, filter = {} as ICampaignFilter) {
    try {
      const campaigns = await this.httpClient.post(`/sp/campaigns/list`,
        this.filterBuilder(filter),
        this.authBuilder(auth)
      );
      return campaigns.data?.campaigns;
    } catch (error) {
      this.logger.error('Failed to get campaign performance report', error.response?.data);
      throw error;
    }
  }

  async updateCampaign(campaignId: string, data: any, auth: IAmazonAuth) {
    try {
      const response = await this.httpClient.put(`/sp/campaigns`, data, {
        ...this.authBuilder(auth)
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update campaign ${campaignId}`, error.response?.data || error.message);
      throw error;
    }
  }

  async generateCampaignReport(auth: IAmazonAuth,payload: ReportPayload) {
    return this.generateReport(auth,payload, {
      reportTypeId: 'spCampaigns',
      groupBy: ["campaign"],  
      columns: CAMPAIGN_MATRICS
    });
  }
  async generateTargetingReport(auth: IAmazonAuth, payload: ReportPayload){
    return this.generateReport(auth,payload, {
      reportTypeId: 'spTargeting',
      groupBy: ["targeting"],  
      columns: TARGETING_MATRICS
    });
    // adProduct": "SPONSORED_PRODUCTS",
    //     "groupBy": [
    //         "targeting"
    //     ],
    //     "columns": [
    //         "adGroupId",
    //         "campaignId",
    //         "targeting",
    //         "keywordId",
    //         "matchType",
    //         "impressions",
    //         "clicks",
    //         "cost",
    //         "purchases1d",
    //         "purchases7d",
    //         "purchases14d",
    //         "purchases30d",
    //         "startDate",
    //         "endDate"
    //     ],
    //     "filters": [
    //         {
    //             "field": "keywordType",
    //             "values": [
    //                 "TARGETING_EXPRESSION",
    //                 "TARGETING_EXPRESSION_PREDEFINED"
    //             ]
    //         }
    //     ],
    //     "reportTypeId": "spTargeting",
    //     "timeUnit": "SUMMARY",
    //     "format": "GZIP_JSON"
  }

  // async getReports(auth: IAmazonAuth,reportId: string, ) {
  //   try {
  //     const response = await this.httpClient.get(`/reporting/reports/${reportId}`, 
  //       this.authBuilder(auth)
  //     );
  //     return response.data;
  //   } catch (error) {
  //     this.logger.error('Failed to get report', error.response?.data || error.message);
  //     throw error;
  //   }
  // }

  async getBudgetUses(campaignIds: string[], auth: IAmazonAuth) {
    try {
      const response = await this.httpClient.post(`/sp/campaigns/budget/usage`, {
        campaignIds: campaignIds
      }, this.authBuilder(auth)
      )
      // console.log(response.data)
      return response.data.success;
    } catch (error) {
      console.log(error,"data")
      this.logger.error(`Failed to get budget uses for campaign ${campaignIds.join(',')}`, error);
      throw error;
    }
  }


}