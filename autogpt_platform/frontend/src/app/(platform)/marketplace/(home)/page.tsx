import { prefetchListExpertTemplatesQuery } from "@/app/api/__generated__/endpoints/experts/experts";
import { buildPageMetadata } from "@/lib/metadata";
import { getQueryClient } from "@/lib/react-query/queryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { MainMarkeplacePage } from "../components/MainMarketplacePage/MainMarketplacePage";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Marketplace - AutoGPT Platform",
  description: "Browse AI experts, skills, workflows, and connectors.",
  path: "/marketplace",
});

export default async function MarketplacePage({
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
  await prefetchListExpertTemplatesQuery(queryClient, {
    ...(selected ? { category: selected } : {}),
    ...(search ? { search_query: search } : {}),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MainMarkeplacePage />
    </HydrationBoundary>
  );
}
