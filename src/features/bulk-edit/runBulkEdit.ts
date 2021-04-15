import { PageExtensionSDK } from "@contentful/app-sdk";
import { Entry } from "@contentful/field-editor-shared";
import processOperation from "./entries-operations/operations";
import { Operation } from "./entries-operations/schemas";
import { paginationQueue, entryProcessingQueue } from "./queues";
import { BulkEditProgress, EntryLog } from "./types";
import PQueue from "p-queue";

interface RunBulkEditInput {
  sdk: PageExtensionSDK;
  operations: Operation[];
  filtersQueryArgs: Record<string, string | number>;
  dryRun: boolean;
  setBulkEditProgress: React.Dispatch<React.SetStateAction<BulkEditProgress>>;
  addEntryLog: (entryId: string, log: EntryLog) => void;
}

interface RunBulkEditResult {
  success: true;
}

const runBulkEdit = async ({
  sdk,
  operations,
  filtersQueryArgs,
  dryRun,
  setBulkEditProgress,
  addEntryLog,
}: RunBulkEditInput): Promise<RunBulkEditResult> => {
  const limit = 1000;
  const entryIds: string[] = [];

  const prefetchAllEntryIds = async (page = 1): Promise<void> => {
    const entries = await sdk.space.getEntries<Pick<Entry, "sys">>({
      limit,
      skip: (page - 1) * limit,
      select: "sys.id",
      ...filtersQueryArgs,
    });

    if (entries.total === 0) {
      return;
    }

    entries.items.forEach((entry) => {
      entryIds.push(entry.sys.id);
    });

    if (entries.total > limit * page) {
      paginationQueue.add(() => prefetchAllEntryIds(page + 1));
    }
  };

  paginationQueue.add(() => prefetchAllEntryIds());

  await paginationQueue.onIdle();

  setBulkEditProgress((x) => ({
    ...x,
    status: "processing_entries",
  }));

  if (entryIds.length === 0) {
    setBulkEditProgress((x) => ({
      ...x,
      status: "done",
    }));
    return { success: true };
  }

  // If a single operation for a given entry fails, we want to skip all other
  // operations for that entry
  const entriesWithOperationThatErrored = new Set<string>();

  const processEntries = async (): Promise<void> => {
    for (let i = 0; i < entryIds.length; i += 1) {
      const thisSpecificEntryQueue = new PQueue({
        concurrency: 1,
      });

      for (let j = 0; j < operations.length; j += 1) {
        thisSpecificEntryQueue.add(async () =>
          entryProcessingQueue.add(
            async () => {
              const isLastOperationOnThisentry = j === operations.length - 1;

              const entry = await sdk.space.getEntry<Entry>(entryIds[i]);

              if (entriesWithOperationThatErrored.has(entry.sys.id) === false) {
                const operationResult = await processOperation({
                  operation: operations[j],
                  entry,
                  dryRun,
                  sdk,
                  setBulkEditProgress,
                  addEntryLog,
                });

                if (operationResult.success === false) {
                  entriesWithOperationThatErrored.add(entry.sys.id);
                }
              } else {
                setBulkEditProgress((x) => ({
                  ...x,
                  operationsSkipped: x.operationsSkipped + 1,
                }));
                addEntryLog(entry.sys.id, {
                  message: `Skipping operation "${operations[j].operation}" for this entry, previous operation for this entry failed`,
                  tone: "negative",
                });
              }

              if (isLastOperationOnThisentry === true) {
                setBulkEditProgress((x) => ({
                  ...x,
                  entriesProcessed: x.entriesProcessed + 1,
                }));
                addEntryLog(entry.sys.id, {
                  message: "Entry processed",
                  tone: "neutral",
                });
              }
            },
            { priority: entryIds.length - i }
          )
        );
      }
    }
  };

  await processEntries();

  entryProcessingQueue.start();

  await entryProcessingQueue.onIdle();

  setBulkEditProgress((x) => ({
    ...x,
    status: "done",
  }));

  return { success: true };
};

export default runBulkEdit;
