"use client";

import * as React from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { ProfileSidebar } from "./components/ProfileSidebar/ProfileSidebar";
import { usePlatformPayment } from "@/hooks/usePlatformPayment";
import {
  AppWindowIcon,
  Coins01Icon,
  Key01Icon,
  SlidersHorizontalIcon,
  Store01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useNewSettingsRedirect } from "./useNewSettingsRedirect";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { isPaymentEnabled } = usePlatformPayment();
  const { isRedirecting } = useNewSettingsRedirect();

  const sidebarLinks = [
    {
      text: t("Profile", "个人资料"),
      href: "/profile",
      icon: <Icon icon={UserCircleIcon} className="size-5" />,
    },
    {
      text: t("Creator Dashboard", "创作者面板"),
      href: "/profile/dashboard",
      icon: <Icon icon={Store01Icon} className="size-5" />,
    },
    ...(isPaymentEnabled
      ? [
          {
            text: t("Billing", "账单"),
            href: "/profile/credits",
            icon: <Icon icon={Coins01Icon} className="size-5" />,
          },
        ]
      : []),
    {
      text: t("Settings", "设置"),
      href: "/profile/settings",
      icon: <Icon icon={SlidersHorizontalIcon} className="size-5" />,
    },
    {
      text: t("API Keys", "API 密钥"),
      href: "/profile/api-keys",
      icon: <Icon icon={Key01Icon} className="size-5" />,
    },
    {
      text: t("OAuth Apps", "OAuth 应用"),
      href: "/profile/oauth-apps",
      icon: <Icon icon={AppWindowIcon} className="size-5" />,
    },
  ];

  // These legacy pages redirect to /settings — render nothing while the
  // replace() is in flight so the old shell never flashes.
  if (isRedirecting) return null;

  return (
    <div className="flex min-h-screen w-full max-w-[1360px] flex-col lg:flex-row">
      <ProfileSidebar links={sidebarLinks} />
      <div className="flex-1 pl-4">{children}</div>
    </div>
  );
}
