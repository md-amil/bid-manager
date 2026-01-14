import { Controller, Get, Query, Redirect, Render, Session, Logger, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

  /**
   * Login page
   */
  @Get('login')
  async loginPage(@Session() session: Record<string, any>, @Res() res: Response) {
    const envRefreshToken = process.env.AMAZON_REFRESH_TOKEN;
    const profileId = process.env.AMAZON_PROFILE_ID;

    if (envRefreshToken && !session.authenticated) {
      this.logger.log('Refresh token found in environment, attempting auto-login');
      try {
        const tokens = await this.authService.refreshAccessToken(envRefreshToken);
        const profiles = await this.authService.getProfiles(tokens.access_token);
        session.accessToken = tokens.access_token;
        session.refreshToken = tokens.refresh_token || envRefreshToken;
        session.tokenExpiresAt = Date.now() + (tokens.expires_in * 1000);
        session.profiles = profiles;
        session.authenticated = true;

        this.logger.log('Auto-login successful, redirecting to profile selection');
        if (profileId) {
          session.selectedProfile = profiles.find(p => p.profileId.toString() === profileId);
          return res.redirect('/');
        }
        return res.redirect('/select-profile');
      } catch (error) {
        this.logger.error('Auto-login failed, showing login page', error);
      }
    }

    // If already authenticated, redirect to select profile
    if (session.authenticated) {
      return res.redirect('/select-profile');
    }

    // Show login page
    return res.render('login', {
      title: 'Login to Amazon Advertising',
    });
  }

  /**
   * Initiate Amazon OAuth flow
   */
  @Get('amazon')
  @Redirect()
  initiateAmazonLogin() {
    const authUrl = this.authService.getAuthorizationUrl();
    this.logger.log('Redirecting to Amazon OAuth');
    return { url: authUrl };
  }

  /**
   * OAuth callback handler
   */
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    if (error) {
      this.logger.error(`OAuth error: ${error}`);
      return res.redirect('/auth/login?error=access_denied');
    }

    if (!code) {
      this.logger.error('No authorization code received');
      return res.redirect('/auth/login?error=no_code');
    }

    try {
      // Exchange code for tokens
      const tokens = await this.authService.exchangeCodeForTokens(code);


      // Get user profiles
      const profiles = await this.authService.getProfiles(tokens.access_token);
      console.log(tokens, "token")
      console.log(profiles, "profiles")

      // Store in session
      session.accessToken = tokens.access_token;
      session.refreshToken = tokens.refresh_token;
      session.tokenExpiresAt = Date.now() + (tokens.expires_in * 1000);
      session.profiles = profiles;
      session.authenticated = true;

      this.logger.log('User authenticated successfully');

      // Redirect to profile selection page
      return res.redirect('/select-profile');
    } catch (err) {
      this.logger.error('Authentication failed', err);
      return res.redirect('/auth/login?error=auth_failed');
    }
  }

  /**
   * Logout
   */
  @Get('logout')
  logout(@Session() session: Record<string, any>, @Res() res: Response) {
    session.destroy((err) => {
      if (err) {
        this.logger.error('Failed to destroy session', err);
      }
    });
    return res.redirect('/auth/login?message=logged_out');
  }

  /**
   * Check authentication status
   */
  @Get('status')
  checkStatus(@Session() session: Record<string, any>) {
    return {
      authenticated: !!session.authenticated,
      hasProfiles: !!(session.profiles && session.profiles.length > 0),
    };
  }
}
