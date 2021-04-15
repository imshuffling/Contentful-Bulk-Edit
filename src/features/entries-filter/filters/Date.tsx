import {
  Card,
  Select,
  Option,
  CardActions,
  DropdownList,
  DropdownListItem,
  TextInput,
  SectionHeading,
} from "@contentful/forma-36-react-components";
import debounce from "lodash/debounce";
import { useCallback } from "react";
import { markFiltersFormAsDirty, removeFilter, updateFilter } from "../filters";
import { DateFilter as DateFilterProps } from "../schemas";

const DateFilter: React.FC<DateFilterProps> = (props) => {
  const { id, label, value, comparison } = props;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onValueChange = useCallback(
    debounce(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        updateFilter(id, {
          ...props,
          comparison: event.target.value as DateFilterProps["comparison"],
        });
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
        name={`${id}-comparison`}
        id={`${id}-comparison`}
        value={comparison}
        onChange={onValueChange}
        className="mt-2"
      >
        <Option value="is">Is</Option>
        <Option value="is_after">Is after</Option>
        <Option value="is_on_or_after">Is on or after</Option>
        <Option value="is_before">Is before</Option>
        <Option value="is_on_or_before">Is on or before</Option>
      </Select>
      <TextInput
        type="date"
        name={id}
        id={id}
        value={value}
        onChange={(event) => {
          updateFilter(id, {
            ...props,
            value: event.target.value,
          });
          markFiltersFormAsDirty();
        }}
        className="mt-2"
      />
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

export default DateFilter;
