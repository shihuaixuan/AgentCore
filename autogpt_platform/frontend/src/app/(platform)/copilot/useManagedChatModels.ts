import { useGetV2ListManagedChatModels } from "@/app/api/__generated__/endpoints/chat/chat";
import {
  selectedChatModel,
  useManagedModelSelection,
} from "./managedModelSelection";

export function useManagedChatModels() {
  const query = useGetV2ListManagedChatModels({ query: { staleTime: 15_000 } });
  const choice = useManagedModelSelection((state) => state.modelID);
  const selectModel = useManagedModelSelection((state) => state.selectModel);
  const models = query.data?.status === 200 ? query.data.data : [];
  return {
    models,
    modelID: selectedChatModel(models, choice),
    selectModel,
    isPending: query.isPending,
    isError: query.isError,
  };
}
