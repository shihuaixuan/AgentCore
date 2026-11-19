import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { usePostV1CreateNewGraph } from "@/app/api/__generated__/endpoints/graphs/graphs";
import { Graph } from "@/app/api/__generated__/models/graph";
import { GraphModel } from "@/app/api/__generated__/models/graphModel";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { sanitizeImportedGraph } from "@/lib/autogpt-server-api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { uploadAgentFormSchema } from "./LibraryUploadAgentDialog";

export function useLibraryUploadAgentDialog(options?: {
  onSuccess?: () => void;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [agentObject, setAgentObject] = useState<Graph | null>(null);

  const { mutateAsync: createGraph, isPending: isUploading } =
    usePostV1CreateNewGraph({
      mutation: {
        onSuccess: ({ data }) => {
          setIsOpen(false);
          options?.onSuccess?.();
          toast({
            title: t("Success", "成功"),
            description: t("Workflow uploaded successfully", "工作流上传成功"),
            variant: "default",
          });
          const qID = "flowID";
          window.location.href = `/build?${qID}=${(data as GraphModel).id}`;
        },
        onError: () => {
          toast({
            title: t("Error", "错误"),
            description: t("Error Uploading workflow", "上传工作流出错"),
            variant: "destructive",
          });
        },
      },
    });

  const form = useForm<z.infer<typeof uploadAgentFormSchema>>({
    resolver: zodResolver(uploadAgentFormSchema),
    defaultValues: {
      agentName: "",
      agentDescription: "",
      agentFile: "",
    },
  });

  const agentFileValue = form.watch("agentFile");
  const prevAgentObjectRef = useRef<Graph | null>(null);

  useEffect(() => {
    if (!agentFileValue) {
      const prevAgent = prevAgentObjectRef.current;
      if (prevAgent) {
        const currentName = form.getValues("agentName");
        const currentDescription = form.getValues("agentDescription");
        if (currentName === prevAgent.name) {
          form.setValue("agentName", "");
        }
        if (currentDescription === prevAgent.description) {
          form.setValue("agentDescription", "");
        }
      }
      setAgentObject(null);
      prevAgentObjectRef.current = null;
      return;
    }

    try {
      const base64Match = agentFileValue.match(/^data:[^;]+;base64,(.+)$/);
      if (!base64Match) {
        throw new Error("Invalid base64 data URL format");
      }

      const base64String = base64Match[1];
      const jsonString = atob(base64String);
      const obj = JSON.parse(jsonString);

      if (
        !["name", "description", "nodes", "links"].every(
          (key) => key in obj && obj[key] != null,
        )
      ) {
        throw new Error(
          "Invalid workflow file. Please upload a valid agent.json file that has been previously exported from the AutoGPT platform. The file must contain the required fields: name, description, nodes, and links.",
        );
      }

      const agent = obj as Graph;
      sanitizeImportedGraph(agent);
      setAgentObject(agent);
      prevAgentObjectRef.current = agent;

      if (!form.getValues("agentName")) {
        form.setValue("agentName", agent.name);
      }
      if (!form.getValues("agentDescription")) {
        form.setValue("agentDescription", agent.description);
      }
    } catch (error) {
      console.error("Error loading agent file:", error);

      toast({
        title: t("Invalid Workflow File", "无效的工作流文件"),
        description: t(
          "Please upload a valid agent.json file that has been previously exported from the AutoGPT platform. The file must contain the required fields: name, description, nodes, and links.",
          "请上传之前从 AutoGPT 平台导出的有效 agent.json 文件，必须包含 name、description、nodes 和 links 字段。",
        ),
        duration: 5000,
        variant: "destructive",
      });

      form.resetField("agentFile");
      setAgentObject(null);
    }
  }, [agentFileValue, form, toast, t]);

  async function onSubmit(values: z.infer<typeof uploadAgentFormSchema>) {
    if (!agentObject) {
      form.setError("root", {
        message: t("No workflow object to save", "没有可保存的工作流对象"),
      });
      return;
    }

    const payload: Graph = {
      ...agentObject,
      name: values.agentName,
      description: values.agentDescription,
      is_active: true,
    };

    await createGraph({
      data: {
        graph: payload,
        source: "upload",
      },
    });
  }

  return {
    onSubmit,
    isUploading,
    isOpen,
    setIsOpen,
    form,
    agentObject,
  };
}
