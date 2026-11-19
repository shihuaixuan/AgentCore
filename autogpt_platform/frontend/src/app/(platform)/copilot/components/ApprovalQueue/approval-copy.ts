import type { Locale } from "@/lib/i18n/locale";

const HEADLINES: Readonly<Record<string, string>> = {
  Run: "运行",
  "Run a command in the sandbox": "在沙盒中运行命令",
  "Act on the open page": "在当前页面执行操作",
  "Post a message": "发布消息",
  "Edit a posted message": "编辑已发布的消息",
  "Create a workflow": "创建工作流",
  "Customize a workflow": "定制工作流",
  "Edit a workflow": "编辑工作流",
  "Fix a workflow": "修复工作流",
  "Start building a workflow": "开始构建工作流",
  "Create folder": "创建文件夹",
  "Create library folder": "创建资源库文件夹",
  "Update library folder": "更新资源库文件夹",
  "Move library folder": "移动资源库文件夹",
  "Delete library folder": "删除资源库文件夹",
  "Move workflows into library folder": "将工作流移入资源库文件夹",
  "Update preset": "更新预设",
  "Delete a preset": "删除预设",
  "Schedule a follow-up": "安排后续任务",
  "Schedule a routine": "安排定期任务",
  "Pause a schedule": "暂停计划",
  "Resume a schedule": "恢复计划",
  "Delete a schedule": "删除计划",
  "Set up the trigger": "设置触发器",
  "File a feature request": "提交功能建议",
  "Confirm the team change": "确认团队变更",
  "Confirm the teammate change": "确认成员变更",
  "Give a teammate a workflow": "为成员分配工作流",
  "Take a workflow from a teammate": "移除成员的工作流",
  "Give a teammate an account": "向成员授予账户权限",
  "Take an account from a teammate": "撤销成员的账户权限",
  "Hand a task to a teammate": "将任务交给成员",
  "Hand this chat to a teammate": "将此对话转交给成员",
  "Message another chat": "向其他对话发送消息",
  "Start a subtask": "启动子任务",
  "Delete skill": "删除技能",
  "Delete workspace file": "删除工作区文件",
  "Forget memories": "遗忘记忆",
  "Run a block": "运行模块",
  "Run a workflow": "运行工作流",
};

export function approvalHeadline(
  ask: string,
  toolName: string,
  locale: Locale = "en",
) {
  if (locale !== "zh-CN") return ask;
  if (HEADLINES[ask]) return HEADLINES[ask];
  const read = ask.match(/^Let (.+) read(?: what (.+) returned)?$/);
  if (read)
    return read[2]
      ? `允许 ${read[1]} 读取 ${read[2]} 返回的内容`
      : `允许 ${read[1]} 读取`;
  const generated = `Run ${toolName.replaceAll("_", " ")}`;
  return ask === generated || ask === toolName ? `运行 ${toolName}` : ask;
}
