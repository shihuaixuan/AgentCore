import type { ModelDetails } from "@/app/api/__generated__/models/modelDetails";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { type FormEvent, useId, useState } from "react";
import { useModelDiscovery } from "./useModelDiscovery";

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
  const [apiKey, setAPIKey] = useState("");
  const [modelID, setModelID] = useState(model?.model ?? "");
  const [error, setError] = useState("");
  const normalizedURL = baseURL.trim().replace(/\/+$/, "");
  const needsKey = !model || model.base_url !== normalizedURL;
  const discovery = useModelDiscovery();
  const busy = saving || discovery.loading;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const key = apiKey.trim();
    setError("");
    try {
      await onSave({
        name: String(form.get("label") ?? "").trim(),
        model: modelID.trim(),
        base_url: normalizedURL,
        ...(key ? { api_key: key } : {}),
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
        id={`${id}-url`}
        type="url"
        label="Base URL"
        placeholder="https://api.example.com/v1"
        value={baseURL}
        onChange={(event) => {
          setBaseURL(event.currentTarget.value);
          discovery.clear();
        }}
        disabled={busy}
        required
        maxLength={500}
      />
      <Input
        size="small"
        id={`${id}-key`}
        type="password"
        label="API Key"
        autoComplete="new-password"
        value={apiKey}
        onChange={(event) => {
          setAPIKey(event.currentTarget.value);
          discovery.clear();
        }}
        disabled={busy}
        required={needsKey}
        maxLength={4096}
        hint={
          needsKey
            ? undefined
            : t("Leave blank to keep the current key.", "留空以保留当前密钥。")
        }
      />
      <Button
        type="button"
        size="small"
        variant="outline"
        disabled={busy || !normalizedURL || !apiKey.trim()}
        onClick={() => discovery.fetchModels(normalizedURL, apiKey.trim())}
      >
        {discovery.loading
          ? t("Fetching models…", "正在获取模型…")
          : t("Fetch models", "获取模型")}
      </Button>
      {discovery.message && (
        <Text
          variant="small"
          tone={discovery.failed ? "error" : "secondary"}
          role={discovery.failed ? "alert" : "status"}
        >
          {discovery.message}
        </Text>
      )}
      {discovery.ids.length > 0 && (
        <Select
          id={`${id}-discovered-model`}
          size="small"
          label={t("Models from your provider", "网关返回的模型")}
          placeholder={t("Select a model", "选择模型")}
          value={discovery.ids.includes(modelID) ? modelID : ""}
          onValueChange={setModelID}
          options={discovery.ids.map((value) => ({ value, label: value }))}
          disabled={busy}
          wrapperClassName="mb-0"
        />
      )}
      <Input
        size="small"
        id={`${id}-model`}
        label={t("Model ID", "模型 ID")}
        hint={t(
          "Choose a listed model or enter its ID manually.",
          "可从列表选择，也可以手动输入模型 ID。",
        )}
        value={modelID}
        onChange={(event) => setModelID(event.currentTarget.value)}
        required
        maxLength={240}
      />
      <Input
        size="small"
        id={`${id}-label`}
        name="label"
        label={t("Display name", "显示名称")}
        defaultValue={model?.name}
        required
        maxLength={120}
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
          disabled={busy}
        >
          {t("Cancel", "取消")}
        </Button>
        <Button type="submit" size="small" disabled={busy}>
          {t("Save model", "保存模型")}
        </Button>
      </div>
    </form>
  );
}
