import { Injectable } from '@nestjs/common';

export enum MatchType {
  AUTO = 'AUTO',
  BROAD = 'BROAD',
  PHRASE = 'PHRASE',
  EXACT = 'EXACT',
}

export enum KeywordAction {
  ADD_EXACT = 'ADD_EXACT',
  ADD_PHRASE = 'ADD_PHRASE',
  ADD_NEGATIVE_EXACT = 'ADD_NEGATIVE_EXACT',
  ADD_NEGATIVE_PHRASE = 'ADD_NEGATIVE_PHRASE',
  PAUSE = 'PAUSE',
  DECREASE_BID = 'DECREASE_BID',
  INCREASE_BID = 'INCREASE_BID',
  INCREASE_BUDGET = 'INCREASE_BUDGET',
  MOVE_TO_MANUAL = 'MOVE_TO_MANUAL',
  KEEP_IN_BEST_CAMPAIGN = 'KEEP_IN_BEST_CAMPAIGN',
}

export interface KeywordDecision {
  actions: KeywordAction[];
  bidAdjustmentPct?: number;
  budgetAdjustmentPct?: number;
  targetMatchType?: MatchType;
  monitorDays?: number;
  reason: string;
}

export interface KeywordInput {
  clicks: number;
  spend: number;
  sales: number;
  acos: number | null;
  targetAcos: number;
  impressions: number;
  currentMatchType: MatchType;
  isFromAutoSearch: boolean;
  isBrandKeyword: boolean;
  isCompetitorKeyword: boolean;
  isLongTail: boolean;
  isDuplicate: boolean;
  isRelevant: boolean;
  highAcosRoundsCount: number;
}

const PAUSE_CLICK_THRESHOLD = 20;
const PAUSE_SPEND_THRESHOLD = 200;
const MIN_SALES_TO_GRADUATE = 2;
const MAX_HIGH_ACOS_ROUNDS = 3;
const HIGH_ACOS_BID_DROP_PCT = -20;
const PHRASE_TO_EXACT_BID_INCREASE = 20;
const PHRASE_TO_EXACT_BUDGET_INCREASE = 10;

@Injectable()
export class KeywordTargetingEngine {
  /** Trigger: 20+ clicks OR 200+ spend with zero sales → pause. */
  shouldPause(clicks: number, spend: number, sales: number): boolean {
    if (sales > 0) return false;
    return clicks >= PAUSE_CLICK_THRESHOLD || spend >= PAUSE_SPEND_THRESHOLD;
  }

  /** Another −20% bid round should be applied (max 3 rounds total). */
  shouldReduceBidForHighAcos(
    acos: number | null,
    targetAcos: number,
    roundsApplied: number,
  ): boolean {
    if (acos === null || acos <= targetAcos) return false;
    return roundsApplied < MAX_HIGH_ACOS_ROUNDS;
  }

  shouldPauseAfterHighAcosRounds(roundsApplied: number): boolean {
    return roundsApplied >= MAX_HIGH_ACOS_ROUNDS;
  }

  /** Related to product → negative exact; unrelated → negative phrase. */
  negativeMatchType(isRelated: boolean): MatchType.EXACT | MatchType.PHRASE {
    return isRelated ? MatchType.EXACT : MatchType.PHRASE;
  }

  /** 2+ sales and ACOS within target → ready for manual campaign. */
  shouldMoveToManual(
    sales: number,
    acos: number | null,
    targetAcos: number,
  ): boolean {
    return (
      sales >= MIN_SALES_TO_GRADUATE && (acos === null || acos <= targetAcos)
    );
  }

  /**
   * AUTO   → EXACT + PHRASE
   * BROAD  → PHRASE + EXACT (keep broad at lower bid)
   * PHRASE → EXACT (budget +10%, bids +20%)
   */
  getMatchProgression(currentMatchType: MatchType): {
    addMatchTypes: MatchType[];
    keepCurrent: boolean;
    bidAdjustmentPct: number;
    budgetAdjustmentPct: number;
    reason: string;
  } {
    switch (currentMatchType) {
      case MatchType.AUTO:
        return {
          addMatchTypes: [MatchType.EXACT, MatchType.PHRASE],
          keepCurrent: false,
          bidAdjustmentPct: 0,
          budgetAdjustmentPct: 0,
          reason:
            'Auto → Manual: 2+ sales with acceptable ACOS — add exact for scaling, phrase for controlled expansion',
        };
      case MatchType.BROAD:
        return {
          addMatchTypes: [MatchType.PHRASE, MatchType.EXACT],
          keepCurrent: true,
          bidAdjustmentPct: -10,
          budgetAdjustmentPct: 0,
          reason:
            'Broad → Phrase/Exact: keep broad at lower bid, add phrase/exact for efficiency',
        };
      case MatchType.PHRASE:
        return {
          addMatchTypes: [MatchType.EXACT],
          keepCurrent: true,
          bidAdjustmentPct: PHRASE_TO_EXACT_BID_INCREASE,
          budgetAdjustmentPct: PHRASE_TO_EXACT_BUDGET_INCREASE,
          reason:
            'Phrase → Exact: consistent sales — add exact match with budget +10% and bids +20%',
        };
      case MatchType.EXACT:
        return {
          addMatchTypes: [],
          keepCurrent: true,
          bidAdjustmentPct: 0,
          budgetAdjustmentPct: 0,
          reason:
            'Already at exact match — optimize via bid and budget adjustments',
        };
    }
  }

  evaluate(input: KeywordInput): KeywordDecision {
    const {
      clicks,
      spend,
      sales,
      acos,
      targetAcos,
      currentMatchType,
      isFromAutoSearch,
      isBrandKeyword,
      isCompetitorKeyword,
      isLongTail,
      isDuplicate,
      isRelevant,
      highAcosRoundsCount,
    } = input;

    if (this.shouldPause(clicks, spend, sales))
      return {
        actions: [KeywordAction.PAUSE, KeywordAction.ADD_NEGATIVE_EXACT],
        reason: `${PAUSE_CLICK_THRESHOLD}+ clicks or ${PAUSE_SPEND_THRESHOLD}+ spend with zero sales — pause and add as negative exact`,
      };

    if (isDuplicate)
      return {
        actions: [KeywordAction.KEEP_IN_BEST_CAMPAIGN],
        reason:
          'Keyword in multiple campaigns causing internal competition — keep only in best-ACOS campaign',
      };

    if (this.shouldPauseAfterHighAcosRounds(highAcosRoundsCount))
      return {
        actions: [KeywordAction.PAUSE],
        reason: `ACOS remained high after ${MAX_HIGH_ACOS_ROUNDS} bid reduction rounds — pause keyword`,
      };

    if (this.shouldReduceBidForHighAcos(acos, targetAcos, highAcosRoundsCount))
      return {
        actions: [KeywordAction.DECREASE_BID],
        bidAdjustmentPct: HIGH_ACOS_BID_DROP_PCT,
        monitorDays: 7,
        reason: `High ACOS — lower bids by 20% (round ${highAcosRoundsCount + 1}/${MAX_HIGH_ACOS_ROUNDS}), monitor 7 days`,
      };

    if (!isRelevant && sales === 0 && clicks >= PAUSE_CLICK_THRESHOLD) {
      const action =
        this.negativeMatchType(false) === MatchType.EXACT
          ? KeywordAction.ADD_NEGATIVE_EXACT
          : KeywordAction.ADD_NEGATIVE_PHRASE;
      return {
        actions: [action],
        reason:
          'Irrelevant search term with no sales and 20+ clicks — add as negative phrase',
      };
    }

    if (isBrandKeyword)
      return {
        actions: [KeywordAction.ADD_EXACT, KeywordAction.ADD_PHRASE],
        targetMatchType: MatchType.EXACT,
        reason:
          'Brand keyword — create separate brand campaign with exact and phrase match',
      };

    if (this.shouldMoveToManual(sales, acos, targetAcos)) {
      const progression = this.getMatchProgression(currentMatchType);
      const actions: KeywordAction[] = [];
      if (isFromAutoSearch || currentMatchType === MatchType.AUTO)
        actions.push(KeywordAction.MOVE_TO_MANUAL);
      if (progression.addMatchTypes.includes(MatchType.EXACT))
        actions.push(KeywordAction.ADD_EXACT);
      if (progression.addMatchTypes.includes(MatchType.PHRASE))
        actions.push(KeywordAction.ADD_PHRASE);
      if (progression.bidAdjustmentPct > 0)
        actions.push(KeywordAction.INCREASE_BID);
      if (progression.budgetAdjustmentPct > 0)
        actions.push(KeywordAction.INCREASE_BUDGET);
      return {
        actions,
        bidAdjustmentPct: progression.bidAdjustmentPct || undefined,
        budgetAdjustmentPct: progression.budgetAdjustmentPct || undefined,
        monitorDays: isCompetitorKeyword ? 7 : undefined,
        reason: progression.reason,
      };
    }

    if (isLongTail || isCompetitorKeyword)
      return {
        actions: [KeywordAction.ADD_EXACT, KeywordAction.ADD_PHRASE],
        monitorDays: isCompetitorKeyword ? 7 : undefined,
        reason: isCompetitorKeyword
          ? 'Competitor keyword with acceptable ACOS — add to manual, monitor closely for 7 days'
          : 'Long-tail keyword with strong intent — add as exact or phrase match',
      };

    return {
      actions: [],
      reason: 'No action required — keyword is performing within targets',
    };
  }
}
