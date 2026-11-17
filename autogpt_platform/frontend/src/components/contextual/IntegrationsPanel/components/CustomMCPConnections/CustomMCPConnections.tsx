"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import { Switch } from "@/components/atoms/Switch/Switch";
import { Text } from "@/components/atoms/Text/Text";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/molecules/Dialog/components/DialogPrimitives";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { ConnectionInput } from "@/app/api/__generated__/models/connectionInput";
import { useCustomMCPConnections } from "./useCustomMCPConnections";

interface Props {
  state: ReturnType<typeof useCustomMCPConnections>;
}

export function CustomMCPConnections({ state }: Props) {
  const { t } = useTranslation();
  const { pendingRemove, setPendingRemove } = state;
  return (
    <>
      <Dialog open={state.open} onOpenChange={state.setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("Custom MCP connection", "自定义 MCP 连接")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Use the HTTPS address that serves MCP tools. Services with separate OAuth and tool addresses are not supported here.",
                "请输入提供 MCP 工具的 HTTPS 地址。此处暂不支持授权地址与工具地址分离的服务。",
              )}
            </DialogDescription>
          </DialogHeader>
          <Input
            id="custom-mcp-name"
            label={t("Name", "名称")}
            value={state.form.name}
            onChange={(event) =>
              state.setForm({ ...state.form, name: event.target.value })
            }
          />
          <Input
            id="custom-mcp-description"
            label={t("Description", "描述")}
            value={state.form.description ?? ""}
            onChange={(event) =>
              state.setForm({ ...state.form, description: event.target.value })
            }
          />
          <Input
            id="custom-mcp-url"
            label={t("Server URL", "服务器地址")}
            type="url"
            value={state.form.server_url}
            onChange={(event) =>
              state.setForm({
                ...state.form,
                server_url: event.target.value,
                credential_id: null,
              })
            }
          />
          <Select
            id="custom-mcp-auth"
            label={t("Authentication", "身份验证")}
            value={state.form.auth_type}
            onValueChange={(value) =>
              state.setForm({
                ...state.form,
                auth_type: value as ConnectionInput["auth_type"],
                credential_id: null,
              })
            }
            options={[
              { value: "none", label: t("None", "无需认证") },
              { value: "oauth", label: "OAuth" },
              { value: "bearer", label: "Bearer" },
              { value: "basic", label: "Basic" },
            ]}
          />
          {(state.form.auth_type === "basic" ||
            state.form.auth_type === "bearer") && (
            <Input
              id="custom-mcp-token"
              label={t("Credential", "凭据")}
              type="password"
              value={state.token}
              onChange={(event) => state.setToken(event.target.value)}
            />
          )}
          {state.form.auth_type === "oauth" && state.form.credential_id && (
            <Button
              variant="secondary"
              onClick={() =>
                state.setForm({ ...state.form, credential_id: null })
              }
            >
              {t("Reconnect", "重新授权")}
            </Button>
          )}
          <label className="flex items-center gap-2">
            <Switch
              checked={state.form.enabled ?? true}
              onCheckedChange={(enabled) =>
                state.setForm({ ...state.form, enabled })
              }
            />{" "}
            {t("Enabled", "启用")}
          </label>
          {state.error && (
            <Text variant="small" role="alert">
              {state.error}
            </Text>
          )}
          <Button
            variant="primary"
            onClick={() => void state.save()}
            loading={state.busy}
          >
            {state.form.enabled === false
              ? t("Save", "保存")
              : t("Test and save", "测试并保存")}
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Remove connection?", "移除连接？")}</DialogTitle>
            <DialogDescription>
              {t(
                "Workflows using this connection will stop working. Its saved credential remains in Integrations and can be removed separately.",
                "使用此连接的工作流将无法运行。保存的凭据仍保留在集成页面，可单独移除。",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPendingRemove(null)}>
              {t("Cancel", "取消")}
            </Button>
            <Button
              variant="primary"
              loading={state.busy}
              onClick={async () => {
                if (pendingRemove) {
                  if (await state.remove(pendingRemove.id))
                    setPendingRemove(null);
                }
              }}
            >
              {t("Remove", "移除")}
            </Button>
          </div>
          {state.error && (
            <Text variant="small" role="alert">
              {state.error}
            </Text>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
