import { Controller, Get, Post, Query, Redirect, Render, Session, Logger, Res, Body, Req } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
// import { Organization } from '../schemas/organization.schema';
import { Profile } from '../schemas/profile.schema';
// import { AmazonApiService } from 'src/services/amazon/amazon-api.service';
import { AuthApiService } from 'src/services/amazon/auth-api.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly authApi: AuthApiService,

    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
  ) { }

  /**
   * Login page
   */
  @Get('login')
  async loginPage(@Session() session: Record<string, any>, @Res() res: Response) {
    const envRefreshToken = process.env.AMAZON_REFRESH_TOKEN;
    const profileId = process.env.AMAZON_PROFILE_ID;
    const accessToken = process.env.ACCESS_TOKEN;

    // If already authenticated with Amazon, redirect to home
    if (session.authenticated) {
      return res.redirect('/');
    }

    // If user is logged in but no Amazon account connected, show connect page
    if (session.userId && !session.authenticated) {
      return res.redirect('/auth/connect-amazon');
    }

    if (envRefreshToken && !session.authenticated) {
      this.logger.log('Refresh token found in environment, attempting auto-login');
      try {
        const tokens = await this.authApi.refreshAccessToken(envRefreshToken);
        const profiles = await this.authService.getProfiles(tokens.access_token);
        session.accessToken = tokens.access_token;
        session.refreshToken = tokens.refresh_token;
        session.tokenExpiresAt = Date.now() + (tokens.expires_in * 1000);
        // session.profiles = profiles;
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

    // Show login page
    return res.render('login', {
      title: 'Login to Amazon Bid Manager',
    });
  }

  /**
   * Handle login form submission
   */
  @Post('login')
  async handleLogin(
    @Body('email') email: string,
    @Body('password') password: string,
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    try {
      // Find user by email
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        return res.render('login', {
          error: 'invalid_credentials',
          title: 'Login to Amazon Bid Manager'
        });
      }

      // Compare password (plain text for now - should use bcrypt in production)
      if (password !== user.password) {
        return res.render('login', {
          error: 'invalid_credentials',
          title: 'Login to Amazon Bid Manager'
        });
      }

      // Store user in session
      session.userId = user._id;
      session.userEmail = user.email;
      session.userName = user.name;

      this.logger.log(`User ${email} logged in successfully`);

      // Check if user has Amazon account connected
      const org = await this.authService.getOrganization(user._id);
      
      if (!org.refreshToken) {
        // No Amazon account connected, redirect to connect page
        return new Promise((resolve, reject) => {
          session.save((err) => {
            if (err) reject(err);
            else resolve(res.redirect('/auth/connect-amazon'));
          });
        });
      }

      // Auto-connect Amazon if refresh token exists
      try {
        Object.assign(session, await this.authService.getSessionDetails(org));
        return new Promise((resolve, reject) => {
          session.save((err) => {
            if (err) reject(err);
            else resolve(res.redirect('/select-profile'));
          });
        });
      } catch (error) {
        this.logger.error('Failed to auto-connect Amazon', error);
        return new Promise((resolve, reject) => {
          session.save((err) => {
            if (err) reject(err);
            else resolve(res.redirect('/auth/connect-amazon'));
          });
        });
      }
    } catch (error) {
      this.logger.error('Login error', error);
      return res.render('login', {
        error: 'auth_failed',
        title: 'Login to Amazon Bid Manager'
      });
    }
  }

  /**
   * Registration page
   */
  @Get('register')
  async registerPage(@Session() session: Record<string, any>, @Res() res: Response) {
    if (session.userId) {
      return res.redirect('/');
    }

    return res.render('register', {
      title: 'Create Organization',
    });
  }

  /**
   * Handle registration form submission
   */
  @Post('register')
  async handleRegister(
    @Body('orgName') orgName: string,
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('phone') phone: string,
    @Body('password') password: string,
    @Body('confirmPassword') confirmPassword: string,
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        return res.render('register', {
          error: 'Passwords do not match',
          title: 'Create Organization'
        });
      }

      // Check if email already exists
      const existingUser = await this.userModel.findOne({ email }).exec();
      if (existingUser) {
        return res.render('register', {
          error: 'Email already registered',
          title: 'Create Organization'
        });
      }

      // Check if phone already exists
      const existingPhone = await this.userModel.findOne({ phone }).exec();
      if (existingPhone) {
        return res.render('register', {
          error: 'Phone number already registered',
          title: 'Create Organization'
        });
      }

      const { user } = await this.authService.createOrganization({
        name,
        email,
        phone,
        password,
        orgName
      })
      // Store user in session
      session.userId = user._id;
      session.userEmail = user.email;
      session.userName = user.name;
      this.logger.log(`New organization "${orgName}" created by ${email}`);

      return new Promise((resolve, reject) => {
        session.save((err) => {
          if (err) reject(err);
          else resolve(res.redirect('/auth/connect-amazon'));
        });
      });
    } catch (error) {
      this.logger.error('Registration error', error);
      return res.render('register', {
        error: 'Failed to create account. Please try again.',
        title: 'Create Organization'
      });
    }
  }

  /**
   * Connect Amazon account page
   */
  @Get('connect-amazon')
  async connectAmazonPage(@Session() session: Record<string, any>, @Res() res: Response) {
    if (!session.userId) {
      return res.redirect('/auth/login');
    }

    if (session.authenticated) {
      return res.redirect('/');
    }

    return res.render('connect-amazon', {
      title: 'Connect Amazon Account',
    });
  }

  /**
   * Initiate Amazon OAuth flow
   */
  @Get('amazon')
  @Redirect()
  initiateAmazonLogin() {
    const authUrl = this.authApi.getAuthorizationUrl();
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
    const userId = session.userId;
    if (!userId) {
      this.logger.error('No userId in session');
      return res.redirect('/auth/login?error=auth_failed');
    }
    try {
      const { tokens, profiles: savedProfiles, organization } = await this.authService.updateOrganization(userId, code);
      session.accessToken = tokens.access_token;
      session.refreshToken = tokens.refresh_token;
      session.tokenExpiresAt = Date.now() + (tokens.expires_in * 1000);
      session.authenticated = true;
      session.organizationId = organization._id;
      this.logger.log(`User authenticated successfully with ${savedProfiles.length} profiles`);

      return new Promise((resolve, reject) => {
        session.save((err) => {
          if (err) reject(err);
          else resolve(res.redirect('/select-profile'));
        });
      });
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
      // hasProfiles: !!(session.profiles && session.profiles.length > 0),
    };
  }

  /**
   * Sync profiles with Amazon API
   */
  @Post('sync-profiles')
  async syncProfiles(@Req() req: any) {
    const organizationId = req.session.organizationId;
    const accessToken = req.session.accessToken;
    
    if (!organizationId) {
      return { success: false, message: 'Organization not found' };
    }
    
    if (!accessToken) {
      return { success: false, message: 'Not authenticated with Amazon' };
    }
    
    try {
      const result = await this.authService.syncProfiles(organizationId, accessToken);
      return { success: true, ...result };
    } catch (error) {
      this.logger.error('Profile sync failed', error);
      return { success: false, message: error.message };
    }
  }
}
