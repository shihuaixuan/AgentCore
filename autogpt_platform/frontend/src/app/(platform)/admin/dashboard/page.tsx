import { getServerTranslation } from "@/lib/i18n/server";
import { withRoleAccess } from "@/lib/withRoleAccess";
import React from "react";

async function AdminDashboard() {
  const { t } = await getServerTranslation();
  return (
    <div>
      <h1>{t("Admin Dashboard", "管理后台")}</h1>
      {/* Add your admin-only content here */}
    </div>
  );
}

export default async function AdminDashboardPage() {
  "use server";
  const withAdminAccess = await withRoleAccess(["admin"]);
  const ProtectedAdminDashboard = await withAdminAccess(AdminDashboard);
  return <ProtectedAdminDashboard />;
}
