import z from "zod";
import { validateYouTubeUrl } from "@/lib/utils";

// Mirrors SUB_HEADING_MAX_LENGTH in backend/api/features/store/model.py.
export const SUB_HEADING_MAX = 100;

// Create conditional schema that changes based on whether it's a marketplace update
export const publishAgentSchemaFactory = (
  isMarketplaceUpdate: boolean = false,
  t: (english: string, chinese: string) => string = (english) => english,
) => {
  const baseSchema = {
    changesSummary: isMarketplaceUpdate
      ? z
          .string()
          .min(
            1,
            t(
              "Changes summary is required for updates",
              "更新时必须填写更改摘要",
            ),
          )
          .max(
            500,
            t(
              "Changes summary must be less than 500 characters",
              "更改摘要必须少于 500 个字符",
            ),
          )
      : z.string().optional(),
    title: isMarketplaceUpdate
      ? z
          .string()
          .optional()
          .refine(
            (val) => !val || val.length <= 100,
            t(
              "Title must be less than 100 characters",
              "标题必须少于 100 个字符",
            ),
          )
      : z
          .string()
          .min(1, t("Title is required", "请输入标题"))
          .max(
            100,
            t(
              "Title must be less than 100 characters",
              "标题必须少于 100 个字符",
            ),
          ),
    subheader: z
      .string()
      .trim()
      .min(1, t("Tagline is required", "请输入简短介绍"))
      .max(
        SUB_HEADING_MAX,
        t(
          `Tagline must be ${SUB_HEADING_MAX} characters or less`,
          `简短介绍不能超过 ${SUB_HEADING_MAX} 个字符`,
        ),
      ),
    slug: isMarketplaceUpdate
      ? z
          .string()
          .optional()
          .refine(
            (val) => !val || (val.length <= 50 && /^[a-z0-9-]+$/.test(val)),
            t(
              "Slug can only contain lowercase letters, numbers, and hyphens",
              "网址标识只能包含小写字母、数字和连字符",
            ),
          )
      : z
          .string()
          .min(1, t("Slug is required", "请输入网址标识"))
          .max(
            50,
            t(
              "Slug must be less than 50 characters",
              "网址标识必须少于 50 个字符",
            ),
          )
          .regex(
            /^[a-z0-9-]+$/,
            t(
              "Slug can only contain lowercase letters, numbers, and hyphens",
              "网址标识只能包含小写字母、数字和连字符",
            ),
          ),
    youtubeLink: isMarketplaceUpdate
      ? z
          .string()
          .optional()
          .refine(
            (val) => !val || validateYouTubeUrl(val),
            t("Please enter a valid YouTube URL", "请输入有效的 YouTube URL"),
          )
      : z
          .string()
          .refine(
            validateYouTubeUrl,
            t("Please enter a valid YouTube URL", "请输入有效的 YouTube URL"),
          ),
    category: z.string().min(1, t("Category is required", "请选择分类")),
    description: isMarketplaceUpdate
      ? z
          .string()
          .optional()
          .refine(
            (val) => !val || val.length <= 1000,
            t(
              "Description must be less than 1000 characters",
              "描述必须少于 1000 个字符",
            ),
          )
      : z
          .string()
          .min(1, t("Description is required", "请输入描述"))
          .max(
            1000,
            t(
              "Description must be less than 1000 characters",
              "描述必须少于 1000 个字符",
            ),
          ),
    recommendedScheduleCron: z.string().optional(),
    instructions: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.length <= 2000,
        t(
          "Instructions must be less than 2000 characters",
          "使用说明必须少于 2000 个字符",
        ),
      ),
    agentOutputDemo: isMarketplaceUpdate
      ? z
          .string()
          .optional()
          .refine(
            (val) => !val || validateYouTubeUrl(val),
            t("Please enter a valid YouTube URL", "请输入有效的 YouTube URL"),
          )
      : z
          .string()
          .refine(
            validateYouTubeUrl,
            t("Please enter a valid YouTube URL", "请输入有效的 YouTube URL"),
          ),
  };

  return z.object(baseSchema);
};

export type PublishAgentFormData = z.infer<
  ReturnType<typeof publishAgentSchemaFactory>
>;

export interface PublishAgentInfoInitialData {
  agent_id: string;
  title: string;
  subheader: string;
  slug: string;
  thumbnailSrc: string;
  youtubeLink: string;
  category: string;
  description: string;
  additionalImages?: string[];
  recommendedScheduleCron?: string;
  instructions?: string;
  agentOutputDemo?: string;
  changesSummary?: string;
}
