// import { IRule } from "../core/rule.type";

// export const zeroSalesRule: IRule = {
//   id: 'ZERO_SALES_HARD_STOP',
//   priority: 100,
//   appliesTo: 'CAMPAIGN',
//   evaluate(ctx) {
//     const { spend, sales } = ctx.metrics;
    
//     if (spend >= 300 && sales === 0) {
//       return {
//         applied: true,
//         action: 'DECREASE_BUDGET',
//         value: 0.5,
//         reason: 'HIGH_SPEND_NO_SALES'
//       };
//     }

//     return { applied: false };
//   }
// };