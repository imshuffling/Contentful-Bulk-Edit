import { PageExtensionSDK } from "@contentful/app-sdk";
import { entityHelpers, Entry } from "@contentful/field-editor-shared";

interface DeleteEntryInput {
  entry: Entry;
  dryRun: boolean;
  sdk: PageExtensionSDK;
}

interface DeleteEntryResult {
  success: boolean;
}

const deleteEntry = async ({
  entry,
  dryRun,
  sdk,
}: DeleteEntryInput): Promise<DeleteEntryResult> => {
  if (dryRun === true) {
    return {
      success: true,
    };
  }

  let entryToDelete = entry;

  const entryStatus = entityHelpers.getEntryStatus(entry.sys);

  if (entryStatus !== "archived" && entryStatus !== "draft") {
    entryToDelete = await sdk.space.unpublishEntry(entry);
  }

  await sdk.space.deleteEntry(entryToDelete);

  return { success: true };
};

export default deleteEntry;
