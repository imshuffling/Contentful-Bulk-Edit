import * as z from "zod";

const stringOrNumberRecordSchema = z.record(z.union([z.string(), z.number()]));

// Select filter
const partialSelectFilterSchema = z.object({
  type: z.literal("select"),
  id: z.string(),
  label: z.string(),
  value: z.string(),
  choices: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
    })
  ),
});

export const selectFilterApplyToArgsSchema = z.function(
  z.tuple([stringOrNumberRecordSchema, partialSelectFilterSchema.nonstrict()]),
  stringOrNumberRecordSchema
);

export const selectFilterOnChangeSchema = z.function(
  z.tuple([partialSelectFilterSchema.nonstrict(), z.array(z.any())]),
  z.void()
);

const selectFilterSchema = partialSelectFilterSchema.extend({
  applyToArgs: selectFilterApplyToArgsSchema,
  onChange: selectFilterOnChangeSchema.optional(),
});

export type SelectFilter = z.infer<typeof selectFilterSchema>;

// Date filter
const partialDateFilterSchema = z.object({
  type: z.literal("date"),
  id: z.string(),
  label: z.string(),
  comparison: z.enum([
    "is",
    "is_after",
    "is_on_or_after",
    "is_before",
    "is_on_or_before",
  ]),
  value: z.string(),
});

export const dateFilterApplyToArgsSchema = z.function(
  z.tuple([stringOrNumberRecordSchema, partialDateFilterSchema.nonstrict()]),
  stringOrNumberRecordSchema
);

const dateFilterSchema = partialDateFilterSchema.extend({
  applyToArgs: dateFilterApplyToArgsSchema,
});

export type DateFilter = z.infer<typeof dateFilterSchema>;

// Field filter
export const supportedFieldTypesSchema = z.enum([
  "Symbol",
  "Text",
  "Integer",
  "Number",
  "LinkAsset",
  "LinkEntry",
  "ArrayAsset",
  "ArrayEntry",
  "Date",
  "Boolean",
]);

export type SupportedFieldTypes = z.infer<typeof supportedFieldTypesSchema>;

const partialFieldFilterSchema = z.object({
  type: z.literal("field"),
  id: z.string(),
  label: z.string(),
  contentType: z.string(),
  field: z.string(),
  fieldType: supportedFieldTypesSchema.optional(),
  comparison: z
    .enum([
      "is",
      "is_not",
      "matches",
      "gt",
      "gte",
      "lt",
      "lte",
      "exists",
      "exists_not",
    ])
    .optional(),
  value: z.string(),
});

export const fieldFilterApplyToArgsSchema = z.function(
  z.tuple([stringOrNumberRecordSchema, partialFieldFilterSchema.nonstrict()]),
  stringOrNumberRecordSchema
);

const fieldFilterSchema = partialFieldFilterSchema.extend({
  applyToArgs: fieldFilterApplyToArgsSchema,
});

export type FieldFilter = z.infer<typeof fieldFilterSchema>;

// General filter
const filterSchema = z.union([
  selectFilterSchema,
  dateFilterSchema,
  fieldFilterSchema,
]);

export type Filter = z.infer<typeof filterSchema>;
