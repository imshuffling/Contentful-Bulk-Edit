import PQueue from "p-queue";

export const paginationQueue = new PQueue({
  intervalCap: 5,
  interval: 1000,
  carryoverConcurrencyCount: true,
});

export const entryProcessingQueue = new PQueue({
  autoStart: false,
  intervalCap: 5,
  interval: 1000,
  carryoverConcurrencyCount: true,
});
