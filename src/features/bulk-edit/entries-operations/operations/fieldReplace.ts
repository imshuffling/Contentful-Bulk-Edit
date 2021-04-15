import { Link, PageExtensionSDK } from "@contentful/app-sdk";
import { Entry } from "@contentful/field-editor-shared";
import { FieldOperation } from "../schemas";
import cloneDeep from "lodash/cloneDeep";

// https://stackoverflow.com/a/17886301
const escapeRegExp = (stringToGoIntoTheRegex: string): string => {
  // eslint-disable-next-line no-useless-escape
  return stringToGoIntoTheRegex.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
};

interface FieldReplaceInput {
  entry: Entry;
  dryRun: boolean;
  sdk: PageExtensionSDK;
  operation: FieldOperation;
}

interface FieldReplaceResult {
  success: boolean;
}

const fieldReplace = async ({
  entry,
  dryRun,
  sdk,
  operation,
}: FieldReplaceInput): Promise<FieldReplaceResult> => {
  if (
    operation.newValue === undefined ||
    operation.replacedValue === undefined
  ) {
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

  if (newEntryData.fields?.[operation.field]?.[locale] === undefined) {
    return { success: true };
  }

  const lookupRegex = new RegExp(escapeRegExp(operation.replacedValue), "g");

  if (operation.fieldType === "Boolean") {
    const newValue = operation.newValue === "1" ? true : false;

    if (newEntryData.fields[operation.field][locale] !== newValue) {
      newEntryData.fields[operation.field][locale] = newValue;
    }
  } else if (operation.fieldType === "Date") {
    newEntryData.fields[operation.field][locale] = new Date(
      newEntryData.fields[operation.field][locale].replace(
        lookupRegex,
        operation.newValue
      )
    ).toISOString();
  } else if (
    operation.fieldType === "Integer" ||
    operation.fieldType === "Number" ||
    operation.fieldType === "Symbol" ||
    operation.fieldType === "Text"
  ) {
    newEntryData.fields[operation.field][locale] = newEntryData.fields[
      operation.field
    ][locale].replace(lookupRegex, operation.newValue);
  } else if (operation.fieldType === "LinkEntry") {
    newEntryData.fields[operation.field][locale] = {
      sys: {
        type: "Link",
        linkType: "Entry",
        id: newEntryData.fields[operation.field][locale].replace(
          lookupRegex,
          operation.newValue
        ),
      },
    };
  } else if (operation.fieldType === "LinkAsset") {
    newEntryData.fields[operation.field][locale] = {
      sys: {
        type: "Link",
        linkType: "Asset",
        id: newEntryData.fields[operation.field][locale].replace(
          lookupRegex,
          operation.newValue
        ),
      },
    };
  } else if (operation.fieldType === "ArrayEntry") {
    newEntryData.fields[operation.field][locale] = (newEntryData.fields[
      operation.field
    ][locale] as Link[])
      .map((entrySys) => entrySys.sys.id)
      .join(",")
      .replace(lookupRegex, operation.newValue)
      .split(",")
      .filter((entryId) => entryId !== "")
      .map((entryId) => ({
        sys: {
          type: "Link",
          linkType: "Entry",
          id: entryId.trim(),
        },
      }));
  } else if (operation.fieldType === "ArrayAsset") {
    newEntryData.fields[operation.field][locale] = (newEntryData.fields[
      operation.field
    ][locale] as Link[])
      .map((entrySys) => entrySys.sys.id)
      .join(",")
      .replace(lookupRegex, operation.newValue)
      .split(",")
      .filter((entryId) => entryId !== "")
      .map((entryId) => ({
        sys: {
          type: "Link",
          linkType: "Asset",
          id: entryId.trim(),
        },
      }));
  }

  if (JSON.stringify(newEntryData) !== JSON.stringify(entry)) {
    await sdk.space.updateEntry(newEntryData);
  }

  return { success: true };
};

export default fieldReplace;
