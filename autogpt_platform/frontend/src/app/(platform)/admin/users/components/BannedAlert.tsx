import { Alert, AlertDescription } from "@/components/molecules/Alert/Alert";
import { Icon } from "@/components/atoms/Icon/Icon";
import { UserBlock01Icon } from "@hugeicons/core-free-icons";
import { type AdminUser, formatDateTime, formatTimeUntil } from "../helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  user: AdminUser;
}

export function BannedAlert({ user }: Props) {
  const { t, locale } = useTranslation();
  const until = user.banExpires
    ? t(
        `until ${formatDateTime(user.banExpires, locale)} (${formatTimeUntil(user.banExpires, undefined, locale)})`,
        `至 ${formatDateTime(user.banExpires, locale)}（${formatTimeUntil(user.banExpires, undefined, locale)}）`,
      )
    : t("permanently", "永久");

  return (
    <Alert variant="error" icon={BannedIcon}>
      <AlertDescription className="break-words">
        <strong className="font-medium">{t("Banned", "已封禁")}</strong> ·{" "}
        {until}
        {user.banReason ? <> · &ldquo;{user.banReason}&rdquo;</> : null}
      </AlertDescription>
    </Alert>
  );
}

function BannedIcon({ className }: { className?: string }) {
  return <Icon icon={UserBlock01Icon} className={className} aria-hidden />;
}
