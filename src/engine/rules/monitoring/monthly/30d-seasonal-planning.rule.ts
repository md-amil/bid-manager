import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 30-Day Seasonal Planning (Structural Decision)
 * Condition: 30 days data, approaching peak season
 * Action: Increase budgets, prepare for seasonal demand
 * NOTE: Proactive growth planning
 */
export class ThirtyDaySeasonalPlanningRule extends BaseRule implements ICampaignRuleDecision {
  private acosTarget: number = config.targetAcos;
  private minOrders: number = 10;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;

    const acos = this.acos;

    // Only recommend if campaign is healthy
    return acos <= this.acosTarget && this.metrics.purchase >= this.minOrders;
  }

  execute(): AdjustmentLog {
    const currentMonth = new Date().getMonth();
    
    // Seasonal recommendations
    const seasonalRecommendations: { [key: number]: string } = {
      8: 'Back-to-School (Sept): +40% budget increase recommended',
      9: 'Fall/Halloween (Oct): +30% budget increase recommended',
      10: 'Black Friday prep (Nov): +60% budget increase recommended',
      11: 'Holiday (Dec): +80% budget increase recommended',
      4: 'Summer season (June): +25% budget increase recommended',
    };

    const seasonalAdvice = seasonalRecommendations[currentMonth] ||
      'No major seasonal event this month. Maintain current budget.';

    const adjustments: Adjustment[] = [];

    return {
      ruleId: 'THIRTY_DAY_005',
      ruleName: '30-Day Seasonal Planning - Growth Preparation',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
        
      adjustments,
      reasoning:
        `30-day profitable performance confirmed (ACOS ${(this.acos * 100).toFixed(2)}%). ` +
        `${seasonalAdvice}\n\n` +
        `Strategy: You have a proven winning campaign. Approaching seasonal periods, customers search more for your category. ` +
        `Increasing budgets during these periods multiplies your volume without hurting profitability. ` +
        `Plan ahead: Request higher budget limits, arrange supplier inventory, prepare for 2-3x volume.`,
    };
  }
}
