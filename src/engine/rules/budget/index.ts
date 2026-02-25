// import { ICampaignBundle } from "src/engine/interfaces";

// export class ProfitableCampaignBudgetRule implements IBudgetAdjustmentRule {
//   private acosTarget: number;

//   constructor(acosTarget: number = 0.30) {
//     this.acosTarget = acosTarget;
//   }

//   shouldApply(campaign: ICampaignBundle): boolean {
//     if (campaign.metrics.sales === 0) return false;

//     const acos = campaign.metrics.spend / campaign.metrics.sales;
//     return acos <= this.acosTarget;
//   }

//   execute(campaign: ICampaignBundle): BudgetAdjustmentResult {
//     const oldBudget = campaign.budget;
//     const newBudget = oldBudget * 1.25;

//     const currentAcos = campaign.metrics.spend > 0 ? campaign.metrics.spend / campaign.metrics.sales : 0;
//     const potentialAdditionalSpend = newBudget - oldBudget;
//     const potentialAdditionalSales =
//       campaign.metrics.sales > 0 ? potentialAdditionalSpend / currentAcos : 0;

//     return {
//       campaignId: campaign.id,
//       oldBudget,
//       newBudget,
//       changePercentage: 25,
//       reason: 'Campaign is profitable with ACOS below target',
//       rule: 'PROFITABLE_CAMPAIGN_BUDGET',
//       estimatedImpact: {
//         potentialAdditionalSpend,
//         potentialAdditionalSales,
//       },
//     };
//   }
// }

// /**
//  * INCREASE BUDGET: Budget Is Getting Exhausted Early in the Day
//  * Indicators: Campaign runs out of budget before evening, good ACOS
//  * Action: Increase daily budget 20%
//  */
// export class BudgetExhaustionBudgetRule implements IBudgetAdjustmentRule {
//   private acosTarget: number;
//   private budgetUtilizationThreshold: number;

//   constructor(acosTarget: number = 0.30, threshold: number = 0.8) {
//     this.acosTarget = acosTarget;
//     this.budgetUtilizationThreshold = threshold;
//   }

//   shouldApply(campaign: ICampaignBundle): boolean {
//     const dailyBudgetUtilization = campaign.metrics1d ? campaign.metrics1d.spend / campaign.budget : 0;
//     const acos = campaign.metrics.spend > 0 ? campaign.metrics.spend / campaign.metrics.sales : Infinity;

//     return (
//       dailyBudgetUtilization >= this.budgetUtilizationThreshold &&
//       acos <= this.acosTarget &&
//       campaign.metrics.sales > 0
//     );
//   }

//   execute(campaign: ICampaignBundle): BudgetAdjustmentResult {
//     const oldBudget = campaign.budget;
//     const newBudget = oldBudget * 1.2;

//     return {
//       campaignId: campaign.id,
//       oldBudget,
//       newBudget,
//       changePercentage: 20,
//       reason: 'Budget exhausted early in day with good performance',
//       rule: 'BUDGET_EXHAUSTION_BUDGET',
//     };
//   }
// }

// /**
//  * INCREASE BUDGET: Seasonal or High-Demand Periods
//  * Indicators: Festivals, sale events, Prime Day, peak season
//  * Action: Increase 50% budget before/during event
//  */
// export class SeasonalEventBudgetRule implements IBudgetAdjustmentRule {
//   private season: 'peak' | 'normal' | 'low' = 'normal';

//   constructor(season: 'peak' | 'normal' | 'low' = 'normal') {
//     this.season = season;
//   }

//   shouldApply(campaign: ICampaignBundle): boolean {
//     return this.season === 'peak';
//   }

//   execute(campaign: ICampaignBundle): BudgetAdjustmentResult {
//     const oldBudget = campaign.budget;
//     const newBudget = oldBudget * 1.5;

//     return {
//       campaignId: campaign.id,
//       oldBudget,
//       newBudget,
//       changePercentage: 50,
//       reason: 'Seasonal/high-demand period - increase to capture demand',
//       rule: 'SEASONAL_EVENT_BUDGET',
//     };
//   }
// }

// // ════════════════════════════════════════════════════════════════════════════
// // BUDGET DECREASE RULES
// // ════════════════════════════════════════════════════════════════════════════

// /**
//  * DECREASE BUDGET: ACOS Is Higher Than Target
//  * Indicators: ACOS consistently above profitability threshold
//  * Action: Reduce budget by 25%
//  */
// export class HighAcosBudgetRule implements IBudgetAdjustmentRule {
//   private acosTarget: number;

//   constructor(acosTarget: number = 0.30) {
//     this.acosTarget = acosTarget;
//   }

//   shouldApply(campaign: ICampaignBundle): boolean {
//     if (campaign.metrics.sales === 0) return false;

//     const acos = campaign.metrics.spend / campaign.metrics.sales;
//     return acos > this.acosTarget;
//   }

//   execute(campaign: ICampaignBundle): BudgetAdjustmentResult {
//     const oldBudget = campaign.budget;
//     const newBudget = oldBudget * 0.75;

//     const acos = campaign.metrics.spend > 0 ? campaign.metrics.spend / campaign.metrics.sales : Infinity;

//     return {
//       campaignId: campaign.id,
//       oldBudget,
//       newBudget,
//       changePercentage: -25,
//       reason: `ACOS (${(acos * 100).toFixed(2)}%) is above target (${(this.acosTarget * 100).toFixed(2)}%)`,
//       rule: 'HIGH_ACOS_BUDGET',
//     };
//   }
// }

// /**
//  * DECREASE BUDGET: High Spend but No or Very Low Sales
//  * Indicators: Clicks increasing, spend increasing, sales minimal/zero
//  * Action: Lower budget by 50%
//  */
// export class HighSpendLowSalesBudgetRule implements IBudgetAdjustmentRule {
//   private spendThreshold: number;

//   constructor(spendThreshold: number = 200) {
//     this.spendThreshold = spendThreshold;
//   }

//   shouldApply(campaign: ICampaignBundle): boolean {
//     return campaign.metrics.spend > this.spendThreshold && campaign.metrics.sales === 0;
//   }

//   execute(campaign: ICampaignBundle): BudgetAdjustmentResult {
//     const oldBudget = campaign.budget;
//     const newBudget = oldBudget * 0.5;

//     return {
//       campaignId: campaign.id,
//       oldBudget,
//       newBudget,
//       changePercentage: -50,
//       reason: `High spend ($${campaign.metrics.spend.toFixed(2)}) with zero sales`,
//       rule: 'HIGH_SPEND_LOW_SALES_BUDGET',
//     };
//   }
// }