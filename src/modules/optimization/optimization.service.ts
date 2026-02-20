import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';

import { AcosRoasEngine, EntityType } from 'src/engine/acos-roas.engine';
import { AutoCampaignEngine } from 'src/engine/auto-campaign.engine';
import {
  BidAdjustmentEngine,
  BidInput,
} from 'src/engine/bid-adjustment.engine';
import { BudgetEngine, BudgetInput } from 'src/engine/budget.engine';
import {
  KeywordTargetingEngine,
  MatchType,
} from 'src/engine/keyword-targeting.engine';
import { MonitoringEngine } from 'src/engine/monitoring.engine';

import { CampaignApiService } from 'src/services/amazon/campaign-api.service';
import { CampaignService } from 'src/services/campaign.service';
import { OptimizationLog } from 'src/schemas/optimization.schema';
import { ICampaignBundle } from 'src/engine/interfaces';
import { SearchTermDocument } from 'src/schemas/reports/search-term-report.schema';
import { TargetingType } from 'src/schemas/campaign.schema';

export interface OptimizeCampaignParams {
  bundle: ICampaignBundle;
  searchTerms: SearchTermDocument[];
  scopeId: string;
  budgetUsages?: BudgetUsage[];
}

export interface BudgetUsage {
  campaignId: string;
  budgetUtilizationPercent?: number;
}

@Injectable()
export class OptimizationService {
  private readonly logger = new Logger(OptimizationService.name);
  private readonly targetAcos: number;
  private readonly minBid: number;
  private readonly maxBid: number;

  constructor(
    private readonly acosRoasEngine: AcosRoasEngine,
    private readonly autoCampaignEngine: AutoCampaignEngine,
    private readonly bidAdjustmentEngine: BidAdjustmentEngine,
    private readonly budgetEngine: BudgetEngine,
    private readonly keywordTargetingEngine: KeywordTargetingEngine,
    private readonly monitoringEngine: MonitoringEngine,
    private readonly campaignApiService: CampaignApiService,
    private readonly campaignService: CampaignService,
    private readonly configService: ConfigService,
    @InjectModel(OptimizationLog.name)
    private readonly optimizationLogModel: Model<OptimizationLog>,
  ) {
    this.targetAcos = parseFloat(this.configService.get('TARGET_ACOS', '0.30'));
    this.minBid = parseFloat(this.configService.get('MIN_BID_AMOUNT', '0.25'));
    this.maxBid = parseFloat(this.configService.get('MAX_BID_AMOUNT', '10.00'));
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  async optimizeCampaign(params: OptimizeCampaignParams): Promise<void> {
    const { bundle, searchTerms, scopeId, budgetUsages = [] } = params;

    if (!bundle || bundle.state === 'PAUSED') return;

    const report = bundle.campaignReport;
    if (!report) {
      this.logger.warn(`No report found for campaign ${bundle.campaignId}`);
      return;
    }

    const acos =
      report.spend > 0 && report.sales14d > 0
        ? report.spend / report.sales14d
        : null;

    const budgetUsage = budgetUsages.find(
      (u) => String(u.campaignId) === String(bundle.campaignId),
    );
    const budgetExhaustedEarly =
      (budgetUsage?.budgetUtilizationPercent ?? 0) >= 100;

    // 1. Evaluate ACOS/ROAS health (logged for audit, drives downstream logic)
    const acosMetrics = this.acosRoasEngine.evaluate({
      spend: report.spend ?? 0,
      sales: report.sales14d ?? 0,
      clicks: report.clicks ?? 0,
      impressions: report.impressions ?? 0,
      netMargin: this.targetAcos,
      dataWindowDays: 14,
      entityType: EntityType.CAMPAIGN,
      targetAcos: this.targetAcos,
    });

    this.logger.log(
      `Campaign ${bundle.campaignId} | zone=${acosMetrics.zone} | acos=${acos?.toFixed(2) ?? 'N/A'}`,
    );

    // 2. Budget decision
    await this.applyBudgetDecision(bundle, acos, budgetExhaustedEarly, scopeId);

    // 3. Bid decision — by targeting type
    if (bundle.targetingType === TargetingType.AUTO) {
      await this.optimizeAutoCampaign(bundle, acos, searchTerms, scopeId);
    } else {
      await this.optimizeManualCampaign(bundle, scopeId);
    }
  }

  // ─── Budget ──────────────────────────────────────────────────────────────────

  private async applyBudgetDecision(
    bundle: ICampaignBundle,
    acos: number | null,
    budgetExhaustedEarly: boolean,
    scopeId: string,
  ): Promise<void> {
    const report = bundle.campaignReport;
    const currentBudget = bundle.budget?.budget ?? 0;
    if (currentBudget <= 0) return;

    const input: BudgetInput = {
      currentBudget,
      dailySpend: (report.spend ?? 0) / 14,
      sales: report.sales14d ?? 0,
      acos,
      targetAcos: this.targetAcos,
      budgetExhaustedEarly,
      isSeasonal: false,
    };

    const decision = this.budgetEngine.evaluate(input);
    if (decision.decision === 'HOLD') return;

    const campaignId = String(bundle.campaignId);

    try {
      await this.campaignApiService.updateCampaign(
        campaignId,
        {
          campaigns: [
            {
              campaignId,
              budget: {
                budget: decision.newBudget,
                budgetType: bundle.budget?.budgetType ?? 'DAILY',
              },
            },
          ],
        },
        scopeId,
      );

      await this.log({
        entityType: 'CAMPAIGN',
        entityId: campaignId,
        type: 'BUDGET_UPDATE',
        oldValue: currentBudget,
        newValue: decision.newBudget,
        action: decision.decision,
        adjustmentPercentage: decision.adjustmentPct,
        reason: decision.reason,
        status: 'success',
      });

      this.logger.log(
        `Budget ${decision.decision}: ${currentBudget} → ${decision.newBudget} | ${decision.reason}`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await this.log({
        entityType: 'CAMPAIGN',
        entityId: campaignId,
        type: 'BUDGET_UPDATE',
        oldValue: currentBudget,
        newValue: decision.newBudget,
        action: decision.decision,
        reason: decision.reason,
        status: 'failed',
        errorMessage: message,
      });
      this.logger.error(
        `Budget update failed for campaign ${campaignId}: ${message}`,
      );
    }
  }

  // ─── Auto Campaign ───────────────────────────────────────────────────────────

  private async optimizeAutoCampaign(
    bundle: ICampaignBundle,
    acos: number | null,
    searchTerms: SearchTermDocument[],
    scopeId: string,
  ): Promise<void> {
    const report = bundle.campaignReport;
    const clicks = report.clicks ?? 0;
    const sales = report.sales14d ?? 0;
    const conversionRate = clicks > 0 ? sales / clicks : 0;
    const dailySpend = (report.spend ?? 0) / 14;
    const budgetUtilization =
      (bundle.budget?.budget ?? 0) > 0 ? dailySpend / bundle.budget.budget : 0;

    const isNewAsin =
      (report.clicks ?? 0) <= 20 &&
      sales === 0 &&
      (report.impressions ?? 0) < 1_000;

    const hasListingIssue =
      (report.impressions ?? 0) > 500 &&
      (report.clicks ?? 0) > 20 &&
      sales === 0;

    const decision = this.autoCampaignEngine.evaluate({
      spend: report.spend ?? 0,
      sales,
      clicks,
      impressions: report.impressions ?? 0,
      acos,
      targetAcos: this.targetAcos,
      conversionRate,
      budgetUtilization,
      isNewAsin,
      hasListingIssue,
    });

    // Identify profitable search terms to move to manual (informational log)
    const profitableTerms = searchTerms.filter((term) => {
      const termAcos =
        term.cost && term.sales7d ? term.cost / term.sales7d : null;
      return (
        term.sales7d >= 2 && termAcos !== null && termAcos <= this.targetAcos
      );
    });

    if (decision.moveTermsToManual && profitableTerms.length > 0) {
      this.logger.log(
        `Campaign ${bundle.campaignId}: ${profitableTerms.length} profitable search terms ready to move to manual`,
      );
    }

    // Determine monitoring windows
    const windows = this.monitoringEngine.applicableWindows(14);
    this.logger.debug(
      `Campaign ${bundle.campaignId} applicable windows: ${windows.join(', ')}`,
    );

    // Log the auto campaign decision (bid changes on auto targets require separate
    // target-level API calls using getTargetsByCampaign — logged as recommendations)
    await this.log({
      entityType: 'CAMPAIGN',
      entityId: String(bundle.campaignId),
      type: 'BID_UPDATE',
      action: decision.bidDecision,
      adjustmentPercentage: decision.bidAdjustmentPct,
      reason: decision.reason,
      status: decision.bidDecision === 'HOLD' ? 'skipped' : 'logged',
    });

    this.logger.log(
      `Auto campaign ${bundle.campaignId}: bid=${decision.bidDecision} (${decision.bidAdjustmentPct}%) | budget=${decision.budgetDecision} | ${decision.reason}`,
    );
  }

  // ─── Manual Campaign ─────────────────────────────────────────────────────────

  private async optimizeManualCampaign(
    bundle: ICampaignBundle,
    scopeId: string,
  ): Promise<void> {
    const activeKeywords = bundle.keywords.filter(
      (kw) => kw.state === 'ENABLED',
    );

    for (const kw of activeKeywords) {
      const kwReport = kw.keywordReports;
      if (!kwReport) continue;

      const kwAcos =
        kwReport.cost > 0 && kwReport.sales7d > 0
          ? kwReport.cost / kwReport.sales7d
          : null;

      const input: BidInput = {
        acos: kwAcos,
        targetAcos: this.targetAcos,
        clicks: kwReport.clicks ?? 0,
        sales: kwReport.sales7d ?? 0,
        spend: kwReport.cost ?? 0,
        impressions: kwReport.impressions ?? 0,
        isCompetitorAsinTarget: false,
      };

      const decision = this.bidAdjustmentEngine.evaluate(input);
      const currentBid = kw.bid ?? 0;
      const newBid = this.clampBid(
        this.bidAdjustmentEngine.calcNewBid(currentBid, decision.adjustmentPct),
      );
      const keywordId = String(kw.keywordId);

      try {
        await this.campaignApiService.updateKeyword(
          keywordId,
          { keywords: [{ keywordId, bid: newBid }] },
          scopeId,
        );

        await this.log({
          entityType: 'KEYWORD',
          entityId: keywordId,
          type: 'BID_UPDATE',
          oldValue: currentBid,
          newValue: newBid,
          action: decision.decision,
          adjustmentPercentage: decision.adjustmentPct,
          reason: decision.reason,
          status: 'success',
        });

        this.logger.log(
          `Keyword ${keywordId}: bid ${currentBid} → ${newBid} (${decision.decision}) | ${decision.reason}`,
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await this.log({
          entityType: 'KEYWORD',
          entityId: keywordId,
          type: 'BID_UPDATE',
          oldValue: currentBid,
          newValue: newBid,
          action: decision.decision,
          reason: decision.reason,
          status: 'failed',
          errorMessage: message,
        });
        this.logger.error(`Keyword ${keywordId} bid update failed: ${message}`);
      }

      // Keyword targeting progression (PAUSE / match-type graduation)
      await this.evaluateKeywordTargeting(kw, kwAcos, scopeId);
    }
  }

  private async evaluateKeywordTargeting(
    kw: ICampaignBundle['keywords'][number],
    kwAcos: number | null,
    _scopeId: string,
  ): Promise<void> {
    const kwReport = kw.keywordReports;
    const decision = this.keywordTargetingEngine.evaluate({
      clicks: kwReport.clicks ?? 0,
      spend: kwReport.cost ?? 0,
      sales: kwReport.sales7d ?? 0,
      acos: kwAcos,
      targetAcos: this.targetAcos,
      impressions: kwReport.impressions ?? 0,
      currentMatchType: (kw.matchType as MatchType) ?? MatchType.BROAD,
      isFromAutoSearch: false,
      isBrandKeyword: false,
      isCompetitorKeyword: false,
      isLongTail: false,
      isDuplicate: false,
      isRelevant: true,
      highAcosRoundsCount: 0,
    });

    if (decision.actions.length === 0) return;

    this.logger.log(
      `Keyword ${kw.keywordId} targeting: [${decision.actions.join(', ')}] | ${decision.reason}`,
    );
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private clampBid(bid: number): number {
    return parseFloat(
      Math.max(this.minBid, Math.min(this.maxBid, bid)).toFixed(2),
    );
  }

  private async log(
    entry: Partial<OptimizationLog> & {
      entityType: 'CAMPAIGN' | 'AD_GROUP' | 'KEYWORD';
      entityId: string;
      type: 'BID_UPDATE' | 'BUDGET_UPDATE';
      reason: string;
    },
  ): Promise<void> {
    try {
      await this.optimizationLogModel.create(entry);
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to write optimization log: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
