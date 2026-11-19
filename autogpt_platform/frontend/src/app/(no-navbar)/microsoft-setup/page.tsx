"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { MicrosoftCapabilityService } from "@/app/api/__generated__/models/microsoftCapabilityService";
import { Link } from "@/components/atoms/Link/Link";
import { Text } from "@/components/atoms/Text/Text";
import { WorkIQInstructions } from "@/components/contextual/MicrosoftConnection/WorkIQInstructions";
import { getMicrosoftServicePurpose } from "@/lib/microsoft-setup";

const SERVICES: Array<{ service: MicrosoftCapabilityService; name: string }> = [
  { service: "mail", name: "Mail" },
  { service: "calendar", name: "Calendar" },
  { service: "files", name: "Files" },
  { service: "teams", name: "Teams chats" },
  { service: "copilot", name: "Microsoft 365 Copilot" },
  { service: "work_iq", name: "Work IQ" },
];

const ADMIN_CONSENT_GUIDE_URL =
  "https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/grant-admin-consent";

const SERVICE_NAMES: Record<MicrosoftCapabilityService, string> = {
  mail: "邮件",
  calendar: "日历",
  files: "文件",
  teams: "Teams 聊天",
  copilot: "Microsoft 365 Copilot",
  work_iq: "Work IQ",
};

export default function MicrosoftSetupPage() {
  const { t, locale } = useTranslation();
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <Text variant="h2" as="h1">
        {t(
          "Set up Microsoft 365 for your organization",
          "为你的组织设置 Microsoft 365",
        )}
      </Text>
      <section className="flex flex-col gap-3">
        <Text variant="h4" as="h2">
          {t("What AutoGPT asks for", "AutoGPT 请求的权限")}
        </Text>
        <Text variant="body">
          {t(
            "Each person connects their own Microsoft account, and each service asks Microsoft for its own permissions.",
            "每个人连接自己的 Microsoft 账户，各项服务分别向 Microsoft 请求所需权限。",
          )}
        </Text>
        <ul className="flex flex-col gap-2">
          {SERVICES.map(({ service, name }) => (
            <li key={service} className="flex flex-col">
              <Text variant="body-medium">
                {t(name, SERVICE_NAMES[service])}
              </Text>
              <Text variant="small" tone="muted">
                {getMicrosoftServicePurpose(service, locale)}
              </Text>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <Text variant="h4" as="h2">
          {t("Approve AutoGPT once", "一次性批准 AutoGPT")}
        </Text>
        <Text variant="body">
          {t(
            "People can usually approve mail, calendar and files themselves. Teams chats and Microsoft 365 Copilot usually need a Microsoft admin, and Work IQ always does.",
            "用户通常可以自行批准邮件、日历和文件权限。Teams 聊天和 Microsoft 365 Copilot 通常需要 Microsoft 管理员批准，Work IQ 则始终需要。",
          )}
        </Text>
        <ol className="list-decimal space-y-2 pl-5">
          <Text as="li" variant="body">
            {t(
              "Sign in to AutoGPT with your work account.",
              "使用工作账户登录 AutoGPT。",
            )}
          </Text>
          <Text as="li" variant="body">
            <Link href="/settings/ai-connections" variant="secondary">
              {t(
                "Open Settings → AI connections and connect Microsoft.",
                "打开设置 → AI 连接，并连接 Microsoft。",
              )}
            </Link>
          </Text>
          <Text as="li" variant="body">
            {t(
              "If Settings offers “Approve for my whole organization”, choose it and accept Microsoft’s permissions screen. If it doesn’t, this AutoGPT server connects Microsoft with sign-in codes: grant AutoGPT tenant-wide admin consent by following Microsoft’s guide.",
              "如果设置中提供“为整个组织批准”，请选择该项并在 Microsoft 权限页面确认。如果未提供，则此服务器使用登录代码连接 Microsoft；请按照 Microsoft 指南，为 AutoGPT 授予整个租户的管理员同意权限。",
            )}{" "}
            <Link href={ADMIN_CONSENT_GUIDE_URL} isExternal variant="secondary">
              {t("Microsoft's guide", "Microsoft 指南")}
            </Link>
            .
          </Text>
        </ol>
        <Text variant="body">
          {t(
            "After that, people in your organization can connect without waiting for an admin.",
            "完成后，组织成员即可连接，无需等待管理员批准。",
          )}
        </Text>
      </section>
      <section className="flex flex-col gap-3">
        <Text variant="h4" as="h2">
          {t("Work IQ (optional)", "Work IQ（可选）")}
        </Text>
        <WorkIQInstructions />
      </section>
      <Link href="/settings/ai-connections" variant="secondary">
        {t("Return to connections", "返回连接设置")}
      </Link>
    </main>
  );
}
