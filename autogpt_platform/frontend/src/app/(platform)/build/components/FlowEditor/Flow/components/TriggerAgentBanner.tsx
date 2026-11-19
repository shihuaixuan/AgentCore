import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/molecules/Alert/Alert";
import Link from "next/link";
import { Text } from "@/components/atoms/Text/Text";
import { useGetV2GetLibraryAgentByGraphId } from "@/app/api/__generated__/endpoints/library/library";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { useQueryStates, parseAsString } from "nuqs";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export const TriggerAgentBanner = () => {
  const { t } = useTranslation();
  const [{ flowID }] = useQueryStates({
    flowID: parseAsString,
  });

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

  return (
    <Alert className="absolute bottom-4 left-1/2 z-20 w-auto -translate-x-1/2 rounded-xlarge select-none">
      <AlertTitle>
        {t("You are building a Trigger Workflow", "你正在构建触发工作流")}
      </AlertTitle>
      <AlertDescription>
        {t(
          "Your workflow will listen for its trigger and will run when the time is right.",
          "此工作流会监听触发事件，并在满足条件时运行。",
        )}
        <br />
        {t("You can view its activity in your", "你可以在此查看其活动：")}{" "}
        <Link
          href={
            libraryAgent ? `/library/agents/${libraryAgent.id}` : "/library"
          }
          className="underline"
        >
          <Text variant="body-tight" as="span" tone="inherit">
            {t("Workflow Library", "工作流库")}
          </Text>
        </Link>
        .
      </AlertDescription>
    </Alert>
  );
};
