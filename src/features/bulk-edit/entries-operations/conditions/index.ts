import { Entry } from "@contentful/field-editor-shared";
import { Operation } from "../schemas";
import entryStatus from "./entryStatus";
import { ConditionEvaluationResult } from "./types";

const conditionProcessors = [entryStatus];

interface ProcessEntryConditionsInput {
  operation: Operation;
  entry: Entry;
}

interface ProcessEntryConditionsResult {
  passed: boolean;
  reason: string;
  conditions: ConditionEvaluationResult[];
}

const processEntryConditions = async ({
  operation,
  entry,
}: ProcessEntryConditionsInput): Promise<ProcessEntryConditionsResult> => {
  if (
    operation.logic === undefined ||
    operation.logic.conditions.length === 0
  ) {
    return {
      passed: true,
      reason: "No conditions defined",
      conditions: [],
    };
  }

  const evaluatedConditions: ConditionEvaluationResult[] = [];

  for (let i = 0; i < operation.logic.conditions.length; i += 1) {
    const condition = operation.logic.conditions[i];
    const processor = conditionProcessors.find((conditionProcessor) => {
      return conditionProcessor.canEvaluate(condition);
    });

    if (processor === undefined) {
      evaluatedConditions.push({
        passed: false,
        reason: "Condition could not be evaluated",
      });
      continue;
    }

    evaluatedConditions.push(await processor.evaluate({ condition, entry }));
  }

  const passed =
    operation.logic.operator === "and"
      ? evaluatedConditions.some(
          (evaluatedCondition) => evaluatedCondition.passed === false
        ) === false
      : evaluatedConditions.some(
          (evaluatedCondition) => evaluatedCondition.passed === false
        ) === true;

  return {
    passed,
    reason: passed
      ? operation.logic.operator === "and"
        ? "All conditions passed"
        : "At least one condition passed"
      : operation.logic.operator === "and"
      ? "Not all conditions passed"
      : "None of the conditions passed",
    conditions: evaluatedConditions,
  };
};

export default processEntryConditions;
