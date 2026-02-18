import { IRule } from '../core/rule.type';

export const profitableBidRule: IRule = {
  id: 'TARGET_SCALE',
  priority: 40,
  appliesTo: 'TARGET',
  evaluate(ctx) {
    const { acos } = ctx.metrics;
    if (acos !== null && acos < 30) {
      return {
        applied: true,
        action: 'INCREASE_BID',
        value: 1.25,
        reason: 'PROFITABLE_TARGET',
      };
    }

    return { applied: false };
  },
};
