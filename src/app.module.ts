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
import { AmazonApiService } from './services/amazon-api.service';
import { BidAdjustmentService } from './services/bid-adjustment.service';
import { CronService } from './services/cron.service';
import { AuthService } from './services/auth.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/bid-manager'),
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: BidAdjustmentLog.name, schema: BidAdjustmentLogSchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController, CampaignController, ViewController, ProfileController, AuthController],
  providers: [AppService, AmazonApiService, BidAdjustmentService, CronService, AuthService],
})
export class AppModule {}
