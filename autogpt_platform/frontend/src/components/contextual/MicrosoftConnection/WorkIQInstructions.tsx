"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  WORK_IQ_APP_ID,
  WORK_IQ_PERMISSIONS_URL,
  WORK_IQ_SETUP_URL,
} from "@/lib/microsoft-setup";

export function WorkIQInstructions() {
  const { t } = useTranslation();
  return (
    <ol className="list-decimal space-y-3 pl-5 text-body">
      <li>
        <a
          href={WORK_IQ_SETUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {t("Enable Work IQ for your organization", "为组织启用 Work IQ")}
        </a>
        {t(
          ". This creates Microsoft's Work IQ service in your tenant.",
          "。这会在您的租户中创建 Microsoft 的 Work IQ 服务。",
        )}
        <pre className="mt-2 overflow-x-auto rounded bg-surface-hover p-2 text-caption">
          {`az ad sp create --id ${WORK_IQ_APP_ID}`}
        </pre>
      </li>
      <li>
        {t("Review the ", "查看")}
        <a
          href={WORK_IQ_PERMISSIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {t("Work IQ permission", "Work IQ 权限")}
        </a>
        {t(
          ". Only an admin can approve it: connect Microsoft in AutoGPT, then approve Work IQ for your organization from that connection. Company policies may also require approval for mail, calendar, files, or Teams.",
          "。仅管理员可以批准：请在 AutoGPT 中连接 Microsoft，然后通过该连接为组织批准 Work IQ。公司策略可能还要求批准邮件、日历、文件或 Teams 权限。",
        )}
      </li>
      <li>
        {t(
          "Confirm a Copilot Studio usage-based billing plan is configured and the intended user is assigned. Work IQ usage can incur charges.",
          "确认已配置 Copilot Studio 按使用量计费的套餐，并已分配给目标用户。使用 Work IQ 可能产生费用。",
        )}
      </li>
      <li>
        {t(
          "Return here, sign in with the intended account, and verify access. Individual actions still follow your organization's policies.",
          "返回此处，使用目标账户登录并验证访问权限。各项操作仍受组织策略约束。",
        )}
      </li>
    </ol>
  );
}
