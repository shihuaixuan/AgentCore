import { convertLibraryAgentIntoCustomNode } from "../helpers";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { getV2GetLibraryAgent } from "@/app/api/__generated__/endpoints/library/library";
import { useAddBlockToBuilder } from "./useAddBlockToBuilder";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function useAddAgentToBuilder() {
  const { t } = useTranslation();
  const { addBlockWithPlacement } = useAddBlockToBuilder();

  function addAgentToBuilder(libraryAgent: LibraryAgent) {
    const { input_schema, output_schema } = libraryAgent;

    const { block, hardcodedValues } = convertLibraryAgentIntoCustomNode(
      libraryAgent,
      input_schema,
      output_schema,
    );

    return addBlockWithPlacement(block, hardcodedValues);
  }

  async function addLibraryAgentToBuilder(agent: LibraryAgent) {
    const response = await getV2GetLibraryAgent(agent.id);

    if (!response.data) {
      throw new Error(
        t("Failed to get workflow details", "无法获取工作流详情"),
      );
    }

    const libraryAgent = response.data as LibraryAgent;
    return addAgentToBuilder(libraryAgent);
  }

  return {
    addAgentToBuilder,
    addLibraryAgentToBuilder,
  };
}
