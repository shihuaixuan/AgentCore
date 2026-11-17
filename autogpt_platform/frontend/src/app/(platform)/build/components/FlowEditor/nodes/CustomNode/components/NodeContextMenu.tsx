import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useCopyPasteStore } from "@/app/(platform)/build/stores/copyPasteStore";
import { useNodeStore } from "@/app/(platform)/build/stores/nodeStore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import {
  SecondaryDropdownMenuContent,
  SecondaryDropdownMenuItem,
  SecondaryDropdownMenuSeparator,
} from "@/components/molecules/SecondaryMenu/SecondaryMenu";
import { useReactFlow } from "@xyflow/react";
import {
  Copy01Icon,
  Delete02Icon,
  LinkSquare01Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

type Props = {
  nodeId: string;
  subGraphID?: string;
};

export const NodeContextMenu = ({ nodeId, subGraphID }: Props) => {
  const { t } = useTranslation();
  const { deleteElements } = useReactFlow();

  function handleCopy() {
    useNodeStore.setState((state) => ({
      nodes: state.nodes.map((node) => ({
        ...node,
        selected: node.id === nodeId,
      })),
    }));

    useCopyPasteStore.getState().copySelectedNodes();
    useCopyPasteStore.getState().pasteNodes();
  }

  function handleDelete() {
    deleteElements({ nodes: [{ id: nodeId }] });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="py-2">
        <Icon icon={MoreVerticalIcon} size={16} />
      </DropdownMenuTrigger>
      <SecondaryDropdownMenuContent side="right" align="start">
        <SecondaryDropdownMenuItem onClick={handleCopy}>
          <Icon icon={Copy01Icon} size={20} className="mr-2" />
          <span>{t("Copy", "复制")}</span>
        </SecondaryDropdownMenuItem>
        <SecondaryDropdownMenuSeparator />

        {subGraphID && (
          <>
            <SecondaryDropdownMenuItem
              onClick={() => window.open(`/build?flowID=${subGraphID}`)}
            >
              <Icon icon={LinkSquare01Icon} size={20} className="mr-2" />
              <span>{t("Open workflow", "打开工作流")}</span>
            </SecondaryDropdownMenuItem>
            <SecondaryDropdownMenuSeparator />
          </>
        )}

        <SecondaryDropdownMenuItem variant="destructive" onClick={handleDelete}>
          <Icon icon={Delete02Icon} size={20} tone="error" className="mr-2" />
          <span>{t("Delete", "删除")}</span>
        </SecondaryDropdownMenuItem>
      </SecondaryDropdownMenuContent>
    </DropdownMenu>
  );
};
