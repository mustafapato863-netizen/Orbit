---
name: webapp-testing
description: >-
  Web application testing methodology covering Vitest unit tests, React Testing Library component tests, and Playwright end-to-end (E2E) automation.
---

# Web Application Testing Methodology

Use this skill when writing, executing, or auditing automated test suites for web applications.

## 1. Unit & Integration Testing (Vitest)
- **Calculation Logic**: Test progress aggregation, workstream counting, risk severity scoring, stage transitions, due date math, and permission checks.
- **Environment & Zod Validation**: Test environment variable validation schemas (`src/lib/env.ts`) against valid/invalid values.
- **Run Command**: `npm run test`

## 2. Component Testing (React Testing Library)
- **User Interactions**: Test accordion expansion/collaboration, filter controls, tab switching, and modal form submission.
- **Accessibility & Querying**: Query DOM elements using accessible selectors (`getByRole`, `getByLabelText`, `getByText`). Avoid querying by brittle CSS selectors or internal implementation details.

## 3. End-to-End Testing (Playwright)
- **User Journeys**: Test complete workflows: Login -> Workspace Selection -> Project Dashboard -> Pipeline Accordion -> Stage Transition -> Risk Creation -> Decision Approval -> PowerPoint/Excel Exports.
- **Mobile Layout Verification**: Verify drawer navigation, cards fallbacks, and touch target sizes on mobile viewport presets.
- **Run Command**: `npm run test:e2e`
