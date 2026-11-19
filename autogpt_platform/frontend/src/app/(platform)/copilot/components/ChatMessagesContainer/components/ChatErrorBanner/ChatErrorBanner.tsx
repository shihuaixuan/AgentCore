import { Button } from "@/components/atoms/Button/Button";
import { useIsBillingEnabled } from "@/hooks/useIsBillingEnabled";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import {
  describeChatError,
  type ChatErrorAction,
} from "../../../../chatErrorGuidance";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  error: Error;
}

export function ChatErrorBanner({ error }: Props) {
  const { t, locale } = useTranslation();
  const guidance = describeChatError(error, locale);
  const isBillingEnabled = useIsBillingEnabled();
  // Without billing (most self-hosted installs) there are no plans to pick
  // and /settings/billing is a 404, so point at whoever runs the server.
  const noPlans = guidance.action === "plans" && !isBillingEnabled;
  const { title } = guidance;
  const action = noPlans ? null : guidance.action;
  const note = noPlans
    ? t(
        "Ask whoever runs this server to set one up.",
        "请联系服务器管理员设置套餐。",
      )
    : guidance.note;
  return (
    <div
      data-testid="chat-error-banner"
      className="rounded-lg bg-error-surface p-4 text-body text-error-foreground"
    >
      <details>
        <summary className="cursor-pointer font-medium">{title}</summary>
        <pre className="mt-2 max-h-40 overflow-auto text-caption break-words whitespace-pre-wrap text-error-foreground">
          {error.message}
        </pre>
      </details>
      {note ? (
        <Text variant="small-tight" tone="muted" className="mt-1">
          {note}
        </Text>
      ) : null}
      {action ? (
        <Button
          as="NextLink"
          href={hrefFor(action)}
          variant="secondary"
          size="small"
          className="mt-3"
        >
          {action === "sign-in"
            ? t("Sign in", "登录")
            : action === "new-chat"
              ? t("Start a new chat", "开始新对话")
              : t("See plans", "查看套餐")}
        </Button>
      ) : null}
    </div>
  );
}

function hrefFor(action: ChatErrorAction) {
  if (action === "new-chat") return "/copilot";
  if (action === "plans") return "/settings/billing";
  const here =
    typeof window === "undefined"
      ? "/copilot"
      : `${window.location.pathname}${window.location.search}`;
  return `/login?next=${encodeURIComponent(here)}`;
}
