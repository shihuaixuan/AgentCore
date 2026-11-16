"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useRouter } from "next/navigation";
import { AccountMenuRow } from "./AccountMenuRow";
import { Logout03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export function AccountLogoutOption() {
  const { t } = useTranslation();
  const router = useRouter();

  function handleLogout() {
    router.replace("/logout");
  }

  return (
    <AccountMenuRow
      as="button"
      destructive
      label={t("Log out", "退出登录")}
      icon={<Icon icon={Logout03Icon} className="h-[18px] w-[18px] shrink-0" />}
      onClick={handleLogout}
    />
  );
}
