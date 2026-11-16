import { z } from "zod";

export function createApiKeyConnectSchema(
  t: (english: string, chinese: string) => string = (english) => english,
) {
  return z
    .object({
      title: z
        .string()
        .trim()
        .min(1, t("Name is required", "请输入名称"))
        .max(
          100,
          t("Name must be 100 characters or less", "名称不能超过 100 个字符"),
        ),
      apiKey: z
        .string()
        .trim()
        .min(1, t("API key is required", "请输入 API 密钥")),
      expiresAt: z
        .string()
        .trim()
        .optional()
        .superRefine((value, ctx) => {
          if (!value) return;
          const parsed = Date.parse(value);
          if (Number.isNaN(parsed)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("Pick a valid date", "请选择有效日期"),
            });
            return;
          }
          if (parsed <= Date.now()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t(
                "Expiry must be in the future",
                "到期时间必须晚于当前时间",
              ),
            });
          }
        }),
    })
    .strict();
}

export const apiKeyConnectSchema = createApiKeyConnectSchema();

export type ApiKeyConnectFormValues = z.infer<typeof apiKeyConnectSchema>;
