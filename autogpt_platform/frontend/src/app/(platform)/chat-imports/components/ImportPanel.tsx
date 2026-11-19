import { Card } from "@/components/atoms/Card/Card";
import { Text } from "@/components/atoms/Text/Text";
import {
  TabsLine,
  TabsLineContent,
  TabsLineList,
  TabsLineTrigger,
} from "@/components/molecules/TabsLine/TabsLine";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { QwenWorkImport } from "./QwenWorkImport";
import { WorkBuddyImport } from "./WorkBuddyImport";

export type ImportSourceProps = {
  ownerID: string;
  onSaved: () => Promise<void>;
};

export function ImportPanel({ ownerID, onSaved }: ImportSourceProps) {
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
            <TabsLineTrigger value="qwenwork">
              {t("QwenWork", "千问办公")}
            </TabsLineTrigger>
          </TabsLineList>
          <TabsLineContent value="workbuddy" forceMount>
            <WorkBuddyImport ownerID={ownerID} onSaved={onSaved} />
          </TabsLineContent>
          <TabsLineContent value="qwenwork" forceMount>
            <QwenWorkImport ownerID={ownerID} onSaved={onSaved} />
          </TabsLineContent>
        </TabsLine>
      </section>
    </Card>
  );
}
