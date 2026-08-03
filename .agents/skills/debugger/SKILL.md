---
name: debugger
description: >-
  Advanced debugging skill for empirical root-cause analysis, log inspection, stack trace isolation, regression prevention, and fix verification.
---

# Advanced Debugging & Root-Cause Analysis

Use this skill when investigating runtime errors, broken builds, test failures, or unexpected web application behavior.

## 1. Empirical Investigation Protocol
- **Read Un-truncated Logs First**: Before forming diagnostic hypotheses, fetch and inspect full build, server, or browser console error logs.
- **Trace Back to Source**: Identify exact line numbers, call stacks, module resolution paths, and parameter values.
- **No Symptom Masking**: Fix underlying root causes instead of swallowing exceptions, inserting dummy try-catches, or deleting failing assertions.

## 2. System Diagnostic Steps
1. **Identify Failure Trigger**: Inspect command exit code, log output, or error stack trace.
2. **Isolate Component**: Determine if failure originates in client component, server action, Prisma ORM query, database connection, or environment variable resolution.
3. **Reproduce & Verify**: Run exact failing command or test script to confirm error behavior.
4. **Apply Fix**: Refactor broken code, update schema, or adjust configuration.
5. **Re-run Verification**: Execute build/test commands (`npm run build`, `npm run typecheck`, `npm run test`) to confirm resolution without side effects.
