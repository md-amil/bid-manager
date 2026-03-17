import { Injectable } from "@nestjs/common";
import { AmazonApiService, ReportPayload, } from "./amazon-api.service";
import { IAmazonAuth } from "src/interfaces/index.type";
import { CAMPAIGN_MATRICS, TARGETING_MATRICS, ADVERTISED_PRODUCT_METRICS, KEYWORD_MATRICS, SEARCH_TERM_MATRICS, ADGROUP_MATRICS } from "src/utils/constant";


@Injectable()
export class ReportApiService extends AmazonApiService {

    async generateCampaign(auth: IAmazonAuth, payload: ReportPayload) {
        const name = `campaign-${payload.scopeId}-${payload.startDate}-${payload.endDate}`;

        return this.generateReport(auth, { ...payload, name }, {
            reportTypeId: 'spCampaigns',
            groupBy: ["campaign"],
            columns: CAMPAIGN_MATRICS
        });
    }

    async generateAdGroup(auth: IAmazonAuth, payload: ReportPayload) {
        const name = `adGroup-${payload.scopeId}-${payload.startDate}-${payload.endDate}`;
        return this.generateReport(auth, { ...payload, name }, {
            reportTypeId: 'spCampaigns',
            groupBy: ["adGroup"],
            columns: ADGROUP_MATRICS
        });
    }

    async generateTargeting(auth: IAmazonAuth, payload: ReportPayload) {
        const name = `targeting-${payload.scopeId}-${payload.startDate}-${payload.endDate}`;
        return this.generateReport(auth, { ...payload, name }, {
            reportTypeId: 'spTargeting',
            groupBy: ["targeting"],
            columns: TARGETING_MATRICS
        });
    }

    async generateAd(auth: IAmazonAuth, payload: ReportPayload) {
        const name = `ad-${payload.scopeId}-${payload.startDate}-${payload.endDate}`;
        return this.generateReport(auth, { ...payload, name }, {
            reportTypeId: 'spAdvertisedProduct',
            groupBy: ["advertiser"],
            columns: ADVERTISED_PRODUCT_METRICS
        });
    }

    async generateKeyword(auth: IAmazonAuth, payload: ReportPayload) {
        const name = `keyword-${payload.scopeId}-${payload.startDate}-${payload.endDate}`;
        return this.generateReport(auth, { ...payload, name }, {
            scopeId: payload.scopeId,
            reportTypeId: 'spKeywords',
            groupBy: ["adGroup"],
            columns: KEYWORD_MATRICS,
        });
    }

    async generateSearchTerm(auth: IAmazonAuth, payload) {
        const name = `searchTerm-${payload.scopeId}-${payload.startDate}-${payload.endDate}`;
        return this.generateReport(auth, { ...payload, name }, {
            scopeId: payload.scopeId,
            reportTypeId: 'spSearchTerm',
            groupBy: ["searchTerm"],
            columns: SEARCH_TERM_MATRICS,
        });
    }


    async getBudgetUses(campaignIds: string[], auth: IAmazonAuth) {
        try {
            const response = await this.httpClient.post(`/sp/campaigns/budget/usage`, { campaignIds }, this.authBuilder(auth))
            return response.data.success;
        } catch (error) {
            this.logger.error(`Failed to get budget uses for campaign ${campaignIds.join(',')}`, error);
            throw error;
        }
    }

}