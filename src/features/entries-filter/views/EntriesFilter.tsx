import {
  CollectionResponse,
  ContentType,
  PageExtensionSDK,
  User,
} from "@contentful/app-sdk";
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem,
  Grid,
  GridItem,
  Heading,
  Paragraph,
  SkeletonRow,
  Subheading,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tag,
  TextLink,
  Typography,
} from "@contentful/forma-36-react-components";
import { UseQueryResult } from "react-query";
import dateDifferenceInHours from "date-fns/differenceInHours";
import dateFormatDistanceToNow from "date-fns/formatDistanceToNow";
import dateFormat from "date-fns/format";
import dateStartOfDay from "date-fns/startOfDay";
import dateEndOfDay from "date-fns/endOfDay";
import { useCallback, useEffect, useState } from "react";
import { entityHelpers, Entry } from "@contentful/field-editor-shared";
import { useEntity } from "simpler-state";
import {
  activeFilters,
  addFilter,
  filtersFormState,
  markFiltersFormAsDirty,
  markFiltersFormAsNotDirty,
  removeFilter,
} from "../filters";
import SelectFilter from "../filters/Select";
import {
  dateFilterApplyToArgsSchema,
  fieldFilterApplyToArgsSchema,
  Filter,
  selectFilterApplyToArgsSchema,
  selectFilterOnChangeSchema,
} from "../schemas";
import DateFilter from "../filters/Date";
import FieldFilter from "../filters/Field";
import { nanoid } from "nanoid";

const EntriesFilter: React.FC<{
  contentTypes: CollectionResponse<ContentType>;
  users: CollectionResponse<User>;
  sdk: PageExtensionSDK;
  setFiltersQueryArgs: React.Dispatch<
    React.SetStateAction<Record<string, string | number>>
  >;
  getEntriesQuery: UseQueryResult<CollectionResponse<Entry>, unknown>;
}> = (props) => {
  const {
    sdk,
    contentTypes,
    users,
    setFiltersQueryArgs,
    getEntriesQuery,
  } = props;

  const [addNewFilterDropdownOpen, setAddNewFilterDropdownOpen] = useState(
    false
  );

  const filters = useEntity(activeFilters);
  const formState = useEntity(filtersFormState);

  const constructFiltersQueryArgs = useCallback(() => {
    let args: Record<string, string | number> = {};

    if (filters.length === 0) {
      setFiltersQueryArgs(args);
      return;
    }

    filters.forEach((filter) => {
      if (filter.type === "select") {
        args = filter.applyToArgs(args, filter);
      } else if (filter.type === "date") {
        args = filter.applyToArgs(args, filter);
      } else if (filter.type === "field") {
        args = filter.applyToArgs(args, filter);
      }
    });

    setFiltersQueryArgs(args);
  }, [filters, setFiltersQueryArgs]);

  // Apply filters when form is dirty
  useEffect(() => {
    if (formState.dirty === false) {
      return;
    }

    constructFiltersQueryArgs();
    markFiltersFormAsNotDirty();
  }, [constructFiltersQueryArgs, formState.dirty]);

  const addNewUserFilter = ({
    id,
    label,
  }: {
    id: string;
    label: string;
  }): void => {
    addFilter({
      type: "select",
      id,
      label,
      value: "",
      choices: users.items.map((user) => ({
        value: user.sys.id,
        label:
          user.firstName !== null || user.lastName !== null
            ? `${`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()} (${
                user.email
              })`
            : user.email,
      })),
      applyToArgs: selectFilterApplyToArgsSchema.implement((args, filter) => {
        if (filter.value === "") {
          return args;
        }

        args[`sys.${id}.sys.id`] = filter.value;

        return args;
      }),
    });
  };

  const addNewDateFilter = ({
    id,
    label,
  }: {
    id: string;
    label: string;
  }): void => {
    addFilter({
      type: "date",
      id,
      label,
      value: "",
      comparison: "is",
      applyToArgs: dateFilterApplyToArgsSchema.implement((args, filter) => {
        if (filter.value === "") {
          return args;
        }

        const date = new Date(filter.value);
        const startOfDayDate = dateStartOfDay(date);
        const endOfDayDate = dateEndOfDay(date);

        if (filter.comparison === "is") {
          args[`sys.${id}[gte]`] = startOfDayDate.toISOString();
          args[`sys.${id}[lte]`] = endOfDayDate.toISOString();
        } else if (filter.comparison === "is_after") {
          args[`sys.${id}[gte]`] = endOfDayDate.toISOString();
        } else if (filter.comparison === "is_on_or_after") {
          args[`sys.${id}[gte]`] = startOfDayDate.toISOString();
        } else if (filter.comparison === "is_before") {
          args[`sys.${id}[lte]`] = startOfDayDate.toISOString();
        } else if (filter.comparison === "is_on_or_before") {
          args[`sys.${id}[lte]`] = endOfDayDate.toISOString();
        }

        return args;
      }),
    });
  };

  const addNewFilter = (type: string): void => {
    switch (type) {
      case "contentType":
        addFilter({
          type: "select",
          id: "contentType",
          label: "Content type",
          value: "",
          choices: contentTypes.items.map((contentType) => ({
            value: contentType.sys.id,
            label: contentType.name,
          })),
          applyToArgs: selectFilterApplyToArgsSchema.implement(
            (args, filter) => {
              if (filter.value === "") {
                return args;
              }

              args.content_type = filter.value;

              return args;
            }
          ),
          onChange: selectFilterOnChangeSchema.implement(
            (filter, filtersArg: Filter[]) => {
              if (filter.value === "") {
                return;
              }

              // If a content type is set, we want to remove all field value
              // filters not operating on that content type
              const filtersToRemove = filtersArg.filter(
                (activeFilter) =>
                  activeFilter.type === "field" &&
                  activeFilter.contentType !== filter.value &&
                  activeFilter.contentType !== ""
              );

              filtersToRemove.forEach((filterToRemove) =>
                removeFilter(filterToRemove.id)
              );
            }
          ),
        });
        break;
      case "createdBy":
        addNewUserFilter({
          id: "createdBy",
          label: "Created by",
        });
        break;
      case "updatedBy":
        addNewUserFilter({
          id: "updatedBy",
          label: "Last updated by",
        });
        break;
      case "publishedBy":
        addNewUserFilter({
          id: "publishedBy",
          label: "Last published by",
        });
        break;
      case "updatedAt":
        addNewDateFilter({
          id: "updatedAt",
          label: "Last updated at",
        });
        break;
      case "createdAt":
        addNewDateFilter({
          id: "createdAt",
          label: "Created at",
        });
        break;
      case "publishedAt":
        addNewDateFilter({
          id: "publishedAt",
          label: "Last published at",
        });
        break;
      case "firstPublishedAt":
        addNewDateFilter({
          id: "firstPublishedAt",
          label: "First published at",
        });
        break;
      case "fieldValue":
        addFilter({
          type: "field",
          id: `field-${nanoid()}`,
          label: "Field value",
          contentType: "",
          field: "",
          value: "",
          applyToArgs: fieldFilterApplyToArgsSchema.implement(
            (args, filter) => {
              const value = filter.value.trim();

              // This is to prevent an edge case where two field filters
              // somehow end up with two different content types
              if (
                args.content_type !== undefined &&
                args.content_type !== filter.contentType
              ) {
                return args;
              }

              if (filter.comparison === "exists") {
                args.content_type = filter.contentType;
                args[`fields.${filter.field}[exists]`] = "true";
                return args;
              } else if (filter.comparison === "exists_not") {
                args.content_type = filter.contentType;
                args[`fields.${filter.field}[exists]`] = "false";
                return args;
              }

              if (value === "") {
                return args;
              }

              args.content_type = filter.contentType;

              switch (filter.fieldType) {
                case "Boolean":
                case "Integer":
                case "Number":
                case "Symbol":
                  if (filter.comparison === "is") {
                    args[`fields.${filter.field}`] = value;
                  } else if (filter.comparison === "is_not") {
                    args[`fields.${filter.field}[ne]`] = value;
                  } else if (filter.comparison === "matches") {
                    args[`fields.${filter.field}[match]`] = value;
                  } else if (filter.comparison === "gt") {
                    args[`fields.${filter.field}[gt]`] = value;
                  } else if (filter.comparison === "gte") {
                    args[`fields.${filter.field}[gte]`] = value;
                  } else if (filter.comparison === "lt") {
                    args[`fields.${filter.field}[lt]`] = value;
                  } else if (filter.comparison === "lte") {
                    args[`fields.${filter.field}[lte]`] = value;
                  }
                  break;
                case "Text":
                  args[`fields.${filter.field}[match]`] = value;
                  break;
                case "Date":
                  const date = new Date(value);
                  const startOfDayDate = dateStartOfDay(date);
                  const endOfDayDate = dateEndOfDay(date);

                  if (filter.comparison === "is") {
                    args[
                      `fields.${filter.field}[gte]`
                    ] = startOfDayDate.toISOString();
                    args[
                      `fields.${filter.field}[lte]`
                    ] = endOfDayDate.toISOString();
                  } else if (filter.comparison === "gt") {
                    args[
                      `fields.${filter.field}[gte]`
                    ] = endOfDayDate.toISOString();
                  } else if (filter.comparison === "gte") {
                    args[
                      `fields.${filter.field}[gte]`
                    ] = startOfDayDate.toISOString();
                  } else if (filter.comparison === "lt") {
                    args[
                      `fields.${filter.field}[lte]`
                    ] = startOfDayDate.toISOString();
                  } else if (filter.comparison === "lte") {
                    args[
                      `fields.${filter.field}[lte]`
                    ] = endOfDayDate.toISOString();
                  }
                  break;
                case "LinkAsset":
                case "LinkEntry":
                  if (filter.comparison === "is") {
                    args[`fields.${filter.field}.sys.id`] = value;
                  } else {
                    args[`fields.${filter.field}.sys.id[ne]`] = value;
                  }
                  break;
                case "ArrayAsset":
                case "ArrayEntry":
                  args[`fields.${filter.field}.sys.id`] = value;
                  break;
              }

              return args;
            }
          ),
        });
        break;
    }

    markFiltersFormAsDirty();
  };

  const getContentTypeDisplayField = (contentTypeId: string): string => {
    const contentType = contentTypes.items.find(
      (x) => x.sys.id === contentTypeId
    );

    return contentType?.displayField ?? "";
  };

  const getEntryContentTypeName = (entry: Entry): string => {
    const contentType = contentTypes.items.find(
      (x) => x.sys.id === entry.sys.contentType.sys.id
    );

    return contentType?.name ?? "Untitled";
  };

  const getEntryName = (entry: Entry): string => {
    const displayField = getContentTypeDisplayField(
      entry.sys.contentType.sys.id
    );

    return entry.fields?.[displayField]?.[sdk.locales.default] ?? "Untitled";
  };

  const getEntryUpdatedAt = (entry: Entry): string => {
    const now = new Date();
    const entryUpdatedAt = new Date(entry.sys.updatedAt);
    const hoursAgoUpdatedAt = dateDifferenceInHours(now, entryUpdatedAt);

    if (hoursAgoUpdatedAt < 24) {
      return dateFormatDistanceToNow(entryUpdatedAt, { addSuffix: true });
    }

    return dateFormat(entryUpdatedAt, "MMM d, y");
  };

  return (
    <>
      <Typography>
        <Heading>1. Which entries do you want to edit?</Heading>
      </Typography>

      {filters.length === 0 ? (
        <Typography>
          <Paragraph className="text-lg">
            You have no filters applied, all entries will potentially be edited
          </Paragraph>
        </Typography>
      ) : (
        <div className="mb-4">
          <Grid columns={4} columnGap="spacingM" rowGap="spacingM">
            {filters.map((filter) => (
              <GridItem key={filter.id}>
                {filter.type === "select" ? (
                  <SelectFilter {...filter} />
                ) : filter.type === "date" ? (
                  <DateFilter {...filter} />
                ) : filter.type === "field" ? (
                  <FieldFilter
                    {...filter}
                    contentTypes={contentTypes}
                    sdk={sdk}
                  />
                ) : null}
              </GridItem>
            ))}
          </Grid>
        </div>
      )}

      <Dropdown
        isOpen={addNewFilterDropdownOpen}
        onClose={() => {
          setAddNewFilterDropdownOpen(false);
        }}
        toggleElement={
          <Button
            buttonType="positive"
            size="small"
            indicateDropdown
            onClick={() => {
              setAddNewFilterDropdownOpen(true);
            }}
          >
            Add new filter
          </Button>
        }
      >
        <DropdownList>
          <DropdownListItem isTitle>Entry</DropdownListItem>
          {[
            { id: "contentType", label: "Content type" },
            { id: "createdBy", label: "Created by" },
            { id: "updatedBy", label: "Last updated by" },
            { id: "publishedBy", label: "Last published by" },
            { id: "updatedAt", label: "Last updated at" },
            { id: "createdAt", label: "Created at" },
            { id: "publishedAt", label: "Last published at" },
            { id: "firstPublishedAt", label: "First published at" },
          ].map((filter) => (
            <DropdownListItem
              key={filter.id}
              onClick={() => {
                addNewFilter(filter.id);
                setAddNewFilterDropdownOpen(false);
              }}
              isDisabled={
                filters.find(
                  (appliedFilter) => appliedFilter.id === filter.id
                ) !== undefined
              }
            >
              {filter.label}
            </DropdownListItem>
          ))}
          <DropdownListItem isTitle>Field</DropdownListItem>
          <DropdownListItem
            onClick={() => {
              addNewFilter("fieldValue");
              setAddNewFilterDropdownOpen(false);
            }}
          >
            Field value
          </DropdownListItem>
        </DropdownList>
      </Dropdown>

      <Typography className="mt-8">
        <Subheading>
          {getEntriesQuery.data === undefined
            ? "Fetching entries"
            : getEntriesQuery.data.total > 10
            ? "First 10 entries"
            : `${getEntriesQuery.data.total} ${
                getEntriesQuery.data.total === 1 ? "entry" : "entries"
              }`}{" "}
          matching your query:
        </Subheading>
      </Typography>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Content Type</TableCell>
            <TableCell>Updated</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {getEntriesQuery.data && getEntriesQuery.isLoading === false ? (
            getEntriesQuery.data.items.map((entry) => (
              <TableRow key={entry.sys.id}>
                <TableCell>
                  <TextLink
                    icon="ExternalLink"
                    iconPosition="right"
                    linkType="muted"
                    target="_blank"
                    href={`https://app.contentful.com/spaces/${sdk.ids.space}/entries/${entry.sys.id}`}
                  >
                    {getEntryName(entry)}
                  </TextLink>
                </TableCell>
                <TableCell>{getEntryContentTypeName(entry)}</TableCell>
                <TableCell>{getEntryUpdatedAt(entry)}</TableCell>
                <TableCell>
                  <Tag
                    entityStatusType={entityHelpers.getEntryStatus(entry.sys)}
                  >
                    {entityHelpers.getEntryStatus(entry.sys)}
                  </Tag>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <SkeletonRow rowCount={10} columnCount={3} />
          )}
        </TableBody>
      </Table>

      {getEntriesQuery.data && getEntriesQuery.isLoading === false ? (
        <Typography className="f36-margin-top--m">
          <Paragraph>
            In total, your filters match{" "}
            <b>
              {getEntriesQuery.data.total}{" "}
              {getEntriesQuery.data.total === 1 ? "entry" : "entries"}
            </b>
          </Paragraph>
        </Typography>
      ) : null}
    </>
  );
};

export default EntriesFilter;
