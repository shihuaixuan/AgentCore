import { prefetchGetV2ListMarketplaceSkillsInfiniteQuery } from "@/app/api/__generated__/endpoints/store/store";
import { getPaginationNextPageNumber } from "@/app/api/helpers";
import { getQueryClient } from "@/lib/react-query/queryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";
import { SkillsBrowsePage } from "./components/SkillsBrowsePage/SkillsBrowsePage";
import { BROWSE_PAGE_SIZE } from "../components/SkillsSection/helpers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skills - AutoGPT Marketplace",
  description: "Playbooks your experts follow. Teach them your way of working.",
};

export default async function MarketplaceSkillsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
  }>;
}) {
  const queryClient = getQueryClient();
  const { q, category } = await searchParams;
  const search = (Array.isArray(q) ? q[0] : q)?.trim();
  const selected = Array.isArray(category) ? category[0] : category;
  await prefetchGetV2ListMarketplaceSkillsInfiniteQuery(
    queryClient,
    {
      page: 1,
      page_size: BROWSE_PAGE_SIZE,
      ...(search ? { search_query: search } : {}),
      ...(selected ? { category: selected } : {}),
    },
    {
      query: {
        initialPageParam: 1,
        getNextPageParam: getPaginationNextPageNumber,
      },
    },
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SkillsBrowsePage />
    </HydrationBoundary>
  );
}
