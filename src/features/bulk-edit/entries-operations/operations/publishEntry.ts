import { PageExtensionSDK } from "@contentful/app-sdk";
import { entityHelpers, Entry } from "@contentful/field-editor-shared";

interface PublishEntryInput {
  entry: Entry;
  dryRun: boolean;
  sdk: PageExtensionSDK;
}

interface PublishEntryResult {
  success: boolean;
}

const publishEntry = async ({
  entry,
  dryRun,
  sdk,
}: PublishEntryInput): Promise<PublishEntryResult> => {
  if (dryRun === true) {
    return {
      success: true,
    };
  }

  let entryToPublish = entry;

  const entryStatus = entityHelpers.getEntryStatus(entry.sys);

  if (entryStatus === "archived") {
    entryToPublish = await sdk.space.unarchiveEntry(entry);
  } else if (entryStatus === "published") {
    return { success: true };
  }

  await sdk.space.publishEntry(entryToPublish);

  return { success: true };
};

export default publishEntry;
