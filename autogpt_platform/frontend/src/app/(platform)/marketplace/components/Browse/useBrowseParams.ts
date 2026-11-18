import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useBrowseParams() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    if (query !== params.toString())
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return {
    params,
    update,
    search: params.get("q")?.trim() ?? "",
    category: params.get("category") || null,
  };
}
