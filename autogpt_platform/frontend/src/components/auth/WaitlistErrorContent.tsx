"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { environment } from "@/services/environment";
import { Button } from "../atoms/Button/Button";
import { Text } from "../atoms/Text/Text";

interface Props {
  onBackToLogin?: () => void;
}

export function WaitlistErrorContent(props: Props) {
  const { t } = useTranslation();
  if (!environment.isCloud()) return <SelfHostedNotAllowed {...props} />;
  return (
    <div className="flex flex-col items-center gap-6">
      <Text variant="h3">
        {t("We're in closed beta", "目前处于封闭测试阶段")}
      </Text>
      <div className="flex flex-col gap-4 text-center">
        <Text variant="large" className="text-center">
          {t(
            "Looks like your email isn't in our early access list just yet. Join the waitlist and we will let you know the moment we open up access!",
            "你的邮箱尚未加入抢先体验名单。加入候补名单后，我们会在开放访问时通知你！",
          )}
        </Text>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            window.open("https://agpt.co/waitlist", "_blank");
          }}
        >
          {t("Join Waitlist", "加入候补名单")}
        </Button>
        {props.onBackToLogin ? (
          <Button variant="secondary" onClick={props.onBackToLogin}>
            {t("Back to Login", "返回登录")}
          </Button>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Text variant="small" tone="muted" className="text-center">
          {t(
            "Already joined? Double-check you are using the same email you signed up with. Need a hand? Emails us at",
            "已经加入？请确认使用的是申请时的邮箱。需要帮助？请发邮件至",
          )}{" "}
          <a
            href="mailto:contact@agpt.co"
            className="underline hover:text-foreground-base"
          >
            contact@agpt.co
          </a>{" "}
          {t("or", "或")}{" "}
          <a
            href="https://discord.gg/autogpt"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground-base"
          >
            {t("message us on Discord", "在 Discord 上联系我们")}
          </a>
        </Text>
      </div>
    </div>
  );
}

// A self-hosted instance's allowlist belongs to its operator, not to AutoGPT's
// waitlist, so point the user at whoever runs it.
function SelfHostedNotAllowed(props: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-6">
      <Text variant="h3">
        {t("This email can't sign up here", "此邮箱无法在这里注册")}
      </Text>
      <Text variant="large" className="text-center">
        {t(
          "This instance only allows approved emails. Ask your administrator to add yours, or sign up with an email they have already approved.",
          "此实例仅允许已获批准的邮箱注册。请联系管理员添加你的邮箱，或使用已获批准的邮箱注册。",
        )}
      </Text>
      {props.onBackToLogin ? (
        <Button variant="secondary" onClick={props.onBackToLogin}>
          {t("Back to Login", "返回登录")}
        </Button>
      ) : null}
    </div>
  );
}
