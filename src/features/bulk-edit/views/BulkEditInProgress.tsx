import {
  Button,
  Heading,
  Note,
  Paragraph,
  SectionHeading,
  Spinner,
  Typography,
} from "@contentful/forma-36-react-components";
import React, { useState } from "react";
import { BulkEditProgress, BulkEditStatus, EntryLog } from "../types";

interface BulkEditInProgressProps {
  dryRun: boolean;
  totalEntriesCount: number;
  totalOperationsCount: number;
  bulkEditProgress: BulkEditProgress;
  bulkEditStatus: BulkEditStatus;
  setBulkEditStatus: React.Dispatch<React.SetStateAction<BulkEditStatus>>;
  logs: Map<string, EntryLog[]>;
}

const BulkEditInProgress: React.FC<BulkEditInProgressProps> = (props) => {
  const {
    dryRun,
    totalEntriesCount,
    totalOperationsCount,
    bulkEditProgress,
    bulkEditStatus,
    setBulkEditStatus,
    logs,
  } = props;

  const [logsOpen, setLogsOpen] = useState(false);

  return (
    <section className="max-w-3xl mx-auto">
      {bulkEditProgress.status !== "done" ? (
        <Note>Bulk editing is in progress, do not close this tab</Note>
      ) : null}
      <Typography className="mt-8">
        <Heading>Summary of what&apos;s going on:</Heading>
        {dryRun === true ? (
          <Paragraph>
            You have chosen to run bulk editing in a &quot;dry run&quot; mode,
            your entries will not actually be edited.
          </Paragraph>
        ) : (
          <Paragraph>
            You have chosen <i>not to</i> run bulk editing in a &quot;dry
            run&quot; mode, entries will be edited.
          </Paragraph>
        )}

        <Heading>
          Status:{" "}
          <span className="font-normal">
            {bulkEditProgress.status === "collecting_entries" ? (
              <>
                Collecting entries <Spinner />
              </>
            ) : bulkEditProgress.status === "processing_entries" ? (
              <>
                Processing entries <Spinner />
              </>
            ) : dryRun === true ? (
              "Bulk editing (dry run) completed"
            ) : (
              "Bulk editing completed"
            )}
          </span>
        </Heading>
        <Paragraph>
          {bulkEditProgress.entriesProcessed} / {totalEntriesCount} entries
          processed
        </Paragraph>
        {bulkEditProgress.operationsProcessed > 0 ? (
          <Paragraph>{`${
            bulkEditProgress.operationsProcessed
          } / ${totalOperationsCount} ${
            bulkEditProgress.operationsProcessed === 1
              ? "operation"
              : "operations"
          } processed`}</Paragraph>
        ) : null}
        {bulkEditProgress.operationsSucceeded > 0 ? (
          <Paragraph>{`${bulkEditProgress.operationsSucceeded} ${
            bulkEditProgress.operationsSucceeded === 1
              ? "operation"
              : "operations"
          } succeeded`}</Paragraph>
        ) : null}
        {bulkEditProgress.operationsSkipped > 0 ? (
          <Paragraph>{`${bulkEditProgress.operationsSkipped} ${
            bulkEditProgress.operationsSkipped === 1
              ? "operation"
              : "operations"
          } skipped`}</Paragraph>
        ) : null}
        {bulkEditProgress.operationsErrored > 0 ? (
          <Paragraph>{`${bulkEditProgress.operationsErrored} ${
            bulkEditProgress.operationsErrored === 1
              ? "operation"
              : "operations"
          } errored`}</Paragraph>
        ) : null}
      </Typography>

      {logsOpen === true ? (
        <div className="mt-8 p-2 bg-gray-100">
          <div className="overflow-x-hidden overflow-y-scroll max-h-96">
            {Array.from(logs).map((logItem) => (
              <React.Fragment key={logItem[0]}>
                <SectionHeading className="mt-3">{logItem[0]}</SectionHeading>
                {logItem[1].map((log, i) => (
                  <Paragraph
                    key={i}
                    className={
                      log.tone === "positive"
                        ? "text-green-800"
                        : log.tone === "negative"
                        ? "text-red-800"
                        : ""
                    }
                  >
                    {log.message}
                  </Paragraph>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : null}

      {bulkEditStatus === "finished" ? (
        <div className="mt-8">
          <Button
            onClick={() => {
              setBulkEditStatus("configuring");
            }}
            className="mr-2"
          >
            Back to the previous screen
          </Button>
          <Button
            buttonType="muted"
            onClick={() => {
              setLogsOpen((open) => !open);
            }}
          >
            {logsOpen === true ? "Hide logs" : "Show logs"}
          </Button>
        </div>
      ) : null}
    </section>
  );
};

export default BulkEditInProgress;
