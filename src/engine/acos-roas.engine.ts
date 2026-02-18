import { Injectable } from '@nestjs/common';

export enum AcosZone {
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  PROFITABLE = 'PROFITABLE',
  OPTIMIZATION = 'OPTIMIZATION',
  RISK = 'RISK',
  NO_SALES = 'NO_SALES',
}

export enum EntityType {
  KEYWORD = 'KEYWORD',
  CAMPAIGN = 'CAMPAIGN',
  ACCOUNT = 'ACCOUNT',
}

export const MIN_EVAL_DAYS: Record<EntityType, number> = {
  [EntityType.KEYWORD]: 7,
  [EntityType.CAMPAIGN]: 14,
  [EntityType.ACCOUNT]: 30,
};

export interface AcosAction {
  type:
    | 'INCREASE_BID'
    | 'DECREASE_BID'
    | 'INCREASE_BUDGET'
    | 'DECREASE_BUDGET'
    | 'ADD_NEGATIVE'
    | 'PAUSE_KEYWORD'
    | 'PAUSE_CAMPAIGN'
    | 'PUSH_EXACT_MATCH'
    | 'IMPROVE_TOP_OF_SEARCH'
    | 'SHIFT_SPEND'
    | 'LOWER_BROAD_EXPOSURE';
  adjustmentPct: number | null;
  reason: string;
}

export interface AcosRoasInput {
  spend: number;
  sales: number;
  clicks: number;
  impressions: number;
  netMargin: number;
  dataWindowDays: number;
  entityType: EntityType;
  targetAcos?: number;
}

export interface AcosRoasMetrics {
  acos: number | null;
  roas: number | null;
  breakEvenAcos: number;
  effectiveTargetAcos: number;
  zone: AcosZone;
  hasEnoughData: boolean;
  actions: AcosAction[];
}

const OPTIMIZATION_TOLERANCE = 0.1;

@Injectable()
export class AcosRoasEngine {
  /** ACOS = Spend ÷ Sales. Returns null when sales = 0. */
  calcAcos(spend: number, sales: number): number | null {
    if (sales <= 0) return null;
    return spend / sales;
  }

  /** ROAS = Sales ÷ Spend. Returns null when spend = 0. */
  calcRoas(spend: number, sales: number): number | null {
    if (spend <= 0) return null;
    return sales / spend;
  }

  roasFromAcos(acos: number): number {
    return 1 / acos;
  }
  acosFromRoas(roas: number): number {
    return 1 / roas;
  }

  /** Break-Even ACOS = Net Profit Margin (e.g. 0.30 for 30%) */
  breakEvenAcos(netMargin: number): number {
    return netMargin;
  }

  hasEnoughData(dataWindowDays: number, entityType: EntityType): boolean {
    return dataWindowDays >= MIN_EVAL_DAYS[entityType];
  }

  getZone(acos: number | null, targetAcos: number, clicks: number): AcosZone {
    if (acos === null && clicks > 0) return AcosZone.NO_SALES;
    if (acos === null) return AcosZone.INSUFFICIENT_DATA;
    const upperBound = targetAcos * (1 + OPTIMIZATION_TOLERANCE);
    if (acos < targetAcos) return AcosZone.PROFITABLE;
    if (acos <= upperBound) return AcosZone.OPTIMIZATION;
    return AcosZone.RISK;
  }

  getActions(zone: AcosZone): AcosAction[] {
    switch (zone) {
      case AcosZone.PROFITABLE:
        return [
          {
            type: 'INCREASE_BID',
            adjustmentPct: 25,
            reason: 'ACOS below target — ads are profitable, scale bids',
          },
          {
            type: 'INCREASE_BUDGET',
            adjustmentPct: 25,
            reason: 'ACOS below target — increase budget on scalable campaigns',
          },
          {
            type: 'PUSH_EXACT_MATCH',
            adjustmentPct: null,
            reason:
              'Push exact-match and brand keywords to protect profitable traffic',
          },
          {
            type: 'IMPROVE_TOP_OF_SEARCH',
            adjustmentPct: 20,
            reason: 'Improve Top of Search placement share by 20%',
          },
        ];
      case AcosZone.OPTIMIZATION:
        return [
          {
            type: 'INCREASE_BID',
            adjustmentPct: 10,
            reason: 'ACOS near target — fine-tune bids per keyword',
          },
          {
            type: 'ADD_NEGATIVE',
            adjustmentPct: null,
            reason: 'Add negative keywords to cut wasted spend',
          },
          {
            type: 'SHIFT_SPEND',
            adjustmentPct: null,
            reason: 'Shift budget toward better-performing targets',
          },
        ];
      case AcosZone.RISK:
        return [
          {
            type: 'DECREASE_BID',
            adjustmentPct: -50,
            reason: 'ACOS above target — margin erosion, reduce bids by 50%',
          },
          {
            type: 'PAUSE_KEYWORD',
            adjustmentPct: null,
            reason: 'Pause or negate poor-performing keywords',
          },
          {
            type: 'LOWER_BROAD_EXPOSURE',
            adjustmentPct: null,
            reason: 'Lower auto and broad campaign exposure',
          },
        ];
      case AcosZone.NO_SALES:
        return [
          {
            type: 'PAUSE_KEYWORD',
            adjustmentPct: null,
            reason:
              'Pause keywords that exceeded click threshold with zero sales',
          },
          {
            type: 'ADD_NEGATIVE',
            adjustmentPct: null,
            reason: 'Add wasteful search terms as negatives',
          },
          {
            type: 'PAUSE_CAMPAIGN',
            adjustmentPct: null,
            reason:
              'Stop ads immediately — inefficient spend with no conversion',
          },
        ];
      case AcosZone.INSUFFICIENT_DATA:
        return [];
    }
  }

  breakEvenDecision(
    acos: number | null,
    netMargin: number,
  ): 'SCALE' | 'OPTIMIZE' | 'CONTROL' | 'WAIT' {
    if (acos === null) return 'WAIT';
    const breakEven = this.breakEvenAcos(netMargin);
    const upper = breakEven * (1 + OPTIMIZATION_TOLERANCE);
    if (acos < breakEven) return 'SCALE';
    if (acos <= upper) return 'OPTIMIZE';
    return 'CONTROL';
  }

  evaluate(input: AcosRoasInput): AcosRoasMetrics {
    const { spend, sales, clicks, netMargin, dataWindowDays, entityType } =
      input;
    const hasEnoughData = this.hasEnoughData(dataWindowDays, entityType);
    const acos = this.calcAcos(spend, sales);
    const roas = this.calcRoas(spend, sales);
    const breakEvenAcos = this.breakEvenAcos(netMargin);
    const effectiveTargetAcos = input.targetAcos ?? breakEvenAcos;
    const zone = hasEnoughData
      ? this.getZone(acos, effectiveTargetAcos, clicks)
      : AcosZone.INSUFFICIENT_DATA;
    const actions = this.getActions(zone);
    return {
      acos,
      roas,
      breakEvenAcos,
      effectiveTargetAcos,
      zone,
      hasEnoughData,
      actions,
    };
  }
}
