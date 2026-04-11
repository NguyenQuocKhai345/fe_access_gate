---
name: Add route-level suspense
about: Good first issue for router performance and UX
title: "[good first issue] Add lazy-loaded routes with suspense fallbacks"
labels: ["good first issue", "enhancement"]
assignees: []
---

## Summary

Split route bundles and add loading fallbacks to improve initial load performance.

## Tasks

- Convert page imports to lazy imports.
- Add suspense fallback for route rendering.
- Validate navigation and protected route behavior.

## Acceptance Criteria

- App builds and routes render correctly.
- No runtime errors during navigation.
- Protected routes continue to redirect correctly.
