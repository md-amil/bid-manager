import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import { Profile } from 'src/schemas/profile.schema';
import { AmazonApiService, TokenResponse } from './amazon/amazon-api.service';
import { AmazonSyncService } from './amazon/amazon-sync.service';
import { Organization } from 'src/schemas/organization.schema';
import { AuthApiService } from './amazon/auth-api.service';
import { User } from 'src/schemas/user.schema';
import { AmazonMapper } from './amazon/amazon.mapper';

export interface UpdateOrganizationResult {
  tokens: TokenResponse;
  organization: Organization;
  profiles: any[]; // or a proper Profile type
}

// interface AmazonProfile {
//   profileId: number;
//   countryCode: string;
//   currencyCode: string;
//   timezone: string;
//   accountInfo: {
//     marketplaceStringId: string;
//     id: string;
//     type: string;
//     name: string;
//   };
// }

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // private readonly clientId: string;
  // private readonly clientSecret: string;
  // private readonly redirectUri: string;
  // private readonly scope: string;

  constructor(
    private authApi: AuthApiService,
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Organization.name) private organizationModel: Model<Organization>,

  ) {
    // this.clientId = this.configService.get<string>('AMAZON_CLIENT_ID') || '';
    // this.clientSecret = this.configService.get<string>('AMAZON_CLIENT_SECRET') || '';
    // this.redirectUri = this.configService.get<string>('AMAZON_REDIRECT_URI', 'http://localhost:3000/auth/callback');
    // this.scope = 'advertising::campaign_management';
  }

  async createOrganization({ orgName, ...dto }: any) {
    // Create user
    const user = new this.userModel(dto);
    await user.save();
    const organization = new this.organizationModel({
      name: orgName,
      ownerId: user._id.toString(),
    });
    await organization.save();
    return { user, organization };
  }


  async updateOrganization(ownerId: string, code: string): Promise<UpdateOrganizationResult> {
    try {
      const tokens = await this.authApi.exchangeCodeForTokens(code);
      const profiles = await this.authApi.getProfiles(tokens.access_token);
      const organization = await this.organizationModel.findOneAndUpdate(
        { ownerId },
        {
          accessToken: tokens.access_token,
          ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
          accessTokenExpires: new Date(Date.now() + tokens.expires_in * 1000),
        },
        { new: true }
      ).exec();
      
      if (!organization) {
        throw new Error("Organization not found");
      }
      const operations = profiles.map((profile) => {
        return {
          updateOne: {
            filter: { profileId: profile.profileId },
            update: { $set: AmazonMapper.profile(profile, organization._id) },
            upsert: true,
          },
        };
      });
      await this.profileModel.bulkWrite(operations);
      return { tokens,organization, profiles }
    } catch (e) {
      throw e
    }
    // // Save profiles to profile table with organizationId
    // const savedProfiles: Profile[] = [];
    // for (const profile of amazonProfiles) {
    //   const profileData = {
    //     profileId: profile.profileId.toString(),
    //     organizationId: organization._id.toString(),
    //     countryCode: profile.countryCode,
    //     currencyCode: profile.currencyCode,
    //     timezone: profile.timezone,
    //     dailyBudget: profile.dailyBudget || 0,
    //     accountInfo: {
    //       marketplaceStringId: profile.accountInfo?.marketplaceStringId || '',
    //       id: profile.accountInfo?.id || '',
    //       type: profile.accountInfo?.type || 'seller',
    //       name: profile.accountInfo?.name || '',
    //     },
    //   };

    //   // Upsert profile (update if exists, create if not)
    //   const savedProfile = await this.profileModel.findOneAndUpdate(
    //     { profileId: profileData.profileId },
    //     profileData,
    //     { upsert: true, new: true }
    //   ).exec();
    //   if (savedProfile) {
    //     savedProfiles.push(savedProfile);
    //   }
    // }
    // return this.organizationModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }


  async getOrganization(user?: any) {
    let query = user._id?{ ownerId: user._id }:{}
    const organization = await this.organizationModel.findOne(query).exec();
    if (!organization) throw new Error('Organization not found');
    return organization;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    try {
      const organizations = await this.organizationModel.find().exec();
      return organizations;
    } catch (error) {
      this.logger.error('Failed to get all organizations', error.message);
      throw new Error('Failed to fetch organizations');
    }
  }


  async getSessionDetails({ refreshToken, id }: Organization) {
    const tokens = await this.authApi.refreshAccessToken(refreshToken!);
    // const profiles = await this.getProfiles(id);
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: Date.now() + (tokens.expires_in * 1000),
      organizationId:id,
      // profiles,
      authenticated: true,
    }
  }




  /**
   * Generate authorization URL for Amazon OAuth
   */
  // getAuthorizationUrl(): string {
  //   const authUrl = new URL('https://www.amazon.in/ap/oa');
  //   authUrl.searchParams.append('client_id', this.clientId);
  //   authUrl.searchParams.append('scope', this.scope);
  //   authUrl.searchParams.append('response_type', 'code');
  //   authUrl.searchParams.append('redirect_uri', this.redirectUri);
  //   return authUrl.toString();
  // }

  /**
   * Exchange authorization code for tokens
   */
  // async exchangeCodeForTokens(authCode: string): Promise<TokenResponse> {
  //   try {
  //     const params = new URLSearchParams({
  //       grant_type: 'authorization_code',
  //       code: authCode,
  //       client_id: this.clientId,
  //       client_secret: this.clientSecret,
  //       redirect_uri: this.redirectUri,
  //     });

  //     const response = await axios.post<TokenResponse>(
  //       'https://api.amazon.in/auth/o2/token',
  //       params.toString(),
  //       {
  //         headers: {
  //           'Content-Type': 'application/x-www-form-urlencoded',
  //         },
  //       }
  //     );

  //     this.logger.log('Successfully exchanged authorization code for tokens');
  //     return response.data;
  //   } catch (error) {
  //     this.logger.error('Failed to exchange authorization code', error.response?.data || error.message);
  //     throw new Error('Failed to authenticate with Amazon');
  //   }
  // }

  /**
   * Fetch profiles directly from Amazon Advertising API
   */
  // async fetchAmazonProfiles(accessToken: string) {
  //   try {
  //     const response = await axios.get('https://advertising-api.amazon.com/v2/profiles', {
  //       headers: {
  //         'Authorization': `Bearer ${accessToken}`,
  //         'Content-Type': 'application/json',
  //       },
  //     });
  //     this.logger.log(`Fetched ${response.data.length} profiles from Amazon API`);
  //     return response.data;
  //   } catch (error) {
  //     this.logger.error('Failed to fetch profiles from Amazon API', error.response?.data || error.message);
  //     throw new Error('Failed to fetch profiles from Amazon');
  //   }
  // }

  /**
   * Get Amazon Advertising profiles using access token
   */



  async getProfiles(organizationId?: string) {
    try {
      const query: any = {};
      if (organizationId) {
        query.organizationId = organizationId;
      }
      const profiles = await this.profileModel.find(query);
      return profiles
    } catch (error) {
      this.logger.error('Failed to get profiles', error.response?.data || error.message);
      throw new Error('Failed to fetch  profiles');
    }
  }

  /**
   * Sync profiles from Amazon API with database
   * Removes profiles from DB that don't exist in API
   */
  async syncProfiles(organizationId: string, accessToken: string): Promise<{ added: number; removed: number; total: number }> {
    try {
      // Fetch profiles from Amazon API using session access token
      const apiProfiles = await this.authApi.getProfiles(accessToken);
      const apiProfileIds = apiProfiles.map(p => p.profileId.toString());

      // Get existing profiles from DB for this organization
      const dbProfiles = await this.profileModel.find({ organizationId }).exec();
      const dbProfileIds = dbProfiles.map(p => p.profileId);

      // Find profiles to remove (exist in DB but not in API)
      const profilesToRemove = dbProfiles.filter(p => !apiProfileIds.includes(p.profileId));
      
      // Remove stale profiles
      if (profilesToRemove.length > 0) {
        const removeIds = profilesToRemove.map(p => p.profileId);
        await this.profileModel.deleteMany({ profileId: { $in: removeIds }, organizationId }).exec();
        this.logger.log(`Removed ${profilesToRemove.length} stale profiles`);
      }

      // Upsert profiles from API
      const operations = apiProfiles.map((profile) => ({
        updateOne: {
          filter: { profileId: profile.profileId },
          update: { $set: { ...profile, organizationId } },
          upsert: true,
        },
      }));

      if (operations.length > 0) {
        await this.profileModel.bulkWrite(operations);
      }

      const added = apiProfiles.filter(p => !dbProfileIds.includes(p.profileId.toString())).length;
      const removed = profilesToRemove.length;

      this.logger.log(`Profile sync completed: ${added} added, ${removed} removed, ${apiProfiles.length} total`);
      
      return { added, removed, total: apiProfiles.length};
    } catch (error) {
      this.logger.error('Failed to sync profiles', error.response?.data || error.message);
      throw new Error('Failed to sync profiles with Amazon');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  // async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  //   return this.amazonApi.refreshAccessToken()
  //   // try {
  //   //   const params = new URLSearchParams({
  //   //     grant_type: 'refresh_token',
  //   //     refresh_token: refreshToken,
  //   //     client_id: this.clientId,
  //   //     client_secret: this.clientSecret,
  //   //   });

  //   //   const response = await axios.post<TokenResponse>(
  //   //     'https://api.amazon.in/auth/o2/token',
  //   //     params.toString(),
  //   //     {
  //   //       headers: {
  //   //         'Content-Type': 'application/x-www-form-urlencoded',
  //   //       },
  //   //     }
  //   //   );

  //   //   this.logger.log('Successfully refreshed access token');
  //   //   return response.data;
  //   // } catch (error) {
  //   //   this.logger.error('Failed to refresh access token', error.response?.data || error.message);
  //   //   throw new Error('Failed to refresh authentication');
  //   // }
  // }
}
