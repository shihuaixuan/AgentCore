import type { Locale } from "@/lib/i18n/locale";

const PDF_MIME_TYPE = "application/pdf";
const GENERIC_MIME_TYPES = new Set(["", "application/octet-stream"]);
const PDF_SIGNATURE = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

export async function validatePDFBlob(
  blob: Blob,
  locale: Locale = "en",
): Promise<Blob> {
  const mimeType = blob.type.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  const header = new Uint8Array(
    await blob.slice(0, PDF_SIGNATURE.length).arrayBuffer(),
  );
  const hasPDFSignature = PDF_SIGNATURE.every(
    (byte, index) => header[index] === byte,
  );
  const hasAllowedMimeType =
    mimeType === PDF_MIME_TYPE || GENERIC_MIME_TYPES.has(mimeType);

  if (!hasAllowedMimeType || !hasPDFSignature) {
    throw new Error(
      locale === "zh-CN"
        ? "返回的文件不是有效的 PDF"
        : "The file response is not a valid PDF",
    );
  }

  return mimeType === PDF_MIME_TYPE
    ? blob
    : new Blob([blob], { type: PDF_MIME_TYPE });
}
