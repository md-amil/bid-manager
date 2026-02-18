import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface ReportResponse {
  reportId: string;
  status: string;
  url?: string;
  name?: string;
  configuration: {
    reportTypeId: 'spCampaigns' | 'spKeywords' | 'spSearchTerm';
  };
  startDate?: string;
  endDate?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface IFilter {
  nextToken?: string;
  state?: string[];
  campaignId?: string[];
  adGroupId?: string[];
  adId?: string[];
  keywordId?: string[];
}

export interface ReportPayload {
  scopeId: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface ReportConfig {
  scopeId?: string;
  reportTypeId: 'spCampaigns' | 'spKeywords' | 'spSearchTerm';
  groupBy: string[];
  columns: string[];
}

export interface AmazonProfile {
  profileId: string;
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

@Injectable()
export class AmazonApiService {
  protected readonly logger = new Logger(AmazonApiService.name);
  protected httpClient: AxiosInstance;
  protected accessToken: string;
  protected tokenExpiresAt: number;
  protected readonly clientId: string;
  protected readonly clientSecret: string;
  protected readonly refreshToken: string;
  protected readonly scopeId: string;
  protected readonly tokenUrl: string;

  constructor(protected configService: ConfigService) {
    this.clientId = this.configService.get<string>('AMAZON_CLIENT_ID') || '';
    this.clientSecret =
      this.configService.get<string>('AMAZON_CLIENT_SECRET') || '';
    this.refreshToken =
      this.configService.get<string>('AMAZON_REFRESH_TOKEN') || '';
    this.scopeId = this.configService.get<string>('AMAZON_PROFILE_ID') || '';
    this.accessToken = this.configService.get('ACCESS_TOKEN') || '';
    this.tokenExpiresAt = +this.configService.get('TOKEN_EXPIRY');

    this.tokenUrl = this.configService.get<string>(
      'AMAZON_TOKEN_URL',
      'https://api.amazon.com/auth/o2/token',
    );
    if (
      !this.clientId ||
      !this.clientSecret ||
      !this.refreshToken ||
      !this.scopeId
    ) {
      this.logger.warn(
        'Amazon API credentials not configured. Please set AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET, AMAZON_REFRESH_TOKEN, and AMAZON_PROFILE_ID in your .env file',
      );
    }
    this.httpClient = this.createClient();
  }

  get headers() {
    return {
      campaigns: 'application/vnd.spcampaign.v3+json',
      adGroups: 'application/vnd.spadGroup.v3+json',
      productAds: 'application/vnd.spproductAd.v3+json',
      keywords: 'application/vnd.spkeyword.v3+json',
      negativeKeywords: 'application/vnd.spnegativeKeyword.v3+json',
      targets: 'application/vnd.sptargetingClause.v3+json',
      negativeTargets: 'application/vnd.spnegativeTargetingClause.v3+json',
    };
  }
  private createClient(session?: any) {
    const baseURL = this.configService.get<string>(
      'AMAZON_ADVERTISING_API_URL',
      'https://advertising-api-eu.amazon.com',
    );
    const client = axios.create({
      baseURL,
      headers: {
        Accept: 'application/vnd.spCampaign.v3+json',
        'Content-Type': 'application/vnd.spcampaign.v3+json',
        'Amazon-Advertising-API-ClientId': this.clientId,
      },
    });

    client.interceptors.request.use(
      async (request) => {
        const accept =
          this.headers[request.url!.split('/')[2]] ?? 'application/json';

        if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
          const data = await this.refreshAccessToken();
          this.accessToken = data.access_token;
          console.log('token will expire in ', data.expires_in);
          this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
          console.log(this.tokenExpiresAt);
        }
        request.headers['Authorization'] = `Bearer ${this.accessToken}`;
        request.headers['Content-Type'] = accept;
        request.headers['Accept'] = accept;
        return request;
      },
      (error) => Promise.reject(error),
    );
    return client;
  }

  async refreshAccessToken() {
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
        },
      );
      console.log('newly created access token', response.data);
      this.logger.log('Access token refreshed successfully');
      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to refresh access token',
        error.response?.data || error.message,
      );
      throw new Error('Failed to authenticate with Amazon Advertising API');
    }
  }

  async getProfiles(): Promise<AmazonProfile[]> {
    try {
      const response = await this.httpClient.get('/v2/profiles');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get profiles', error);
      throw error;
    }
  }

  protected filterBuilder(filter: IFilter) {
    const { nextToken, ...f } = filter;
    return Object.keys(f).reduce(
      (pay, key) => {
        if (filter[key].length === 0) return pay;
        pay[key + 'Filter'] = {
          include: filter[key],
        };
        return pay;
      },
      { ...(nextToken && { nextToken }) } as any,
    );
  }

  protected scopeBuilder(scopeId: string = this.scopeId) {
    return {
      headers: {
        'Amazon-Advertising-API-Scope': scopeId,
      },
    };
  }

  async getProductMeta(asins: string[] | string) {
    try {
      const response = await this.httpClient.post('/product/metadata', {
        asins: Array.isArray(asins) ? asins : [asins],
        adType: 'SP',
        pageSize: 5,
        pageIndex: 0,
      });
      return response.data;
    } catch (e) {
      this.logger.error(
        'Failed to get keywords',
        e.response?.data || e.message,
      );
    }
  }

  async generateReport(payload: ReportPayload, config: ReportConfig) {
    try {
      const response = await this.httpClient.post<ReportResponse>(
        '/reporting/reports',
        {
          configuration: {
            adProduct: 'SPONSORED_PRODUCTS',
            timeUnit: 'DAILY',
            format: 'GZIP_JSON',
            ...config,
          },
          ...payload,
        },
        this.scopeBuilder(payload.scopeId),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to generate report',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // async getAdGroupsByCampaign(campaignId: string, scopeId: string = this.scopeId) {
  //   return this.getAdGroups(scopeId, {
  //     campaignId: [campaignId]
  //   });
  // }

  // async generateReport(payload: ReportPayload) {
  //   try {
  //     const response = await this.httpClient.post(
  //       '/reporting/reports',
  //       {
  //         "configuration": {
  //           "adProduct": "SPONSORED_PRODUCTS",
  //           "reportTypeId": "spCampaigns",
  //           "groupBy": ["campaign"],
  //           "columns": CAMPAIGN_MATRICS,
  //           "timeUnit": "DAILY",
  //           "format": "GZIP_JSON"
  //         },
  //         ...payload,
  //       },
  //       {
  //         ...this.scopeBuilder(payload.scopeId)
  //       }
  //     );
  //     return response.data;
  //   } catch (error) {
  //     this.logger.error('Failed to generate report', error.response?.data || error.message);
  //     throw error;
  //   }
  // }

  async getReports(reportId: string) {
    try {
      const response = await this.httpClient.get<ReportResponse>(
        `/reporting/reports/${reportId}`,
        this.scopeBuilder(),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to get report',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // async getProductAdsByAdGroup(adGroupId: string, scopeId: string = this.scopeId) {
  //   return this.getAds(scopeId, {
  //     adGroupId: [adGroupId]
  //   });
  // }

  async getProfile(profileId: string): Promise<AmazonProfile> {
    try {
      const response = await this.httpClient.get(`/v2/profiles/${profileId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get profile ${profileId}`, error);
      throw error;
    }
  }

  async updateProductAd(
    adId: string,
    data: any,
    scopeId: string = this.scopeId,
  ) {
    try {
      const response = await this.httpClient.put(`/sp/productAds`, data, {
        ...this.scopeBuilder(scopeId),
      });
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to update product ad ${adId}`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async updateKeyword(
    keywordId: string,
    data: any,
    scopeId: string = this.scopeId,
  ) {
    try {
      const response = await this.httpClient.put(`/sp/keywords`, data, {
        ...this.scopeBuilder(scopeId),
      });
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to update keyword ${keywordId}`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}
