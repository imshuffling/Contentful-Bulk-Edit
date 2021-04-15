import {
  CollectionResponse,
  ContentType,
  ContentTypeField,
  PageExtensionSDK,
} from "@contentful/app-sdk";
import { Asset, Entry } from "@contentful/field-editor-shared";
import {
  Card,
  Select,
  Option,
  CardActions,
  DropdownList,
  DropdownListItem,
  SectionHeading,
  TextInput,
  Button,
} from "@contentful/forma-36-react-components";
import { useCallback, useMemo } from "react";
import { useEntity } from "simpler-state";
import {
  activeFilters,
  markFiltersFormAsDirty,
  removeFilter,
  updateFilter,
} from "../filters";
import {
  FieldFilter as FieldFilterPartialProps,
  SupportedFieldTypes,
  supportedFieldTypesSchema,
} from "../schemas";
import debounce from "lodash/debounce";

interface FieldFilterProps extends FieldFilterPartialProps {
  contentTypes: CollectionResponse<ContentType>;
  sdk: PageExtensionSDK;
}

const FieldFilter: React.FC<FieldFilterProps> = (props) => {
  const {
    id,
    label,
    contentType,
    field,
    fieldType,
    value,
    comparison,
    contentTypes,
    sdk,
  } = props;

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

  const getFieldComparisonOptions = (
    fieldTypArg: FieldFilterProps["fieldType"]
  ): {
    comparison: Required<FieldFilterProps>["comparison"];
    label: string;
  }[] => {
    switch (fieldTypArg) {
      case "Boolean":
      case "LinkAsset":
      case "LinkEntry":
        return [
          {
            comparison: "is",
            label: "Is",
          },
          { comparison: "is_not", label: "Is not" },
          { comparison: "exists_not", label: "Is empty" },
          { comparison: "exists", label: "Is not empty" },
        ];
      case "Symbol":
        return [
          {
            comparison: "is",
            label: "Is",
          },
          { comparison: "is_not", label: "Is not" },
          { comparison: "matches", label: "Contains" },
          { comparison: "exists_not", label: "Is empty" },
          { comparison: "exists", label: "Is not empty" },
        ];
      case "Date":
        return [
          { comparison: "is", label: "Is" },
          { comparison: "lt", label: "Is before" },
          { comparison: "lte", label: "Is on or before" },
          { comparison: "gt", label: "Is after" },
          { comparison: "gte", label: "Is on or after" },
          { comparison: "exists_not", label: "Is empty" },
          { comparison: "exists", label: "Is not empty" },
        ];
      case "Integer":
      case "Number":
        return [
          { comparison: "is", label: "Is" },
          { comparison: "lt", label: "Is less than" },
          { comparison: "lte", label: "Is less than or equal to" },
          { comparison: "gt", label: "Is more than" },
          { comparison: "gte", label: "Is more than or equal to" },
          { comparison: "exists_not", label: "Is empty" },
          { comparison: "exists", label: "Is not empty" },
        ];

      case "ArrayAsset":
      case "ArrayEntry":
        return [
          { comparison: "matches", label: "Contains" },
          { comparison: "exists_not", label: "Is empty" },
          { comparison: "exists", label: "Is not empty" },
        ];
      case "Text":
        return [
          { comparison: "matches", label: "Contains" },
          { comparison: "exists_not", label: "Is empty" },
          { comparison: "exists", label: "Is not empty" },
        ];
      default:
        return [];
    }
  };

  const fieldComparisonOptions = useMemo(() => {
    return getFieldComparisonOptions(fieldType);
  }, [fieldType]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onFieldChange = useCallback(
    debounce(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        const [newContentType, newField] =
          event.target.value === "" ? ["", ""] : event.target.value.split(":");
        const newFieldType = getFieldType(newContentType, newField);
        const [newComparison] = getFieldComparisonOptions(newFieldType);

        if (newContentType !== "") {
          const contentTypeFilter = filters.find(
            (filter) => filter.id === "contentType"
          );

          if (contentTypeFilter !== undefined) {
            updateFilter("contentType", {
              ...contentTypeFilter,
              value: newContentType,
            });
          }
        }

        const newFilter = {
          ...props,
          comparison: newComparison?.comparison as FieldFilterProps["comparison"],
          contentType: newContentType,
          field: newField,
          fieldType: newFieldType as SupportedFieldTypes,
        };

        updateFilter(id, newFilter);
        markFiltersFormAsDirty();
      },
      300,
      { leading: true, trailing: true, maxWait: 1500 }
    ),
    [props, filters]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onValueChange = useCallback(
    debounce(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newFilter = {
          ...props,
          value: event.target.value,
        };

        updateFilter(id, newFilter);
        markFiltersFormAsDirty();
      },
      300,
      { leading: true, trailing: true, maxWait: 1500 }
    ),
    [props]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onComparisonChange = useCallback(
    debounce(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newFilter = {
          ...props,
          comparison: event.target.value as FieldFilterProps["comparison"],
        };

        updateFilter(id, newFilter);
        markFiltersFormAsDirty();
      },
      300,
      { leading: true, trailing: true, maxWait: 1500 }
    ),
    [props]
  );

  return (
    <Card className="relative">
      <SectionHeading>{label}</SectionHeading>
      <Select
        name={`${id}-field`}
        id={`${id}-field`}
        value={field ? `${contentType}:${field}` : ""}
        className="mt-2"
        onChange={onFieldChange}
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
      </Select>
      {fieldComparisonOptions.length > 0 ? (
        <Select
          name={`${id}-comparison`}
          id={`${id}-comparison`}
          value={comparison}
          className="mt-2"
          onChange={onComparisonChange}
        >
          {fieldComparisonOptions.map((option) => (
            <Option key={option.comparison} value={option.comparison}>
              {option.label}
            </Option>
          ))}
        </Select>
      ) : null}
      {field !== "" ? (
        <>
          {comparison !== undefined &&
          ["exists", "exists_not"].includes(comparison) === false ? (
            <TextInput
              id={id}
              name={id}
              value={value}
              className="mt-2"
              onChange={onValueChange}
              placeholder={
                fieldType === "LinkAsset"
                  ? "Asset id"
                  : fieldType === "LinkEntry"
                  ? "Entry id"
                  : fieldType === "ArrayAsset"
                  ? "Asset id, asset id..."
                  : fieldType === "ArrayEntry"
                  ? "Entry id, entry id..."
                  : fieldType === "Date"
                  ? ""
                  : "Value"
              }
              type={
                fieldType === "Date"
                  ? "date"
                  : fieldType === "Number" || fieldType === "Integer"
                  ? "number"
                  : "text"
              }
            />
          ) : null}
          {fieldType === "LinkAsset" &&
          comparison !== undefined &&
          ["exists", "exists_not"].includes(comparison) === false ? (
            <Button
              buttonType="muted"
              size="small"
              className="mt-1"
              onClick={async () => {
                const asset = await sdk.dialogs.selectSingleAsset<Asset>();

                if (asset === null) {
                  return;
                }

                const newFilter = {
                  ...props,
                  value: asset.sys.id,
                };

                updateFilter(id, newFilter);
                markFiltersFormAsDirty();
              }}
            >
              Pick asset
            </Button>
          ) : null}
          {fieldType === "ArrayAsset" &&
          comparison !== undefined &&
          ["exists", "exists_not"].includes(comparison) === false ? (
            <Button
              buttonType="muted"
              size="small"
              className="mt-1"
              onClick={async () => {
                const assets = await sdk.dialogs.selectMultipleAssets<Asset>();

                if (assets === null) {
                  return;
                }

                const newFilter = {
                  ...props,
                  value: assets.map((asset) => asset.sys.id).join(","),
                };

                updateFilter(id, newFilter);
                markFiltersFormAsDirty();
              }}
            >
              Pick assets
            </Button>
          ) : null}
          {fieldType === "LinkEntry" &&
          comparison !== undefined &&
          ["exists", "exists_not"].includes(comparison) === false ? (
            <Button
              buttonType="muted"
              size="small"
              className="mt-1"
              onClick={async () => {
                const entry = await sdk.dialogs.selectSingleEntry<Entry>();

                if (entry === null) {
                  return;
                }

                const newFilter = {
                  ...props,
                  value: entry.sys.id,
                };

                updateFilter(id, newFilter);
                markFiltersFormAsDirty();
              }}
            >
              Pick entry
            </Button>
          ) : null}
          {fieldType === "ArrayEntry" &&
          comparison !== undefined &&
          ["exists", "exists_not"].includes(comparison) === false ? (
            <Button
              buttonType="muted"
              size="small"
              className="mt-1"
              onClick={async () => {
                const entries = await sdk.dialogs.selectMultipleEntries<Entry>();

                if (entries === null) {
                  return;
                }

                const newFilter = {
                  ...props,
                  value: entries.map((entry) => entry.sys.id).join(","),
                };

                updateFilter(id, newFilter);
                markFiltersFormAsDirty();
              }}
            >
              Pick entries
            </Button>
          ) : null}
        </>
      ) : null}
      <CardActions className="absolute top-4 right-4">
        <DropdownList>
          <DropdownListItem
            onClick={() => {
              removeFilter(id);
              markFiltersFormAsDirty();
            }}
          >
            Remove
          </DropdownListItem>
        </DropdownList>
      </CardActions>
    </Card>
  );
};

export default FieldFilter;
