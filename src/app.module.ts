import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';

import configuration from './config/configuration';

// Controllers
import { AppController } from './app.controller';
import { CampaignController } from './controllers/campaign.controller';
import { ViewController } from './controllers/view.controller';
import { ProfileController } from './controllers/profile.controller';
import { AuthController } from './controllers/auth.controller';

// Services
import { AppService } from './app.service';
import { AuthService } from './services/auth.service';
import { CampaignService } from './services/campaign.service';
import { ReportService } from './services/report.service';
import { CronService } from './services/cron.service';
import { AmazonApiService } from './services/amazon/amazon-api.service';
import { AmazonSyncService } from './services/amazon/amazon-sync.service';
import { CampaignApiService } from './services/amazon/campaign-api.service';
import { AdGroupApiService } from './services/amazon/adgroup-api.service';

// Queue producers & processors
import { SyncProducer } from './queue/producer/sync.producer';
import { ReportProducer } from './queue/producer/report.producer';
import { BidProducer } from './queue/producer/bid.producer';
import { AmazonSyncProcessor } from './queue/consumer/amazon-sync.processor';
import { ReportProcessor } from './queue/consumer/report.processor';
import { BidProcessor } from './queue/consumer/bid.processor';

// Optimization
import { OptimizationService } from './modules/optimization/optimization.service';

// Schemas
import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { AdGroup, AdGroupSchema } from './schemas/ad-group.schema';
import { Ad, AdSchema } from './schemas/ad.schema';
import { Keyword, KeywordSchema } from './schemas/keyword.schema';
import { Target, TargetSchema } from './schemas/target.schema';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import {
  BidAdjustmentLog,
  BidAdjustmentLogSchema,
} from './schemas/bid-adjustment-log.schema';
import {
  OptimizationLog,
  OptimizationLogSchema,
} from './schemas/optimization.schema';
import {
  CampaignReport,
  CampaignReportSchema,
} from './schemas/reports/report.schema';
import {
  KeywordReport,
  KeywordReportSchema,
} from './schemas/reports/keyword-report.schema';
import {
  SearchTermReport,
  SearchTermReportSchema,
} from './schemas/reports/search-term-report.schema';

// Engine module (provides all 6 @Injectable engines)
import { EngineModule } from './engine/engine.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),

    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017/bid-manager',
    ),

    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: AdGroup.name, schema: AdGroupSchema },
      { name: Ad.name, schema: AdSchema },
      { name: Keyword.name, schema: KeywordSchema },
      { name: Target.name, schema: TargetSchema },
      { name: Profile.name, schema: ProfileSchema },
      { name: BidAdjustmentLog.name, schema: BidAdjustmentLogSchema },
      { name: OptimizationLog.name, schema: OptimizationLogSchema },
      { name: CampaignReport.name, schema: CampaignReportSchema },
      { name: KeywordReport.name, schema: KeywordReportSchema },
      { name: SearchTermReport.name, schema: SearchTermReportSchema },
    ]),

    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
    }),
    BullModule.registerQueue(
      { name: 'campaignSync' },
      { name: 'reportProcessor' },
      { name: 'bidProcessor' },
    ),

    ScheduleModule.forRoot(),
    EngineModule,
  ],

  controllers: [
    AppController,
    CampaignController,
    ViewController,
    ProfileController,
    AuthController,
  ],

  providers: [
    // Core
    AppService,

    // Auth
    AuthService,

    // Amazon API clients
    AmazonApiService,
    CampaignApiService,
    AdGroupApiService,
    AmazonSyncService,

    // Domain services
    CampaignService,
    ReportService,

    // Optimization (wires engines → Amazon API → OptimizationLog)
    OptimizationService,

    // Scheduled jobs
    CronService,

    // Queue producers
    SyncProducer,
    ReportProducer,
    BidProducer,

    // Queue processors (workers)
    AmazonSyncProcessor,
    ReportProcessor,
    BidProcessor,
  ],
})
export class AppModule {}
