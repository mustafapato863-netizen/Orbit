---
name: code-reviewer
description: >-
  Code review and audit skill for evaluating TypeScript, Next.js, Prisma schema, security, permissions, and architectural alignment.
---

# Code Reviewer Guidelines & Checklist

Use this skill when auditing, reviewing, or refactoring code for security, performance, correctness, and architectural consistency.

## 1. Security & Authorization Audit
- **Authentication & RBAC**: Verify that every Server Action and Route Handler explicitly checks authentication (`getSession` / `getCurrentUser`) and enforces role-based access control (RBAC) permissions.
- **Secret Leaks**: Ensure no secret environment variables (e.g. `AUTH_SECRET`, database passwords) are exposed to client components or `NEXT_PUBLIC_` prefixed variables.
- **Input Validation**: Confirm all external inputs (forms, route parameters, request bodies) are validated using Zod schemas before database queries or mutations.

## 2. Type Safety & TypeScript Strictness
- **Strict Types**: Eliminate `any` types. Ensure explicit return types on public utility functions and API handlers.
- **Null & Undefined Safety**: Verify proper optional chaining (`?.`) and nullish coalescing (`??`) to prevent runtime crashes.

## 3. Database & Performance Optimization
- **N+1 Query Prevention**: Ensure Prisma queries include necessary relations via `include` or batch requests rather than looping asynchronous calls.
- **Index Optimization**: Confirm foreign keys and frequently filtered columns (e.g., `projectId`, `milestoneId`, `deliveryStageId`) have proper database indexes.
- **Memory & Resource Leak**: Verify streams and database connections are properly handled.

## 4. Component & UI Best Practices
- **Server vs Client Component Split**: Check that components marked `'use client'` actually require client state/effects, keeping server components lean and data-fetching server-side.
- **Error Boundaries & Fallbacks**: Confirm dynamic boundaries use `Suspense` and clear error fallbacks.
