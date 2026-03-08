# Specification: Refactor UI Layer and Code Splitting

## Metadata
- **ID**: spec-2026-03-06-ui-layer
- **Status**: draft
- **Created**: 2026-03-06

## Problem Statement
Current components often contain business logic or data fetching. The bundle size is unoptimized, and there is a lack of clear boundaries between presentational and container components.

## Desired State
A purely presentational UI layer in `src/ui/`:
- **Components/Primitives**: Receive all data and callbacks via props only.
- **Pages**: Top-level route components that compose layouts and call application hooks.
- **Code Splitting**: Dynamic loading for all page routes using `React.lazy` and `Suspense`.

## Success Criteria
- [ ] No component below `ui/pages/` imports from `application/`, `infrastructure/`, or `core/`.
- [ ] Every page route is code-split.
- [ ] Visual design, Tailwind classes, and layout remain unchanged.
- [ ] Unused dependencies are removed from `package.json`.

## References
- [Refactor Prompt](../../specs/prompt.md#L134-L146)
