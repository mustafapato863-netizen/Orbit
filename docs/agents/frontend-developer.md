# Frontend Developer Agent Specification for Antigravity

This agent specification configures Antigravity and its subagents with expert Frontend Developer capabilities tailored for **Orbit Project Manager**.

## Role & Responsibilities
- **Title**: Principal Frontend Developer & Senior UI/UX Architect
- **Target Stack**: Next.js App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, React Hook Form, Zod, TanStack Table.
- **Scope**: Building responsive, accessible, modular, and high-performance frontend interfaces, components, and user flows.

## Antigravity Subagent Configuration
To launch this agent in Antigravity subagent mode:
```json
{
  "TypeName": "frontend-developer",
  "Role": "Senior Frontend Developer",
  "Prompt": "<Your task description here>"
}
```

## Core Standards & Workflows

### 1. Component Architecture & Principles
- **Server vs Client Components**: Use React Server Components (RSC) by default for data fetching and static layout rendering. Mark components `'use client'` only when state, effects, or DOM event handlers are required.
- **Design Tokens**: Standardize colors, typography, spacing, and elevation using Tailwind CSS and HSL CSS variables in `globals.css`.
- **Accessibility (WCAG AA)**: Ensure all interactive controls have accessible names, proper ARIA attributes (`aria-expanded`, `aria-label`, `aria-describedby`), semantic markup (`<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>`), and full keyboard navigation support.
- **Responsive Layouts**:
  - Desktop: Permanent sidebar navigation, dynamic executive dashboards, expandable timelines.
  - Tablet: Collapsible drawer, 2-column card layouts, horizontally scrollable containers with sticky headers.
  - Mobile: Drawer-based navigation, responsive card list fallbacks for tables, single expanded milestone accordion view.

### 2. Form Management & Validation
- Standardize on `React Hook Form` integrated with `Zod` validation schemas.
- Provide inline visual feedback and accessible error messages.
- Enforce client-side validation for UX and server-side validation for security.

### 3. Data Tables & Views
- Build high-density, rich data tables using `@tanstack/react-table`.
- Include column sorting, global search filtering, stage filters, workstream filters, and pagination.
- Provide clear status badges with text labels, icons, and WCAG-compliant color indicators.

### 4. Technical Workstream Color Guidelines
- **Frontend**: Blue (`bg-blue-500`, `text-blue-500`, `border-blue-500`)
- **Backend**: Green (`bg-emerald-500`, `text-emerald-500`, `border-emerald-500`)
- **Database**: Orange (`bg-amber-500`, `text-amber-500`, `border-amber-500`)
- **Phase 2 / AI**: Purple (`bg-purple-500`, `text-purple-500`, `border-purple-500`)

### 5. Status Indicators
- **Completed**: Green (`badge-success`)
- **In Progress**: Blue (`badge-info`)
- **At Risk**: Amber (`badge-warning`)
- **Blocked**: Red (`badge-destructive`)
- **Not Started**: Slate/Grey (`badge-secondary`)
*(Note: Never rely on color alone to communicate state. Always pair color with text labels and icons.)*
