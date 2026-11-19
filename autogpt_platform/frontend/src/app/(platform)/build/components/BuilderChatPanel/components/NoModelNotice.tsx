import { SELF_HOSTED_MODELS_DOCS_URL } from "@/app/(platform)/copilot/helpers/reportedSendError";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

// The builder chat runs only on this server's own model, so unlike the main
// chat's notice this one has no ChatGPT-plan route to offer.
export function NoModelNotice() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-6">
      <div className="w-full rounded-2xl bg-warning-surface px-3 py-2">
        <Text
          variant="body-tight"
          tone="warning"
          as="div"
          role="status"
          aria-label={t("No AI connection", "未连接 AI 模型")}
          className="flex items-start gap-2 text-left"
        >
          <Icon
            icon={Alert02Icon}
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            {t(
              "No AI model is connected, so the builder chat can't answer yet. Whoever runs this server can add a model API key or a local model",
              "尚未连接 AI 模型，构建助手暂时无法回答。服务器管理员可以添加模型 API 密钥或本地模型",
            )}{" "}
            <a
              href={SELF_HOSTED_MODELS_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              <Text variant="body-medium-tight" as="span" tone="inherit">
                {t("(setup guide)", "（配置指南）")}
              </Text>
            </a>
            .
          </span>
        </Text>
      </div>
    </div>
  );
}
