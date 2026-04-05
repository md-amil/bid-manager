import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization } from 'src/schemas/organization.schema';
import { Profile } from 'src/schemas/profile.schema';
import { AuthService } from './auth.service';
import { AmazonSyncService } from './amazon/amazon-sync.service';
import { ReportProducer } from 'src/queue/producer/report.producer';
import { AuthApiService } from './amazon/auth-api.service';
import { SyncProducer } from 'src/queue/producer/sync.producer';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectModel(Organization.name) private organizationModel: Model<Organization>,
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
    private authService: AuthService,
    private authApi: AuthApiService,
    private amazonSyncService: AmazonSyncService,
    private reportProducer: ReportProducer,
    private syncProducer: SyncProducer,
  ) { }

  /**
   * Daily cron job to generate reports for all organizations
   * Runs at 1:00 AM every day
   * Flow: Get saved organization -> Sync profiles -> Generate all reports
   */
  @Cron('0 1 * * *', {
    name: 'daily-report-generation',
    timeZone: 'America/New_York',
  })
  async handleDailyReportGeneration() {
    this.logger.log('Starting daily report generation cron job');
    try {
      const organization = await this.authService.getOrganization()
      this.logger.log(`Processing report generation for organization: ${organization._id}`);
      if (!organization.refreshToken) return
      const tokens = await this.authApi.refreshAccessToken(organization.refreshToken);
      this.logger.log('Syncing profiles...');
      await this.authService.syncProfiles(organization._id.toString(), tokens.access_token);
      const profiles = await this.authService.getProfiles(organization._id.toString())
      this.logger.log(`Found ${profiles.length} profiles to process`);
      this.reportProducer.generateOrganizationReport(profiles, tokens.access_token);
      this.logger.log('Daily report generation cron job completed successfully');
    } catch (error) {
      this.logger.error('Error in daily report generation cron job', error);
    }
  }

  /**
   * Weekly cron job to sync campaign data
   * Runs every Sunday at 2:00 AM
   * Flow: Get saved organization -> Sync profiles -> Sync all campaign data
   */
  @Cron('0 2 * * 0', {
    name: 'weekly-campaign-sync',
    timeZone: 'America/New_York',
  })
  async handleWeeklyCampaignSync() {
    this.logger.log('Starting weekly campaign sync cron job');
    try {
      const organization = await this.authService.getOrganization()
      if (!organization.refreshToken) {
       return  this.logger.warn(`Organization ${organization._id} has no refresh token`);
      }
      this.logger.log(`Processing campaign sync for organization: ${organization._id}`);
      const tokens = await this.authApi.refreshAccessToken(organization.refreshToken);
      this.logger.log('Syncing profiles...');
      await this.authService.syncProfiles(organization._id.toString(), tokens.access_token);
      const profiles = await this.authService.getProfiles(organization._id.toString())
      this.logger.log(`Found ${profiles.length} profiles to sync`);
      this.syncProducer.syncOrganizationCampaign(profiles,tokens.access_token)
      this.logger.log('Weekly campaign sync cron job completed successfully');
    } catch (error) {
      this.logger.error('Error in weekly campaign sync cron job', error);
    }
  }
}
