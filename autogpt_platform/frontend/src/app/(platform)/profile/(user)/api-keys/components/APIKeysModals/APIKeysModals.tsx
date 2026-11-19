"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getScopeDescription } from "@/lib/api-key-scopes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/molecules/Dialog/components/DialogPrimitives";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Label } from "@/components/atoms/Label/Label";
import { BaseInput } from "@/components/atoms/Input/BaseInput";
import { Text } from "@/components/atoms/Text/Text";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Button } from "@/components/atoms/Button/Button";

import { useAPIkeysModals } from "./useAPIkeysModals";
import { APIKeyPermission } from "@/app/api/__generated__/models/aPIKeyPermission";

export const APIKeysModals = () => {
  const { t, locale } = useTranslation();
  const {
    isCreating,
    handleCreateKey,
    handleCopyKey,
    setIsCreateOpen,
    setIsKeyDialogOpen,
    isCreateOpen,
    isKeyDialogOpen,
    keyState,
    setKeyState,
  } = useAPIkeysModals();

  return (
    <div className="mb-4 flex justify-end">
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button variant="compact-primary" size="compact">
            {t("Create Key", "创建密钥")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("Create New API Key", "创建新 API 密钥")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Create a new AutoGPT Platform API key",
                "创建新的 AutoGPT 平台 API 密钥",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("Name", "名称")}</Label>
              <BaseInput
                id="name"
                value={keyState.newKeyName}
                onChange={(e) =>
                  setKeyState((prev) => ({
                    ...prev,
                    newKeyName: e.target.value,
                  }))
                }
                placeholder={t(
                  "My AutoGPT Platform API Key",
                  "我的 AutoGPT 平台 API 密钥",
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">
                {t("Description (Optional)", "描述（可选）")}
              </Label>
              <BaseInput
                id="description"
                value={keyState.newKeyDescription}
                onChange={(e) =>
                  setKeyState((prev) => ({
                    ...prev,
                    newKeyDescription: e.target.value,
                  }))
                }
                placeholder={t("Used for...", "用于…")}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("Permissions", "权限")}</Label>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {Object.values(APIKeyPermission).map((permission) => (
                  <div className="flex items-center space-x-2" key={permission}>
                    <Checkbox
                      id={permission}
                      checked={keyState.selectedPermissions.includes(
                        permission,
                      )}
                      onCheckedChange={(checked: boolean) => {
                        setKeyState((prev) => ({
                          ...prev,
                          selectedPermissions: checked
                            ? [...prev.selectedPermissions, permission]
                            : prev.selectedPermissions.filter(
                                (p) => p !== permission,
                              ),
                        }));
                      }}
                    />
                    <Label htmlFor={permission}>
                      {locale === "zh-CN"
                        ? getScopeDescription(permission, locale)
                        : permission}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="compact-outline"
              size="compact"
              onClick={() => setIsCreateOpen(false)}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              variant="compact-primary"
              size="compact"
              onClick={handleCreateKey}
              disabled={isCreating}
            >
              {t("Create", "创建")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isKeyDialogOpen} onOpenChange={setIsKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(
                "AutoGPT Platform API Key Created",
                "AutoGPT 平台 API 密钥已创建",
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Please copy your AutoGPT API key now. You won't be able to see it again!",
                "请立即复制你的 AutoGPT API 密钥。之后将无法再次查看！",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="ph-no-capture flex flex-1 rounded-md bg-surface-hover p-2">
              <Text variant="body-mono-tight" as="code" tone="inherit">
                {keyState.newApiKey}
              </Text>
            </div>
            <Button
              size="compact-icon"
              variant="compact-outline"
              onClick={handleCopyKey}
            >
              <Icon aria-hidden icon={Copy01Icon} className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="compact-primary"
              size="compact"
              onClick={() => setIsKeyDialogOpen(false)}
            >
              {t("Close", "关闭")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
