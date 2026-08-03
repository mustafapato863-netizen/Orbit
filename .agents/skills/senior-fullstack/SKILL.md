---
name: senior-fullstack
description: >-
  Senior full-stack engineering skill for Next.js App Router, TypeScript, Prisma, PostgreSQL, Tailwind, React Hook Form, and automated testing.
---

# Senior Full-Stack Engineering Architecture

Use this skill when architecting, building, or refactoring full-stack Next.js web applications.

## 1. Stack Integration Architecture
- **Single Monolithic Repository**: Keep frontend components, server actions, database migrations, and report generators in one unified Next.js App Router application.
- **End-to-End Type Safety**: Share TypeScript types and Zod schemas between database models, server actions, forms, and component props.

## 2. Server Action & Component Workflow
1. Client submits React Hook Form.
2. Zod validates payload on client for instant UI feedback.
3. Server Action re-validates payload with Zod for security.
4. Server Action verifies user session (`AUTH_SECRET` token / session cookie) and project permissions.
5. Server Action runs transactional Prisma query (`prisma.$transaction`).
6. Server Action records an `AuditLog` entry.
7. Server Action revalidates target path (`revalidatePath`) and returns standard success/failure response (`{ success: true, data }`).

## 3. Verification & Quality Assurance
- **Unit & Integration Tests**: Verify progress calculations, stage transitions, and risk level formulas using Vitest.
- **E2E Automation**: Test key flows (login, task update, report export) using Playwright.
