# Specification: Refactor Infrastructure Adapters

## Metadata
- **ID**: spec-2026-03-08-infrastructure
- **Status**: draft
- **Created**: 2026-03-08

## Problem Statement
External dependencies (PocketBase, Resend, Gemini) are currently accessed directly, leading to tight coupling. Swapping providers (e.g., from PocketBase to Supabase) would currently require a massive code rewrite.

## Desired State
Concrete adapters in `src/infrastructure/` that implement the domain ports. The interfaces (ports) must be designed to be **provider-agnostic**.
- **Data Port**: Defines functions like `getUser`, `saveResearch`, `streamNotifications` without leaking PocketBase-specific types or SDK structures.
- **PocketBase Adapter**: Implements the Data Port. PocketBase SDK is imported ONLY here.
- **Future-Proofing**: The architecture must allow replacing the PocketBase Adapter with a Supabase Adapter by only changing the infrastructure layer, with zero impact on the `core/domain` or `core/usecases`.

## Success Criteria
- [ ] PocketBase SDK is strictly isolated within `src/infrastructure/pocketbase/`.
- [ ] Domain ports use standard JavaScript types or domain-defined entities, never SDK-specific classes (like `RecordModel`).
- [ ] Error handling in ports is generic (e.g., `NotFoundError` instead of `ClientResponseError`).

## References
- [Refactor Prompt](../../specs/prompt.md#L110-L120)
- [Future Migration Context](../../docs/spec-summary.md)
