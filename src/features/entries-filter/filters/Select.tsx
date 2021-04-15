import {
  Card,
  Select,
  Option,
  CardActions,
  DropdownList,
  DropdownListItem,
  SectionHeading,
} from "@contentful/forma-36-react-components";
import React, { useCallback } from "react";
import { useEntity } from "simpler-state";
import {
  activeFilters,
  markFiltersFormAsDirty,
  removeFilter,
  updateFilter,
} from "../filters";
import { SelectFilter as SelectFilterProps } from "../schemas";
import debounce from "lodash/debounce";

const SelectFilter: React.FC<SelectFilterProps> = (props) => {
  const { id, label, value, choices, onChange } = props;

  const filters = useEntity(activeFilters);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onValueChange = useCallback(
    debounce(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newFilter = {
          ...props,
          value: (event.target as HTMLSelectElement).value,
        };

        if (typeof onChange === "function") {
          onChange(newFilter, filters);
        }

        updateFilter(id, newFilter);
        markFiltersFormAsDirty();
      },
      300,
      { leading: true, trailing: true, maxWait: 1500 }
    ),
    [filters, props, onChange]
  );

  return (
    <Card className="relative">
      <SectionHeading>{label}</SectionHeading>
      <Select
        name={id}
        id={id}
        value={value}
        onChange={onValueChange}
        className="mt-2"
      >
        <Option value="">Any</Option>
        {Array.from(choices).map((choice) => (
          <Option key={choice.value} value={choice.value}>
            {choice.label}
          </Option>
        ))}
      </Select>
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

export default SelectFilter;
