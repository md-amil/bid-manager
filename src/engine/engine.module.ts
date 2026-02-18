import { Module } from '@nestjs/common';
import { AcosRoasEngine } from './acos-roas.engine';
import { AutoCampaignEngine } from './auto-campaign.engine';
import { BidAdjustmentEngine } from './bid-adjustment.engine';
import { BudgetEngine } from './budget.engine';
import { KeywordTargetingEngine } from './keyword-targeting.engine';
import { MonitoringEngine } from './monitoring.engine';

const ENGINES = [
  AcosRoasEngine,
  BudgetEngine,
  AutoCampaignEngine,
  BidAdjustmentEngine,
  MonitoringEngine,
  KeywordTargetingEngine,
];

@Module({
  providers: ENGINES,
  exports: ENGINES,
})
export class EngineModule {}
