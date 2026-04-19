import { Injectable, Logger } from '@nestjs/common';
import { Cron,  } from '@nestjs/schedule';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Organization } from 'src/schemas/organization.schema';
// import { Profile } from 'src/schemas/profile.schema';
import { AuthService } from './auth.service';
// import { AmazonSyncService } from './amazon/amazon-sync.service';
import { ReportProducer } from 'src/queue/producer/report.producer';
import { AuthApiService } from './amazon/auth-api.service';
import { SyncProducer } from 'src/queue/producer/sync.producer';
import DailyRuleEngine from 'src/engine/core/daily-rule.engine';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    // @InjectModel(Organization.name) private organizationModel: Model<Organization>,
    // @InjectModel(Profile.name) private profileModel: Model<Profile>,
    private authService: AuthService,
    private authApi: AuthApiService,
    // private amazonSyncService: AmazonSyncService,
    private reportProducer: ReportProducer,
    private syncProducer: SyncProducer,
    private dailyRuleEngine: DailyRuleEngine,
  ) { }

  /**
   * Daily cron job to generate reports for all organizations
   * Runs at 1:00 AM every day
   * Flow: Get all organizations -> For each org: Sync profiles -> Generate all reports
   */
  @Cron('0 1 * * *', {
    name: 'daily-report-generation',
    timeZone: 'America/New_York',
  })
  async handleDailyReportGeneration() {
    this.logger.log('Starting daily report generation cron job', new Date());
    try {
      const organizations = await this.authService.getAllOrganizations();
      this.logger.log(`Found ${organizations.length} organizations to process`);

      for (const organization of organizations) {
        try {
          this.logger.log(`Processing report generation for organization: ${organization._id}`);
          if (!organization.refreshToken) {
            this.logger.warn(`Organization ${organization._id} has no refresh token, skipping...`);
            continue;
          }
          const tokens = await this.authApi.refreshAccessToken(organization.refreshToken);
          this.logger.log(`Syncing profiles for organization ${organization._id}...`);
          await this.authService.syncProfiles(organization._id.toString(), tokens.access_token);
          const profiles = await this.authService.getProfiles(organization._id.toString());
          this.logger.log(`Found ${profiles.length} profiles to process for organization ${organization._id}`);
          this.reportProducer.generateOrganizationReport(profiles, tokens.access_token);
          this.logger.log(`Report generation queued for organization: ${organization._id}`);
        } catch (orgError) {
          this.logger.error(`Error processing organization ${organization._id}:`, orgError.message);
          // Continue with next organization even if one fails
        }
      }
      this.logger.log('Daily report generation cron job completed successfully');
    } catch (error) {
      this.logger.error('Error in daily report generation cron job', error);
    }
  }

  /**
   * Daily cron job to run bid adjustments for all profiles across all organizations
   * Runs at 2:00 AM every day (1 hour after report generation)
   * Flow: Get all organizations -> For each org: Get all profiles -> Generate access token -> Run daily rule engine for each profile
   */
  @Cron('0 2 * * *', {
    name: 'daily-bid-adjustment',
    timeZone: 'America/New_York',
  })
  async handleDailyBidAdjustment() {
    this.logger.log('Starting daily bid adjustment cron job', new Date());
    try {
      const organizations = await this.authService.getAllOrganizations();
      this.logger.log(`Found ${organizations.length} organizations to process for bid adjustment`);

      for (const organization of organizations) {
        try {
          this.logger.log(`Processing bid adjustment for organization: ${organization._id}`);
          
          if (!organization.refreshToken) {
            this.logger.warn(`Organization ${organization._id} has no refresh token, skipping...`);
            continue;
          }
          
          // Get fresh access token for the organization
          const tokens = await this.authApi.refreshAccessToken(organization.refreshToken);
          this.logger.log(`Refreshed access token for organization ${organization._id}`);
          
          // Get all profiles for the organization
          const profiles = await this.authService.getProfiles(organization._id.toString());
          this.logger.log(`Found ${profiles.length} profiles to process for organization ${organization._id}`);
          
          // Run daily rule engine for each profile
          for (const profile of profiles) {
            try {
              this.logger.log(`Running daily adjustment for profile: ${profile.profileId} (org: ${organization._id})`);
              await this.dailyRuleEngine.run({
                scopeId: profile.profileId.toString(),
                accessToken: tokens.access_token,
              });
              this.logger.log(`Completed daily adjustment for profile: ${profile.profileId}`);
            } catch (profileError) {
              this.logger.error(`Error processing profile ${profile.profileId}:`, profileError.message);
              // Continue with next profile even if one fails
            }
          }
          
          this.logger.log(`Completed bid adjustment for organization: ${organization._id}`);
        } catch (orgError) {
          this.logger.error(`Error processing organization ${organization._id}:`, orgError.message);
          // Continue with next organization even if one fails
        }
      }
      
      this.logger.log('Daily bid adjustment cron job completed successfully');
    } catch (error) {
      this.logger.error('Error in daily bid adjustment cron job', error);
    }
  }

  /**
   * Weekly cron job to sync campaign data for all organizations
   * Runs every Sunday at 3:00 AM (after daily adjustment)
   * Flow: Get all organizations -> For each org: Sync profiles -> Sync all campaign data
   */
  @Cron('0 3 * * 0', {
    name: 'weekly-campaign-sync',
    timeZone: 'America/New_York',
  })
  async handleWeeklyCampaignSync() {
    this.logger.log('Starting weekly campaign sync cron job');
    try {
      const organizations = await this.authService.getAllOrganizations();
      this.logger.log(`Found ${organizations.length} organizations to sync`);

      for (const organization of organizations) {
        try {
          if (!organization.refreshToken) {
            this.logger.warn(`Organization ${organization._id} has no refresh token, skipping...`);
            continue;
          }
          this.logger.log(`Processing campaign sync for organization: ${organization._id}`);
          const tokens = await this.authApi.refreshAccessToken(organization.refreshToken);
          this.logger.log(`Syncing profiles for organization ${organization._id}...`);
          await this.authService.syncProfiles(organization._id.toString(), tokens.access_token);
          const profiles = await this.authService.getProfiles(organization._id.toString());
          this.logger.log(`Found ${profiles.length} profiles to sync for organization ${organization._id}`);
          this.syncProducer.syncOrganizationCampaign(profiles, tokens.access_token);
          this.logger.log(`Campaign sync queued for organization: ${organization._id}`);
        } catch (orgError) {
          this.logger.error(`Error processing organization ${organization._id}:`, orgError.message);
          // Continue with next organization even if one fails
        }
      }
      this.logger.log('Weekly campaign sync cron job completed successfully');
    } catch (error) {
      this.logger.error('Error in weekly campaign sync cron job', error);
    }
  }
}
