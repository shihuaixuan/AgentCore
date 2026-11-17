const LABELS: Record<string, string> = {
  "First Wins": "初试身手",
  "Kickstart your journey with quick wins.": "完成简单任务，开启使用之旅。",
  "Complete onboarding": "完成入门引导",
  "Hire an expert or get a workflow from the marketplace":
    "从市场聘用专家或获取工作流",
  "Hire an expert in the Marketplace, or add one of its workflows to your Library":
    "在市场聘用专家，或将工作流添加到工作流库",
  "Open the Library page and run a workflow": "打开工作流库并运行工作流",
  "Go to the Library, open a workflow you want, and run it":
    "前往工作流库，打开所需工作流并运行",
  "Consistency Challenge": "持续使用挑战",
  "Build your rhythm and make workflows part of your routine.":
    "养成习惯，让工作流融入日常。",
  "Schedule your first workflow": "首次设置工作流定时运行",
  "Schedule a workflow to run on a recurring basis": "设置工作流周期性运行",
  "Run workflows 3 days in a row": "连续 3 天运行工作流",
  "Run any workflows from the Library or Builder for 3 days in a row":
    "连续 3 天从工作流库或构建器运行任意工作流",
  "The Pro Playground": "进阶探索",
  "Master powerful features to supercharge your workflow.":
    "掌握强大功能，提升工作流效率。",
  "Trigger a workflow via webhook": "通过 Webhook 触发工作流",
  "In the Builder, go to Settings and copy the Webhook URL. Use it to trigger your workflow from another app.":
    "在构建器设置中复制 Webhook URL，即可从其他应用触发工作流。",
  "Run workflows 14 days in a row": "连续 14 天运行工作流",
  "Run any workflows from the Library or Builder for 14 days in a row":
    "连续 14 天从工作流库或构建器运行任意工作流",
  "Complete 100 workflow runs": "完成 100 次工作流运行",
  "Let your workflows run and complete 100 tasks in total":
    "运行工作流，累计完成 100 项任务",
};

export function taskLabel(label: string) {
  return LABELS[label] ?? label;
}
