import { useTranslation } from "@/lib/i18n/LanguageProvider";
import React from "react";
import { MenuItem } from "../MenuItem";
import { useBlockMenuSidebar } from "./useBlockMenuSidebar";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { useBlockMenuStore } from "../../../../stores/blockMenuStore";
import { DefaultStateType } from "../types";

export const BlockMenuSidebar = () => {
  const { t } = useTranslation();
  const { data, setDefaultState, defaultState, isLoading, isError, error } =
    useBlockMenuSidebar();
  const setIntegration = useBlockMenuStore((state) => state.setIntegration);
  if (isLoading) {
    return (
      <div className="w-fit space-y-2 px-4 pt-4">
        <Skeleton className="h-12 w-[12.875rem]" />
        <Skeleton className="h-12 w-[12.875rem]" />
        <Skeleton className="h-12 w-[12.875rem]" />
        <Skeleton className="h-12 w-[12.875rem]" />
        <Skeleton className="h-12 w-[12.875rem]" />
        <Skeleton className="h-12 w-[12.875rem]" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="w-fit space-y-2 px-4 pt-4">
        <ErrorCard
          className="w-[12.875rem]"
          isSuccess={false}
          responseError={error || undefined}
          context="block menu"
          httpError={{
            status: data?.status,
            statusText: t("Internal Server Error", "服务器内部错误"),
            message:
              (error?.detail as string) || t("An error occurred", "发生错误"),
          }}
        />
      </div>
    );
  }

  const blockCounts = data?.blockCounts;

  const topLevelMenuItems = [
    {
      name: t("Suggestion", "推荐"),
      type: "suggestion",
    },
    {
      name: t("All blocks", "全部模块"),
      type: "all_blocks",
      number: blockCounts?.all_blocks,
    },
  ];

  const subMenuItems = [
    {
      name: t("Input blocks", "输入模块"),
      type: "input_blocks",
      number: blockCounts?.input_blocks,
    },
    {
      name: t("Action blocks", "操作模块"),
      type: "action_blocks",
      number: blockCounts?.action_blocks,
    },
    {
      name: t("Output blocks", "输出模块"),
      type: "output_blocks",
      number: blockCounts?.output_blocks,
    },
  ];

  const bottomMenuItems = [
    {
      name: t("Integrations", "集成"),
      type: "integrations",
      number: blockCounts?.integrations,
      onClick: () => {
        setDefaultState(DefaultStateType.INTEGRATIONS);
        setIntegration(undefined);
      },
    },
    {
      name: t("Marketplace Workflows", "市场工作流"),
      type: "marketplace_agents",
      number: blockCounts?.marketplace_agents,
    },
    {
      name: t("My Workflows", "我的工作流"),
      type: "my_agents",
      number: blockCounts?.my_agents,
    },
  ];

  return (
    <div className="w-fit space-y-2 px-4 pt-4">
      {topLevelMenuItems.map((item) => (
        <MenuItem
          key={item.type}
          name={item.name}
          number={item.number}
          menuItemType={item.type}
          selected={defaultState === item.type}
          onClick={() => setDefaultState(item.type as DefaultStateType)}
        />
      ))}
      <div className="ml-[0.5365rem] space-y-2 border-l border-foreground-base/10 pl-3">
        {subMenuItems.map((item) => (
          <MenuItem
            key={item.type}
            name={item.name}
            number={item.number}
            menuItemType={item.type}
            className="max-w-[11.5339rem]"
            selected={defaultState === item.type}
            onClick={() => setDefaultState(item.type as DefaultStateType)}
          />
        ))}
      </div>
      {bottomMenuItems.map((item) => (
        <MenuItem
          key={item.type}
          name={item.name}
          number={item.number}
          menuItemType={item.type}
          selected={defaultState === item.type}
          onClick={
            item.onClick ||
            (() => setDefaultState(item.type as DefaultStateType))
          }
        />
      ))}
    </div>
  );
};
