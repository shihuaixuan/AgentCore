import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import React from "react";
import { BaseInput } from "@/components/atoms/Input/BaseInput";
import { Button } from "@/components/atoms/Button/Button";
import { useGraphMenuSearchBarComponent } from "./useGraphMenuSearchBarComponent";
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface GraphMenuSearchBarProps {
  className?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const GraphMenuSearchBar: React.FC<GraphMenuSearchBarProps> = ({
  className = "",
  searchQuery,
  onSearchChange,
  onKeyDown,
}) => {
  const { t } = useTranslation();
  const { inputRef, handleClear } = useGraphMenuSearchBarComponent({
    onSearchChange,
  });

  return (
    <div
      className={cn(
        "flex min-h-[3.5625rem] items-center gap-2.5 px-4",
        className,
      )}
    >
      <div className="flex h-6 w-6 items-center justify-center">
        <Icon
          icon={Search01Icon}
          tone="body"
          className="h-6 w-6"
          strokeWidth={2}
        />
      </div>
      <BaseInput
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t(
          "Search this workflow for blocks, inputs, outputs...",
          "搜索此工作流中的模块、输入和输出…",
        )}
        className={cn(
          "m-0 border-none p-0 font-sans text-body-lg leading-6 font-normal text-foreground-emphasis shadow-none outline-none",
          "placeholder:text-foreground-subtle focus:shadow-none focus:ring-0 focus:outline-none",
        )}
        autoFocus
      />
      {searchQuery.length > 0 && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t("Clear search", "清除搜索")}
          withTooltip={false}
          onClick={handleClear}
        >
          <Icon
            icon={Cancel01Icon}
            tone="body"
            className="h-6 w-6"
            strokeWidth={2}
          />
        </Button>
      )}
    </div>
  );
};
