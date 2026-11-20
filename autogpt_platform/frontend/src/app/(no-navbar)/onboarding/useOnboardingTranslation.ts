"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

const COPY: Record<string, string> = {
  "Talk to me about your work": "说说你的工作",
  "Write to me about your work": "写下你的工作情况",
  "That didn't go through.": "未能发送成功。",
  "What do you want off your plate?": "你最想交出哪些工作？",
  "A few sentences is plenty.": "简单说几句就够了。",
  "Start anywhere. What did you do yesterday that bored you?":
    "从任何地方开始都可以。昨天有哪些工作让你觉得乏味？",
  "Even a minute helps. Keep going if you have more.":
    "一分钟也有帮助。还有想说的就继续。",
  "Keep going, this is gold": "继续说，这些信息很有价值",
  "The more you share, the better your assistant understands your work":
    "分享越多，助手就越了解你的需求",
  "You're building your assistant's memory right now": "你正在帮助助手建立记忆",
  "You're doing great. Keep going": "说得很好，继续吧",
  "Every detail helps your assistant": "每个细节都能让助手更好地帮助你",
  "Share whatever comes to mind next": "想到什么就接着说吧",
  "You're offline. We'll send this when you're back.":
    "当前离线，恢复连接后会自动发送。",
  "We couldn't store your recording on our side.": "服务器未能保存你的录音。",
  "Your recording didn't reach us.": "服务器未收到你的录音。",
  "Part of your recording didn't reach us.": "部分录音未能上传成功。",
  "We couldn't turn your recording into text.": "未能将录音转为文字。",
  "Our speech-to-text service is unavailable.": "语音转文字服务暂不可用。",
  "We couldn't check what you told us just now.":
    "暂时无法检查你刚才提供的内容。",
  "Something newer you sent, maybe from another tab, replaced this.":
    "你新发送的内容替换了本次内容，可能来自另一个标签页。",
  "You've tried a few times already. Wait a bit first.":
    "尝试次数较多，请稍后再试。",
  "Personalization is unavailable for a moment.": "个性化服务暂不可用。",
  "We couldn't reach the server. Check your connection.":
    "无法连接服务器，请检查网络。",
  "Got it. So tell me,": "明白了，请告诉我，",
  "I couldn't hear any words. Check that your mic is on, then tell me,":
    "没有听到语音。请确认麦克风已开启，然后告诉我，",
  "No problem. Let's start with an easy one.":
    "没关系，我们从一个简单问题开始。",
  "Loud and clear! So tell me,": "听得很清楚！请告诉我，",
  "Hi, great to meet you! So tell me,": "你好，很高兴认识你！请告诉我，",
  "No pressure, any answer works. So tell me,":
    "不用有压力，随便说说就好。请告诉我，",
  "No worries, we'll keep it quick. So tell me,":
    "别担心，很快就好。请告诉我，",
  "Just one task you'd hand off is plenty.": "说一项你想交出的工作就够了。",
  "You can skip below. But first, tell me,": "你可以在下方跳过。不过先告诉我，",
  "I'm your assistant, here to take work off your hands.":
    "我是你的助手，来帮你分担工作。",
  "No rush, take your time. When you're ready,": "不着急，慢慢来。准备好后，",
  "Sorry, I'll keep this quick. So tell me,": "抱歉，我们尽快完成。请告诉我，",
  "Thanks, that's a good start! So tell me,":
    "谢谢，这是个好的开始！请告诉我，",
  "I only caught a little of that. So tell me,": "我只听清了一部分。请告诉我，",
  "Got your test! So tell me,": "收到测试了！请告诉我，",
  "Your browser blocked the microphone, so write here instead.":
    "浏览器阻止了麦克风访问，你可以在这里输入文字。",
  "To talk, allow the microphone in your browser's site settings (the lock or microphone icon by the address bar), then":
    "如需语音输入，请在浏览器网站设置中允许麦克风访问（地址栏旁的锁或麦克风图标），然后",
  "The microphone prompt was closed, so write here instead.":
    "麦克风权限提示已关闭，你可以在这里输入文字。",
  "To talk,": "如需语音输入，请",
  "We couldn't open your microphone, so write here instead.":
    "无法打开麦克风，你可以在这里输入文字。",
  "To talk, check that it's connected and no other app is using it, then":
    "如需语音输入，请确认麦克风已连接且未被其他应用占用，然后",
  "Your computer blocked the microphone, so write here instead.":
    "电脑阻止了麦克风访问，你可以在这里输入文字。",
  "To talk, let your browser use the microphone in your computer's privacy settings, then":
    "如需语音输入，请在电脑隐私设置中允许浏览器使用麦克风，然后",
  "Discarding this take…": "正在丢弃录音…",
  "Sending your recording…": "正在发送录音…",
  "Starting a fresh take…": "正在开始新的录音…",
  "Canceling recording": "正在取消录音",
  "Sending recording": "正在发送录音",
  "Restarting recording": "正在重新录音",
  "Turning your brain dump into tasks": "正在将工作描述整理为任务",
  "Finding experts who fit your work": "正在寻找适合你的专家",
  "Choosing who takes each task": "正在为每项任务安排负责人",
};

export function useOnboardingTranslation() {
  const { t } = useTranslation();

  function translateCopy(text: string) {
    return Object.hasOwn(COPY, text) ? t(text, COPY[text]) : text;
  }

  return { translateCopy };
}
