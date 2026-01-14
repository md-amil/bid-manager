import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import axios, { AxiosInstance, head } from 'axios';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AmazonProfile {
  profileId: number;
  countryCode: string;
  currencyCode: string;
  dailyBudget?: number;
  timezone: string;
  accountInfo: {
    marketplaceStringId: string;
    id: string;
    type: 'seller' | 'vendor' | 'agency';
    name: string;
    validPaymentMethod?: boolean;
  };
}

interface ICampaignFilter {
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
export class AmazonApiService {
  private readonly logger = new Logger(AmazonApiService.name);
  private httpClient: AxiosInstance;
  private accessToken: string;
  private tokenExpiresAt: number;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;
  private readonly scopeId: string;
  private readonly tokenUrl: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('AMAZON_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('AMAZON_CLIENT_SECRET') || '';
    this.refreshToken = this.configService.get<string>('AMAZON_REFRESH_TOKEN') || '';
    this.scopeId = this.configService.get<string>('AMAZON_PROFILE_ID') || '';
    this.tokenUrl = this.configService.get<string>('AMAZON_TOKEN_URL', 'https://api.amazon.com/auth/o2/token');
    if (!this.clientId || !this.clientSecret || !this.refreshToken || !this.scopeId) {
      this.logger.warn('Amazon API credentials not configured. Please set AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET, AMAZON_REFRESH_TOKEN, and AMAZON_PROFILE_ID in your .env file');
    }
    this.httpClient = this.createClient();
  }

  private createClient(session?: any) {
    const baseURL = this.configService.get<string>('AMAZON_ADVERTISING_API_URL', 'https://advertising-api-eu.amazon.com');
    const client = axios.create({
      baseURL,
      headers: {
        'Accept': 'application/vnd.spCampaign.v3+json',
        'Content-Type': 'application/vnd.spcampaign.v3+json',
        'Amazon-Advertising-API-ClientId': this.clientId
      },
    });

    client.interceptors.request.use(async (request) => {
      const accept = {
        'campaigns': 'application/vnd.spCampaign.v3+json',
        'adGroups': 'application/vnd.spadGroup.v3+json',
        'productAds': 'application/vnd.spproductAd.v3+json',
        'keywords': 'application/vnd.spkeyword.v3+json',
      }[request.url!.split('/')[2]] ?? 'application/json'

      if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
        await this.refreshAccessToken();
      }
      request.headers['Authorization'] = `Bearer ${this.accessToken}`
      request.headers['Content-Type'] = accept
      request.headers['Accept'] = accept
      return request
    }, (error) => Promise.reject(error))
    return client
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const response = await axios.post<TokenResponse>(
        this.tokenUrl,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;
      this.logger.log('Access token refreshed successfully');
    } catch (error) {
      this.logger.error('Failed to refresh access token', error.response?.data || error.message);
      // throw new Error('Failed to authenticate with Amazon Advertising API');
    }
  }

  async getProfiles(): Promise<AmazonProfile[]> {
    try {
      const response = await this.httpClient.get('/v2/profiles')
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get profiles', error);
      throw error;
    }
  }

  private filterBuilder(filter: ICampaignFilter) {
    return Object.keys(filter).reduce((pay, key) => {
      if (filter[key].length === 0) return pay
      pay[key + 'Filter'] = {
        include: filter[key]
      }
      return pay
    }, {} as any)
  }

  private scopeBuilder(scopeId: string = this.scopeId) {
    return {
      headers: {
        'Amazon-Advertising-API-Scope': scopeId,
      }
    }
  }

  async getCampaigns(scopeId: string = this.scopeId, filter = {} as ICampaignFilter) {
    console.log(scopeId, 'Scope ID in getCampaigns');
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

  async getAdGroups(scopeId: string = this.scopeId, filter = {} as ICampaignFilter) {
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

  async getAds(scopeId: string = this.scopeId, filter = {} as ICampaignFilter) {
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

  async getProductMeta(asins: string[] | string) {
    try {
      const response = await this.httpClient.post(
        '/product/metadata', {
        "asins": Array.isArray(asins) ? asins : [asins],
        "adType": "SP",
        "pageSize": 5,
        "pageIndex": 0
      })
      return response.data
    } catch (e) {
      this.logger.error('Failed to get keywords', e.response?.data || e.message);
    }
  }

  async getKeywords(scopeId: string = this.scopeId, filter: ICampaignFilter) {
    try {
      console.log({filter})
      const response = await this.httpClient.post(
        '/sp/keywords/list', {}, {
        ...this.scopeBuilder(scopeId)
      })
      console.log(response.data.keywords.map(k=>k.adGroupId).join(','))
      return response.data.keywords || [];
    } catch (error) {
      this.logger.error('Failed to get keywords', error.response?.data || error.message);
      throw error;
    }
  }

  async getAdGroupsByCampaign(campaignId: string, scopeId: string = this.scopeId) {
    return this.getAdGroups(scopeId, {
      campaignId: [campaignId]
    });
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
          ...this.scopeBuilder()
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

  // try {
  //   const response = await this.httpClient.post(
  //     '/sp/adGroups/list',
  //     {
  //       campaignIdFilter: {
  //         include: [campaignId]
  //       }
  //     },
  //     {
  //       headers: {
  //         'Amazon-Advertising-API-Scope': scopeId,
  //       }
  //     }
  //   );
  //   this.logger.log(`Retrieved ${response.data.adGroups?.length || 0} ad groups for campaign ${campaignId}`);
  //   console.log(response.data.adGroups, "adGroups")
  //   return response.data.adGroups || [];
  // } catch (error) {
  //   this.logger.error(`Failed to get ad groups for campaign ${campaignId}`, error.response?.data || error.message);
  //   throw error;
  // }

  async getProductAdsByAdGroup(adGroupId: string, scopeId: string = this.scopeId) {
    return this.getAds(scopeId, {
      adGroupId: [adGroupId]
    });
    // try {
    //   const response = await this.httpClient.post(
    //     '/sp/productAds/list',
    //     {
    //       adGroupIdFilter: {
    //         include: [adGroupId]
    //       }
    //     },
    //     {
    //       headers: {
    //         'Amazon-Advertising-API-Scope': scopeId,
    //       }
    //     }
    //   );
    //   console.log(response.data.productAds, "adGroups")
    //   return response.data.productAds || [];
    // } catch (error) {
    //   this.logger.error(`Failed to get product ads for ad group ${adGroupId}`, error.response?.data || error.message);
    //   throw error;
    // }
  }

  async getProfile(profileId: string): Promise<AmazonProfile> {
    try {
      const response = await this.httpClient.get(`/v2/profiles/${profileId}`)
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get profile ${profileId}`, error);
      throw error;
    }
  }

  async getBudgetUses(campaignId: string, scopeId: string = this.scopeId) {
    try {
      const response = await this.httpClient.post(`/sp/campaigns/budget/usage`, {
        campaignIds: [campaignId]
      }, {
        ...this.scopeBuilder(scopeId)
      })
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get budget uses for campaign ${campaignId}`, error);
      throw error;
    }
  }


  async updateCampaign(campaignId: string, data: any, scopeId: string = this.scopeId) {
    try {
      const response = await this.httpClient.put(`/sp/campaigns`, data, {
        ...this.scopeBuilder(scopeId)
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update campaign ${campaignId}`, error.response?.data || error.message);
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

  async updateProductAd(adId: string, data: any, scopeId: string = this.scopeId) {
    try {
      const response = await this.httpClient.put(`/sp/productAds`, data, {
        ...this.scopeBuilder(scopeId)
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update product ad ${adId}`, error.response?.data || error.message);
      throw error;
    }
  }

  async updateKeyword(keywordId: string, data: any, scopeId: string = this.scopeId) {
    try {
      const response = await this.httpClient.put(`/sp/keywords`, data, {
        ...this.scopeBuilder(scopeId)
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update keyword ${keywordId}`, error.response?.data || error.message);
      throw error;
    }
  }


  // private getHeaders(): Record<string, string> {
  //   return {
  //     'Authorization': `Bearer ${this.accessToken}`,
  //     'Amazon-Advertising-API-Scope': this.profileId,
  //   };
  // }

  // async getCampaignMetrics(campaignId: string, startDate: string, endDate: string) {
  //   try {
  //     await this.ensureValidToken();
  //     // Amazon Advertising API endpoint for campaign metrics
  //     const response = await this.httpClient.get(
  //       `/v2/sp/campaigns/${campaignId}`,
  //       {
  //         headers: this.getHeaders(),
  //       }
  //     );

  //     this.logger.log(`Retrieved metrics for campaign ${campaignId}`);
  //     return response.data;
  //   } catch (error) {
  //     this.logger.error(`Failed to get campaign metrics for ${campaignId}`, error.response?.data || error.message);
  //     throw error;
  //   }
  // }

  // async getKeywordBids(campaignId: string) {
  //   try {
  //     // This would use Amazon Advertising API to get keyword bids
  //     // Note: You'll need to integrate with Amazon Advertising API separately
  //     // as it's different from SP-API
  //     const response = await this.makeAdvertisingApiCall(
  //       `/v2/sp/campaigns/${campaignId}/keywords`,
  //       'GET'
  //     );
  //     return response;
  //   } catch (error) {
  //     this.logger.error(`Failed to get keyword bids for campaign ${campaignId}`, error);
  //     throw error;
  //   }
  // }
  // async updateKeywordBid(keywordId: string, newBid: number) {
  //   try {
  //     // Update keyword bid using Amazon Advertising API
  //     const response = await this.makeAdvertisingApiCall(
  //       `/v2/sp/keywords`,
  //       'PUT',
  //       [{
  //         keywordId: keywordId,
  //         bid: newBid,
  //       }]
  //     );

  //     this.logger.log(`Updated keyword ${keywordId} bid to ${newBid}`);
  //     return response;
  //   } catch (error) {
  //     this.logger.error(`Failed to update keyword bid for ${keywordId}`, error);
  //     throw error;
  //   }
  // }

  /**
   * Generic method to make Amazon Advertising API calls
   */
  // private async makeAdvertisingApiCall(
  //   endpoint: string,
  //   method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  //   data?: any,
  //   headers?: Record<string, string>
  // ) {
  //   try {
  //     await this.ensureValidToken();
  //     const config = {
  //       method,
  //       url: endpoint,
  //       headers: this.getHeaders(),
  //       ...(data && { data }),
  //     };

  //     const response = await this.httpClient.request(config);
  //     return response.data;
  //   } catch (error) {
  //     this.logger.error(`API call failed: ${method} ${endpoint}`, error.response?.data || error.message);
  //     throw error;
  //   }
  // }

  // async getKeywordPerformance(adGroupId: string, startDate: string, endDate: string) {
  //   try {
  //     const response = await this.makeAdvertisingApiCall(
  //       '/v2/sp/keywords/report',
  //       'POST',
  //       {
  //         reportDate: startDate,
  //         segment: 'query',
  //         metrics: 'keywordId,keyword,impressions,clicks,cost,sales,adGroupId',
  //         filters: {
  //           adGroupId: adGroupId,
  //         },
  //       }
  //     );

  //     return response;
  //   } catch (error) {
  //     this.logger.error(`Failed to get keyword performance for ad group ${adGroupId}`, error);
  //     throw error;
  //   }
  // }

  /**
   * Get ad groups for a specific campaign
   */
  // async getAdGroupsByCampaign(campaignId: string) {
  //   try {
  //     await this.ensureValidToken();
  //     const response = await this.httpClient.post(
  //       '/sp/adGroups/list',
  //       {
  //         campaignIdFilter: {
  //           include: [campaignId]
  //         }
  //       },
  //       {
  //         headers: {
  //           'Authorization': `Bearer ${this.accessToken}`,
  //           'Amazon-Advertising-API-ClientId': this.clientId,
  //           'Amazon-Advertising-API-Scope': this.profileId,
  //           'Accept': 'application/vnd.spAdGroup.v3+json',
  //           'Content-Type': 'application/vnd.spAdGroup.v3+json',
  //         },
  //       }
  //     );

  //     this.logger.log(`Retrieved ${response.data.adGroups?.length || 0} ad groups for campaign ${campaignId}`);
  //     return response.data.adGroups || [];
  //   } catch (error) {
  //     this.logger.error(`Failed to get ad groups for campaign ${campaignId}`, error.response?.data || error.message);
  //     throw error;
  //   }
  // }

  /**
   * Get campaign details by campaign ID
  //  */
  // async getCampaignById(campaignId: string) {
  //   try {
  //     await this.ensureValidToken();

  //     const response = await this.httpClient.post(
  //       '/sp/campaigns/list',
  //       {
  //         campaignIdFilter: {
  //           include: [campaignId]
  //         }
  //       },
  //       {
  //         headers: {
  //           'Authorization': `Bearer ${this.accessToken}`,
  //           'Amazon-Advertising-API-ClientId': this.clientId,
  //           'Amazon-Advertising-API-Scope': this.profileId,
  //           'Accept': 'application/vnd.spCampaign.v3+json',
  //           'Content-Type': 'application/vnd.spCampaign.v3+json',
  //         },
  //       }
  //     );

  //     const campaigns = response.data.campaigns || [];
  //     if (campaigns.length > 0) {
  //       this.logger.log(`Retrieved campaign details for ${campaignId}`);
  //       console.log(campaigns[0])
  //       return campaigns[0];
  //     }

  //     this.logger.warn(`Campaign ${campaignId} not found`);
  //     return null;
  //   } catch (error) {
  //     this.logger.error(`Failed to get campaign ${campaignId}`, error.response?.data || error.message);
  //     throw error;
  //   }
  // }

  /**
   * Get product ads for a specific ad group
   */


  /**
   * Get a specific profile by ID
   */

}