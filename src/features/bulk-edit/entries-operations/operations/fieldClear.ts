import { PageExtensionSDK } from "@contentful/app-sdk";
import { Entry } from "@contentful/field-editor-shared";
import cloneDeep from "lodash/cloneDeep";
import { FieldOperation } from "../schemas";

interface FieldClearInput {
  entry: Entry;
  dryRun: boolean;
  sdk: PageExtensionSDK;
  operation: FieldOperation;
}

interface FieldClearResult {
  success: boolean;
}

const fieldClear = async ({
  entry,
  dryRun,
  sdk,
  operation,
}: FieldClearInput): Promise<FieldClearResult> => {
  if (operation.newValue === undefined) {
    return {
      success: false,
    };
  }

  if (dryRun === true) {
    return {
      success: true,
    };
  }

  let newEntryData = cloneDeep(entry);
  const locale = operation.locale ?? sdk.locales.default;

  delete newEntryData.fields[operation.field][locale];

  await sdk.space.updateEntry(newEntryData);

  return { success: true };
};

export default fieldClear;
