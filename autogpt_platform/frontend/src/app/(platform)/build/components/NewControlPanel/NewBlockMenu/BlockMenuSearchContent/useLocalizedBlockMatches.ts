import {
  type getV1ListAvailableBlocksResponse,
  useGetV1ListAvailableBlocks,
} from "@/app/api/__generated__/endpoints/blocks/blocks";
import type { BlockInfo } from "@/app/api/__generated__/models/blockInfo";
import type { SearchResponse } from "@/app/api/__generated__/models/searchResponse";
import { okData } from "@/app/api/helpers";
import {
  getBuilderBlockText,
  getBuilderCategoryLabel,
} from "@/app/(platform)/build/helpers/blockCopy";
import { isCredentialFieldSchema } from "@/components/renderers/InputRenderer/custom/CredentialField/helpers";
import { SpecialBlockID } from "@/lib/autogpt-server-api";
import type { CategoryKey } from "../BlockMenuFilters/types";
import { getIntegrationLabel } from "../integrationCopy";
import { getSearchItemType } from "./helper";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBlockInfo(value: unknown): value is BlockInfo {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.uiType === "string" &&
    typeof value.staticOutput === "boolean" &&
    isRecord(value.inputSchema) &&
    isRecord(value.outputSchema) &&
    Array.isArray(value.costs) &&
    Array.isArray(value.contributors) &&
    Array.isArray(value.categories)
  );
}

function indexBlock(block: BlockInfo) {
  const { name, description } = getBuilderBlockText(block, "zh-CN");
  const inputs = isRecord(block.inputSchema.properties)
    ? block.inputSchema.properties
    : {};
  const outputs = isRecord(block.outputSchema.properties)
    ? block.outputSchema.properties
    : {};
  const fields = Object.values(inputs);
  const providers = fields.flatMap((field) =>
    isRecord(field) && Array.isArray(field.credentials_provider)
      ? field.credentials_provider.filter(
          (provider): provider is string => typeof provider === "string",
        )
      : [],
  );
  const terms = [
    name,
    description,
    block.name,
    block.description,
    ...Object.keys(inputs),
    ...Object.keys(outputs),
    ...block.categories.flatMap((entry) =>
      typeof entry?.category === "string"
        ? [entry.category, getBuilderCategoryLabel(entry.category, "zh-CN")]
        : [],
    ),
    ...providers.flatMap((provider) => [
      provider,
      getIntegrationLabel(provider, "zh-CN"),
    ]),
    ...block.contributors.flatMap((entry) =>
      typeof entry?.name === "string" ? [entry.name] : [],
    ),
  ];
  return {
    block,
    filter: fields.some(isCredentialFieldSchema)
      ? ("integrations" as const)
      : ("blocks" as const),
    text: terms
      .map((term) => term.normalize("NFKC").toLowerCase().replace(/\s+/g, ""))
      .join("\n"),
  };
}

function selectCatalog(response: getV1ListAvailableBlocksResponse) {
  const entries: unknown[] = okData(response) ?? [];
  return entries
    .filter(isBlockInfo)
    .filter((block) => block.id !== SpecialBlockID.AGENT)
    .map(indexBlock);
}

type Options = {
  searchQuery: string;
  filters: CategoryKey[];
  creators: string[];
  serverItems: SearchResponse["items"];
  searchSucceeded: boolean;
};

export function useLocalizedBlockMatches({
  searchQuery,
  filters,
  creators,
  serverItems,
  searchSucceeded,
}: Options) {
  const enabled =
    searchSucceeded &&
    /\p{Script=Han}/u.test(searchQuery) &&
    !creators.length &&
    (!filters.length ||
      filters.includes("blocks") ||
      filters.includes("integrations"));
  const { data: catalog, isLoading } = useGetV1ListAvailableBlocks({
    query: { enabled, select: selectCatalog, staleTime: 5 * 60 * 1000 },
  });
  if (!enabled || !catalog)
    return { matches: [], isLoading: enabled && isLoading };

  const shown = new Set<string>();
  for (const item of serverItems) {
    const result = getSearchItemType(item);
    if (result.type === "block") shown.add(result.data.id);
  }
  const words = searchQuery.normalize("NFKC").trim().toLowerCase().split(/\s+/);
  const matches = catalog.flatMap(({ block, filter, text }) => {
    if (
      shown.has(block.id) ||
      (filters.length && !filters.includes(filter)) ||
      !words.every((word) => text.includes(word))
    )
      return [];
    shown.add(block.id);
    return [block];
  });
  return { matches, isLoading: false };
}
