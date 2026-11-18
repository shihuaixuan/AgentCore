import { useListCopilotSkills } from "@/app/api/__generated__/endpoints/skills/skills";
import { useGetV2ListMarketplaceSkillsInfinite } from "@/app/api/__generated__/endpoints/store/store";
import {
  getPaginationNextPageNumber,
  okData,
  unpaginate,
} from "@/app/api/helpers";
import { useAuth } from "@/lib/auth/hooks/useAuth";
import { useBrowseParams } from "../../../components/Browse/useBrowseParams";
import { BROWSE_PAGE_SIZE } from "../../../components/SkillsSection/helpers";

export function useSkillsBrowsePage() {
  const { search, category, update } = useBrowseParams();
  const { isLoggedIn } = useAuth();

  const query = useGetV2ListMarketplaceSkillsInfinite(
    {
      page: 1,
      page_size: BROWSE_PAGE_SIZE,
      ...(search ? { search_query: search } : {}),
      ...(category ? { category } : {}),
    },
    {
      query: {
        initialPageParam: 1,
        getNextPageParam: getPaginationNextPageNumber,
      },
    },
  );

  const installed = useListCopilotSkills(undefined, {
    query: { select: (res) => okData(res) ?? [], enabled: isLoggedIn },
  });

  return {
    isLoggedIn,
    search,
    category,
    skills: query.data ? unpaginate(query.data, "skills") : [],
    total: okData(query.data?.pages[0])?.pagination.total_items ?? 0,
    installedSlugs: new Set((installed.data ?? []).map((skill) => skill.name)),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    hasMore: Boolean(query.hasNextPage),
    isFetchingMore: query.isFetchingNextPage,
    isFetchNextPageError: query.isFetchNextPageError,
    loadMore: query.fetchNextPage,
    setSearch: (value: string) => update({ q: value }),
    setCategory: (value: string | null) => update({ category: value }),
    reset: () => update({ q: null, category: null }),
  };
}
