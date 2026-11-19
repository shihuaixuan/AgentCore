import type { TourCompletionArtifact } from "./types";

export const dailyBriefArtifactChinese: TourCompletionArtifact = {
  filename: "daily-brief-jul-2.md",
  markdown: `# 今日简报 — 7 月 2 日，周四

早上好！以下是今天需要你关注的事项。

## 📅 日程

| 时间 | 会议 | 状态 |
| --- | --- | --- |
| 上午 9:30 | 路线图评审 | ⚠️ 演示文稿尚未共享 |
| 下午 1:00 | 与 Jordan 一对一沟通 | 议程已准备好 |
| 下午 4:30 | 招聘同步会 | 2 位候选人待评估 |

## 📬 收件箱摘要

- **Acme Corp** — 3 封未读邮件，附有合同修订稿。法务标注了第 4.2 条。
- **Jordan** — 仍在等待你回复第三季度定价方案。
- **订阅邮件摘要** — 已自动归档 12 个低优先级邮件会话。

## ✅ 建议优先处理

1. 在上午 9:30 评审前共享路线图演示文稿。
2. 回复 Jordan — 发件箱里已有一份草稿。
3. 在法务今天下班前的截止时间之前，浏览 Acme 的合同修订。

---

_由 **晨间简报** 生成 · 每个工作日上午 7:00 运行_
`,
};

export const callPrepArtifactChinese: TourCompletionArtifact = {
  filename: "call-prep-acme-corp.md",
  markdown: `# 通话准备 — Acme Corp · 下午 2:00

## 🏢 公司概况

- B 轮融资，约 140 人 — **3 月融资 3,000 万美元**（Northline Ventures 领投）
- 总部位于美国得克萨斯州奥斯汀 · 企业物流软件
- 上个季度运营与数据工程岗位的招聘明显增加

## 👤 会面对象

**Dana Patel — 运营副总裁**（第二次通话）

- 14 个月前从 Flexport 加入 Acme
- 负责你这笔交易所属的供应商整合计划
- 更喜欢先看数据，再看演示文稿

## 🧵 待跟进事项

- 对按席位计费模式的**价格异议** — 上次通话后，Dana 希望提供按用量计费的选项。
- 安全问卷已返回，你方还有两项待补充。

## 💡 建议沟通要点

1. 先介绍现在可以提供的按用量计费试点方案。
2. 确认本周交付安全问卷中的待办项。
3. 询问第三季度供应商整合的时间表 — 预算即将截止。

---

_由 **通话准备助手** 生成 · 外部通话前 30 分钟运行_
`,
};

export const competitorWatchArtifactChinese: TourCompletionArtifact = {
  filename: "competitor-pricing-report.md",
  markdown: `# 检测到价格变化 — 竞品 Pro 方案

**competitor.com/pricing** · 今天上午 8:02 检查

## 📈 变化内容

| 方案 | 变化前 | 变化后 | 变化幅度 |
| --- | --- | --- | --- |
| Starter | $19/月 | $19/月 | — |
| **Pro** | **$49/月** | **$59/月** | **+20.4%** |
| Enterprise | 定制报价 | 定制报价 | — |

## 🔍 详情

- Pro 方案的文案现在包含“优先支持”，此前需单独付费。
- 年付折扣从 20% 降至 15%。
- Starter 和 Enterprise 方案未检测到变化。

## 🗒️ 快照差异

\`\`\`diff
- Pro — $49/mo, billed annually (save 20%)
+ Pro — $59/mo, billed annually (save 15%), priority support included
\`\`\`

## ✅ 建议后续行动

1. 根据新的价格差距，评估你自己的 Pro 方案定位。
2. 为销售团队准备要点，帮助他们回应本周比较方案的潜在客户。

---

_由 **竞品价格监测** 生成 · 每天上午 8:00 运行_
`,
};

export const supportQueueArtifactChinese: TourCompletionArtifact = {
  filename: "support-queue-triage.md",
  markdown: `# 工单已分类 — 14 张新工单

夜间积压批次 · 40 秒内处理完成

## ✍️ 已起草回复（9 条）— 等待审核

- #4821 “无法导出 CSV” — 已知问题，已附上临时解决办法链接
- #4822 “如何添加团队成员？” — 已起草操作步骤及邀请链接
- #4824、#4826–#4831 — 密码重置和方案问题，已准备标准回复

## 💳 已转交 Sam（3 张）

- #4823 — 年付方案退款申请
- #4825 — 发票上的 VAT 税号错误
- #4832 — 升级时按比例计费的问题

## 🚨 已升级到 #support（2 张）

> **欧洲服务中断报告** — 法兰克福区域的两位客户报告，自上午 5:40 起出现 502 错误。
> 状态页面已更新，已通知值班人员。

- #4833 — API 超时（法兰克福）
- #4834 — 无法访问控制台（法兰克福）

## 📊 工单处理概况

| 指标 | 今天 | 7 天平均 |
| --- | --- | --- |
| 新工单 | 14 | 17 |
| 自动起草回复 | 64% | 58% |
| 首次响应时间 | 4 分钟 | 26 分钟 |

---

_由 **客服工单分类** 生成 · 每天早上 6:00 运行_
`,
};
