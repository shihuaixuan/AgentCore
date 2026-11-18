import { getServerTranslation } from "@/lib/i18n/server";
import { withRoleAccess } from "@/lib/withRoleAccess";
import React from "react";

async function AdminSettings() {
  const { t } = await getServerTranslation();

  return (
    <div>
      <h1>{t("Admin Settings", "管理设置")}</h1>
      {/* Add admin-only settings here */}
    </div>
  );
}

export default async function AdminSettingsPage() {
  "use server";
  const withAdminAccess = await withRoleAccess(["admin"]);
  const ProtectedAdminSettings = await withAdminAccess(AdminSettings);
  return <ProtectedAdminSettings />;
}
