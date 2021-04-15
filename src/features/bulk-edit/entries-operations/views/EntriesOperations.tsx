import {
  CollectionResponse,
  ContentType,
  PageExtensionSDK,
} from "@contentful/app-sdk";
import {
  Button,
  Card,
  CardActions,
  Dropdown,
  DropdownList,
  DropdownListItem,
  Grid,
  GridItem,
  Heading,
  Note,
  Paragraph,
  Select,
  Option,
  Subheading,
  Typography,
} from "@contentful/forma-36-react-components";
import { nanoid } from "nanoid";
import React, { useMemo, useState } from "react";
import FieldClearOperation from "../components/FieldClearOperation";
import FieldReplaceOperation from "../components/FieldReplaceOperation";
import FieldSetOperation from "../components/FieldSetOperation";
import OperationCondition from "../components/OperationCondition";
import { Condition, Operation } from "../schemas";

interface EntriesOperationsProps {
  operations: Operation[];
  setOperations: React.Dispatch<React.SetStateAction<Operation[]>>;
  sdk: PageExtensionSDK;
  contentTypes: CollectionResponse<ContentType>;
}

const EntriesOperations: React.FC<EntriesOperationsProps> = (props) => {
  const { operations, setOperations, sdk, contentTypes } = props;

  const [
    addNewOperationDropdownOpen,
    setAddNewOperationDropdownOpen,
  ] = useState(false);
  const hasOperations = useMemo(() => {
    return operations.length > 0;
  }, [operations]);

  const addNewOperation = (operation: Operation): void => {
    setOperations((x) => [...x, operation]);
  };

  const updateOperation = (
    operationId: Operation["id"],
    operation: Operation
  ): void => {
    setOperations((savedOperations) =>
      savedOperations.map((savedOperation) =>
        savedOperation.id === operationId ? operation : savedOperation
      )
    );
  };

  const removeOperation = (id: string): void => {
    setOperations((x) => x.filter((y) => y.id !== id));
  };

  const addOperationCondition = (
    operationId: Operation["id"],
    condition: Condition
  ): void => {
    const savedOperation = operations.find(
      (operation) => operation.id === operationId
    );

    if (savedOperation === undefined) {
      return;
    }

    const newOperation: Operation = {
      ...savedOperation,
      logic: savedOperation.logic
        ? {
            ...savedOperation.logic,
            conditions: [...savedOperation.logic.conditions, condition],
          }
        : {
            operator: "and",
            conditions: [condition],
          },
    };

    updateOperation(operationId, newOperation);
  };

  const updateOperationCondition = (
    operationId: Operation["id"],
    condition: Condition
  ): void => {
    const savedOperation = operations.find(
      (operation) => operation.id === operationId
    );

    if (savedOperation === undefined || savedOperation.logic === undefined) {
      return;
    }

    const newOperation: Operation = {
      ...savedOperation,
      logic: {
        ...savedOperation.logic,
        conditions: savedOperation.logic.conditions.map((savedCondition) =>
          savedCondition.id === condition.id ? condition : savedCondition
        ),
      },
    };

    updateOperation(operationId, newOperation);
  };

  const removeOperationCondition = (
    operationId: Operation["id"],
    conditionId: Condition["id"]
  ): void => {
    const savedOperation = operations.find(
      (operation) => operation.id === operationId
    );

    if (savedOperation === undefined || savedOperation.logic === undefined) {
      return;
    }

    const newOperation: Operation = {
      ...savedOperation,
      logic:
        savedOperation.logic.conditions.length <= 1
          ? undefined
          : {
              ...savedOperation.logic,
              conditions: savedOperation.logic.conditions.filter(
                (savedCondition) => savedCondition.id !== conditionId
              ),
            },
    };

    updateOperation(operationId, newOperation);
  };

  const changeOperationLogicOperator = (
    operationId: Operation["id"],
    operator: "and" | "or"
  ): void => {
    const savedOperation = operations.find(
      (operation) => operation.id === operationId
    );

    if (savedOperation === undefined || savedOperation.logic === undefined) {
      return;
    }

    const newOperation: Operation = {
      ...savedOperation,
      logic: {
        ...savedOperation.logic,
        operator,
      },
    };

    updateOperation(operationId, newOperation);
  };

  const getOperationTitle = (operation: Operation): string => {
    switch (operation.operation) {
      case "publish":
        return "Publish entry";
      case "unpublish":
        return "Unpublish entry";
      case "archive":
        return "Archive entry";
      case "delete":
        return "Delete entry";
      case "field_set":
        return "Set field value";
      case "field_clear":
        return "Clear field value";
      case "field_replace":
        return "Replace field value";
      default:
        return "Unknown operation";
    }
  };

  const getOperationDescription = (operation: Operation): string => {
    switch (operation.operation) {
      case "publish":
        return "Entry will be published";
      case "unpublish":
        return "Entry will be unpublished";
      case "archive":
        return "Entry will be archived";
      case "delete":
        return "Entry will be deleted";
      case "field_set":
        return "Entry field value will be set";
      case "field_clear":
        return "Entry will have its field cleared (set to an empty value)";
      case "field_replace":
        return "Entry field value will be (partially or fully) replaced";
      default:
        return "Unknown operation";
    }
  };

  return (
    <section className="mt-12">
      <Typography>
        <Heading>2. Define operations on these entries:</Heading>
      </Typography>

      {hasOperations === false ? (
        <Typography>
          <Paragraph className="text-lg">No operations added</Paragraph>
        </Typography>
      ) : (
        <div className="max-w-3xl mb-4">
          <Grid rowGap="spacingM">
            {operations.map((operation) => (
              <GridItem key={operation.id}>
                <Card className="relative">
                  <Typography>
                    <Subheading>{getOperationTitle(operation)}</Subheading>
                    <Paragraph>{getOperationDescription(operation)}</Paragraph>
                  </Typography>

                  {operation.type === "field" &&
                  operation.operation === "field_set" ? (
                    <FieldSetOperation
                      operation={operation}
                      updateOperation={updateOperation}
                      sdk={sdk}
                      contentTypes={contentTypes}
                    />
                  ) : null}

                  {operation.type === "field" &&
                  operation.operation === "field_clear" ? (
                    <FieldClearOperation
                      operation={operation}
                      updateOperation={updateOperation}
                      sdk={sdk}
                      contentTypes={contentTypes}
                    />
                  ) : null}

                  {operation.type === "field" &&
                  operation.operation === "field_replace" ? (
                    <FieldReplaceOperation
                      operation={operation}
                      updateOperation={updateOperation}
                      sdk={sdk}
                      contentTypes={contentTypes}
                    />
                  ) : null}

                  <div className="mt-4 border-0 border-t border-gray-200 border-solid pt-4">
                    {operation.logic === undefined ? (
                      <Paragraph>
                        This operation will apply to all entries
                      </Paragraph>
                    ) : (
                      <>
                        <div className="text-sm">
                          if{" "}
                          <Select
                            value={operation.logic.operator}
                            width="auto"
                            className="inline-block mx-2"
                            onChange={(e) => {
                              changeOperationLogicOperator(
                                operation.id,
                                e.target.value as "and" | "or"
                              );
                            }}
                          >
                            <Option value="and">all</Option>
                            <Option value="or">any</Option>
                          </Select>{" "}
                          of the following is true:
                        </div>
                        <div>
                          {operation.logic.conditions.map((condition) => (
                            <OperationCondition
                              key={condition.id}
                              condition={condition}
                              onChange={(condition) => {
                                updateOperationCondition(
                                  operation.id,
                                  condition
                                );
                              }}
                              onRemove={() => {
                                removeOperationCondition(
                                  operation.id,
                                  condition.id
                                );
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    <Button
                      buttonType="muted"
                      size="small"
                      onClick={() => {
                        addOperationCondition(operation.id, {
                          id: nanoid(),
                          entity: "entry",
                          type: "status.published",
                        });
                      }}
                      className="mt-4"
                    >
                      Add condition
                    </Button>
                  </div>

                  <CardActions className="absolute top-4 right-4">
                    <DropdownList>
                      <DropdownListItem
                        onClick={() => {
                          removeOperation(operation.id);
                        }}
                      >
                        Remove
                      </DropdownListItem>
                    </DropdownList>
                  </CardActions>
                </Card>
              </GridItem>
            ))}
          </Grid>
          {operations.length > 1 ? (
            <Note className="mt-4">
              Operations are ran sequentially. Result of an operation might
              affect execution of subsequent operations.
            </Note>
          ) : null}
        </div>
      )}

      <Dropdown
        isOpen={addNewOperationDropdownOpen}
        onClose={() => {
          setAddNewOperationDropdownOpen(false);
        }}
        toggleElement={
          <Button
            buttonType="positive"
            size="small"
            indicateDropdown
            onClick={() => {
              setAddNewOperationDropdownOpen(true);
            }}
          >
            Add new operation
          </Button>
        }
      >
        <DropdownList>
          <DropdownListItem isTitle>Entries</DropdownListItem>
          <DropdownListItem
            onClick={() => {
              addNewOperation({
                type: "entry",
                id: nanoid(),
                operation: "publish",
              });
              setAddNewOperationDropdownOpen(false);
            }}
          >
            Publish entry
          </DropdownListItem>
          <DropdownListItem
            onClick={() => {
              addNewOperation({
                type: "entry",
                id: nanoid(),
                operation: "unpublish",
              });
              setAddNewOperationDropdownOpen(false);
            }}
          >
            Unpublish entry
          </DropdownListItem>
          <DropdownListItem
            onClick={() => {
              addNewOperation({
                type: "entry",
                id: nanoid(),
                operation: "archive",
              });
              setAddNewOperationDropdownOpen(false);
            }}
          >
            Archive entry
          </DropdownListItem>
          <DropdownListItem
            onClick={() => {
              addNewOperation({
                type: "entry",
                id: nanoid(),
                operation: "delete",
              });
              setAddNewOperationDropdownOpen(false);
            }}
          >
            Delete entry
          </DropdownListItem>
          <DropdownListItem isTitle>Fields</DropdownListItem>
          <DropdownListItem
            onClick={() => {
              addNewOperation({
                type: "field",
                id: nanoid(),
                operation: "field_set",
                field: "",
                contentType: "",
                locale: sdk.locales.default,
              });
              setAddNewOperationDropdownOpen(false);
            }}
          >
            Set field value
          </DropdownListItem>
          <DropdownListItem
            onClick={() => {
              addNewOperation({
                type: "field",
                id: nanoid(),
                operation: "field_clear",
                field: "",
                contentType: "",
                locale: sdk.locales.default,
              });
              setAddNewOperationDropdownOpen(false);
            }}
          >
            Clear field value
          </DropdownListItem>
          <DropdownListItem
            onClick={() => {
              addNewOperation({
                type: "field",
                id: nanoid(),
                operation: "field_replace",
                field: "",
                contentType: "",
                locale: sdk.locales.default,
              });
              setAddNewOperationDropdownOpen(false);
            }}
          >
            Replace field value
          </DropdownListItem>
        </DropdownList>
      </Dropdown>
    </section>
  );
};

export default EntriesOperations;
