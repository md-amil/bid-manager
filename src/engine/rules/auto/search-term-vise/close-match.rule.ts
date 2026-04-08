import { ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import { config, TargetType } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import BaseRule from "../../base.rule";
import { SearchTermDocument } from "src/schemas/reports/search-term-report.schema";
import { Targeting } from "src/interfaces/report.type";

// instead of search term first analyze targeting metrics

export class CloseMatchOptimizationRule extends BaseRule implements ICampaignRuleDecision {
  private readonly targeting: Targeting;
  private readonly convertableTerm: SearchTermDocument[];
  private readonly acceptableAcos: boolean
  private readonly notAcceptable: boolean

  constructor(bundle: ICampaignBundle) {
    super(bundle)
    this.targeting = this.getTargeting(TargetType.CLOSE_MATCH)[0];
    if(!this.targeting.metrics) return 


    const { cost, sales } = this.targeting.metrics??{}
    const terms = this.getSearchTerms(TargetingType.CLOSE_MATCH);
    this.convertableTerm = terms.filter(st => st.sales7d > 0 && this.calculateACOS(st) <= config.targetAcos);
    this.acceptableAcos = this.calculateACOS({ cost, sales7d: sales }) <= config.targetAcos;
    this.notAcceptable = cost >= config.minSpend && sales === 0;


    // pause if not acceptable


    // // Increase 20% when: Converting search terms found AND ACOS is acceptable
    // this.goodTerms = closeMatchTerms.filter(st => st.sales7d > 0 && this.calculateACOS(st) <= config.targetAcos);
    // // Decrease 50% when: Spending 300+ with no sales OR ACOS is not acceptable
    // this.poorTerms = closeMatchTerms.filter(st =>
    //   (st.cost >= config.minSpend && st.sales7d === 0) ||
    //   (st.sales7d > 0 && this.calculateACOS(st) > config.targetAcos)
    // );
  }

  shouldApply(): boolean {
    if(!this.targeting.metrics) return false
    const lowImpTarget = this.getLowImpressionTarget();
    const isLowImpression = lowImpTarget.length && lowImpTarget.some(target => target.targetId == this.targeting.targetId);
    if (isLowImpression) return false;

    // const { cost, sales } = this.targeting.metrics
    // const acceptableAcos = this.calculateACOS({ cost, sales7d: sales }) <= config.targetAcos;
    // const notAcceptable = cost >= config.minSpend && sales === 0;   
    // return this.notAcceptable || !!this.convertableTerm.length;
    return true
  }

  execute(): AdjustmentLog {
    let action: EAction;
    let change: number;
    const { cost, sales } = this.targeting.metrics??{}
    const acceptableAcos = this.calculateACOS({ cost, sales7d: sales }) <= config.targetAcos;
    if (acceptableAcos && this.convertableTerm.length) {
      action = EAction.INCREASE_BID;
      change = 20;
    }
    // Decrease 50% when: Spending 300+ with no sales OR ACOS is not acceptable
    else {
      action = EAction.DECREASE_BID;
      change = -50;
    }

    // const targetings = this.getTargeting(TargetingType.CLOSE_MATCH)

    const { targetId, metrics, expression, bid } = this.targeting;

    return {
      ruleId: 'RULE_006',
      ruleName: 'Close Match Targeting Optimization',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments: [
        {
          action,
          change,
          target: ETarget.TARGETING
        }
      ],
      targetings: [{
        targetId,
        targetingType: metrics.targeting,
        expression: expression[0].type || '',
        bid
      }],
      reasoning:
        `Close Match (Best for: High-intent discovery): ${this.convertableTerm.length} converting terms with acceptable ACOS. ` +
        `${action === EAction.INCREASE_BID ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
    };
  }
}
