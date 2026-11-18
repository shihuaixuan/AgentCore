import { Select } from "@/components/atoms/Select/Select";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useId } from "react";
import { useManagedChatModels } from "../../../useManagedChatModels";

export function ManagedModelPicker({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation();
  const id = useId();
  const { models, modelID, selectModel, isPending, isError } =
    useManagedChatModels();
  const empty = isPending
    ? t("Loading models…", "正在加载模型…")
    : isError
      ? t("Could not load models", "无法加载模型")
      : t("No models are open for chat", "暂无开放模型");
  return (
    <Select
      id={id}
      label={t("Model", "模型")}
      hideLabel
      size="small"
      placeholder={empty}
      wrapperClassName="w-44 min-w-0 shrink"
      disabled={disabled || !models.length}
      value={modelID ?? ""}
      onValueChange={selectModel}
      options={models.map(({ id: value, name: label }) => ({ value, label }))}
    />
  );
}
