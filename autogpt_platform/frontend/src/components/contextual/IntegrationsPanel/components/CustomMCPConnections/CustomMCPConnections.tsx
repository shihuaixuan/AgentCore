"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
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
import { EndpointFields } from "./EndpointFields";
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
                "Enter the HTTPS server URL supplied by your MCP provider.",
                "请输入 MCP 服务商提供的 HTTPS 服务器地址。",
              )}
            </DialogDescription>
          </DialogHeader>
          <Input
            id="custom-mcp-name"
            label={t("Name", "名称")}
            value={state.form.name}
            onChange={(event) =>
              state.updateFields({ name: event.target.value })
            }
          />
          <Input
            id="custom-mcp-description"
            label={t("Description", "描述")}
            value={state.form.description ?? ""}
            onChange={(event) =>
              state.updateFields({ description: event.target.value })
            }
          />
          <EndpointFields state={state} />
          {state.form.auth_type === "oauth" && state.form.credential_id && (
            <Button
              variant="secondary"
              onClick={() => state.updateFields({ credential_id: null })}
            >
              {t("Reconnect", "重新授权")}
            </Button>
          )}
          <label className="flex items-center gap-2">
            <Switch
              checked={state.form.enabled ?? true}
              onCheckedChange={(enabled) => state.updateFields({ enabled })}
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
            disabled={!state.canSave}
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
                "Workflows using this connection will stop working. You can remove the saved credential separately in My connections.",
                "使用此连接的工作流将无法运行。保存的凭据可在「我的连接」中单独移除。",
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
