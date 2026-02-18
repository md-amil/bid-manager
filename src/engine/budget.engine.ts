import { Injectable } from '@nestjs/common';

export enum BudgetSignal {
  PROFITABLE = 'PROFITABLE',
  BUDGET_EXHAUSTED = 'BUDGET_EXHAUSTED',
  SEASONAL_PEAK = 'SEASONAL_PEAK',
  HIGH_ACOS = 'HIGH_ACOS',
  HIGH_SPEND_NO_SALES = 'HIGH_SPEND_NO_SALES',
}

export type BudgetDecision = 'INCREASE' | 'DECREASE' | 'HOLD';

export interface BudgetAction {
  decision: BudgetDecision;
  adjustmentPct: number;
  monitorDays: number;
  reason: string;
}

export interface BudgetInput {
  currentBudget: number;
  dailySpend: number;
  sales: number;
  acos: number | null;
  targetAcos: number;
  budgetExhaustedEarly: boolean;
  isSeasonal: boolean;
}

@Injectable()
export class BudgetEngine {
  detectSignal(input: BudgetInput): BudgetSignal {
    const {
      acos,
      targetAcos,
      budgetExhaustedEarly,
      isSeasonal,
      dailySpend,
      sales,
    } = input;
    if (isSeasonal) return BudgetSignal.SEASONAL_PEAK;
    if (acos !== null && acos < targetAcos)
      return budgetExhaustedEarly
        ? BudgetSignal.BUDGET_EXHAUSTED
        : BudgetSignal.PROFITABLE;
    if (dailySpend > 0 && sales === 0) return BudgetSignal.HIGH_SPEND_NO_SALES;
    if (acos !== null && acos > targetAcos) return BudgetSignal.HIGH_ACOS;
    return BudgetSignal.PROFITABLE;
  }

  /**
   * PROFITABLE          → +25%, monitor 3–5 days
   * BUDGET_EXHAUSTED    → +20%
   * SEASONAL_PEAK       → +50%
   * HIGH_ACOS           → −25%
   * HIGH_SPEND_NO_SALES → −50%
   */
  getAction(signal: BudgetSignal): BudgetAction {
    switch (signal) {
      case BudgetSignal.PROFITABLE:
        return {
          decision: 'INCREASE',
          adjustmentPct: 25,
          monitorDays: 5,
          reason:
            'ACOS below target — ads are profitable, scale budget gradually',
        };
      case BudgetSignal.BUDGET_EXHAUSTED:
        return {
          decision: 'INCREASE',
          adjustmentPct: 20,
          monitorDays: 3,
          reason:
            'Budget exhausted before EOD with good ACOS — increase daily budget',
        };
      case BudgetSignal.SEASONAL_PEAK:
        return {
          decision: 'INCREASE',
          adjustmentPct: 50,
          monitorDays: 0,
          reason:
            'Seasonal / high-demand event — increase budget, reassess post-event',
        };
      case BudgetSignal.HIGH_ACOS:
        return {
          decision: 'DECREASE',
          adjustmentPct: -25,
          monitorDays: 7,
          reason:
            'ACOS consistently above target — reduce budget to control spend',
        };
      case BudgetSignal.HIGH_SPEND_NO_SALES:
        return {
          decision: 'DECREASE',
          adjustmentPct: -50,
          monitorDays: 7,
          reason: 'High spend with zero or minimal sales — cut budget by 50%',
        };
    }
  }

  calcNewBudget(currentBudget: number, adjustmentPct: number): number {
    return parseFloat((currentBudget * (1 + adjustmentPct / 100)).toFixed(2));
  }

  evaluate(input: BudgetInput): BudgetAction & { newBudget: number } {
    const signal = this.detectSignal(input);
    const action = this.getAction(signal);
    const newBudget = this.calcNewBudget(
      input.currentBudget,
      action.adjustmentPct,
    );
    return { ...action, newBudget };
  }
}
