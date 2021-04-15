import { PageExtensionSDK } from "@contentful/app-sdk";
import { entityHelpers, Entry } from "@contentful/field-editor-shared";

interface UnpublishEntryInput {
  entry: Entry;
  dryRun: boolean;
  sdk: PageExtensionSDK;
}

interface UnpublishEntryResult {
  success: boolean;
}

const unpublishEntry = async ({
  entry,
  dryRun,
  sdk,
}: UnpublishEntryInput): Promise<UnpublishEntryResult> => {
  if (dryRun === true) {
    return {
      success: true,
    };
  }

  let entryToPublish = entry;

  const entryStatus = entityHelpers.getEntryStatus(entry.sys);

  if (entryStatus === "archived") {
    entryToPublish = await sdk.space.unarchiveEntry(entry);
  } else if (entryStatus === "draft") {
    return { success: true };
  }

  await sdk.space.unpublishEntry(entryToPublish);

  return { success: true };
};

export default unpublishEntry;
