import { Injectable } from '@nestjs/common';

export enum BidSignal {
  PROFITABLE_LOW_VISIBILITY = 'PROFITABLE_LOW_VISIBILITY',
  PROFITABLE_STABLE = 'PROFITABLE_STABLE',
  COMPETITOR_CONVERTING = 'COMPETITOR_CONVERTING',
  HIGH_ACOS = 'HIGH_ACOS',
  CLICKS_NO_SALES = 'CLICKS_NO_SALES',
}

export enum PlacementType {
  TOP_OF_SEARCH = 'TOP_OF_SEARCH',
  PRODUCT_PAGE = 'PRODUCT_PAGE',
}

export type BidDecision = 'INCREASE' | 'DECREASE' | 'PAUSE';

export interface BidAction {
  decision: BidDecision;
  adjustmentPct: number;
  monitorDays: number;
  addToNegativeAfterDays: number | null;
  reason: string;
}

export interface PlacementAction {
  placement: PlacementType;
  decision: BidDecision;
  adjustmentPct: number;
  reason: string;
}

export interface BidInput {
  acos: number | null;
  targetAcos: number;
  clicks: number;
  sales: number;
  spend: number;
  impressions: number;
  isCompetitorAsinTarget: boolean;
}

const CLICK_THRESHOLD = 20;
const SPEND_THRESHOLD = 200;

@Injectable()
export class BidAdjustmentEngine {
  detectSignal(input: BidInput): BidSignal {
    const {
      acos,
      targetAcos,
      clicks,
      sales,
      spend,
      impressions,
      isCompetitorAsinTarget,
    } = input;
    const profitable = acos !== null && acos <= targetAcos;
    const clicksNoSales =
      sales === 0 && (clicks >= CLICK_THRESHOLD || spend >= SPEND_THRESHOLD);

    if (clicksNoSales) return BidSignal.CLICKS_NO_SALES;
    if (acos !== null && acos > targetAcos) return BidSignal.HIGH_ACOS;
    if (profitable && isCompetitorAsinTarget)
      return BidSignal.COMPETITOR_CONVERTING;
    if (profitable && impressions < 1000)
      return BidSignal.PROFITABLE_LOW_VISIBILITY;
    return BidSignal.PROFITABLE_STABLE;
  }

  /**
   * PROFITABLE_STABLE / LOW_VISIBILITY / COMPETITOR → +15%, monitor 3–5 days
   * HIGH_ACOS                                       → −25%, pause after 7d
   * CLICKS_NO_SALES                                 → −25%, negative after 7d
   */
  getAction(signal: BidSignal): BidAction {
    switch (signal) {
      case BidSignal.PROFITABLE_STABLE:
        return {
          decision: 'INCREASE',
          adjustmentPct: 15,
          monitorDays: 5,
          addToNegativeAfterDays: null,
          reason:
            'ACOS below target with steady or growing sales — increase bids to maintain momentum',
        };
      case BidSignal.PROFITABLE_LOW_VISIBILITY:
        return {
          decision: 'INCREASE',
          adjustmentPct: 15,
          monitorDays: 5,
          addToNegativeAfterDays: null,
          reason:
            'High sales but low impressions with ACOS under control — increase bids to win more inventory',
        };
      case BidSignal.COMPETITOR_CONVERTING:
        return {
          decision: 'INCREASE',
          adjustmentPct: 15,
          monitorDays: 5,
          addToNegativeAfterDays: null,
          reason:
            'Competitor ASIN targeting generating sales within ACOS — maintain visibility',
        };
      case BidSignal.HIGH_ACOS:
        return {
          decision: 'DECREASE',
          adjustmentPct: -25,
          monitorDays: 7,
          addToNegativeAfterDays: null,
          reason:
            'ACOS consistently above target — reduce bids by 25%, pause if no improvement after 7 days',
        };
      case BidSignal.CLICKS_NO_SALES:
        return {
          decision: 'DECREASE',
          adjustmentPct: -25,
          monitorDays: 7,
          addToNegativeAfterDays: 7,
          reason:
            'Clicks with zero sales past threshold — lower bids by 25%, add to negatives after 7 days',
        };
    }
  }

  /**
   * Top of Search:  +20% if ToS ACOS better, −25% if too high
   * Product Page:   +20% if ACOS within limit, −25% if high clicks/low sales
   */
  getPlacementAction(
    placement: PlacementType,
    placementAcos: number | null,
    targetAcos: number,
    clicks: number,
    sales: number,
  ): PlacementAction {
    const profitable = placementAcos !== null && placementAcos <= targetAcos;
    const highClicksNoSales = sales === 0 && clicks >= CLICK_THRESHOLD;

    switch (placement) {
      case PlacementType.TOP_OF_SEARCH:
        return profitable
          ? {
              placement,
              decision: 'INCREASE',
              adjustmentPct: 20,
              reason: 'Top-of-Search ACOS is better than Rest-of-Search',
            }
          : {
              placement,
              decision: 'DECREASE',
              adjustmentPct: -25,
              reason:
                'Top-of-Search ACOS is too high — reduce placement modifier',
            };
      case PlacementType.PRODUCT_PAGE:
        return profitable
          ? {
              placement,
              decision: 'INCREASE',
              adjustmentPct: 20,
              reason: 'Product page ASIN targeting ACOS within limit',
            }
          : {
              placement,
              decision: 'DECREASE',
              adjustmentPct: -25,
              reason: `High clicks, low sales, high ACOS on product page${highClicksNoSales ? ' (threshold reached)' : ''}`,
            };
    }
  }

  calcNewBid(currentBid: number, adjustmentPct: number): number {
    return parseFloat((currentBid * (1 + adjustmentPct / 100)).toFixed(2));
  }

  evaluate(input: BidInput): BidAction & { signal: BidSignal } {
    const signal = this.detectSignal(input);
    return { ...this.getAction(signal), signal };
  }
}
