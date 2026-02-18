import { Injectable } from '@nestjs/common';

export enum MonitoringWindow {
  DAILY = 1,
  THREE_DAY = 3,
  SEVEN_DAY = 7,
  FOURTEEN_DAY = 14,
  THIRTY_DAY = 30,
}

export interface MonitoringAction {
  action: string;
  reason: string;
  adjustmentPct?: number;
}

export interface MonitoringResult {
  window: MonitoringWindow;
  triggered: boolean;
  actions: MonitoringAction[];
  restrictions: string[];
}

export interface DailyInput {
  isOutOfStock: boolean;
  budgetExhaustedEarly: boolean;
  hasSpendSpike: boolean;
  salesOnSpikeDay: number;
}

export interface ThreeDayInput {
  spendContinues: boolean;
  salesZero: boolean;
  hasIrrelevantSearchTerms: boolean;
  clicks: number;
  spend: number;
}

export interface SevenDayInput {
  keywordsOverClickThreshold: boolean;
  acosAboveTarget: boolean;
  autoCampaignOverspending: boolean;
}

export interface FourteenDayInput {
  performanceStable: boolean;
  profitableTrend: boolean;
  conversionRateConsistent: boolean;
}

export interface ThirtyDayInput {
  structuralInefficiencyFound: boolean;
  lowContributionCampaignsExist: boolean;
  budgetMisallocated: boolean;
}

const NEGATIVE_CLICK_THRESHOLD = 20;
const NEGATIVE_SPEND_THRESHOLD = 200;

@Injectable()
export class MonitoringEngine {
  evaluateDaily(input: DailyInput): MonitoringResult {
    const actions: MonitoringAction[] = [];

    if (input.isOutOfStock)
      actions.push({
        action: 'PAUSE_ADS',
        reason: 'ASIN is out of stock — pause ads to avoid wasted spend',
      });

    if (input.budgetExhaustedEarly)
      actions.push({
        action: 'INCREASE_BUDGET',
        adjustmentPct: 25,
        reason: 'Profitable campaign hitting daily budget limit before EOD',
      });

    if (input.hasSpendSpike && input.salesOnSpikeDay === 0)
      actions.push({
        action: 'DECREASE_BID',
        adjustmentPct: -25,
        reason:
          'Abnormal spend spike without corresponding sales — reduce bids',
      });

    return {
      window: MonitoringWindow.DAILY,
      triggered: actions.length > 0,
      actions,
      restrictions: [
        'Do not change bids daily',
        'Do not pause campaigns based on one bad day',
      ],
    };
  }

  evaluateThreeDay(input: ThreeDayInput): MonitoringResult {
    const actions: MonitoringAction[] = [];
    const negativeTriggered =
      (input.clicks >= NEGATIVE_CLICK_THRESHOLD ||
        input.spend >= NEGATIVE_SPEND_THRESHOLD) &&
      input.salesZero;

    if (negativeTriggered)
      actions.push({
        action: 'ADD_NEGATIVE',
        reason: `${NEGATIVE_CLICK_THRESHOLD}+ clicks or ${NEGATIVE_SPEND_THRESHOLD}+ spend with zero sales — add irrelevant terms as negatives`,
      });

    if (input.spendContinues && input.salesZero)
      actions.push({
        action: 'DECREASE_BID',
        adjustmentPct: -25,
        reason: 'Spend continuing but sales remain zero after 3 days',
      });

    if (input.hasIrrelevantSearchTerms)
      actions.push({
        action: 'ADD_NEGATIVE',
        reason:
          'Same irrelevant search terms appearing — add as negative exact/phrase',
      });

    return {
      window: MonitoringWindow.THREE_DAY,
      triggered: actions.length > 0,
      actions,
      restrictions: [],
    };
  }

  evaluateSevenDay(input: SevenDayInput): MonitoringResult {
    const actions: MonitoringAction[] = [];

    if (input.keywordsOverClickThreshold)
      actions.push({
        action: 'PAUSE_OR_NEGATE_KEYWORD',
        reason: 'Keywords crossed click threshold with no sales',
      });

    if (input.acosAboveTarget)
      actions.push({
        action: 'MOVE_CONVERTING_TERMS_TO_EXACT',
        reason:
          'ACOS consistently above target — move converting search terms to exact match',
      });

    if (input.autoCampaignOverspending)
      actions.push({
        action: 'REALLOCATE_BUDGET',
        reason:
          'Auto campaigns overspending — reallocate budget from auto/broad to exact campaigns',
      });

    return {
      window: MonitoringWindow.SEVEN_DAY,
      triggered: actions.length > 0,
      actions,
      restrictions: [],
    };
  }

  evaluateFourteenDay(input: FourteenDayInput): MonitoringResult {
    const actions: MonitoringAction[] = [];

    if (input.profitableTrend && input.conversionRateConsistent) {
      actions.push(
        {
          action: 'INCREASE_BID',
          adjustmentPct: 25,
          reason:
            'Stable and profitable 14-day trend — increase winning keyword bids',
        },
        {
          action: 'INCREASE_BUDGET',
          adjustmentPct: 25,
          reason:
            'Consistent conversion rate — scale budget on profitable campaigns',
        },
        {
          action: 'ADJUST_PLACEMENT_MULTIPLIERS',
          adjustmentPct: 20,
          reason: 'Stable performance warrants placement modifier adjustment',
        },
      );
    }

    return {
      window: MonitoringWindow.FOURTEEN_DAY,
      triggered: actions.length > 0,
      actions,
      restrictions: [],
    };
  }

  evaluateThirtyDay(input: ThirtyDayInput): MonitoringResult {
    const actions: MonitoringAction[] = [];

    if (input.structuralInefficiencyFound)
      actions.push({
        action: 'RESTRUCTURE_CAMPAIGNS',
        reason:
          'Campaigns overlapping or cannibalizing — restructure campaign architecture',
      });

    if (input.lowContributionCampaignsExist)
      actions.push({
        action: 'PAUSE_LOW_CONTRIBUTION',
        reason:
          'Campaigns with low contribution to total sales should be paused',
      });

    if (input.budgetMisallocated)
      actions.push({
        action: 'REALLOCATE_BUDGET',
        reason:
          'Budget allocation does not match performance — rebalance across campaigns',
      });

    actions.push({
      action: 'SET_NEXT_MONTH_PLAN',
      reason:
        'Strategic review complete — set next month scaling and testing plan',
    });

    return {
      window: MonitoringWindow.THIRTY_DAY,
      triggered: true,
      actions,
      restrictions: [],
    };
  }

  /** Returns which monitoring windows apply for a given number of data days. */
  applicableWindows(dataAgeDays: number): MonitoringWindow[] {
    const windows: MonitoringWindow[] = [];
    const days = dataAgeDays as MonitoringWindow;
    if (days >= MonitoringWindow.DAILY) windows.push(MonitoringWindow.DAILY);
    if (days >= MonitoringWindow.THREE_DAY)
      windows.push(MonitoringWindow.THREE_DAY);
    if (days >= MonitoringWindow.SEVEN_DAY)
      windows.push(MonitoringWindow.SEVEN_DAY);
    if (days >= MonitoringWindow.FOURTEEN_DAY)
      windows.push(MonitoringWindow.FOURTEEN_DAY);
    if (days >= MonitoringWindow.THIRTY_DAY)
      windows.push(MonitoringWindow.THIRTY_DAY);
    return windows;
  }
}
