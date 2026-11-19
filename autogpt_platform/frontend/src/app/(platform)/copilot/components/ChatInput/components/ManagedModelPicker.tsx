import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import { useAuthStore } from "@/lib/auth/hooks/useAuthStore";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useManagedChatModels } from "../../../useManagedChatModels";

export function ManagedModelPicker({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation();
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const { models, modelID, selectModel, isPending, isError } =
    useManagedChatModels();
  const status = isPending
    ? t("Loading models…", "正在加载模型…")
    : isError
      ? t("Could not load models", "无法加载模型")
      : t("No models are open for chat", "暂无开放模型");
  const selected = models.find((model) => model.id === modelID);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="compact-ghost"
          size="compact-sm"
          className="max-w-36 sm:max-w-48"
          aria-label={t(
            `Chat model: ${selected?.name ?? status}`,
            `聊天模型：${selected?.name ?? status}`,
          )}
          disabled={disabled || (!isAdmin && !models.length)}
        >
          <Text as="span" variant="small" className="min-w-0 truncate">
            {selected?.name ?? status}
          </Text>
          <Icon icon={ArrowDown01Icon} aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-56">
        <DropdownMenuLabel>{t("Chat models", "聊天模型")}</DropdownMenuLabel>
        {models.length > 0 && (
          <DropdownMenuRadioGroup
            value={modelID ?? ""}
            onValueChange={selectModel}
          >
            {models.map((model) => (
              <DropdownMenuRadioItem key={model.id} value={model.id}>
                <Text as="span" variant="body" className="min-w-0 break-words">
                  {model.name}
                </Text>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        )}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/ai-connections">
                {t("Manage models", "管理模型")}
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
