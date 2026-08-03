---
name: clean-code
description: >-
  Clean code, SOLID design principles, modular refactoring, low coupling, high cohesion, and strict maintainability standards.
---

# Clean Code & Refactoring Guidelines

Use this skill when writing, reviewing, or refactoring code to ensure maintainability, legibility, and architectural longevity.

## 1. Core Principles
- **DRY (Don't Repeat Yourself)**: Extract repeated logic, data formatting, permission checks, and UI components into shared utility helpers or UI components.
- **KISS (Keep It Simple, Stupid)**: Avoid over-engineering, premature abstractions, or overly complex nested conditionals.
- **Single Responsibility Principle (SRP)**: Each function, component, module, or class must have a single clear purpose.
- **Explicit Naming**: Use descriptive variable, function, component, and type names. Avoid abbreviations like `res`, `idx`, `m`, `cb`.

## 2. Function & Component Guidelines
- **Small Functions**: Functions should ideally be short (< 30 lines) and perform one operation.
- **Pure Functions**: Favor pure utility functions without side-effects for calculations, progress aggregations, date formatting, and status mapping.
- **Zero Symptom Masking**: Never swallow exceptions with empty `catch` blocks or return fake fallback zeroes. Trace and handle exceptions cleanly.
