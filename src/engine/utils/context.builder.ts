import { ReportDocument } from "src/schemas/reports/campaign-report";

export function buildContext(metrics: ReportDocument) {
  const { impressions, cost, sales14d, clicks, campaignBudgetAmount } = metrics
  return {
    entityId: metrics.campaignId.toString(),
    entityType: 'CAMPAIGN' as const,
    metrics: {
      utilization: cost / (campaignBudgetAmount * 14),
      acos: sales14d / cost,
      cost,
      sales: sales14d,
      clicks,
      impressions,
    },
    current: {
      budget: metrics.campaignBudgetAmount
    },
    meta: { isAuto: true }
  };
}