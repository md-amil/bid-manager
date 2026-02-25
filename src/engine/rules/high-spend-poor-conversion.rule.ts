import { CampaignReport } from "src/schemas/reports/report.schema";
import { config } from "../core/rule.engine";
import { AutoCampaignAdjustment, AutoTargetingType, ICampaignBundle, ICampaignRuleDecision } from "../interfaces";

// RULE 4: High Spend with Poor Conversion
export class HighSpendPoorConversionRule implements ICampaignRuleDecision {
  shouldApply(campaign: ICampaignBundle): boolean {
    const { clicks, sales7d, spend } = campaign.matrics;
      if (clicks < config.minClicks) return false;
      if (spend < this.minSpendThreshold(campaign.matrics)) return false;
      if (sales7d === 0) return true;
      const acos = spend / sales7d;
      return acos > config.targetAcos;
  }

  minSpendThreshold(report:CampaignReport) {
        const { spend, clicks, sales7d } = report;
        const avgCpc = clicks > 0 ? spend / clicks : 0;
        const cvr = clicks > 0 ? sales7d / clicks : 0;
        const expectedClicksBeforeJudgement =
            cvr > 0
                ? Math.ceil((1 / cvr) * 1.5)
                : config.fallbackClicks;
        return avgCpc * expectedClicksBeforeJudgement;
    }

  execute(campaign: ICampaignBundle): AutoCampaignAdjustment {
    return {
      ruleId: 'RULE_004',
      ruleName: 'High Spend with Poor Conversion',
      campaignId: campaign.id,
      adjustments: {
        budgetChange: -25,
        bidChanges: [
          { targetingType: AutoTargetingType.CLOSE_MATCH, change: -25 },
          { targetingType: AutoTargetingType.LOOSE_MATCH, change: -25 },
          { targetingType: AutoTargetingType.SUBSTITUTES, change: -25 },
          { targetingType: AutoTargetingType.COMPLEMENTS, change: -25 },
        ],
        action: 'DECREASE',
      },
      reasoning:
        `High clicks with low/zero sales and rising ACOS detected. ` +
        `Lowering bids and budget by 25% and recommending immediate search term review.`,
    };
  }
}