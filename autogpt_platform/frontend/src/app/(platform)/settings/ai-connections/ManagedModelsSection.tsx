import {
  getGetV2ListManagedChatModelsQueryKey,
  getGetV2ListManagedModelSettingsQueryKey,
  useGetV2ListManagedModelSettings,
  usePatchV2UpdateManagedChatModel,
  usePostV2CreateManagedChatModel,
} from "@/app/api/__generated__/endpoints/chat/chat";
import type { ModelDetails } from "@/app/api/__generated__/models/modelDetails";
import { Button } from "@/components/atoms/Button/Button";
import { Switch } from "@/components/atoms/Switch/Switch";
import { Text } from "@/components/atoms/Text/Text";
import { useAuthStore } from "@/lib/auth/hooks/useAuthStore";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useManagedChatModels } from "../../copilot/useManagedChatModels";
import { ManagedModelForm } from "./ManagedModelForm";

export function ManagedModelsSection() {
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  return isAdmin ? <ManagedModelsAdmin /> : <AvailableModels />;
}

function AvailableModels() {
  const { t } = useTranslation();
  const { models, isPending, isError } = useManagedChatModels();
  const empty = isPending
    ? t("Loading models…", "正在加载模型…")
    : isError
      ? t("Could not load models.", "无法加载模型。")
      : t("No models are open for chat.", "暂无向聊天开放的模型。");
  return (
    <section className="mx-4 max-w-2xl">
      <Text variant="body" tone="secondary">
        {t(
          "Models your administrator has made available in chat.",
          "管理员已开放的模型会在聊天框中显示。",
        )}
      </Text>
      {models.length ? (
        <ul className="mt-3 divide-y divide-border-base">
          {models.map((model) => (
            <li key={model.id} className="py-3">
              <Text variant="body">{model.name}</Text>
            </li>
          ))}
        </ul>
      ) : (
        <Text variant="body" className="mt-3" role="status">
          {empty}
        </Text>
      )}
    </section>
  );
}

function ManagedModelsAdmin() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const settings = useGetV2ListManagedModelSettings();
  const create = usePostV2CreateManagedChatModel();
  const update = usePatchV2UpdateManagedChatModel();
  const [editing, setEditing] = useState<ModelDetails | "new" | null>(null);
  const [error, setError] = useState("");
  const saving = create.isPending || update.isPending;
  const models = settings.data?.status === 200 ? settings.data.data : [];

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getGetV2ListManagedModelSettingsQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetV2ListManagedChatModelsQueryKey(),
      }),
    ]);
  }

  async function toggle(model: ModelDetails, enabled: boolean) {
    setError("");
    try {
      await update.mutateAsync({ modelId: model.id, data: { enabled } });
      await refresh();
    } catch {
      setError(
        t("Could not change access. Try again.", "无法更改开放状态，请重试。"),
      );
    }
  }

  return (
    <section className="mx-4 max-w-2xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Text variant="body" tone="secondary" className="max-w-md">
          {t(
            "Add an OpenAI-compatible model, then open it for chat. API keys stay on the server.",
            "添加 OpenAI 兼容模型后，可选择向聊天开放。API Key 只保存在服务端。",
          )}
        </Text>
        {editing === null && (
          <Button type="button" size="small" onClick={() => setEditing("new")}>
            {t("Add model", "添加模型")}
          </Button>
        )}
      </div>
      {editing && (
        <ManagedModelForm
          key={editing === "new" ? "new" : editing.id}
          model={editing === "new" ? null : editing}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={async (data) => {
            if (editing === "new") {
              await create.mutateAsync({
                data: { ...data, api_key: data.api_key ?? "" },
              });
            } else {
              const { base_url, ...changes } = data;
              await update.mutateAsync({
                modelId: editing.id,
                data: {
                  ...changes,
                  ...(base_url !== editing.base_url ? { base_url } : {}),
                },
              });
            }
            setEditing(null);
            await refresh();
          }}
        />
      )}
      {error && (
        <Text role="alert" variant="body" tone="error">
          {error}
        </Text>
      )}
      {settings.isPending && (
        <Text variant="body" role="status">
          {t("Loading models…", "正在加载模型…")}
        </Text>
      )}
      {settings.isError && (
        <Text variant="body" role="alert">
          {t("Could not load models.", "无法加载模型。")}
        </Text>
      )}
      {!settings.isPending && !settings.isError && models.length === 0 && (
        <Text variant="body" tone="secondary">
          {t("No models configured yet.", "尚未配置模型。")}
        </Text>
      )}
      <ul className="divide-y divide-border-base">
        {models.map((model) => (
          <li
            key={model.id}
            className="flex flex-wrap items-center justify-between gap-3 py-4"
          >
            <div className="min-w-0 flex-1">
              <Text variant="body" weight="medium" className="break-words">
                {model.name}
              </Text>
              <Text variant="small" tone="secondary" className="break-all">
                {model.model}
              </Text>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                size="small"
                variant="ghost"
                onClick={() => setEditing(model)}
                disabled={saving}
              >
                {t("Edit", "编辑")}
              </Button>
              <label className="flex items-center gap-2">
                <Text variant="small">
                  {model.enabled
                    ? t("Open for chat", "已开放")
                    : t("Closed", "未开放")}
                </Text>
                <Switch
                  aria-label={t(
                    `Open ${model.name} for chat`,
                    `向聊天开放 ${model.name}`,
                  )}
                  checked={model.enabled}
                  onCheckedChange={(enabled) => void toggle(model, enabled)}
                  disabled={saving}
                />
              </label>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
