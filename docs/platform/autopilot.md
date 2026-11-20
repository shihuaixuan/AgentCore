# AutoPilot

## Overview

AutoPilot is your AI assistant built directly into the AutoGPT Platform. It can perform supported platform actions through natural conversation — from running agents to generating images, conducting research, and building agents for you.

## Accessing AutoPilot

Open AutoPilot from **Home** or **New Task** in the main navigation, or go directly to [platform.agpt.co/copilot](https://platform.agpt.co/copilot).

## What AutoPilot Can Do

AutoPilot can use supported platform tools. Here's what it can help you with:

### Run Agents

Ask AutoPilot to run a supported agent in your [Agent Library](agent-library.md). It will request any missing inputs or credentials before executing it.

### Build Agents

Describe the workflow you want and AutoPilot will create an agent for you in the builder. You can also ask it to edit your existing agents; duplicate a read-only marketplace agent before editing it. See the [Agent Builder Guide](agent-builder-guide.md) for hands-on editing.

### Browse the Marketplace

Ask AutoPilot to find agents for a specific use case and it will search the marketplace for you. You can also browse the [Marketplace](marketplace.md) directly.

### Execute Blocks Directly

AutoPilot can run supported blocks directly without building a full agent. This means you can:

- **Conduct research** with Perplexity
- **Generate images** with the latest image models
- **Edit pictures** using AI image editing blocks
- **Generate videos** using video generation blocks
- **Run supported models** on inference services such as Replicate
- **Make custom HTTP requests** to APIs you configure
- **Write and execute code** with supported coding tools

### Generate Images in Chat

Ask the General Office Assistant or a hired expert for an image, for example: “Generate a picture of an orange cat.” You don't need to change the chat model. To edit an image, attach a PNG, JPEG, or WebP and describe what to change. The result appears in chat and is saved to the chat workspace.

Administrators configure and enable an image model in **Settings → AI Connections**. Chat uses that record's Base URL, model ID and API key for the OpenAI-compatible Images API. The gateway must support `/images/generations` and `/images/edits` and return base64 image data. No personal OpenAI or Replicate connection is needed. The gateway's account is billed.

Enabled `gpt-image-*` models (including provider-prefixed IDs) are recognized automatically. If the user doesn't name a model, Sunburst is preferred, then the oldest enabled image model. To restrict chat images to a particular gateway/model, or use a custom model alias, set `CHAT_MANAGED_IMAGE_MODEL_ID` to the managed record's ID on the backend. If that record is missing, disabled, or doesn't match a user's explicit model request, chat reports the problem instead of switching endpoints.

### Manage Your Library

AutoPilot can help you manage your agent library, view task results, set up schedules, and more.

## Tips for Using AutoPilot

- **Be specific**: The more detail you provide, the better AutoPilot can assist you. Instead of "make me an agent", try "build me an agent that takes a blog topic as input, generates an outline with Claude, then writes the full article".
- **Iterate**: You can refine results by asking follow-up questions or requesting changes.
- **Explore capabilities**: If you're unsure whether AutoPilot supports something, ask it or browse the available blocks.

## AutoPilot vs. the Agent Builder

AutoPilot and the Agent Builder offer complementary ways to work on the platform. AutoPilot can create and edit reusable agents through natural language and run supported blocks directly, while the builder provides hands-on control over the graph.

| | AutoPilot | Agent Builder |
|---|-----------|---------------|
| **Who is it for** | Everyone — no technical knowledge required | Technical users with a grasp of visual programming |
| **Best for** | Natural language interaction, doing things fast, and accessing blocks directly | Hands-on visual control over exactly how an agent is wired together |
| **How it works** | Conversational — describe what you want | Visual — drag, drop, and connect blocks on a canvas |
| **Can build agents** | Yes — describe what you want and it builds the agent for you | Yes — you build the agent manually |
| **Can edit agents** | Yes — for user-created or duplicated editable agents | Yes — full visual editing |
| **Block access** | Can run supported blocks directly without building an agent | Blocks must be connected into an agent workflow |

Choose whichever approach suits you. Many users use both — AutoPilot for speed, and the builder when they want fine-grained visual control over their workflow.
