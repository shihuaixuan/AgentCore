import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useBlockMenuStore } from "@/app/(platform)/build/stores/blockMenuStore";
import { useShallow } from "zustand/react/shallow";
import { FilterChip } from "../FilterChip";
import { categories } from "./constants";
import { FilterSheet } from "../FilterSheet/FilterSheet";
import { CategoryKey } from "./types";

export const BlockMenuFilters = () => {
  const { t } = useTranslation();
  const categoryLabels: Record<CategoryKey, string> = {
    blocks: "模块",
    integrations: "集成",
    marketplace_agents: "市场工作流",
    my_agents: "我的工作流",
  };
  const localizedCategories = categories.map((category) => ({
    ...category,
    name: t(category.name, categoryLabels[category.key]),
  }));
  const {
    filters,
    addFilter,
    removeFilter,
    categoryCounts,
    creators,
    addCreator,
    removeCreator,
  } = useBlockMenuStore(
    useShallow((state) => ({
      filters: state.filters,
      addFilter: state.addFilter,
      removeFilter: state.removeFilter,
      categoryCounts: state.categoryCounts,
      creators: state.creators,
      addCreator: state.addCreator,
      removeCreator: state.removeCreator,
    })),
  );

  const handleFilterClick = (filter: CategoryKey) => {
    if (filters.includes(filter)) {
      removeFilter(filter);
    } else {
      addFilter(filter);
    }
  };

  const handleCreatorClick = (creator: string) => {
    if (creators.includes(creator)) {
      removeCreator(creator);
    } else {
      addCreator(creator);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <FilterSheet categories={localizedCategories} />
      {creators.length > 0 &&
        creators.map((creator) => (
          <FilterChip
            key={creator}
            name={t(
              `Created by ${creator.slice(0, 10)}...`,
              `创建者：${creator.slice(0, 10)}…`,
            )}
            selected={creators.includes(creator)}
            onClick={() => handleCreatorClick(creator)}
          />
        ))}
      {localizedCategories.map((category) => (
        <FilterChip
          key={category.key}
          name={category.name}
          selected={filters.includes(category.key)}
          onClick={() => handleFilterClick(category.key)}
          number={categoryCounts[category.key] ?? 0}
        />
      ))}
    </div>
  );
};
