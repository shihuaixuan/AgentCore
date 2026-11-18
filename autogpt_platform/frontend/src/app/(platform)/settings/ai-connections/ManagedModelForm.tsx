import type { ModelDetails } from "@/app/api/__generated__/models/modelDetails";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { type FormEvent, useId, useState } from "react";

type ModelFormData = {
  name: string;
  model: string;
  base_url: string;
  api_key?: string;
};

interface Props {
  model: ModelDetails | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (data: ModelFormData) => Promise<void>;
}

export function ManagedModelForm({ model, saving, onCancel, onSave }: Props) {
  const { t } = useTranslation();
  const id = useId();
  const [baseURL, setBaseURL] = useState(model?.base_url ?? "");
  const [error, setError] = useState("");
  const needsKey =
    !model || model.base_url !== baseURL.trim().replace(/\/+$/, "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const apiKey = String(form.get("key") ?? "").trim();
    setError("");
    try {
      await onSave({
        name: String(form.get("label") ?? "").trim(),
        model: String(form.get("model") ?? "").trim(),
        base_url: baseURL.trim().replace(/\/+$/, ""),
        ...(apiKey ? { api_key: apiKey } : {}),
      });
    } catch {
      setError(
        t(
          "Could not save. Check the model ID, Base URL and API key.",
          "无法保存，请检查模型 ID、Base URL 和 API Key。",
        ),
      );
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-border-base p-4"
    >
      <Text variant="large-medium">
        {model ? t("Edit model", "编辑模型") : t("Add model", "添加模型")}
      </Text>
      <Input
        size="small"
        id={`${id}-label`}
        name="label"
        label={t("Display name", "显示名称")}
        defaultValue={model?.name}
        required
        maxLength={120}
      />
      <Input
        size="small"
        id={`${id}-model`}
        name="model"
        label={t("Model ID", "模型 ID")}
        defaultValue={model?.model}
        required
        maxLength={240}
      />
      <Input
        size="small"
        id={`${id}-url`}
        type="url"
        label="Base URL"
        placeholder="https://api.example.com/v1"
        value={baseURL}
        onChange={(event) => setBaseURL(event.currentTarget.value)}
        required
        maxLength={500}
      />
      <Input
        size="small"
        id={`${id}-key`}
        name="key"
        type="password"
        label="API Key"
        autoComplete="new-password"
        required={needsKey}
        maxLength={4096}
        hint={
          needsKey
            ? undefined
            : t("Leave blank to keep the current key.", "留空以保留当前密钥。")
        }
      />
      {error && (
        <Text variant="body" tone="error" role="alert">
          {error}
        </Text>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="small"
          variant="ghost"
          onClick={onCancel}
          disabled={saving}
        >
          {t("Cancel", "取消")}
        </Button>
        <Button type="submit" size="small" disabled={saving}>
          {t("Save model", "保存模型")}
        </Button>
      </div>
    </form>
  );
}
