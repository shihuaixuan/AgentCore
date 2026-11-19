import {
  useGetV2GetLibraryAgentByGraphId,
  usePostV2ForkLibraryAgent,
} from "@/app/api/__generated__/endpoints/library/library";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryStates } from "nuqs";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function useDuplicateGraph() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();

  const [{ flowID }] = useQueryStates({
    flowID: parseAsString,
  });

  const { data: libraryAgent, isLoading: isCheckingLibrary } =
    useGetV2GetLibraryAgentByGraphId(
      flowID ?? "",
      {},
      {
        query: {
          select: (res) => res.data as LibraryAgent,
          enabled: !!flowID,
        },
      },
    );

  const { mutateAsync: forkAgent, isPending: isDuplicating } =
    usePostV2ForkLibraryAgent();

  async function duplicate() {
    if (!libraryAgent) return;

    try {
      const result = await forkAgent({ libraryAgentId: libraryAgent.id });
      const forked = result.data as LibraryAgent;
      if (!forked?.graph_id) {
        throw new Error(
          t(
            "The copy did not return a workflow to open.",
            "复制操作未返回可打开的工作流。",
          ),
        );
      }
      router.push(`/build?flowID=${forked.graph_id}`);
    } catch (error) {
      toast({
        title: t("Failed to duplicate workflow", "无法复制工作流"),
        description:
          error instanceof Error
            ? error.message
            : t("An unexpected error occurred.", "发生意外错误。"),
        variant: "destructive",
      });
    }
  }

  return {
    duplicate,
    isDuplicating,
    canDuplicate: !!libraryAgent,
    isCheckingLibrary,
  };
}
