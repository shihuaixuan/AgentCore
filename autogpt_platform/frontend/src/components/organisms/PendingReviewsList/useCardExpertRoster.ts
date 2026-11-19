import {
  type ListExpertIdentitiesQueryResult,
  useListExpertIdentities,
} from "@/app/api/__generated__/endpoints/experts/experts";

function indexByID(response: ListExpertIdentitiesQueryResult) {
  if (response.status !== 200) return undefined;
  return new Map(response.data.map((expert) => [expert.id, expert]));
}

export function useCardExpertRoster(enabled: boolean) {
  const query = useListExpertIdentities({
    query: {
      enabled,
      select: indexByID,
      staleTime: 60_000,
      retry: false,
      retryOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });
  return query.isError ? undefined : query.data;
}
