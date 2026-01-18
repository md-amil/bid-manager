import { Injectable } from "@nestjs/common";
import { AmazonApiService } from "./amazon-api.service";

export interface IFilter {
    state?: string[];
    campaignId?: string[];
    adGroupId?: string[];
    adId?: string[];
    keywordId?: string[];
}


@Injectable()
export class AdGroupApiService extends AmazonApiService {
    async getAdGroups(scopeId: string = this.scopeId, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/adGroups/list',
                this.filterBuilder(filter),
                {
                    ...this.scopeBuilder(scopeId)
                }
            )
            return response.data.adGroups || [];
        } catch (error) {
            this.logger.error('Failed to get ad groups', error.response?.data || error.message);
            throw error;
        }
    }

    async getAds(scopeId: string = this.scopeId, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/productAds/list',
                this.filterBuilder(filter),
                {
                    ...this.scopeBuilder(scopeId)
                }
            )
            return response.data.productAds || [];
        } catch (error) {
            this.logger.error('Failed to get product ads', error.response?.data || error.message);
            throw error;
        }
    }

    async updateAdGroup(campaignId: string, data: any, scopeId: string = this.scopeId) {
        try {
            const response = await this.httpClient.put(`/sp/adGroups`, data, {
                ...this.scopeBuilder(scopeId)
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to update campaign ${campaignId}`, error.response?.data || error.message);
            throw error;
        }
    }

    async getKeywords(scopeId: string = this.scopeId, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/keywords/list', {}, {
                ...this.scopeBuilder(scopeId)
            })
            return response.data.keywords || [];
        } catch (error) {
            this.logger.error('Failed to get keywords', error.response?.data || error.message);
            throw error;
        }
    }

    async getNegativeKeywords(scopeId: string = this.scopeId, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/negativeKeywords/list', {}, {
                ...this.scopeBuilder(scopeId)
            })
            return response.data.negativeKeywords || [];
        } catch (error) {
            this.logger.error('Failed to get keywords', error.response?.data || error.message);
            throw error;
        }
    }

     async getTargets(scopeId: string = this.scopeId, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/targets/list', {}, {
                ...this.scopeBuilder(scopeId)
            })
            return response.data.targetingClauses || [];
        } catch (error) {
            this.logger.error('Failed to get keywords', error.response?.data || error.message);
            throw error;
        }
    }


    async getNegativeTargets(scopeId: string = this.scopeId, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/negativeTargets/list', {}, {
                ...this.scopeBuilder(scopeId)
            })
            return response.data.negativeTargetingClauses || [];
        } catch (error) {
            this.logger.error('Failed to get keywords', error.response?.data || error.message);
            throw error;
        }
    }




}