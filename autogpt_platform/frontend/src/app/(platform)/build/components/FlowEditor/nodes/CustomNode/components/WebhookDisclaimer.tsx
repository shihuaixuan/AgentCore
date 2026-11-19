import { useGetV2GetLibraryAgentByGraphId } from "@/app/api/__generated__/endpoints/library/library";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { Text } from "@/components/atoms/Text/Text";
import { Alert, AlertDescription } from "@/components/molecules/Alert/Alert";
import { isValidUUID } from "@/lib/utils";
import Link from "next/link";
import { parseAsString, useQueryStates } from "nuqs";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export const WebhookDisclaimer = ({ nodeId }: { nodeId: string }) => {
  const { t } = useTranslation();
  const [{ flowID }] = useQueryStates({
    flowID: parseAsString,
  });

  // for a single agentId, we are fetching everything - need to make it better in the future
  const { data: libraryAgent } = useGetV2GetLibraryAgentByGraphId(
    flowID ?? "",
    {},
    {
      query: {
        select: (x) => {
          return x.data as LibraryAgent;
        },
        enabled: !!flowID,
      },
    },
  );

  const isNodeSaved = isValidUUID(nodeId);

  return (
    <>
      <div className="px-4 pt-4">
        <Alert className="mb-3 rounded-xlarge">
          <AlertDescription>
            <Text variant="small-medium">
              {t(
                "You can set up and manage this trigger in your",
                "你可以在工作流库中设置和管理此触发器：",
              )}{" "}
              <Link
                href={
                  libraryAgent
                    ? `/library/agents/${libraryAgent.id}`
                    : "/library"
                }
                className="underline"
              >
                <Text variant="small-medium-inherit" as="span" tone="inherit">
                  {t("Workflow Library", "工作流库")}
                </Text>
              </Link>
              {!isNodeSaved &&
                t(" (after saving the workflow)", "（保存工作流后）")}
              .
            </Text>
          </AlertDescription>
        </Alert>
      </div>

      <Text variant="small" tone="accent" className="mb-4 ml-6">
        {t(
          "Below inputs are only for display purposes and cannot be edited.",
          "以下输入仅供展示，无法编辑。",
        )}
      </Text>
    </>
  );
};
