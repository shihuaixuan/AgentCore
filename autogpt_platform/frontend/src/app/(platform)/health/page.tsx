import { getServerTranslation } from "@/lib/i18n/server";

export default async function HealthPage() {
  const { t } = await getServerTranslation();
  return <div>{t("Yay im healthy", "服务运行正常")}</div>;
}
