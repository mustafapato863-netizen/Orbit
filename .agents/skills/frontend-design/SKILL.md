---
name: frontend-design
description: >-
  Creative UI/UX design skill for modern web applications. Provides principles for rich aesthetics,
  curated HSL color palettes, dark/light themes, typography, glassmorphism, micro-animations, and dynamic visual layouts.
---

# Creative Frontend Design System & Guidelines

Use this skill when designing, building, or refining web application interfaces to achieve a premium, state-of-the-art aesthetic.

## 1. Visual Aesthetics & Philosophy
- **Rich Aesthetics**: Interfaces should look premium, modern, and engaging at first glance. Avoid generic colors (plain red, default blue, stock green).
- **Curated Color Palettes**: Use harmonious HSL/CSS variable tokens tailored for dark/light themes (e.g., deep dark navy sidebar, crisp neutral content background, slate card borders, vibrant primary accents).
- **Typography**: Utilize clean Google Fonts (Inter, Roboto, Outfit) with strict font-weight hierarchy, proper line-heights, and letter spacing.
- **Glassmorphism & Elevation**: Apply subtle borders (`border border-border/50`), backdrop blurs (`backdrop-blur-md`), and layered shadow tokens (`shadow-sm`, `shadow-md`, `shadow-xl`).

## 2. Dynamic Interactions & Micro-Animations
- **Hover Effects**: Subtly scale cards (`hover:scale-[1.01]`), adjust border highlights, or transition background opacity (`transition-all duration-200 ease-in-out`).
- **Interactive Feedback**: Provide instant visual state changes for buttons, tabs, accordions, and active navigation links.
- **Loading & Skeleton States**: Always use skeleton placeholders (`animate-pulse`) for asynchronous content loading instead of blank screens or simple spinners.

## 3. Responsive Layout Patterns
- **Desktop**: Fixed navigation sidebar, rich executive overview dashboards, multi-column cards, interactive timelines.
- **Tablet**: Collapsible drawer navigation, two-column grid summary cards, scrollable table containers with sticky headers.
- **Mobile**: Drawer navigation, card fallbacks for wide data tables, single expanded accordion item, touch-friendly interactive targets (minimum 44x44px).

## 4. Accessibility & Contrast
- **Color Contrast**: Maintain WCAG 2.1 AA contrast ratios (4.5:1 for normal text, 3:1 for large text).
- **Dual Indicators**: Never rely on color alone to communicate state. Always combine color badges with clear text labels and Lucide icons.
