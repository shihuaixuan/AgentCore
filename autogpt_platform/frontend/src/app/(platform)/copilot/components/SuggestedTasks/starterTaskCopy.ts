import type { Locale } from "@/lib/i18n/locale";

const chineseCopy = new Map<string, string>([
  [
    "Build a list of 25 companies that look like your best customers",
    "列出 25 家与你的优质客户相似的公司",
  ],
  ["Most founders start here.", "大多数创始人都从这里开始。"],
  [
    "Draft next week's posts and a newsletter in your voice",
    "用你的口吻起草下周的帖子和一期简报",
  ],
  [
    "So something goes out while you build.",
    "让你专心做产品时，也能按时发布内容。",
  ],
  [
    "Set up a Monday summary of your numbers, pulled from your tools",
    "每周一自动从你使用的工具中汇总关键数据",
  ],
  ["Until you hire someone for it.", "在招到专人之前，先让助手代劳。"],
  [
    "Write a one-page pitch for your next investor or partner call",
    "为下次与投资人或合作伙伴的通话准备一页推介材料",
  ],
  [
    "Research three competitors and what they charge",
    "调研三家竞争对手及其定价",
  ],
  [
    "Turn your weekly checklist into a tracker that chases itself",
    "把每周清单做成能自动跟进的进度表",
  ],
  [
    "The thing that comes back every week.",
    "每周都要重复的工作，不必再手动跟进。",
  ],
  [
    "Draft the vendor follow-ups you send every week",
    "起草每周发给供应商的跟进邮件",
  ],
  [
    "Build the report you assemble by hand so it builds itself",
    "自动生成你一直手动整理的报表",
  ],
  [
    "Write the three procedures your team keeps asking you about",
    "把团队反复问起的三项流程写成指南",
  ],
  ["Clean up the spreadsheet you live in", "整理你每天都在用的电子表格"],
  [
    "Build a list of 25 prospects that match your best customers",
    "列出 25 个与你的优质客户相似的潜在客户",
  ],
  [
    "A clean list is where sales weeks start.",
    "用一份清晰的客户名单开始本周的销售工作。",
  ],
  [
    "Write the follow-up sequence you never get to",
    "写好你一直没空准备的系列跟进消息",
  ],
  [
    "Prep a one-page brief before each meeting on your calendar",
    "为日历里的每场会议准备一页会前简报",
  ],
  [
    "Keep your CRM clean without you touching it",
    "自动整理客户关系管理系统里的资料",
  ],
  [
    "Research five accounts and what changed for them this month",
    "调研五家客户本月的最新动态",
  ],
  [
    "Draft next week's posts in your voice, ready to edit",
    "用你的口吻写好下周的帖子初稿，供你修改",
  ],
  ["The backlog most marketers carry.", "这是许多营销人员积压的工作。"],
  ["Write the newsletter that keeps slipping", "写好那份一再推迟的简报"],
  [
    "Watch three competitors and send a Monday note on what they did",
    "跟踪三家竞争对手，每周一发送动态简报",
  ],
  [
    "Pull your channel numbers into one weekly report",
    "把各渠道的数据汇总成一份周报",
  ],
  ["Turn one long piece into five short ones", "把一篇长文改写成五篇短文"],
  [
    "Turn this week's customer feedback into a ranked list",
    "按优先级整理本周的客户反馈",
  ],
  [
    "Feedback piles up faster than anyone reads it.",
    "反馈来得快，往往还没读完就又攒了一批。",
  ],
  ["Draft the spec you have been putting off", "起草你一直没空写的需求文档"],
  [
    "Watch three competitors and tell you what they shipped",
    "跟踪三家竞争对手，了解他们发布了什么",
  ],
  ["Build your Monday metrics summary", "制作每周一的指标简报"],
  [
    "Write the release notes from this week's changes",
    "根据本周的改动编写发布说明",
  ],
  [
    "Write this week's status update from what shipped",
    "根据本周交付的成果撰写进展报告",
  ],
  [
    "The Friday hour most engineers lose.",
    "帮你省下许多工程师每周五用来写周报的那一小时。",
  ],
  ["Draft the docs your team keeps asking for", "起草团队反复向你索要的文档"],
  [
    "Watch the tools and libraries you depend on for changes",
    "跟踪项目所依赖的工具和软件库的更新",
  ],
  ["Answer the questions customers keep sending", "解答客户反复提出的问题"],
  [
    "Build the report your manager asks for every week",
    "制作主管每周需要的报告",
  ],
  [
    "Screen this week's applicants against the role",
    "按岗位要求初筛本周的应聘者",
  ],
  ["The pile that grows every day.", "每天都有新申请，别让简历越积越多。"],
  [
    "Draft the job post for the role you are hiring",
    "为正在招聘的岗位起草招聘启事",
  ],
  [
    "Schedule interviews without the back and forth",
    "安排面试时间，省去来回沟通",
  ],
  [
    "Write the first-week onboarding plan for your next hire",
    "为下一位新员工制定入职首周计划",
  ],
  [
    "Pull the people numbers you report every month",
    "汇总每月需要上报的人力资源数据",
  ],
  [
    "Find the two tasks eating your week and hand them off",
    "找出每周最耗时的两项任务，交给助手处理",
  ],
  ["Start with what costs you the most time.", "从最占用你时间的工作开始。"],
  [
    "Get a sourced research brief on anything in minutes",
    "几分钟内拿到一份注明来源的专题调研简报",
  ],
  [
    "Draft your next post, email or report in your voice",
    "用你的口吻起草下一篇帖子、邮件或报告",
  ],
  ["Set up a Monday summary of what matters to you", "每周一汇总你关心的事项"],
  [
    "Watch something for you and tell you when it changes",
    "跟踪你关心的事项，有变化就通知你",
  ],
]);

export function localizeStarterCopy(text: string, locale: Locale) {
  return locale === "zh-CN" ? (chineseCopy.get(text) ?? text) : text;
}
