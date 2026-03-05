import { Injectable } from "@nestjs/common";
import { AmazonApiService, } from "./amazon-api.service";
import axios from "axios";

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

const defaultOption = {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
}

@Injectable()
export class AuthApiService extends AmazonApiService {
    private scope = 'advertising::campaign_management';

    getAuthorizationUrl(): string {
        const authUrl = new URL('https://www.amazon.in/ap/oa');
        authUrl.searchParams.append('client_id', this.clientId);
        authUrl.searchParams.append('scope', this.scope);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('redirect_uri', this.redirectUri);
        return authUrl.toString();
    }


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
                this.tokenUrl,
                params.toString(),
                defaultOption
            );
            this.logger.log('Successfully exchanged authorization code for tokens');
            return response.data;
        } catch (error) {
            this.logger.error('Failed to exchange authorization code', error.response?.data || error.message);
            throw new Error('Failed to authenticate with Amazon');
        }
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
                defaultOption
            );
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

}