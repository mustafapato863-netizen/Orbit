---
name: ui-ux-pro-max
description: >-
  Advanced UI/UX Pro Max framework for enterprise dashboards, component interactions, responsive patterns, design token orchestration, and accessibility perfection.
---

# Enterprise UI/UX Pro Max Architecture

Use this skill when designing enterprise-grade SaaS dashboards, complex data management tools, or high-density web interfaces.

## 1. Information Hierarchy & Page Structure
- **Overview First, Details on Demand**: Executive summary cards and aggregate pipeline metrics at the top; interactive data tables and details loaded on user interaction.
- **Accordion & Milestone Collapsing**: In multi-item pipeline views, collapse items by default and allow only one expanded item at a time to prevent cognitive overload.
- **Sticky Column Headers**: Fix table headers and key identifiers (e.g. task name) during horizontal or vertical scrolling.

## 2. Design System Tokens & Styling
- **Dark Navy Sidebar**: Professional dark navy workspace navigation sidebar with crisp active state indicators.
- **Neutral Soft Content Area**: Soft grey background (`bg-slate-50/50` or `bg-slate-900/50`) paired with clean white/dark-slate card containers (`bg-card`).
- **Semantic Badges**:
  - Completed: Green badge (`bg-emerald-500/10 text-emerald-600 border-emerald-500/20`)
  - In Progress: Blue badge (`bg-blue-500/10 text-blue-600 border-blue-500/20`)
  - At Risk: Amber badge (`bg-amber-500/10 text-amber-600 border-amber-500/20`)
  - Blocked: Red badge (`bg-rose-500/10 text-rose-600 border-rose-500/20`)
  - Not Started: Grey badge (`bg-slate-500/10 text-slate-600 border-slate-500/20`)

## 3. Responsive Drawer & Mobile Guidelines
- **Drawer Overviews**: Use side drawers (Sheet component) for secondary details (owner, dates, audit logs, detailed notes) instead of crowding table rows.
- **Mobile Card Fallbacks**: Convert wide desktop data tables into mobile-optimized stacked summary cards on screens `< 768px`.
