import React, { useMemo } from "react";
import {
  FieldOperation,
  Operation,
  SupportedFieldTypes,
  supportedFieldTypesSchema,
} from "../schemas";
import { activeFilters } from "../../../entries-filter/filters";
import { useEntity } from "simpler-state";
import {
  CollectionResponse,
  ContentType,
  ContentTypeField,
  PageExtensionSDK,
} from "@contentful/app-sdk";
import {
  SelectField,
  Option,
  TextField,
  Paragraph,
  RadioButtonField,
  Button,
} from "@contentful/forma-36-react-components";
import { Asset, Entry } from "@contentful/field-editor-shared";

interface FieldSetOperationProps {
  contentTypes: CollectionResponse<ContentType>;
  sdk: PageExtensionSDK;
  operation: FieldOperation;
  updateOperation: (operationId: Operation["id"], operation: Operation) => void;
}

const FieldSetOperation: React.FC<FieldSetOperationProps> = (props) => {
  const { operation, updateOperation, contentTypes, sdk } = props;

  const filters = useEntity(activeFilters);

  const contentTypeFieldOptions = useMemo(() => {
    const selectedContentType = filters.find(
      (filter) => filter.id === "contentType"
    )?.value;

    return selectedContentType !== undefined && selectedContentType !== ""
      ? contentTypes.items.filter(
          (cType) => cType.sys.id === selectedContentType
        )
      : contentTypes.items;
  }, [contentTypes.items, filters]);

  const getFieldType = (
    contentTypeId: string,
    fieldId: string
  ): SupportedFieldTypes | undefined => {
    const cField = contentTypes.items
      .find((cType) => cType.sys.id === contentTypeId)
      ?.fields.find((cTypeField) => cTypeField.id === fieldId);

    if (cField === undefined) {
      return undefined;
    }

    return (cField.type === "Link"
      ? `${cField.type}${cField.linkType}`
      : cField.type === "Array"
      ? `${cField.type}${cField.items?.linkType}`
      : cField.type) as SupportedFieldTypes;
  };

  const isFieldSupported = (cField: ContentTypeField): boolean => {
    const type =
      cField.type === "Link"
        ? `${cField.type}${cField.linkType}`
        : cField.type === "Array"
        ? `${cField.type}${cField.items?.linkType}`
        : cField.type;

    return supportedFieldTypesSchema.safeParse(type).success;
  };

  const isCurrentFieldLocalized = useMemo(() => {
    if (operation.field === "" || operation.contentType === "") {
      return false;
    }

    return (
      contentTypes.items
        .find((cType) => cType.sys.id === operation.contentType)
        ?.fields.find((cTypeField) => cTypeField.id === operation.field)
        ?.localized ?? false
    );
  }, [contentTypes.items, operation.contentType, operation.field]);

  return (
    <div>
      <SelectField
        name={`${operation.id}-field`}
        id={`${operation.id}-field`}
        labelText="Field"
        value={
          operation.field ? `${operation.contentType}:${operation.field}` : ""
        }
        className="mt-2"
        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
          const [newContentType, newField] =
            event.target.value === ""
              ? ["", ""]
              : event.target.value.split(":");
          const newFieldType = getFieldType(newContentType, newField);

          const newOperation = {
            ...operation,
            contentType: newContentType,
            field: newField,
            fieldType: newFieldType as SupportedFieldTypes,
            newValue: "",
          };

          updateOperation(operation.id, newOperation);
        }}
      >
        <Option value="">Select a field</Option>
        {contentTypeFieldOptions.map((contentType) => (
          <optgroup key={contentType.sys.id} label={contentType.name}>
            {contentType.fields.filter(isFieldSupported).map((cField) => (
              <Option
                key={`${contentType.sys.id}:${cField.id}`}
                value={`${contentType.sys.id}:${cField.id}`}
              >
                {cField.name}
              </Option>
            ))}
          </optgroup>
        ))}
      </SelectField>

      {isCurrentFieldLocalized === true ? (
        <SelectField
          name={`${operation.id}-locale`}
          id={`${operation.id}-locale`}
          labelText="Locale"
          value={operation.locale ?? sdk.locales.default}
          className="mt-2"
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
            const newOperation = {
              ...operation,
              locale: event.target.value,
            };

            updateOperation(operation.id, newOperation);
          }}
        >
          {sdk.locales.available.map((locale) => (
            <Option key={locale} value={locale}>
              {locale}
            </Option>
          ))}
        </SelectField>
      ) : null}

      {operation.field !== "" && operation.fieldType !== undefined ? (
        <>
          {[
            "Symbol",
            "Integer",
            "Number",
            "LinkAsset",
            "LinkEntry",
            "ArrayAsset",
            "ArrayEntry",
            "Date",
          ].includes(operation.fieldType) ? (
            <>
              <TextField
                name={`${operation.id}-value`}
                id={`${operation.id}-value`}
                labelText="New value"
                className="mt-4"
                value={operation.newValue ?? ""}
                textInputProps={{
                  type:
                    operation.fieldType === "Integer" ||
                    operation.fieldType === "Number"
                      ? "number"
                      : operation.fieldType === "Date"
                      ? "date"
                      : "text",
                }}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  const newOperation = {
                    ...operation,
                    newValue: event.target.value,
                  };

                  updateOperation(operation.id, newOperation);
                }}
              />
              {operation.fieldType === "LinkAsset" ? (
                <Button
                  buttonType="muted"
                  size="small"
                  className="mt-1"
                  onClick={async () => {
                    const asset = await sdk.dialogs.selectSingleAsset<Asset>();

                    if (asset === null) {
                      return;
                    }

                    const newOperation = {
                      ...operation,
                      newValue: asset.sys.id,
                    };

                    updateOperation(operation.id, newOperation);
                  }}
                >
                  Pick asset
                </Button>
              ) : null}
              {operation.fieldType === "ArrayAsset" ? (
                <Button
                  buttonType="muted"
                  size="small"
                  className="mt-1"
                  onClick={async () => {
                    const assets = await sdk.dialogs.selectMultipleAssets<Asset>();

                    if (assets === null) {
                      return;
                    }

                    const newOperation = {
                      ...operation,
                      newValue: assets.map((asset) => asset.sys.id).join(","),
                    };

                    updateOperation(operation.id, newOperation);
                  }}
                >
                  Pick assets
                </Button>
              ) : null}
              {operation.fieldType === "LinkEntry" ? (
                <Button
                  buttonType="muted"
                  size="small"
                  className="mt-1"
                  onClick={async () => {
                    const entry = await sdk.dialogs.selectSingleEntry<Entry>();

                    if (entry === null) {
                      return;
                    }

                    const newOperation = {
                      ...operation,
                      newValue: entry.sys.id,
                    };

                    updateOperation(operation.id, newOperation);
                  }}
                >
                  Pick entry
                </Button>
              ) : null}
              {operation.fieldType === "ArrayEntry" ? (
                <Button
                  buttonType="muted"
                  size="small"
                  className="mt-1"
                  onClick={async () => {
                    const entries = await sdk.dialogs.selectMultipleEntries<Entry>();

                    if (entries === null) {
                      return;
                    }

                    const newOperation = {
                      ...operation,
                      newValue: entries.map((entry) => entry.sys.id).join(","),
                    };

                    updateOperation(operation.id, newOperation);
                  }}
                >
                  Pick entries
                </Button>
              ) : null}
            </>
          ) : null}
          {operation.fieldType === "Text" ? (
            <TextField
              name={`${operation.id}-value`}
              id={`${operation.id}-value`}
              labelText="New value"
              className="mt-4"
              textarea
              value={operation.newValue ?? ""}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const newOperation = {
                  ...operation,
                  newValue: event.target.value,
                };

                updateOperation(operation.id, newOperation);
              }}
            />
          ) : null}
          {operation.fieldType === "Boolean" ? (
            <>
              <Paragraph className="mt-4 font-medium text-sm f36-color--text-dark">
                New value
              </Paragraph>
              <RadioButtonField
                name={`${operation.id}-value`}
                id={`${operation.id}-value`}
                labelText="True"
                className="mt-1"
                value="1"
                checked={operation.newValue === "1"}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  const newOperation = {
                    ...operation,
                    newValue: event.target.value,
                  };

                  updateOperation(operation.id, newOperation);
                }}
              />
              <RadioButtonField
                name={`${operation.id}-value`}
                id={`${operation.id}-value`}
                labelText="False"
                value="0"
                checked={operation.newValue === "0"}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  const newOperation = {
                    ...operation,
                    newValue: event.target.value,
                  };

                  updateOperation(operation.id, newOperation);
                }}
                className="ml-4"
              />
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default FieldSetOperation;
