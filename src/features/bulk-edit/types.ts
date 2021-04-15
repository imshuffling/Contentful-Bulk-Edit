export interface BulkEditProgress {
  status: "collecting_entries" | "processing_entries" | "done";
  entriesProcessed: number;
  operationsProcessed: number;
  operationsSucceeded: number;
  operationsSkipped: number;
  operationsErrored: number;
}

export type BulkEditStatus = "configuring" | "running" | "finished";

export interface EntryLog {
  message: string;
  tone: "positive" | "negative" | "neutral";
}
