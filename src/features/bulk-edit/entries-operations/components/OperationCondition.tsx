import {
  Select,
  Option,
  IconButton,
} from "@contentful/forma-36-react-components";
import {
  Condition,
  EntryCondition,
  entryConditionSchema,
  FieldCondition,
  fieldConditionSchema,
} from "../schemas";

const OperationConditionWrapper: React.FC = (props) => {
  return (
    <div className="mt-4 flex flex-wrap items-center">{props.children}</div>
  );
};

interface OperationConditionProps {
  condition: Condition;
  onChange: (condition: Condition) => void;
  onRemove: () => void;
}

const OperationCondition: React.FC<OperationConditionProps> = (props) => {
  const { condition, onChange, onRemove } = props;

  const entryCondition = entryConditionSchema.safeParse(condition);

  if (entryCondition.success === true) {
    return (
      <OperationConditionWrapper>
        <Select
          width="auto"
          className="inline-block mr-2"
          value={condition.entity}
          onChange={(e) => {
            if (e.target.value === "entry") {
              onChange({
                ...entryCondition.data,
                entity: "entry",
              });
            } else {
              onChange({
                id: entryCondition.data.id,
                type: "value.is",
                entity: "field",
                field: "",
                value: "",
              });
            }
          }}
        >
          <Option value="entry">Entry</Option>
          {/* <Option value="field">Field</Option> */}
        </Select>{" "}
        is{" "}
        <Select
          width="auto"
          className="inline-block mx-2"
          value={condition.type}
          onChange={(e) => {
            onChange({
              ...entryCondition.data,
              type: e.target.value as EntryCondition["type"],
            });
          }}
        >
          <Option value="status.published">published</Option>
          <Option value="status.unpublished">unpublished</Option>
          <Option value="status.archived">archived</Option>
        </Select>
        <IconButton
          iconProps={{
            icon: "Close",
          }}
          buttonType="negative"
          onClick={() => {
            onRemove();
          }}
        />
      </OperationConditionWrapper>
    );
  }

  const fieldCondition = fieldConditionSchema.safeParse(condition);

  if (fieldCondition.success === true) {
    return (
      <OperationConditionWrapper>
        <Select
          width="auto"
          className="inline-block mr-2"
          value={condition.entity}
          onChange={(e) => {
            if (e.target.value === "entry") {
              onChange({
                id: fieldCondition.data.id,
                type: "status.published",
                entity: "entry",
              });
            } else {
              onChange({
                ...fieldCondition.data,
                entity: "field",
              });
            }
          }}
        >
          <Option value="entry">Entry</Option>
          <Option value="field">Field</Option>
        </Select>
        <Select
          width="auto"
          className="inline-block mx-2"
          value={condition.type}
          onChange={(e) => {
            onChange({
              ...fieldCondition.data,
              type: e.target.value as FieldCondition["type"],
            });
          }}
        >
          <Option value="value.is">is equal to</Option>
        </Select>
        <IconButton
          iconProps={{
            icon: "Close",
          }}
          buttonType="negative"
          onClick={() => {
            onRemove();
          }}
        />
      </OperationConditionWrapper>
    );
  }

  return <p className="text-sm">Unknown condition</p>;
};

export default OperationCondition;
