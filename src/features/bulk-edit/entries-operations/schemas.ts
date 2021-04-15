import * as z from "zod";

// Conditions
export const entryConditionSchema = z.object({
  id: z.string(),
  entity: z.literal("entry"),
  type: z.enum(["status.published", "status.unpublished", "status.archived"]),
});

export type EntryCondition = z.infer<typeof entryConditionSchema>;

export const fieldConditionSchema = z.object({
  id: z.string(),
  entity: z.literal("field"),
  type: z.enum(["value.is"]),
  field: z.string(),
  value: z.string(),
});

export type FieldCondition = z.infer<typeof fieldConditionSchema>;

const conditionSchema = z.union([entryConditionSchema, fieldConditionSchema]);

export type Condition = z.infer<typeof conditionSchema>;

const conditionsSchema = z.object({
  operator: z.enum(["and", "or"]),
  conditions: z.array(conditionSchema),
});

// Entries
const entryOperationTypesSchema = z.enum([
  "publish",
  "unpublish",
  "archive",
  "delete",
]);

export type EntryOperationTypes = z.infer<typeof entryOperationTypesSchema>;

export const entryOperationSchema = z.object({
  type: z.literal("entry"),
  id: z.string(),
  operation: entryOperationTypesSchema,
  logic: conditionsSchema.optional(),
});

export type EntryOperation = z.infer<typeof entryOperationSchema>;

// Fields
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

const fieldOperationTypesSchema = z.enum([
  "field_set",
  "field_clear",
  "field_replace",
]);

export type FieldOperationTypes = z.infer<typeof fieldOperationTypesSchema>;

export const fieldOperationSchema = z.object({
  type: z.literal("field"),
  id: z.string(),
  contentType: z.string(),
  field: z.string(),
  fieldType: supportedFieldTypesSchema.optional(),
  locale: z.string().optional(),
  operation: fieldOperationTypesSchema,
  logic: conditionsSchema.optional(),
  replacedValue: z.string().optional(),
  newValue: z.string().optional(),
});

export type FieldOperation = z.infer<typeof fieldOperationSchema>;

// All operations
export const operationSchema = z.union([
  entryOperationSchema,
  fieldOperationSchema,
]);

export type Operation = z.infer<typeof operationSchema>;
