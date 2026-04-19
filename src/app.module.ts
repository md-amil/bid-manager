import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ClsModule } from 'nestjs-cls';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CampaignController } from './controllers/campaign.controller';
import { ViewController } from './controllers/view.controller';
import { ProfileController } from './controllers/profile.controller';
import { AuthController } from './controllers/auth.controller';
import { SettingController } from './controllers/setting.controller';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { AdjustmentLog, AdjustmentLogSchema } from './schemas/log.schema';
import { CampaignReport, CampaignReportSchema, } from './schemas/reports/campaign-report';
import { AmazonApiService } from './services/amazon/amazon-api.service';
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
// import { OptimizationLog, OptimizationLogSchema } from './schemas/optimization.schema';
import { CampaignApiService } from './services/amazon/campaign-api.service';
import { Keyword, KeywordSchema } from './schemas/keyword.schema';
import { Target, TargetSchema } from './schemas/target.schema';
import { AdGroupApiService } from './services/amazon/adgroup-api.service';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import { KeywordReport, KeywordReportSchema } from './schemas/reports/keyword-report.schema';
import { SearchTermReport, SearchTermReportSchema } from './schemas/reports/search-term-report.schema';
import { User, UserSchema } from './schemas/user.schema';
import { Organization, OrganizationSchema } from './schemas/organization.schema';
import Engine from './engine/core/rule.engine';
import DailyRuleEngine from './engine/core/daily-rule.engine';
import { AuthApiService } from './services/amazon/auth-api.service';
import { ClsMiddleware } from './middleware/cls.middleware';
import { DateFilterMiddleware } from './middleware/date-filter.middleware';
import { AuthMiddleware } from './middleware/auth.middleware';
import { AdjustmentLogService } from './services/log.service';
import { TargetReport, TargetReportSchema } from './schemas/reports/target-report.schema';
import { Product, ProductSchema } from './schemas/product.schema';
import { AdReport, AdReportSchema } from './schemas/reports/ad-report.schema';
import { AdGroupReport, AdGroupReportSchema } from './schemas/reports/adgroup-report.schema';
import { ReportApiService } from './services/amazon/report-api.service';
import { Setting, SettingSchema } from './schemas/setting.schema';
import { SettingService } from './services/setting.service';
import { DataService } from './services/data.service';

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
      { name: Campaign.name, schema: CampaignSchema },
      { name: AdjustmentLog.name, schema: AdjustmentLogSchema },
      { name: CampaignReport.name, schema: CampaignReportSchema },
      { name: AdGroup.name, schema: AdGroupSchema },
      { name: Ad.name, schema: AdSchema },
      { name: Keyword.name, schema: KeywordSchema },
      { name: Target.name, schema: TargetSchema },
      { name: KeywordReport.name, schema: KeywordReportSchema },
      { name: TargetReport.name, schema: TargetReportSchema },
      { name: SearchTermReport.name, schema: SearchTermReportSchema },
      { name: Profile.name, schema: ProfileSchema },
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Product.name, schema: ProductSchema },
      { name: AdReport.name, schema: AdReportSchema },
      { name: AdGroupReport.name, schema: AdGroupReportSchema },
      { name: Setting.name, schema: SettingSchema },
    ]),
    ScheduleModule.forRoot(),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: false, // We'll manually apply middleware to ensure session is available
      },
    }),
  ],
  controllers: [AppController, CampaignController, ViewController, ProfileController, AuthController, SettingController],
  providers: [
    AdjustmentLogService,
    CampaignApiService,
    AmazonSyncService,
    AmazonSyncProcessor,
    AdGroupApiService,
    AmazonApiService,
    ReportApiService,
    AppService,
    AuthApiService,
    Engine,
    DailyRuleEngine,
    CronService, AuthService,
    BidProcessor, ReportProcessor,
    CampaignService, SyncProducer,
    ReportProducer, BidProducer,
    ReportService,
    SettingService,
    DataService
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ClsMiddleware)
      .forRoutes('*');
    
    consumer
      .apply(DateFilterMiddleware)
      .forRoutes('*');
    
    // Apply auth middleware to protected routes (exclude auth pages)
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.GET },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.GET },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/amazon', method: RequestMethod.GET },
        { path: 'auth/callback', method: RequestMethod.GET },
        { path: 'auth/connect-amazon', method: RequestMethod.GET },
        { path: 'auth/logout', method: RequestMethod.GET },
        { path: 'select-profile', method: RequestMethod.GET },
        { path: 'select-profile', method: RequestMethod.POST },
        'auth/(.*)'
      )
      .forRoutes('*');
  }
}
