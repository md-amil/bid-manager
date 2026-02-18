import { Injectable } from "@nestjs/common";
import { AmazonApiService, ReportPayload } from "./amazon-api.service";

export interface IFilter {
    nextToken?: string;
    state?: string[];
    campaignId?: string[];
    adGroupId?: string[];
    adId?: string[];
    keywordId?: string[];
}

const COLUMNS = [
    "date",
    "attributedSalesSameSku1d",
    "attributedSalesSameSku7d",
    "attributedSalesSameSku14d",
    "attributedSalesSameSku30d",
    "unitsSoldClicks1d",
    "unitsSoldClicks7d",
    "unitsSoldClicks14d",
    "unitsSoldClicks30d",
    "sales7d",
    "sales14d",
    "purchases7d",
    "purchases14d",
    "impressions",
    "clicks",
    "cost",
    "currency",
    "keywordId",
    "keyword",
    "matchType",
    "topOfSearchImpressionShare"
]

const SEARCH_TERM_COLUMN = [
    "attributedSalesSameSku1d",
    "date",
    "roasClicks14d",
    "unitsSoldClicks1d",
    "matchType",
    "attributedSalesSameSku14d",
    "unitsSoldOtherSku14d",
    "sales7d",
    "attributedSalesSameSku30d",
    "salesOtherSku14d",
    "kindleEditionNormalizedPagesRoyalties14d",
    "searchTerm",
    "unitsSoldSameSku1d",
    "campaignStatus",
    "keyword",
    "purchasesSameSku7d",
    "salesOtherSku7d",
    "campaignBudgetAmount",
    "purchases7d",
    "unitsSoldSameSku30d",
    "costPerClick",
    "unitsSoldClicks14d",
    "adGroupName",
    "campaignId",
    "clickThroughRate",
    "purchaseClickRate14d",
    "kindleEditionNormalizedPagesRead14d",
    "unitsSoldClicks30d",
    "qualifiedBorrows",
    "acosClicks14d",
    "campaignBudgetCurrencyCode",
    "portfolioId",
    "unitsSoldClicks7d",
    "unitsSoldSameSku14d",
    "roasClicks7d",
    "keywordId",
    "attributedSalesSameSku7d",
    "royaltyQualifiedBorrows",
    "sales1d",
    "adGroupId",
    "addToList",
    "keywordBid",
    "targeting",
    "purchasesSameSku14d",
    "unitsSoldOtherSku7d",
    "spend",
    "purchasesSameSku1d",
    "campaignBudgetType",
    "keywordType",
    "purchases1d",
    "unitsSoldSameSku7d",
    "cost",
    "sales14d",
    "acosClicks7d",
    "sales30d",
    "impressions",
    "purchasesSameSku30d",
    "purchases14d",
    "purchases30d",
    "clicks",
    "campaignName",
    "adKeywordStatus"
];

@Injectable()
export class AdGroupApiService extends AmazonApiService {
    async getAdGroups(scopeId: string = this.scopeId, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/adGroups/list',
                this.filterBuilder(filter),
                this.scopeBuilder(scopeId)
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
                this.scopeBuilder(scopeId)
            )
            return response.data || {};
        } catch (error) {
            this.logger.error('Failed to get product ads', error.response?.data || error.message);
            throw error;
        }
    }

    async updateAdGroup(campaignId: string, data: any, scopeId: string = this.scopeId) {
        try {
            const response = await this.httpClient.put(`/sp/adGroups`,
                data, this.scopeBuilder(scopeId)
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to update campaign ${campaignId}`, error.response?.data || error.message);
            throw error;
        }
    }

    async getKeywords(scopeId: string = this.scopeId, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/keywords/list', this.filterBuilder(filter), this.scopeBuilder(scopeId))
            return response.data || {};
        } catch (error) {
            this.logger.error('Failed to get keywords', error.response?.data || error.message);
            throw error;
        }
    }

    async getNegativeKeywords(scopeId: string = this.scopeId, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/negativeKeywords/list', this.filterBuilder(filter), this.scopeBuilder(scopeId)
            )
            return response.data || {};
        } catch (error) {
            this.logger.error('Failed to get keywords', error.response?.data || error.message);
            throw error;
        }
    }

    async getTargets(scopeId: string = this.scopeId, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/targets/list', this.filterBuilder(filter), this.scopeBuilder(scopeId)
            )
            return response.data || {};
        } catch (error) {
            this.logger.error('Failed to get keywords', error.response?.data || error.message);
            throw error;
        }
    }

    async getNegativeTargets(scopeId: string = this.scopeId, filter = {} as IFilter) {
        try {
            const response = await this.httpClient.post(
                '/sp/negativeTargets/list', this.filterBuilder(filter), this.scopeBuilder(scopeId)
            )
            return response.data || {};
        } catch (error) {
            this.logger.error('Failed to get keywords', error.response?.data || error.message);
            throw error;
        }
    }

    async generateKeywordReport(payload: ReportPayload) {
        return this.generateReport(payload, {
            scopeId: payload.scopeId,
            reportTypeId: 'spKeywords',
            groupBy: ["adGroup"],
            columns: COLUMNS,
        });
    }

    async generateSearchTerm(payload) {
        return this.generateReport(payload, {
            scopeId: payload.scopeId,
            reportTypeId: 'spSearchTerm',
            groupBy: ["searchTerm"],
            columns: SEARCH_TERM_COLUMN,
        });
    }
}