import { Card } from "@/components/atoms/Card/Card";
import { Text } from "@/components/atoms/Text/Text";
import {
  TabsLine,
  TabsLineContent,
  TabsLineList,
  TabsLineTrigger,
} from "@/components/molecules/TabsLine/TabsLine";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { QianwenImport } from "./QianwenImport";
import { WorkBuddyImport } from "./WorkBuddyImport";

export function ImportPanel({ onSaved }: { onSaved: () => Promise<void> }) {
  const { t } = useTranslation();
  return (
    <Card variant="outlined" className="min-w-0">
      <section
        aria-labelledby="chat-import-heading"
        className="space-y-3 p-4 sm:p-6"
      >
        <Text as="h2" variant="h4" id="chat-import-heading">
          {t("Import conversations", "导入对话")}
        </Text>
        <Text variant="body" tone="secondary">
          {t(
            "Your drafts stay in this browser until you save them.",
            "保存前，草稿只保留在此浏览器中。",
          )}
        </Text>
        <TabsLine defaultValue="workbuddy" variant="compact">
          <TabsLineList aria-label={t("Import source", "导入来源")}>
            <TabsLineTrigger value="workbuddy">WorkBuddy</TabsLineTrigger>
            <TabsLineTrigger value="qianwen">
              {t("Qianwen", "通义千问")}
            </TabsLineTrigger>
          </TabsLineList>
          <TabsLineContent value="workbuddy" forceMount>
            <WorkBuddyImport onSaved={onSaved} />
          </TabsLineContent>
          <TabsLineContent value="qianwen" forceMount>
            <QianwenImport onSaved={onSaved} />
          </TabsLineContent>
        </TabsLine>
      </section>
    </Card>
  );
}
