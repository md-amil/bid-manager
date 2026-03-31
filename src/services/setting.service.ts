import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from '../schemas/setting.schema';

@Injectable()
export class SettingService {
  constructor(
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>,
  ) {}

  private getDefaults(organizationId: string) {
    return [
      {
        key: 'targetAcos',
        organizationId,
        value: 0.2,
        label: 'Target ACOS',
        description: 'Target Advertising Cost of Sales (20% = 0.2)',
        type: 'percent',
        category: 'general',
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: 'minSales',
        organizationId,
        value: 100,
        label: 'Minimum Sales',
        description: 'Minimum sales amount to consider a term profitable',
        type: 'currency',
        category: 'thresholds',
        min: 0,
        max: 10000,
        step: 10,
      },
      {
        key: 'minClicks',
        organizationId,
        value: 20,
        label: 'Minimum Clicks',
        description: 'Minimum clicks before making bid decisions',
        type: 'number',
        category: 'thresholds',
        min: 0,
        max: 1000,
        step: 1,
      },
      {
        key: 'minSpend',
        organizationId,
        value: 200,
        label: 'Minimum Spend',
        description: 'Minimum spend threshold for negative keywords',
        type: 'currency',
        category: 'thresholds',
        min: 0,
        max: 5000,
        step: 10,
      },
      {
        key: 'minRoas',
        organizationId,
        value: 5,
        label: 'Minimum ROAS',
        description: 'Minimum Return on Ad Spend',
        type: 'number',
        category: 'general',
        min: 0,
        max: 50,
        step: 0.5,
      },
      {
        key: 'minImpressions',
        organizationId,
        value: 500,
        label: 'Minimum Impressions',
        description: 'Minimum impressions for listing issue detection',
        type: 'number',
        category: 'thresholds',
        min: 0,
        max: 10000,
        step: 10,
      },
      {
        key: 'minCvr',
        organizationId,
        value: 8,
        label: 'Minimum Conversion Rate',
        description: 'Minimum conversion rate percentage',
        type: 'percent',
        category: 'thresholds',
        min: 0,
        max: 100,
        step: 0.5,
      },
      {
        key: 'budgetUtilizationThreshold',
        organizationId,
        value: 0.85,
        label: 'Budget Utilization Threshold',
        description: 'Threshold for budget utilization check (85% = 0.85)',
        type: 'percent',
        category: 'thresholds',
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: 'expectedConversionRate',
        organizationId,
        value: 3,
        label: 'Expected Conversion Rate',
        description: 'Expected conversion rate for calculations',
        type: 'percent',
        category: 'thresholds',
        min: 0,
        max: 100,
        step: 0.5,
      },
      {
        key: 'searchWindow',
        organizationId,
        value: 7,
        label: 'Search Window (Days)',
        description: 'Number of days to look back for search term data',
        type: 'number',
        category: 'general',
        min: 1,
        max: 90,
        step: 1,
      },
    ];
  }

  async initializeDefaults(organizationId: string) {
    const defaults = this.getDefaults(organizationId);

    for (const defaultSetting of defaults) {
      await this.settingModel.findOneAndUpdate(
        { key: defaultSetting.key, organizationId },
        { $setOnInsert: defaultSetting },
        { upsert: true, new: true }
      ).exec();
    }
  }

  async getAllSettings(organizationId: string): Promise<Setting[]> {
    return this.settingModel.find({ organizationId }).sort({ category: 1, label: 1 }).exec();
  }

  async getSettingByKey(key: string, organizationId: string): Promise<Setting | null> {
    return this.settingModel.findOne({ key, organizationId }).exec();
  }

  async updateSetting(key: string, value: number, organizationId: string): Promise<Setting | null> {
    return this.settingModel.findOneAndUpdate(
      { key, organizationId },
      { value },
      { new: true },
    ).exec();
  }

  async getConfigObject(organizationId: string): Promise<Record<string, number>> {
    const settings = await this.getAllSettings(organizationId);
    const config: Record<string, number> = {};
    settings.forEach((setting) => {
      config[setting.key] = setting.value;
    });
    return config;
  }
}
