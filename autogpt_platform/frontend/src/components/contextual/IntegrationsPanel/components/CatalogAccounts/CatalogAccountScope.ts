import { createContext } from "react";
import type { CatalogAccount } from "@/lib/mcp-catalog-connections";

export const CatalogAccountScope = createContext<{
  expertID?: string;
  onAccount?: (row: CatalogAccount) => void;
}>({});
