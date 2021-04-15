import { PageExtensionSDK } from "@contentful/app-sdk";
import { Entry } from "@contentful/field-editor-shared";
import { BulkEditProgress, EntryLog } from "../../types";
import processEntryConditions from "../conditions";
import {
  Operation,
  entryOperationSchema,
  EntryOperation,
  FieldOperation,
  fieldOperationSchema,
} from "../schemas";
import archiveEntry from "./archiveEntry";
import deleteEntry from "./deleteEntry";
import fieldClear from "./fieldClear";
import fieldReplace from "./fieldReplace";
import fieldSet from "./fieldSet";
import publishEntry from "./publishEntry";
import unpublishEntry from "./unpublishEntry";

interface OperationResult {
  success: boolean;
}

interface ProcessEntryOperationInput {
  operation: EntryOperation;
  entry: Entry;
  dryRun: boolean;
  sdk: PageExtensionSDK;
}

const processEntryOperation = async ({
  operation,
  entry,
  dryRun,
  sdk,
}: ProcessEntryOperationInput): Promise<OperationResult> => {
  let result = {
    success: false,
  };

  try {
    switch (operation.operation) {
      case "publish":
        result = await publishEntry({
          entry,
          dryRun,
          sdk,
        });
        return result;
      case "unpublish":
        result = await unpublishEntry({
          entry,
          dryRun,
          sdk,
        });
        return result;
      case "archive":
        result = await archiveEntry({
          entry,
          dryRun,
          sdk,
        });
        return result;
      case "delete":
        result = await deleteEntry({
          entry,
          dryRun,
          sdk,
        });
        return result;
      default:
        return result;
    }
  } catch {
    return result;
  }
};

interface ProcessFieldOperationInput {
  operation: FieldOperation;
  entry: Entry;
  dryRun: boolean;
  sdk: PageExtensionSDK;
}

const processFieldOperation = async ({
  operation,
  entry,
  dryRun,
  sdk,
}: ProcessFieldOperationInput): Promise<OperationResult> => {
  let result = {
    success: false,
  };

  try {
    switch (operation.operation) {
      case "field_set":
        result = await fieldSet({
          entry,
          dryRun,
          sdk,
          operation,
        });
        return result;
      case "field_clear":
        result = await fieldClear({
          entry,
          dryRun,
          sdk,
          operation,
        });
        return result;
      case "field_replace":
        result = await fieldReplace({
          entry,
          dryRun,
          sdk,
          operation,
        });
        return result;
      default:
        return result;
    }
  } catch {
    return result;
  }
};

interface ProcessOperationInput {
  operation: Operation;
  entry: Entry;
  dryRun: boolean;
  sdk: PageExtensionSDK;
  setBulkEditProgress: React.Dispatch<React.SetStateAction<BulkEditProgress>>;
  addEntryLog: (entryId: string, log: EntryLog) => void;
}

const processOperation = async ({
  operation,
  entry,
  dryRun,
  sdk,
  setBulkEditProgress,
  addEntryLog,
}: ProcessOperationInput): Promise<OperationResult> => {
  const processingConditionsResult = await processEntryConditions({
    operation,
    entry,
  });

  if (processingConditionsResult.passed === false) {
    setBulkEditProgress((x) => ({
      ...x,
      operationsSkipped: x.operationsSkipped + 1,
    }));
    addEntryLog(entry.sys.id, {
      message: `Skipping operation "${operation.operation}" for this entry, conditions do not match`,
      tone: "neutral",
    });
    return {
      success: true,
    };
  }

  const isEntryOperation = entryOperationSchema.safeParse(operation);

  if (isEntryOperation.success === true) {
    const result = await processEntryOperation({
      operation: isEntryOperation.data,
      entry,
      dryRun,
      sdk,
    });

    if (result.success === false) {
      setBulkEditProgress((x) => ({
        ...x,
        operationsErrored: x.operationsErrored + 1,
      }));
      addEntryLog(entry.sys.id, {
        message: `Operation "${operation.operation}" failed`,
        tone: "negative",
      });
    } else {
      setBulkEditProgress((x) => ({
        ...x,
        operationsSucceeded: x.operationsSucceeded + 1,
      }));
      addEntryLog(entry.sys.id, {
        message: `Operation "${operation.operation}" succeeded`,
        tone: "positive",
      });
    }

    setBulkEditProgress((x) => ({
      ...x,
      operationsProcessed: x.operationsProcessed + 1,
    }));

    return result;
  }

  const isFieldOperation = fieldOperationSchema.safeParse(operation);

  if (isFieldOperation.success === true) {
    const result = await processFieldOperation({
      operation: isFieldOperation.data,
      entry,
      dryRun,
      sdk,
    });

    if (result.success === false) {
      setBulkEditProgress((x) => ({
        ...x,
        operationsErrored: x.operationsErrored + 1,
      }));
      addEntryLog(entry.sys.id, {
        message: `Operation "${operation.operation}" failed`,
        tone: "negative",
      });
    } else {
      setBulkEditProgress((x) => ({
        ...x,
        operationsSucceeded: x.operationsSucceeded + 1,
      }));
      addEntryLog(entry.sys.id, {
        message: `Operation "${operation.operation}" succeeded`,
        tone: "positive",
      });
    }

    setBulkEditProgress((x) => ({
      ...x,
      operationsProcessed: x.operationsProcessed + 1,
    }));

    return result;
  }

  addEntryLog(entry.sys.id, {
    message: `Skipping operation "${operation.operation}" for this entry, operation unknown`,
    tone: "negative",
  });

  return {
    success: false,
  };
};

export default processOperation;
