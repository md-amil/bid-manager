import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CampaignController } from './controllers/campaign.controller';
import { ViewController } from './controllers/view.controller';
import { ProfileController } from './controllers/profile.controller';
import { AuthController } from './controllers/auth.controller';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { BidAdjustmentLog, BidAdjustmentLogSchema } from './schemas/bid-adjustment-log.schema';
import { CampaignReport, CampaignReportSchema, } from './schemas/reports/report.schema';
import { AmazonApiService } from './services/amazon/amazon-api.service';
import { BidService } from './services/amazon/bid.service';
import { CronService } from './services/cron.service';
import { AuthService } from './services/auth.service';
import { BullModule } from '@nestjs/bullmq';
import { AmazonSyncService } from './services/amazon/amazon-sync.service';
import { AdGroup, AdGroupSchema } from './schemas/ad-group.schema';
import { Ad, AdSchema } from './schemas/ad.schema';
import { AmazonSyncProcessor } from './queue/consumer/amazon-sync.processor';
import { BidProcessor } from './queue/consumer/bid.processor';
import { ReportProcessor } from './queue/consumer/report.processor';
import { CampaignService } from './services/campaign.service';
import { SyncProducer } from './queue/producer/sync.producer';
import { ReportProducer } from './queue/producer/report.producer';
import { ReportService } from './services/report.service';
import { BidProducer } from './queue/producer/bid.producer';
import { OptimizationLog, OptimizationLogSchema } from './schemas/optimization.schema';
import { CampaignApiService } from './services/amazon/campaign-api.service';
import { Keyword, KeywordSchema } from './schemas/keyword.schema';
import { Target, TargetSchema } from './schemas/target.schema';
import { Engine } from './engine/core/rule.engine';
import { AdGroupApiService } from './services/amazon/adgroup-api.service';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import { KeywordReport, KeywordReportSchema } from './schemas/reports/keyword-report.schema';
import { SearchTermReport, SearchTermReportSchema } from './schemas/reports/search-term-report.schema';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue(
      { name: 'campaignSync' },
      { name: 'reportProcessor' },
      { name: 'bidProcessor' }
    ),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/bid-manager'),
    MongooseModule.forFeature([
      { name: OptimizationLog.name, schema: OptimizationLogSchema },
      { name: Campaign.name, schema: CampaignSchema },
      { name: BidAdjustmentLog.name, schema: BidAdjustmentLogSchema },
      { name: CampaignReport.name, schema: CampaignReportSchema },
      { name: AdGroup.name, schema: AdGroupSchema },
      { name: Ad.name, schema: AdSchema },
      { name: Keyword.name, schema: KeywordSchema },
      { name: Target.name, schema: TargetSchema },
      { name: KeywordReport.name, schema: KeywordReportSchema },
       { name: SearchTermReport.name, schema: SearchTermReportSchema },

      { name: Profile.name, schema: ProfileSchema },

    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController, CampaignController, ViewController, ProfileController, AuthController],
  providers: [AppService,AdGroupApiService, AmazonApiService,Engine, CampaignApiService,BidService, CronService, AuthService, AmazonSyncService, AmazonSyncProcessor, BidProcessor, ReportProcessor, CampaignService, SyncProducer, ReportProducer, BidProducer, ReportService],
})
export class AppModule { }
