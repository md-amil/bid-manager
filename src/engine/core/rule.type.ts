export type TRuleType = 'CAMPAIGN' | 'TARGET' | 'ADGROUP'

export type RuleContext = {
  entityId: string
  entityType: TRuleType

  metrics: {
    acos: number | null
    spend: number
    sales: number
    clicks: number
    impressions: number
    utilization: number
  }

  current: {
    bid?: number
    budget?: number
  }

  meta: {
    isAuto: boolean
    targetingType?: 'CLOSE' | 'LOOSE' | 'SUBSTITUTES' | 'COMPLEMENTS'
    isNewProduct?: boolean
  }
};

export type ActionType = 'INCREASE' | 'DECREASE' | 'PAUSE' | 'NO_CHANGE' | 'DECREASE_BUDGET'|'INCREASE_BUDGET' | 'INCREASE_BID'
export type RuleResult = {
  applied: boolean
  action?: ActionType
  value?: number
  reason?: string
};

export interface IRule {
  id: string
  priority: number
  appliesTo: TRuleType
  evaluate: (ctx: RuleContext) =>RuleResult
};