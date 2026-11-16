import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import {
  RJSFSchema,
  englishStringTranslator,
  TranslatableString,
} from "@rjsf/utils";
import { useId, useMemo } from "react";
import Form from "./registry";
import { ExtendedFormContextType } from "./types";
import { customValidator } from "./utils/custom-validator";
import { generateUiSchemaForCustomFields } from "./utils/generate-ui-schema";
import { preprocessInputSchema } from "./utils/input-schema-pre-processor";

type FormRendererProps = {
  jsonSchema: RJSFSchema;
  handleChange: (formData: any) => void;
  uiSchema: any;
  initialValues: any;
  formContext: ExtendedFormContextType;
  className?: string;
};

export function FormRenderer({
  jsonSchema,
  handleChange,
  uiSchema,
  initialValues,
  formContext,
  className,
}: FormRendererProps) {
  const { t } = useTranslation();
  const domIdPrefix = `${useId()}-`;
  const preprocessedSchema = useMemo(() => {
    return preprocessInputSchema(jsonSchema);
  }, [jsonSchema]);

  // Merge custom field ui:field settings with existing uiSchema
  const mergedUiSchema = useMemo(() => {
    return generateUiSchemaForCustomFields(preprocessedSchema, uiSchema);
  }, [preprocessedSchema, uiSchema]);

  function translateString(
    stringToTranslate: TranslatableString,
    params?: string[],
  ) {
    const translations: Partial<Record<TranslatableString, string>> = {
      [TranslatableString.ArrayItemTitle]: "项目",
      [TranslatableString.MissingItems]: "缺少项目定义",
      [TranslatableString.EmptyArray]: "暂无项目。使用下方按钮添加。",
      [TranslatableString.YesLabel]: "是",
      [TranslatableString.NoLabel]: "否",
      [TranslatableString.CloseLabel]: "关闭",
      [TranslatableString.ErrorsLabel]: "错误",
      [TranslatableString.AddButton]: "添加",
      [TranslatableString.AddItemButton]: "添加项目",
      [TranslatableString.CopyButton]: "复制",
      [TranslatableString.MoveDownButton]: "下移",
      [TranslatableString.MoveUpButton]: "上移",
      [TranslatableString.RemoveButton]: "移除",
      [TranslatableString.NowLabel]: "现在",
      [TranslatableString.ClearLabel]: "清除",
      [TranslatableString.AriaDateLabel]: "选择日期",
      [TranslatableString.PreviewLabel]: "预览",
      [TranslatableString.DecrementAriaLabel]: "将数值减 1",
      [TranslatableString.IncrementAriaLabel]: "将数值加 1",
      [TranslatableString.OptionalObjectAdd]: "添加可选字段的数据",
      [TranslatableString.OptionalObjectRemove]: "移除可选字段的数据",
      [TranslatableString.OptionalObjectEmptyMsg]: "可选字段暂无数据",
      [TranslatableString.Type]: "类型",
      [TranslatableString.Value]: "值",
      [TranslatableString.OptionPrefix]: "选项 %1",
      [TranslatableString.TitleOptionPrefix]: "%1 选项 %2",
      [TranslatableString.KeyLabel]: "%1 键",
    };
    const text = t(
      stringToTranslate,
      translations[stringToTranslate] ?? stringToTranslate,
    );
    return englishStringTranslator(text as TranslatableString, params);
  }

  return (
    <div className={cn("mt-4", className)} data-tutorial-id="input-handles">
      <Form
        formContext={{ ...formContext, domIdPrefix }}
        idPrefix="agpt"
        idSeparator="_%_"
        schema={preprocessedSchema}
        validator={customValidator}
        translateString={translateString}
        onChange={handleChange}
        uiSchema={mergedUiSchema}
        formData={initialValues}
        liveValidate={false}
      />
    </div>
  );
}
