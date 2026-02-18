import { IRule } from "../core/rule.type";

export const highAcosRule: IRule = {
    id: 'HIGH_ACOS_CONTROL',
    priority: 80,
    appliesTo: 'CAMPAIGN',
    evaluate(ctx) {
        const { acos } = ctx.metrics;
        if (acos && acos > 30) 
            return {
                applied: true,
                action: 'DECREASE_BUDGET',
                value: 0.75,
                reason: 'ACOS_ABOVE_TARGET'
            };
        return { applied: false };
    }
};
