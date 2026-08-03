---
name: senior-prompt-engineer
description: >-
  Senior prompt engineering skill for designing structured system prompts, persona specifications, tool-use guidance, subagent instructions, and context optimization.
---

# Senior Prompt Engineering Methodology

Use this skill when designing, authoring, or optimizing system prompts, subagent prompts, instructions, or LLM templates.

## 1. System Prompt Construction
- **Role & Identity**: Explicitly declare role, domain expertise, target technology stack, and standard behaviors.
- **Constraints & Rules**: Clearly list non-negotiable rules, formatting boundaries, security constraints, and anti-patterns (what NOT to do).
- **Structured Sections**: Use clear Markdown headers (`#`, `##`, bullet points) and structured blocks to maximize attention and instruction adherence.

## 2. Tool Invocation & Subagent Guidance
- **Explicit Parameters**: Define exact input/output formats for function/tool calling.
- **Controlled Execution Flow**: Direct agents to take action immediately, inspect logs, run verification, and avoid unnecessary back-and-forth prompts.
- **Context Efficiency**: Instruct agents to read target lines or slice outputs to protect context windows.
