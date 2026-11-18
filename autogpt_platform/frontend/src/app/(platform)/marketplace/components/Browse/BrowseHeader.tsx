"use client";

import { Text } from "@/components/atoms/Text/Text";
import type { ReactNode } from "react";
import { SearchBar } from "../SearchBar/SearchBar";

export const BROWSE_LAYOUT = "w-full px-4 pt-6 pb-16 sm:px-8 lg:px-10";
export const BROWSE_GRID =
  "grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3";

interface Props {
  title: string;
  description: string;
  action?: ReactNode;
  search?: { value: string; label: string; onSubmit: (value: string) => void };
}

export function BrowseHeader({ title, description, action, search }: Props) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
      <div className="flex min-w-0 flex-col gap-1">
        <Text as="h1" variant="h3">
          {title}
        </Text>
        <Text variant="body" tone="muted">
          {description}
        </Text>
      </div>
      {(search || action) && (
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          {search && (
            <SearchBar
              key={search.value}
              placeholder={search.label}
              defaultValue={search.value}
              onSubmit={search.onSubmit}
              height="h-10"
              width="w-full md:w-64"
            />
          )}
          {action}
        </div>
      )}
    </header>
  );
}
