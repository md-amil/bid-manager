import { Controller, Get, Param, Render, Logger, Session, Res, Redirect } from '@nestjs/common';
import type { Response } from 'express';
import { AmazonApiService, AmazonProfile } from '../services/amazon/amazon-api.service';
import { AuthService } from '../services/auth.service';

@Controller('profiles')
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(
    private readonly amazonApiService: AmazonApiService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @Render('profiles')
  async getProfilesPage(@Session() session: Record<string, any>, @Res() res: Response) {
    if (!session.authenticated || !session.accessToken) {
      return res.redirect('/auth/login');
    }
    try {
      if (Date.now() >= session.tokenExpiresAt) {
        const tokens = await this.amazonApiService.refreshAccessToken(session.refreshToken);
        session.accessToken = tokens.access_token;
        session.tokenExpiresAt = Date.now() + (tokens.expires_in * 1000);
      }
      // Use profiles from session or fetch fresh
      
        const profiles = await this.authService.getProfiles(session.organizationId);
      
      return {
        title: 'Amazon Advertising Profiles',
        profiles,
        error: null,
      };
    } catch (error) {
      this.logger.error('Failed to load profiles page', error);
      
      return {
        title: 'Amazon Advertising Profiles',
        profiles: [],
        error: 'Failed to load profiles. Please try logging in again.',
      };
    }
  }

  @Get('api')
  async getProfilesApi(@Session() session: Record<string, any>) {
    if (!session.authenticated || !session.accessToken) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    try {
      // Check if token needs refresh
      if (Date.now() >= session.tokenExpiresAt) {
        const tokens = await this.amazonApiService.refreshAccessToken(session.refreshToken);
        session.accessToken = tokens.access_token;
        session.tokenExpiresAt = Date.now() + (tokens.expires_in * 1000);
      }

      const profiles =  await this.authService.getProfiles(session.organizationId);
      
      return {
        success: true,
        data: profiles,
      };
    } catch (error) {
      this.logger.error('Failed to get profiles via API', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch profiles',
      };
    }
  }

  @Get('api/:id')
  async getProfileApi(@Param('id') profileId: string) {
    try {
      const profile = await this.amazonApiService.getProfile(profileId);
      return {
        success: true,
        data: profile,
      };
    } catch (error) {
      this.logger.error(`Failed to get profile ${profileId} via API`, error);
      return {
        success: false,
        error: error.message || 'Failed to fetch profile',
      };
    }
  }

  @Get(':id')
  @Render('profile-detail')
  async getProfileDetailPage(
    @Param('id') profileId: string,
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    // Check if user is authenticated
    if (!session.authenticated || !session.accessToken) {
      return res.redirect('/auth/login');
    }

    try {
      // Find profile in session
      const profile = session.profiles?.find(p => p.profileId.toString() === profileId);
      
      if (!profile) {
        return {
          title: 'Profile Details',
          profile: null,
          error: 'Profile not found.',
        };
      }
      
      return {
        title: `Profile: ${profile.accountInfo.name}`,
        profile,
        error: null,
      };
    } catch (error) {
      this.logger.error(`Failed to load profile ${profileId} detail page`, error);
      
      return {
        title: 'Profile Details',
        profile: null,
        error: 'Failed to load profile details.',
      };
    }
  }
}