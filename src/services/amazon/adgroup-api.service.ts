import { Injectable } from "@nestjs/common";
import { AmazonApiService, ReportPayload } from "./amazon-api.service";
import { IAmazonAuth } from "src/interfaces/index.type";
import { KEYWORD_MATRICS, SEARCH_TERM_MATRICS } from "src/utils/constant";

export interface IFilter {
    nextToken?: string;
    state?: string[];
    campaignId?: string[];
    adGroupId?: string[];
    adId?: string[];
    keywordId?: string[];
}


@Injectable()
export class AdGroupApiService extends AmazonApiService {
    async getAdGroups(auth: IAmazonAuth, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/adGroups/list',
                this.filterBuilder(filter),
                this.authBuilder(auth)
            )
            return response.data.adGroups || [];
        } catch (error) {
            this.logger.error('Failed to get ad groups', error.response?.data || error.message);
            throw error;
        }
    }

    async getAds(auth:IAmazonAuth, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/productAds/list',
                this.filterBuilder(filter),
                this.authBuilder(auth)
            )
            return response.data || {};
        } catch (error) {
            this.logger.error('Failed to get product ads', error.response?.data || error.message);
            throw error;
        }
    }

    async updateAdGroup(auth: IAmazonAuth, campaignId: string, data: any) {
        try {
            const response = await this.httpClient.put(`/sp/adGroups`,
                data, this.authBuilder(auth)
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to update campaign ${campaignId}`, error.response?.data || error.message);
            throw error;
        }
    }

    async getKeywords(auth: IAmazonAuth, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/keywords/list', this.filterBuilder(filter), this.authBuilder(auth))
            return response.data || {};
        } catch (error) {
            this.logger.error('Failed to get keywords', error.response?.data || error.message);
            throw error;
        }
    }

    async getNegativeKeywords(auth: IAmazonAuth, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/negativeKeywords/list', this.filterBuilder(filter), this.authBuilder(auth)
            )
            return response.data || {};
        } catch (error) {
            this.logger.error('Failed to get keywords', error.response?.data || error.message);
            throw error;
        }
    }

    async getTargets(auth: IAmazonAuth, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/targets/list', this.filterBuilder(filter), this.authBuilder(auth)
            )
            return response.data || {};
        } catch (error) {
            this.logger.error('Failed to get keywords', error.response?.data || error.message);
            throw error;
        }
    }

    async getNegativeTargets(auth: IAmazonAuth, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/negativeTargets/list', this.filterBuilder(filter), this.authBuilder(auth)
            )
            return response.data || {};
        } catch (error) {
            this.logger.error('Failed to get keywords', error.response?.data || error.message);
            throw error;
        }
    }

    
}