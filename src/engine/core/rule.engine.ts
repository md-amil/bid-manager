import { ReportDocument } from "src/schemas/reports/report.schema";
import { IRule, RuleContext } from "./rule.type";
import { buildContext } from "../utils/context.builder";
import { rules } from "../rules";
import { Injectable } from "@nestjs/common";
@Injectable()
export class Engine {
  constructor() { }
  private runRuleEngine(
    rules: IRule[],
    context: RuleContext
  ) {
    const sorted = rules.sort((a, b) => b.priority - a.priority);
    for (const rule of sorted) {
      if (rule.appliesTo !== context.entityType) continue;
      const result = rule.evaluate(context);
      if (result.applied) return {
        entityId: context.entityId,
        action: result.action,
        value: result.value,
        reason: result.reason,
        ruleId: rule.id,
        snapshot: context.metrics
      };
    }
    return {
      entityId: context.entityId,
      action: 'NO_CHANGE',
      reason: 'NO_RULE_MATCHED'
    };
  }
  async run(report:any,extra:any) {
    const context = buildContext(report)
    return this.runRuleEngine(rules, context)
  }
}

