import { entity } from "simpler-state";
import { Filter } from "./schemas";

export const filtersFormState = entity({
  dirty: false,
});

export const markFiltersFormAsDirty = (): void => {
  filtersFormState.set((state) => ({ ...state, dirty: true }));
};

export const markFiltersFormAsNotDirty = (): void => {
  filtersFormState.set((state) => ({ ...state, dirty: false }));
};

export const activeFilters = entity<Filter[]>([]);

export const addFilter = (filter: Filter): void => {
  activeFilters.set((filters) => [...filters, filter]);
};

export const removeFilter = (filterId: Filter["id"]): void => {
  activeFilters.set((filters) =>
    filters.filter((filter) => filter.id !== filterId)
  );
};

export const updateFilter = (filterId: Filter["id"], filter: Filter): void => {
  activeFilters.set((filters) =>
    filters.map((savedFilter) =>
      savedFilter.id !== filterId ? savedFilter : filter
    )
  );
};
