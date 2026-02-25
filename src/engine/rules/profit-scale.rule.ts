// import { IRule } from "../core/rule.type";

// export const profitableScaleRule: IRule = {
//   id: 'PROFITABLE_SCALE',
//   priority: 40,
//   appliesTo: 'CAMPAIGN',

//   evaluate(ctx) {
//     const { acos, utilization } = ctx.metrics;
//     if (
//       acos !== null &&
//       acos <= 30 &&
//       utilization >= 0.7
//     ) {
//       return {
//         applied: true,
//         action: 'INCREASE_BUDGET',
//         value: 1.25,
//         reason: 'PROFITABLE_AND_LIMITED'
//       };
//     }

//     return { applied: false };
//   }
// };
