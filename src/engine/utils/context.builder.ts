import { ReportDocument } from "src/schemas/report.schema";

export function buildContext(metrics: ReportDocument) {
  const { acosClicks14d, impressions, spend, sales14d, clicks,campaignBudgetAmount } = metrics
  return {
    entityId: metrics.campaignId.toString(),
    entityType: 'CAMPAIGN' as const,
    metrics: {
      utilization: metrics.spend / (metrics.campaignBudgetAmount * 14),
      acos: acosClicks14d,
      spend, sales: sales14d,
      clicks, impressions,
    },
    current: {
      budget: metrics.campaignBudgetAmount
    },
    meta: { isAuto: true }
  };
}