import { PageExtensionSDK } from "@contentful/app-sdk";
import { entityHelpers, Entry } from "@contentful/field-editor-shared";

interface ArchiveEntryInput {
  entry: Entry;
  dryRun: boolean;
  sdk: PageExtensionSDK;
}

interface ArchiveEntryResult {
  success: boolean;
}

const archiveEntry = async ({
  entry,
  dryRun,
  sdk,
}: ArchiveEntryInput): Promise<ArchiveEntryResult> => {
  if (dryRun === true) {
    return {
      success: true,
    };
  }

  let entryToArchive = entry;

  const entryStatus = entityHelpers.getEntryStatus(entry.sys);

  if (entryStatus === "archived") {
    return { success: true };
  }

  if (entryStatus !== "draft") {
    entryToArchive = await sdk.space.unpublishEntry(entry);
  }

  await sdk.space.archiveEntry(entryToArchive);

  return { success: true };
};

export default archiveEntry;
