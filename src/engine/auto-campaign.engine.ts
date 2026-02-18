import { Injectable } from '@nestjs/common';

export enum AutoCampaignSignal {
  PROFITABLE_TERMS = 'PROFITABLE_TERMS',
  LAUNCH_PHASE = 'LAUNCH_PHASE',
  GOOD_CVR_LOW_IMP = 'GOOD_CVR_LOW_IMP',
  HIGH_SPEND_POOR_CVR = 'HIGH_SPEND_POOR_CVR',
  LISTING_ISSUE = 'LISTING_ISSUE',
}

export enum AutoTargetType {
  CLOSE_MATCH = 'CLOSE_MATCH',
  LOOSE_MATCH = 'LOOSE_MATCH',
  SUBSTITUTES = 'SUBSTITUTES',
  COMPLEMENTS = 'COMPLEMENTS',
}

export type BidBudgetDecision = 'INCREASE' | 'DECREASE' | 'HOLD';

export interface AutoCampaignAction {
  bidDecision: BidBudgetDecision;
  budgetDecision: BidBudgetDecision;
  bidAdjustmentPct: number;
  budgetAdjustmentPct: number;
  moveTermsToManual: boolean;
  enableAllTargetTypes: boolean;
  reason: string;
}

export interface AutoTargetTypeAction {
  targetType: AutoTargetType;
  decision: BidBudgetDecision;
  adjustmentPct: number;
  reason: string;
}

export interface AutoCampaignInput {
  spend: number;
  sales: number;
  clicks: number;
  impressions: number;
  acos: number | null;
  targetAcos: number;
  conversionRate: number;
  budgetUtilization: number;
  isNewAsin: boolean;
  hasListingIssue: boolean;
}

const NEGATIVE_CLICK_THRESHOLD = 20;
const NEGATIVE_SPEND_THRESHOLD = 200;
const CLOSE_MATCH_PAUSE_SPEND = 300;

@Injectable()
export class AutoCampaignEngine {
  detectSignal(input: AutoCampaignInput): AutoCampaignSignal {
    const {
      acos,
      targetAcos,
      isNewAsin,
      hasListingIssue,
      conversionRate,
      impressions,
      budgetUtilization,
      sales,
    } = input;
    if (isNewAsin) return AutoCampaignSignal.LAUNCH_PHASE;
    if (hasListingIssue && impressions > 500 && sales === 0)
      return AutoCampaignSignal.LISTING_ISSUE;
    if (acos !== null && acos <= targetAcos)
      return AutoCampaignSignal.PROFITABLE_TERMS;
    if (conversionRate > 0.05 && impressions < 500 && budgetUtilization < 0.7)
      return AutoCampaignSignal.GOOD_CVR_LOW_IMP;
    return AutoCampaignSignal.HIGH_SPEND_POOR_CVR;
  }

  getAction(signal: AutoCampaignSignal): AutoCampaignAction {
    switch (signal) {
      case AutoCampaignSignal.PROFITABLE_TERMS:
        return {
          bidDecision: 'HOLD',
          budgetDecision: 'INCREASE',
          bidAdjustmentPct: 0,
          budgetAdjustmentPct: 25,
          moveTermsToManual: true,
          enableAllTargetTypes: false,
          reason:
            'Auto campaign generating profitable search terms — scale budget, move winners to manual exact/phrase',
        };
      case AutoCampaignSignal.LAUNCH_PHASE:
        return {
          bidDecision: 'HOLD',
          budgetDecision: 'HOLD',
          bidAdjustmentPct: 0,
          budgetAdjustmentPct: 0,
          moveTermsToManual: false,
          enableAllTargetTypes: true,
          reason:
            'New ASIN launch — run with suggested bids and enable all 4 auto targeting types for discovery',
        };
      case AutoCampaignSignal.GOOD_CVR_LOW_IMP:
        return {
          bidDecision: 'INCREASE',
          budgetDecision: 'HOLD',
          bidAdjustmentPct: 25,
          budgetAdjustmentPct: 0,
          moveTermsToManual: false,
          enableAllTargetTypes: false,
          reason:
            'Good CVR but limited impressions — increase bids by 25% to unlock more inventory',
        };
      case AutoCampaignSignal.HIGH_SPEND_POOR_CVR:
        return {
          bidDecision: 'DECREASE',
          budgetDecision: 'DECREASE',
          bidAdjustmentPct: -25,
          budgetAdjustmentPct: -25,
          moveTermsToManual: false,
          enableAllTargetTypes: false,
          reason:
            'High spend with poor conversion — lower bids and budget by 25%, review search terms immediately',
        };
      case AutoCampaignSignal.LISTING_ISSUE:
        return {
          bidDecision: 'DECREASE',
          budgetDecision: 'HOLD',
          bidAdjustmentPct: -50,
          budgetAdjustmentPct: 0,
          moveTermsToManual: false,
          enableAllTargetTypes: false,
          reason:
            'Good traffic but poor sales due to listing issues — reduce bids by 50% until listing is improved',
        };
    }
  }

  getTargetTypeAction(
    targetType: AutoTargetType,
    acos: number | null,
    targetAcos: number,
    spend: number,
    sales: number,
  ): AutoTargetTypeAction {
    const profitable = acos !== null && acos <= targetAcos;
    const highSpendNoSales = spend >= CLOSE_MATCH_PAUSE_SPEND && sales === 0;
    switch (targetType) {
      case AutoTargetType.CLOSE_MATCH:
        return profitable
          ? {
              targetType,
              decision: 'INCREASE',
              adjustmentPct: 20,
              reason: 'Converting terms found with acceptable ACOS',
            }
          : {
              targetType,
              decision: 'DECREASE',
              adjustmentPct: -50,
              reason: `300+ spend with no sales or unacceptable ACOS${highSpendNoSales ? ' (spend threshold reached)' : ''}`,
            };
      case AutoTargetType.LOOSE_MATCH:
        return profitable
          ? {
              targetType,
              decision: 'INCREASE',
              adjustmentPct: 20,
              reason:
                'Low CPC and decent CTR — good for new product reach expansion',
            }
          : {
              targetType,
              decision: 'DECREASE',
              adjustmentPct: -50,
              reason: 'Traffic too generic or ACOS consistently high',
            };
      case AutoTargetType.SUBSTITUTES:
        return profitable
          ? {
              targetType,
              decision: 'INCREASE',
              adjustmentPct: 25,
              reason:
                'Sales from competitor listings with competitive price and reviews',
            }
          : {
              targetType,
              decision: 'DECREASE',
              adjustmentPct: -50,
              reason: 'High clicks, low sales — weak competitive positioning',
            };
      case AutoTargetType.COMPLEMENTS:
        return profitable
          ? {
              targetType,
              decision: 'INCREASE',
              adjustmentPct: 25,
              reason:
                'Genuinely complementary products generating incremental sales',
            }
          : {
              targetType,
              decision: 'DECREASE',
              adjustmentPct: -50,
              reason: 'Low relevance, poor sales, or high ACOS',
            };
    }
  }

  /** Trigger: 20+ clicks OR 200+ spend with zero sales → add as negative. */
  shouldAddNegative(clicks: number, spend: number, sales: number): boolean {
    if (sales > 0) return false;
    return (
      clicks >= NEGATIVE_CLICK_THRESHOLD || spend >= NEGATIVE_SPEND_THRESHOLD
    );
  }

  readonly negativeRule = {
    clickThreshold: NEGATIVE_CLICK_THRESHOLD,
    spendThreshold: NEGATIVE_SPEND_THRESHOLD,
    description:
      'Add as negative exact or phrase when 20+ clicks OR 200+ spend with zero sales',
  };

  evaluate(input: AutoCampaignInput): AutoCampaignAction {
    return this.getAction(this.detectSignal(input));
  }
}
