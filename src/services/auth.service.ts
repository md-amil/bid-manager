import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AmazonProfile {
  profileId: number;
  countryCode: string;
  currencyCode: string;
  timezone: string;
  accountInfo: {
    marketplaceStringId: string;
    id: string;
    type: string;
    name: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scope: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('AMAZON_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('AMAZON_CLIENT_SECRET') || '';
    this.redirectUri = this.configService.get<string>('AMAZON_REDIRECT_URI', 'http://localhost:3000/auth/callback');
    this.scope = 'advertising::campaign_management';
  }

  

  /**
   * Generate authorization URL for Amazon OAuth
   */
  getAuthorizationUrl(): string {
    const authUrl = new URL('https://www.amazon.in/ap/oa');
    authUrl.searchParams.append('client_id', this.clientId);
    authUrl.searchParams.append('scope', this.scope);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', this.redirectUri);
    
    return authUrl.toString();
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(authCode: string): Promise<TokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      });

      const response = await axios.post<TokenResponse>(
        'https://api.amazon.in/auth/o2/token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.logger.log('Successfully exchanged authorization code for tokens');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange authorization code', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Amazon');
    }
  }

  /**
   * Get Amazon Advertising profiles using access token
   */
  async getProfiles(accessToken: string): Promise<AmazonProfile[]> {
    try {
      const response = await axios.get<AmazonProfile[]>(
        'https://advertising-api-eu.amazon.com/v2/profiles',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Amazon-Advertising-API-ClientId': this.clientId,
          },
        }
      );

      this.logger.log(`Retrieved ${response.data.length} profiles`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get profiles', error.response?.data || error.message);
      throw new Error('Failed to fetch Amazon profiles');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const response = await axios.post<TokenResponse>(
        'https://api.amazon.in/auth/o2/token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.logger.log('Successfully refreshed access token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh access token', error.response?.data || error.message);
      throw new Error('Failed to refresh authentication');
    }
  }
}
