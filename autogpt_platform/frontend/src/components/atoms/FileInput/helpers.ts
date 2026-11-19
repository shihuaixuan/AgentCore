import type { Locale } from "@/lib/i18n/locale";

export function getFileLabel(
  filename: string,
  contentType?: string,
  locale: Locale = "en",
) {
  if (contentType) {
    const mimeParts = contentType.split("/");
    if (mimeParts.length > 1) {
      return locale === "zh-CN"
        ? `${mimeParts[1].toUpperCase()} 文件`
        : `${mimeParts[1].toUpperCase()} file`;
    }
    return locale === "zh-CN" ? `${contentType} 文件` : `${contentType} file`;
  }

  const pathParts = filename.split(".");
  if (pathParts.length > 1) {
    const ext = pathParts.pop();
    if (ext)
      return locale === "zh-CN"
        ? `${ext.toUpperCase()} 文件`
        : `${ext.toUpperCase()} file`;
  }
  return locale === "zh-CN" ? "文件" : "File";
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } else if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${bytes} B`;
  }
}
