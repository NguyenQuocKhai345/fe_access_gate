---
name: Improve auth UX
about: Good first issue to improve login/register experience
title: "[good first issue] Improve auth form UX and validation"
labels: ["good first issue", "enhancement"]
assignees: []
---

## Summary

Improve the auth forms by adding richer client-side validation and clearer inline feedback.

## Tasks

- Add Zod schema validation for login/register.
- Show inline error states for each field.
- Add loading/success feedback.

## Acceptance Criteria

- Invalid form submissions are blocked with clear messages.
- Forms are keyboard accessible.
- Existing auth flow still works.
