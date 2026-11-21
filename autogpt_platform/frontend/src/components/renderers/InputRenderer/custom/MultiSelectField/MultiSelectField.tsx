import { useTranslation } from "@/lib/i18n/LanguageProvider";
import React from "react";
import { FieldProps, getUiOptions } from "@rjsf/utils";
import { BlockIOObjectSubSchema } from "@/lib/autogpt-server-api/types";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@/components/molecules/MultiSelect/MultiSelect";
import { cn } from "@/lib/utils";
import { useMultiSelectField } from "./useMultiSelectField";
import { distinctOptionLabels } from "../../utils/option-labels";

export const MultiSelectField = (props: FieldProps) => {
  const { t } = useTranslation();
  const { schema, formData, onChange, fieldPathId } = props;
  const uiOptions = getUiOptions(props.uiSchema);

  const { optionSchema, options, selection, createChangeHandler } =
    useMultiSelectField({
      schema: schema as BlockIOObjectSubSchema,
      formData,
    });

  const handleValuesChange = createChangeHandler(onChange, fieldPathId);

  const displayName = schema.title;
  const isBuilderNode = props.registry.formContext.isBuilderNode;
  const items = distinctOptionLabels(
    options.map((key) => ({
      value: key,
      label: optionSchema[key].title || key,
    })),
  );
  const labels = new Map(items.map(({ value, label }) => [value, label]));
  const keys = new Map(items.map(({ value, label }) => [label, value]));

  return (
    <div className={cn("flex flex-col", uiOptions.className)}>
      <MultiSelector
        className="nodrag"
        values={
          isBuilderNode
            ? selection.map((key) => labels.get(key) ?? key)
            : selection
        }
        onValuesChange={
          isBuilderNode
            ? (selected) =>
                handleValuesChange(
                  selected.map((label) => keys.get(label) ?? label),
                )
            : handleValuesChange
        }
      >
        <MultiSelectorTrigger className="rounded-3xl border border-border-base bg-surface px-2 shadow-none">
          <MultiSelectorInput
            placeholder={
              (schema as any).placeholder ??
              (displayName
                ? t(`Select ${displayName}...`, `选择${displayName}…`)
                : t("Select options...", "选择选项…"))
            }
          />
        </MultiSelectorTrigger>
        <MultiSelectorContent className="nowheel">
          <MultiSelectorList>
            {items.map(({ value, label }) => (
              <MultiSelectorItem
                key={value}
                value={isBuilderNode ? label : value}
                title={optionSchema[value].description}
              >
                {isBuilderNode ? label : (optionSchema[value].title ?? value)}
              </MultiSelectorItem>
            ))}
          </MultiSelectorList>
        </MultiSelectorContent>
      </MultiSelector>
    </div>
  );
};
