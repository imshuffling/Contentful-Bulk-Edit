import { entityHelpers, Entry } from "@contentful/field-editor-shared";
import { Condition } from "../schemas";

interface EntryIsPublishedInput {
  condition: Condition;
  entry: Entry;
}

interface EntryIsPublishedResult {
  passed: boolean;
  reason: string;
}

const entryIsPublished = {
  canEvaluate: (condition: Condition): boolean => {
    return condition.entity === "entry" && condition.type.startsWith("status.");
  },
  evaluate: async ({
    condition,
    entry,
  }: EntryIsPublishedInput): Promise<EntryIsPublishedResult> => {
    const statusToCheckFor = condition.type.replace("status.", "");
    const passed = entityHelpers.getEntryStatus(entry.sys) === statusToCheckFor;

    return {
      passed,
      reason: `Entry status ${
        passed === true ? "is" : "is not"
      } "${statusToCheckFor}"`,
    };
  },
};

export default entryIsPublished;
