import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

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

@Injectable()
export class AmazonApiService {
  private readonly logger = new Logger(AmazonApiService.name);
  private httpClient: AxiosInstance;
  private accessToken: string;
  private tokenExpiresAt: number;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;
  private readonly profileId: string;
  private readonly tokenUrl: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('AMAZON_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('AMAZON_CLIENT_SECRET') || '';
    this.refreshToken = this.configService.get<string>('AMAZON_REFRESH_TOKEN') || '';
    this.profileId = this.configService.get<string>('AMAZON_PROFILE_ID') || '';
    this.tokenUrl = this.configService.get<string>('AMAZON_TOKEN_URL', 'https://api.amazon.com/auth/o2/token');
    
    if (!this.clientId || !this.clientSecret || !this.refreshToken || !this.profileId) {
      this.logger.warn('Amazon API credentials not configured. Please set AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET, AMAZON_REFRESH_TOKEN, and AMAZON_PROFILE_ID in your .env file');
    }
    
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      const baseURL = this.configService.get<string>('AMAZON_ADVERTISING_API_URL', 'https://advertising-api-eu.amazon.com');
      
      this.httpClient = axios.create({
        baseURL,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Get initial access token
      await this.refreshAccessToken();
      
      this.logger.log('Amazon Advertising API client initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Amazon API client', error);
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
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
      console.log('access token', this.accessToken)
      // Set expiration time (subtract 5 minutes for safety margin)
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;
      
      this.logger.log('Access token refreshed successfully');
    } catch (error) {
      this.logger.error('Failed to refresh access token', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Amazon Advertising API');
    }
  }

  /**
   * Ensure we have a valid access token before making API calls
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Get common headers for API requests
   */
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Amazon-Advertising-API-ClientId': this.clientId,
      'Amazon-Advertising-API-Scope': this.profileId,
      'Content-Type': 'application/vnd.spCampaign.v3+json',
      'Accept': 'application/vnd.spCampaign.v3+json',
    };
  }

  async getCampaignMetrics(campaignId: string, startDate: string, endDate: string) {
    try {
      await this.ensureValidToken();
      
      // Amazon Advertising API endpoint for campaign metrics
      const response = await this.httpClient.get(
        `/v2/sp/campaigns/${campaignId}`,
        {
          headers: this.getHeaders(),
        }
      );

      this.logger.log(`Retrieved metrics for campaign ${campaignId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get campaign metrics for ${campaignId}`, error.response?.data || error.message);
      throw error;
    }
  }

  async getKeywordBids(campaignId: string) {
    try {
      // This would use Amazon Advertising API to get keyword bids
      // Note: You'll need to integrate with Amazon Advertising API separately
      // as it's different from SP-API
      const response = await this.makeAdvertisingApiCall(
        `/v2/sp/campaigns/${campaignId}/keywords`,
        'GET'
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to get keyword bids for campaign ${campaignId}`, error);
      throw error;
    }
  }

  async updateKeywordBid(keywordId: string, newBid: number) {
    try {
      // Update keyword bid using Amazon Advertising API
      const response = await this.makeAdvertisingApiCall(
        `/v2/sp/keywords`,
        'PUT',
        [{
          keywordId: keywordId,
          bid: newBid,
        }]
      );

      this.logger.log(`Updated keyword ${keywordId} bid to ${newBid}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to update keyword bid for ${keywordId}`, error);
      throw error;
    }
  }

  async getCampaigns(startDate: string, endDate: string) {
    try {
     const campaigns = await  this.httpClient.post(
        `/sp/campaigns/list`, {},
        {
          headers: this.getHeaders(),
        }
      ); 
      return campaigns.data;

      // Get performance report for all campaigns
      // const response = await this.makeAdvertisingApiCall(
      //   '/v2/sp/campaigns',
      //   'POST',
      //   // {
      //   //   reportDate: startDate,
      //   //   metrics: 'campaignId,campaignName,impressions,clicks,cost,sales',
      //   // }
      // );
      // console.log({response})
      // return response;
    } catch (error) {
      console.log(error)
      this.logger.error('Failed to get campaign performance report', );
      throw error;
    }
  }

  /**
   * Generic method to make Amazon Advertising API calls
   */
  private async makeAdvertisingApiCall(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    data?: any,
    headers?: Record<string, string>
  ) {
    try {
      await this.ensureValidToken();
      const config = {
        method,
        url: endpoint,
        headers: this.getHeaders(),
        ...(data && { data }),
      };

      const response = await this.httpClient.request(config);
      return response.data;
    } catch (error) {
      this.logger.error(`API call failed: ${method} ${endpoint}`, error.response?.data || error.message);
      throw error;
    }
  }

  async getKeywordPerformance(adGroupId: string, startDate: string, endDate: string) {
    try {
      const response = await this.makeAdvertisingApiCall(
        '/v2/sp/keywords/report',
        'POST',
        {
          reportDate: startDate,
          segment: 'query',
          metrics: 'keywordId,keyword,impressions,clicks,cost,sales,adGroupId',
          filters: {
            adGroupId: adGroupId,
          },
        }
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to get keyword performance for ad group ${adGroupId}`, error);
      throw error;
    }
  }

  /**
   * Get all available profiles for the authenticated user
   */
  async getProfiles(): Promise<AmazonProfile[]> {
    try {
      const response = await this.makeAdvertisingApiCall('/v2/profiles', 'GET');
      console.log(response)
      this.logger.log(`Retrieved ${response.length} profiles`);
      return response;
    } catch (error) {
      this.logger.error('Failed to get profiles', error);
      throw error;
    }
  }

  /**
   * Get a specific profile by ID
   */
  async getProfile(profileId: string): Promise<AmazonProfile> {
    try {
      const response = await this.makeAdvertisingApiCall(`/v2/profiles/${profileId}`, 'GET');
      this.logger.log(`Retrieved profile ${profileId}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to get profile ${profileId}`, error);
      throw error;
    }
  }
}


