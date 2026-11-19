import { useDeleteWorkspaceFile } from "@/app/api/__generated__/endpoints/workspace/workspace";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { uploadFileDirect } from "@/lib/direct-upload";
import { parseWorkspaceFileID, buildWorkspaceURI } from "@/lib/workspace-uri";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function useWorkspaceUpload() {
  const { t, locale } = useTranslation();
  const { toast } = useToast();

  const { mutate: deleteMutation } = useDeleteWorkspaceFile({
    mutation: {
      onError: () => {
        toast({
          title: t("Failed to delete file", "删除文件失败"),
          description: t(
            "The file could not be removed from storage.",
            "无法从存储空间中删除此文件。",
          ),
          variant: "destructive",
        });
      },
    },
  });

  async function handleUploadFile(file: File) {
    const d = await uploadFileDirect(file, undefined, locale);
    return {
      file_name: d.name,
      size: d.size_bytes,
      content_type: d.mime_type,
      file_uri: buildWorkspaceURI(d.file_id, d.mime_type),
    };
  }

  function handleDeleteFile(fileURI: string) {
    const fileID = parseWorkspaceFileID(fileURI);
    if (!fileID) return;
    deleteMutation({ fileId: fileID });
  }

  return { handleUploadFile, handleDeleteFile };
}
