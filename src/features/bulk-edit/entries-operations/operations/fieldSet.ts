import { PageExtensionSDK } from "@contentful/app-sdk";
import { Entry } from "@contentful/field-editor-shared";
import cloneDeep from "lodash/cloneDeep";
import { FieldOperation } from "../schemas";

interface FieldSetInput {
  entry: Entry;
  dryRun: boolean;
  sdk: PageExtensionSDK;
  operation: FieldOperation;
}

interface FieldSetResult {
  success: boolean;
}

const fieldSet = async ({
  entry,
  dryRun,
  sdk,
  operation,
}: FieldSetInput): Promise<FieldSetResult> => {
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

  if (newEntryData.fields[operation.field] === undefined) {
    newEntryData.fields[operation.field] = {};
  }

  if (operation.fieldType === "Boolean") {
    newEntryData.fields[operation.field][locale] =
      operation.newValue === "1" ? true : false;
  } else if (operation.fieldType === "Date") {
    newEntryData.fields[operation.field][locale] = new Date(
      operation.newValue
    ).toISOString();
  } else if (
    operation.fieldType === "Integer" ||
    operation.fieldType === "Number" ||
    operation.fieldType === "Symbol" ||
    operation.fieldType === "Text"
  ) {
    newEntryData.fields[operation.field][locale] = operation.newValue;
  } else if (operation.fieldType === "LinkEntry") {
    newEntryData.fields[operation.field][locale] = {
      sys: {
        type: "Link",
        linkType: "Entry",
        id: operation.newValue,
      },
    };
  } else if (operation.fieldType === "LinkAsset") {
    newEntryData.fields[operation.field][locale] = {
      sys: {
        type: "Link",
        linkType: "Asset",
        id: operation.newValue,
      },
    };
  } else if (operation.fieldType === "ArrayEntry") {
    newEntryData.fields[operation.field][locale] = operation.newValue
      .split(",")
      .map((entryId) => ({
        sys: {
          type: "Link",
          linkType: "Entry",
          id: entryId.trim(),
        },
      }));
  } else if (operation.fieldType === "ArrayAsset") {
    newEntryData.fields[operation.field][locale] = operation.newValue
      .split(",")
      .map((entryId) => ({
        sys: {
          type: "Link",
          linkType: "Asset",
          id: entryId.trim(),
        },
      }));
  }

  await sdk.space.updateEntry(newEntryData);

  return { success: true };
};

export default fieldSet;
