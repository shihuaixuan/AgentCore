import { useGetV2ListStoreAgentsInfinite } from "@/app/api/__generated__/endpoints/store/store";
import {
  getPaginationNextPageNumber,
  okData,
  unpaginate,
} from "@/app/api/helpers";
import { useBrowseParams } from "../../components/Browse/useBrowseParams";

export function useWorkflowsBrowse() {
  const { params, search, category, update } = useBrowseParams();
  const value = params.get("sort");
  const sort = value === "rating" || value === "updated_at" ? value : "runs";
  const query = useGetV2ListStoreAgentsInfinite(
    {
      page: 1,
      page_size: 24,
      ...(category ? { category } : {}),
      ...(search ? { search_query: search } : { sorted_by: sort }),
    },
    {
      query: {
        initialPageParam: 1,
        getNextPageParam: getPaginationNextPageNumber,
      },
    },
  );

  return {
    query,
    search,
    category,
    sort,
    update,
    workflows: query.data ? unpaginate(query.data, "agents") : [],
    total: okData(query.data?.pages[0])?.pagination.total_items ?? 0,
  };
}
