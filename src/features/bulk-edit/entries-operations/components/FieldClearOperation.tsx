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
import { SelectField, Option } from "@contentful/forma-36-react-components";

interface FieldClearOperationProps {
  contentTypes: CollectionResponse<ContentType>;
  sdk: PageExtensionSDK;
  operation: FieldOperation;
  updateOperation: (operationId: Operation["id"], operation: Operation) => void;
}

const FieldClearOperation: React.FC<FieldClearOperationProps> = (props) => {
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
    </div>
  );
};

export default FieldClearOperation;
