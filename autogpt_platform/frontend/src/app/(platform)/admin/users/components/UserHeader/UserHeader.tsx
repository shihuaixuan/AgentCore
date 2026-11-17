"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/atoms/Avatar/Avatar";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { UserSwitchIcon } from "@hugeicons/core-free-icons";
import { AdminSection } from "../../../components/AdminSection";
import { useAdminImpersonation } from "../../../components/useAdminImpersonation";
import { type AdminUser, getDisplayName } from "../../helpers";
import { BanDialog } from "./components/BanDialog";
import { ImpersonateDialog } from "./components/ImpersonateDialog";
import { UnbanDialog } from "./components/UnbanDialog";

interface Props {
  user: AdminUser;
  isSelf: boolean;
  canAct: boolean;
}

export function UserHeader({ user, isSelf, canAct }: Props) {
  const { t } = useTranslation();
  const impersonation = useAdminImpersonation();
  const displayName = getDisplayName(user);
  const isImpersonatingThisUser = impersonation.impersonatedUserId === user.id;

  return (
    <AdminSection className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback accessibleLabel={displayName}>
            <span className="flex size-full items-center justify-center rounded-full bg-surface-hover text-body-lg font-medium text-foreground-body">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <Text variant="large-medium" as="h2" className="break-all">
              {displayName}
            </Text>
            {isSelf ? (
              <Badge variant="info" size="small">
                {t("You", "你")}
              </Badge>
            ) : null}
            {user.role === "admin" ? (
              <Badge variant="info" size="small">
                {t("Admin", "管理员")}
              </Badge>
            ) : null}
            {user.banned ? (
              <Badge variant="error" size="small">
                {t("Banned", "已封禁")}
              </Badge>
            ) : null}
            {user.emailVerified ? null : (
              <Badge variant="warning" size="small">
                {t("Unverified", "未验证")}
              </Badge>
            )}
          </div>
          <Text
            variant="body"
            className="break-all"
            tone="secondary"
            translate="no"
          >
            {user.email}
          </Text>
        </div>
      </div>

      {canAct ? (
        <div className="flex flex-wrap gap-2">
          {isImpersonatingThisUser ? (
            <Button
              variant="secondary"
              size="small"
              leadingIcon={UserSwitchIcon}
              onClick={impersonation.stopImpersonating}
            >
              {t("Stop impersonating", "停止模拟登录")}
            </Button>
          ) : (
            <ImpersonateDialog
              user={user}
              currentImpersonationID={impersonation.impersonatedUserId}
              isStarting={impersonation.isStarting}
              onConfirm={() => impersonation.startImpersonating(user.id)}
            />
          )}
          {user.banned ? (
            <UnbanDialog user={user} />
          ) : (
            <BanDialog user={user} />
          )}
        </div>
      ) : null}
    </AdminSection>
  );
}
