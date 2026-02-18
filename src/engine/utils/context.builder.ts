import { ReportDocument } from "src/schemas/reports/report.schema";

export function buildContext(metrics: ReportDocument) {
  const { impressions, spend, sales14d, clicks, campaignBudgetAmount } = metrics
  return {
    entityId: metrics.campaignId.toString(),
    entityType: 'CAMPAIGN' as const,
    metrics: {
      utilization: spend / (campaignBudgetAmount * 14),
      acos: sales14d / spend,
      spend,
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