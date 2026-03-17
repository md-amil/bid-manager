import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ClsService } from 'nestjs-cls';
import { IAmazonAuth } from 'src/interfaces/index.type';

export interface ReportResponse {
  reportId: string;
  status: string;
  url?: string;
  name?: string;
  configuration: {
    reportTypeId: 'spCampaigns' | 'spKeywords' | 'spSearchTerm' | 'spTargeting' | 'spAdvertisedProduct',
    groupBy: string[];
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
  name?: string;
  startDate: string;
  endDate: string;
}

export interface ReportConfig {
  scopeId?: string;
  reportTypeId: 'spCampaigns' | 'spKeywords' | 'spSearchTerm' | 'spTargeting' | 'spAdvertisedProduct';
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
  protected readonly redirectUri: string

  constructor(protected configService: ConfigService, protected readonly cls: ClsService) {
    this.clientId = this.configService.get<string>('AMAZON_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('AMAZON_CLIENT_SECRET') || '';
    this.refreshToken = this.configService.get<string>('AMAZON_REFRESH_TOKEN') || '';
    this.scopeId = this.configService.get<string>('AMAZON_PROFILE_ID') || '';
    this.accessToken = this.configService.get('ACCESS_TOKEN') || ''
    this.tokenExpiresAt = +this.configService.get('TOKEN_EXPIRY')
    this.redirectUri = this.configService.get<string>('AMAZON_REDIRECT_URI', 'http://localhost:3000/auth/callback');


    this.tokenUrl = this.configService.get<string>('AMAZON_TOKEN_URL', 'https://api.amazon.com/auth/o2/token');
    if (!this.clientId || !this.clientSecret || !this.refreshToken || !this.scopeId) {
      this.logger.warn('Amazon API credentials not configured. Please set AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET, AMAZON_REFRESH_TOKEN, and AMAZON_PROFILE_ID in your .env file');
    }
    this.httpClient = this.createClient();
  }

  get headers() {
    return {
      'campaigns': 'application/vnd.spcampaign.v3+json',
      'adGroups': 'application/vnd.spadGroup.v3+json',
      'productAds': 'application/vnd.spproductAd.v3+json',
      'keywords': 'application/vnd.spkeyword.v3+json',
      'negativeKeywords': 'application/vnd.spnegativeKeyword.v3+json',
      'targets': 'application/vnd.sptargetingClause.v3+json',
      'negativeTargets': 'application/vnd.spnegativeTargetingClause.v3+json'
    }
  }
  private createClient() {
    const baseURL = this.configService.get<string>('AMAZON_ADVERTISING_API_URL', 'https://advertising-api-eu.amazon.com');
    const client = axios.create({
      baseURL,
      headers: {
        // 'Accept': 'application/vnd.spCampaign.v3+json',
        // 'Content-Type': 'application/vnd.spcampaign.v3+json',
        'Amazon-Advertising-API-ClientId': this.clientId
      },
    });

    client.interceptors.request.use(async (request) => {
      const accept = this.headers[request.url!.split('/')[2]] ?? 'application/json'
      request.headers['Content-Type'] = accept;
      request.headers['Accept'] = accept;
      // console.log(
      //   'Request Headers:', request.headers
      // )
      if (request.headers['Authorization']) return request

      // if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
      //   const data = await this.refreshAccessToken(this.refreshToken);
      //   this.accessToken = data.access_token;
      //   console.log("token will expire in ", data.expires_in)
      //   this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
      //   console.log(this.tokenExpiresAt)
      // }

      // request.headers['Authorization'] = `Bearer ${accessToken}`
      return request
    }, (error) => Promise.reject(error))
    return client
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
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
      console.log("newly created access token", response.data)
      this.logger.log('Access token refreshed successfully');
      return response.data
    } catch (error) {
      this.logger.error('Failed to refresh access token', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Amazon Advertising API');
    }
  }


  async getProfiles(accessToken?: string) {
    try {
      const response = await this.httpClient.get('/v2/profiles', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      this.logger.log(`Fetched ${response.data.length} profiles from Amazon API`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch profiles from Amazon API', error.response?.data || error.message);
      throw new Error('Failed to fetch profiles from Amazon');
    }
  }

  // async getProfiles(): Promise<AmazonProfile[]> {
  //   try {
  //     const response = await this.httpClient.get('/v2/profiles')
  //     return response.data;
  //   } catch (error) {
  //     this.logger.error('Failed to get profiles', error);
  //     throw error;
  //   }
  // }

  protected filterBuilder(filter: IFilter) {
    const { nextToken, ...f } = filter
    return Object.keys(f).reduce((pay, key) => {
      if (filter[key].length === 0) return pay
      pay[key + 'Filter'] = {
        include: filter[key]
      }
      return pay
    }, { ...(nextToken && { nextToken }) } as any)
  }

  protected authBuilder({ scopeId, accessToken }: IAmazonAuth) {
    return {
      headers: {
        'Amazon-Advertising-API-Scope': scopeId,
        'Authorization': `Bearer ${accessToken}`,
      }
    }
  }

  async getProductMeta(auth:IAmazonAuth) {
    const payload = {
      "pageSize": 300,
      "checkItemDetails": "true",
      "pageIndex": 0
    }
    try {
      const response = await this.httpClient.post(
        '/product/metadata', payload, this.authBuilder(auth)
        //   {
        //   "asins": Array.isArray(asins) ? asins : [asins],
        //   "adType": "SP",
        //   "pageSize": 5,
        // }
      )
      return response.data?.ProductMetadataList
    } catch (e) {
      this.logger.error('Failed to get keywords', e.response?.data || e.message);
    }
  }


  async generateReport(auth: IAmazonAuth, payload: ReportPayload, config: ReportConfig) {
    try {
      const response = await this.httpClient.post<ReportResponse>(
        '/reporting/reports',
        {
          "configuration": {
            "adProduct": "SPONSORED_PRODUCTS",
            "timeUnit": "DAILY",
            "format": "GZIP_JSON",
            ...config
          },
          ...payload,
        },
        this.authBuilder(auth)
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to generate report', error.response?.data || error.message);
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

  async getReports(auth: IAmazonAuth, reportId: string) {
    try {
      const response = await this.httpClient.get<ReportResponse>(
        `/reporting/reports/${reportId}`,
        this.authBuilder(auth)
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get report', error.response?.data || error.message);
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
      const response = await this.httpClient.get(`/v2/profiles/${profileId}`)
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get profile ${profileId}`, error);
      throw error;
    }
  }




  async updateProductAd(auth: IAmazonAuth, adId: string, data: any) {
    try {
      const response = await this.httpClient.put(`/sp/productAds`, data, {
        ...this.authBuilder(auth)
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update product ad ${adId}`, error.response?.data || error.message);
      throw error;
    }
  }

  async updateKeyword(auth: IAmazonAuth, keywordId: string, data: any) {
    try {
      const response = await this.httpClient.put(`/sp/keywords`, data, {
        ...this.authBuilder(auth)
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update keyword ${keywordId}`, error.response?.data || error.message);
      throw error;
    }
  }
}
