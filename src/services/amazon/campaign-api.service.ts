import { Injectable } from "@nestjs/common";
import { AmazonApiService, ReportPayload, } from "./amazon-api.service";
import { IAmazonAuth } from "src/interfaces/index.type";
import { CAMPAIGN_MATRICS, TARGETING_MATRICS, ADVERTISED_PRODUCT_METRICS } from "src/utils/constant";

export interface ICampaignFilter {
  state?: string[];
  campaignId?: string[];
  adGroupId?: string[];
  adId?: string[];
  keywordId?: string[];
}


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
      this.logger.error('Failed to get campaign ', error.response?.data);
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

  async generateCampaignReport(auth: IAmazonAuth, payload: ReportPayload) {
    const name = `campaign-${payload.scopeId}-${payload.startDate}-${payload.endDate}`;
    return this.generateReport(auth, { ...payload, name }, {
      reportTypeId: 'spCampaigns',
      groupBy: ["campaign"],
      columns: CAMPAIGN_MATRICS
    });
  }
  async generateAdGroupReport(auth: IAmazonAuth, payload: ReportPayload) {
    const name = `adGroup-${payload.scopeId}-${payload.startDate}-${payload.endDate}`;
    return this.generateReport(auth, { ...payload, name }, {
      reportTypeId: 'spCampaigns',
      groupBy: ["adGroup"],
      columns: CAMPAIGN_MATRICS
    });
  }
  async generateTargetingReport(auth: IAmazonAuth, payload: ReportPayload) {
    const name = `targeting-${payload.scopeId}-${payload.startDate}-${payload.endDate}`;
    return this.generateReport(auth, { ...payload, name }, {
      reportTypeId: 'spTargeting',
      groupBy: ["targeting"],
      columns: TARGETING_MATRICS
    });
  }

  async generateAdReport(auth: IAmazonAuth, payload: ReportPayload) {
    const name = `ad-${payload.scopeId}-${payload.startDate}-${payload.endDate}`;
    return this.generateReport(auth, { ...payload, name }, {
      reportTypeId: 'spAdvertisedProduct',
      groupBy: ["advertiser"],
      columns: ADVERTISED_PRODUCT_METRICS
    });
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
      const response = await this.httpClient.post(`/sp/campaigns/budget/usage`, { campaignIds }, this.authBuilder(auth))
      return response.data.success;
    } catch (error) {
      console.log(error, "data")
      this.logger.error(`Failed to get budget uses for campaign ${campaignIds.join(',')}`, error);
      throw error;
    }
  }


}