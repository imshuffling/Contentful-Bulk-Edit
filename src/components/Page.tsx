import {
  CollectionResponse,
  PageExtensionSDK,
  ContentType,
  User,
} from "@contentful/app-sdk";
import {
  Workbench,
  WorkbenchContent,
  WorkbenchHeader,
} from "@contentful/forma-36-react-components";
import { Entry } from "@contentful/field-editor-shared";
import React, { useCallback, useState } from "react";
import { useQuery } from "react-query";
import BulkEdit from "../features/bulk-edit/views/BulkEdit";
import EntriesFilter from "../features/entries-filter/views/EntriesFilter";
import { Operation } from "../features/bulk-edit/entries-operations/schemas";
import EntriesOperations from "../features/bulk-edit/entries-operations/views/EntriesOperations";
import runBulkEdit from "../features/bulk-edit/runBulkEdit";
import BulkEditInProgress from "../features/bulk-edit/views/BulkEditInProgress";
import {
  BulkEditProgress,
  BulkEditStatus,
  EntryLog,
} from "../features/bulk-edit/types";

interface PageProps {
  sdk: PageExtensionSDK;
}

const Page = (props: PageProps) => {
  const { sdk } = props;

  const [totalEntriesCount, setTotalEntriesCount] = useState(0);
  const [totalOperationsCount, setTotalOperationsCount] = useState(0);
  const [bulkEditStatus, setBulkEditStatus] = useState<BulkEditStatus>(
    "configuring"
  );
  const [bulkEditProgress, setBulkEditProgress] = useState<BulkEditProgress>({
    status: "collecting_entries",
    entriesProcessed: 0,
    operationsProcessed: 0,
    operationsSucceeded: 0,
    operationsSkipped: 0,
    operationsErrored: 0,
  });
  const [logs, setLogs] = useState(new Map<string, EntryLog[]>());
  const addEntryLog = useCallback((entryId: string, log: EntryLog): void => {
    setLogs((currentLogs) => {
      if (currentLogs.has(entryId) === false) {
        currentLogs.set(entryId, [log]);
      } else {
        currentLogs.get(entryId)?.push(log);
      }

      return currentLogs;
    });
  }, []);

  const getContentTypesQuery = useQuery<CollectionResponse<ContentType>>(
    "content-types",
    () => sdk.space.getContentTypes<ContentType>()
  );

  const getUsersQuery = useQuery<CollectionResponse<User>>("users", () =>
    sdk.space.getUsers<User>()
  );

  const [filtersQueryArgs, setFiltersQueryArgs] = useState<
    Record<string, string | number>
  >({});

  const getEntriesQuery = useQuery<CollectionResponse<Entry>>(
    ["filtered-entries", filtersQueryArgs],
    () =>
      sdk.space.getEntries<Entry>({
        limit: 10,
        ...filtersQueryArgs,
      }),
    {
      cacheTime: 1000 * 15,
    }
  );

  const [operations, setOperations] = useState<Operation[]>([]);
  const [dryRun, setDryRun] = useState(true);

  if (
    getContentTypesQuery.data === undefined ||
    getUsersQuery.data === undefined
  ) {
    return null;
  }

  return (
    <Workbench>
      <WorkbenchHeader title="Bulk edit" />
      <WorkbenchContent className="f36-font-family--sans-serif">
        {bulkEditStatus === "configuring" ? (
          <>
            <EntriesFilter
              sdk={sdk}
              contentTypes={getContentTypesQuery.data}
              users={getUsersQuery.data}
              setFiltersQueryArgs={setFiltersQueryArgs}
              getEntriesQuery={getEntriesQuery}
            />
            <EntriesOperations
              operations={operations}
              setOperations={setOperations}
              sdk={sdk}
              contentTypes={getContentTypesQuery.data}
            />
            <BulkEdit
              operations={operations}
              dryRun={dryRun}
              setDryRun={setDryRun}
              onBulkEdit={async () => {
                const shouldRunBulkEdit = await sdk.dialogs.openConfirm({
                  title: "Run bulk editing?",
                  message:
                    dryRun === true
                      ? "You have chosen the dry run option. No entries will be affected. You will get a log of changes that would have happened were you to run this without a dry run."
                      : "If you confirm, bulk editing will start. In a lot of cases the changes are not reversible. We advise creating a backup environment before performing bulk editing.",
                });

                if (shouldRunBulkEdit === false) {
                  return;
                }

                setLogs(new Map());
                setBulkEditStatus("running");
                setBulkEditProgress({
                  status: "collecting_entries",
                  entriesProcessed: 0,
                  operationsProcessed: 0,
                  operationsSucceeded: 0,
                  operationsSkipped: 0,
                  operationsErrored: 0,
                });
                setTotalEntriesCount(getEntriesQuery.data?.total ?? 0);
                setTotalOperationsCount(
                  (getEntriesQuery.data?.total ?? 0) * operations.length
                );

                await runBulkEdit({
                  sdk,
                  operations,
                  filtersQueryArgs,
                  dryRun,
                  setBulkEditProgress,
                  addEntryLog,
                });

                setBulkEditStatus("finished");

                // After 1 second (arbitrary value), we refetch entries so that
                // if they go back to a previous screen, the changes made are
                // reflected in the table
                setTimeout(async () => {
                  await getEntriesQuery.refetch();
                }, 1000);
              }}
            />
          </>
        ) : (
          <BulkEditInProgress
            dryRun={dryRun}
            totalEntriesCount={totalEntriesCount}
            bulkEditProgress={bulkEditProgress}
            bulkEditStatus={bulkEditStatus}
            setBulkEditStatus={setBulkEditStatus}
            totalOperationsCount={totalOperationsCount}
            logs={logs}
          />
        )}
      </WorkbenchContent>
    </Workbench>
  );
};

export default Page;
