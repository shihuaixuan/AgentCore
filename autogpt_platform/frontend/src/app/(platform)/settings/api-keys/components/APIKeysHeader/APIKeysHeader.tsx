"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Link } from "@/components/atoms/Link/Link";
import { Text } from "@/components/atoms/Text/Text";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

const API_DOCS_URL =
  "https://agpt.co/docs/platform/api-and-integrations/api-guide";

interface Props {
  onCreate: () => void;
}

export function APIKeysHeader({ onCreate }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start gap-4 pb-6 pl-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col">
        <Text variant="h4" as="h1">
          {t("AutoGPT API Keys", "AutoGPT API 密钥")}
        </Text>
        <Text variant="body" tone="body" className="mt-4 max-w-[600px]">
          {t(
            "Manage API keys that let external tools access your AutoGPT account. See the",
            "管理允许外部工具访问 AutoGPT 账户的 API 密钥。请参阅",
          )}{" "}
          <Link href={API_DOCS_URL} isExternal variant="secondary">
            {t("API docs", "API 文档")}
          </Link>{" "}
          {t("to get started.", "以开始使用。")}
        </Text>
      </div>

      <Button
        variant="primary"
        size="small"
        leftIcon={<Icon icon={PlusSignIcon} size={16} />}
        onClick={onCreate}
        className="sm:hidden"
      >
        {t("Create Key", "创建密钥")}
      </Button>
      <Button
        variant="primary"
        size="large"
        leftIcon={<Icon icon={PlusSignIcon} size={20} />}
        onClick={onCreate}
        className="hidden sm:inline-flex"
      >
        {t("Create Key", "创建密钥")}
      </Button>
    </div>
  );
}
