# Skill Selection & De-duplication Policy

To prevent context window bloat and avoid conflicting guidelines from overlapping skills, Antigravity must strictly adhere to the following skill selection rules for every task.

## Core Rule: Maximum 3 Skills Per Task
- **Strict Limit**: Never activate or load more than **3 skills** for a single task or conversation step.
- **Single Skill Per Domain**: Choose only the single best-fit skill per domain. Never combine overlapping skills that address the same domain.

---

## Domain Routing & Skill Selection Matrix

### Domain 1: UI / UX & Frontend Design
*Choose ONE only:*
- **`ui-ux-pro-max`**: Primary choice for SaaS dashboards, enterprise data tables, layout navigation, and drawer patterns.
- **`frontend-design`**: Use only for aesthetic styling, HSL visual color tokens, CSS micro-animations, or glassmorphic visual polish.
*(Rule: Never activate both `ui-ux-pro-max` and `frontend-design` simultaneously.)*

### Domain 2: Backend & Full-Stack Architecture
*Choose ONE only:*
- **`senior-fullstack`**: Primary choice for feature development involving Next.js App Router, Server Actions, React components, and Zod forms.
- **`senior-backend`**: Use only when doing dedicated database schema design, Prisma migrations, backend security audits, or report generation (PptxGenJS / ExcelJS).
*(Rule: Never activate both `senior-fullstack` and `senior-backend` simultaneously.)*

### Domain 3: Code Quality, Review & Refactoring
*Choose ONE only:*
- **`clean-code`**: Primary choice for code refactoring, applying SOLID/DRY principles, and improving code structure.
- **`code-reviewer`**: Use only during formal code reviews, pull-request checks, security vulnerability audits, or permission verification.
*(Rule: Never activate both `clean-code` and `code-reviewer` simultaneously.)*

### Domain 4: Diagnostics & Testing
*Choose ONE only:*
- **`debugger`**: Primary choice when investigating errors, broken builds, test failures, or log stack traces.
- **`webapp-testing`**: Primary choice when authoring new Vitest unit tests, RTL component tests, or Playwright E2E automation scripts.
*(Rule: Never activate both `debugger` and `webapp-testing` simultaneously.)*

### Domain 5: Agent & Prompt Engineering
- **`senior-prompt-engineer`**: Use only when creating or optimizing agent system prompts, subagent specifications, or LLM instructions.

---

## Example Optimal Skill Bundles (Max 3)

| Task Type | Primary Skill | Secondary Skill | Optional 3rd Skill |
| :--- | :--- | :--- | :--- |
| **New Full-Stack Feature** | `senior-fullstack` | `ui-ux-pro-max` | `clean-code` |
| **Database Migration & Backend API** | `senior-backend` | `code-reviewer` | `clean-code` |
| **Bug Fixing & Error Resolution** | `debugger` | `senior-fullstack` | `clean-code` |
| **Automated Testing Suite** | `webapp-testing` | `senior-fullstack` | `code-reviewer` |
| **Subagent / Skill Prompt Creation** | `senior-prompt-engineer` | `clean-code` | - |
