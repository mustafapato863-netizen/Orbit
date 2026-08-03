---
name: senior-backend
description: >-
  Senior backend architecture skill for PostgreSQL, Prisma ORM, Server Actions, RBAC authorization, transactional security, audit logging, and report generators.
---

# Senior Backend Architecture & Data Guidelines

Use this skill when designing, implementing, or auditing database schemas, server actions, route handlers, or backend services.

## 1. Database & Prisma Schema Integrity
- **Relational Integrity**: Use clear primary keys, foreign key constraints, indexes on lookup fields (`projectId`, `milestoneId`, `stageId`, `ownerId`), and strict unique constraints.
- **Enums**: Utilize Prisma `enum`s for fixed domain sets (`ProjectStatus`, `MilestoneStatus`, `WorkItemStatus`, `RiskLevel`, `DeliveryStageCode`, `WorkstreamCode`, `MembershipRole`).
- **Join Tables**: Never store comma-separated IDs or arrays of foreign keys in string fields. Use join tables (e.g. `MilestoneSharedCapability`, `WorkItemWorkstream`) for many-to-many relationships.
- **Soft Deletion & Audit Logging**: Track `createdAt`, `updatedAt`, and write audit logs (`AuditLog` model) for entity modifications.

## 2. Server Actions & Security
- **Authentication & Project Scope**: Verify `userId` and user role per request. Scope all database operations strictly to authorized projects.
- **Server Validation**: Validate all payload data using Zod (`z.object({...})`) on the server. Never trust client validation alone.
- **Error Handling**: Catch database errors safely; return friendly error messages without exposing connection strings or database internals.

## 3. Report & File Generation
- **PowerPoint & Excel Generation**: Use `PptxGenJS` and `ExcelJS` to compile server-side reports dynamically. Ensure generated files contain zero credentials or internal secrets.
