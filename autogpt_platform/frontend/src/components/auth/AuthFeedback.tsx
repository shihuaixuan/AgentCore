"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { HelpItem } from "@/components/auth/help-item";
import { Card, CardContent } from "@/components/atoms/Card/Card";
import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { BehaveAs } from "@/services/environment";

interface Props {
  type: "login" | "signup";
  message?: string | null;
  isError?: boolean;
  behaveAs?: BehaveAs;
}

export default function AuthFeedback({
  type,
  message = "",
  isError = false,
  behaveAs = BehaveAs.CLOUD,
}: Props) {
  const { t } = useTranslation();
  const displayMessage =
    message ||
    (isError
      ? t("Something went wrong. Please try again.", "出错了，请重试。")
      : "");

  const isCloudMode = behaveAs === BehaveAs.CLOUD;
  const isLocalMode = behaveAs === BehaveAs.LOCAL;
  const showCloudHelp = isError && isCloudMode;
  const showLocalHelp = isError && isLocalMode;
  const isSignupFlow = type === "signup";
  const hasAnyHelpContent = showCloudHelp || showLocalHelp;

  const hasContent = displayMessage || hasAnyHelpContent;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="mt-4 w-full space-y-4">
      {/* Message feedback */}
      {displayMessage && (
        <div className="text-center text-body leading-normal font-medium">
          {isError ? (
            <div className="flex items-center justify-center space-x-2 text-error">
              <Icon aria-hidden icon={AlertCircleIcon} className="h-4 w-4" />
              <span>{displayMessage}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-success">
              <Icon
                aria-hidden
                icon={CheckmarkCircle02Icon}
                className="h-4 w-4"
              />
              <span>{displayMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Cloud-specific help */}
      {showCloudHelp &&
        (isSignupFlow ? (
          <Card
            variant="outlined"
            className="overflow-hidden rounded-lg border border-border-base bg-surface shadow-sm"
          >
            <CardContent className="p-0">
              <div className="divide-y divide-separator">
                <Text
                  variant="body-medium-tight"
                  as="span"
                  tone="error"
                  className="my-3 block text-center"
                >
                  {t(
                    "The provided email may not be allowed to sign up.",
                    "此邮箱可能尚未获得注册权限。",
                  )}
                </Text>
                <HelpItem
                  title={t(
                    "AutoGPT Platform is currently in closed beta. ",
                    "AutoGPT 平台目前处于封闭测试阶段。",
                  )}
                  description={t("You can join ", "你可以加入")}
                  linkText={t("the waitlist here", "候补名单")}
                  href="https://agpt.co/waitlist"
                />
                <HelpItem
                  title={t(
                    "Make sure you use the same email address you used to sign up for the waitlist.",
                    "请确认使用的是申请加入候补名单时的邮箱。",
                  )}
                />
                <HelpItem
                  title={t(
                    "You can self host the platform!",
                    "你也可以自行部署平台！",
                  )}
                  description={t("Visit our", "访问我们的")}
                  linkText={t("GitHub repository", "GitHub 仓库")}
                  href="https://github.com/Significant-Gravitas/AutoGPT"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card
            variant="outlined"
            className="overflow-hidden rounded-lg border border-border-base bg-surface shadow-sm"
          >
            <CardContent className="p-0">
              <div className="divide-y divide-separator">
                <HelpItem
                  title={t("Having trouble logging in?", "登录遇到问题？")}
                  description={t("Make sure you've already ", "请确认你已经")}
                  linkText={t("signed up", "注册账户")}
                  href="/signup"
                />
              </div>
            </CardContent>
          </Card>
        ))}

      {/* Local-specific help */}
      {showLocalHelp && (
        <Card
          variant="outlined"
          className="w-full overflow-hidden rounded-lg border border-border-base bg-surface shadow-sm"
        >
          <div className="w-full divide-y divide-separator">
            <HelpItem
              title={t(
                "Having trouble getting AutoGPT running locally?",
                "本地运行 AutoGPT 遇到问题？",
              )}
              description={t("Ask for help on our", "你可以在这里寻求帮助：")}
              linkText="Discord"
              href="https://discord.gg/autogpt"
            />

            <HelpItem
              title={t("Think you've found a bug?", "发现了问题？")}
              description={t("Open an issue on our", "请在这里提交问题：")}
              linkText="GitHub"
              href="https://github.com/Significant-Gravitas/AutoGPT"
            />

            <HelpItem
              title={t(
                "Interested in the cloud-hosted version?",
                "想体验云端版本？",
              )}
              description={t("Join our", "加入我们的")}
              linkText={t("waitlist here", "候补名单")}
              href="https://agpt.co/waitlist"
            />
          </div>
        </Card>
      )}
    </div>
  );
}
