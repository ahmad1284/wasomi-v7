# Roadmap Overview: Transitioning to MVP Backend

This document summarizes the specifications defined in `codev/specs`, outlining the roadmap for transitioning Wasomi Scholars from a local-only prototype to a production-ready MVP.

## Current State
The application currently operates as a standalone React prototype. All data persistence is simulated using `localStorage` within `store.ts`, and core business logic is interleaved with UI components. This limits the platform to a single-device experience and lacks the scale required for an academic research portal.

## The Roadmap

### Phase 1: Infrastructure Foundations
- **[1-docker-environment.md](../codev/specs/1-docker-environment.md)**: Establishes a containerized development stack. It replaces manual setup with a single command (`docker compose --profile dev up`), spinning up PocketBase (backend), Mailpit (email UI), and MinIO (file storage).
- **[2-architecture-and-layering.md](../codev/specs/2-architecture-and-layering.md)**: Introduces a strict Clean Architecture. This moves the project away from a flat structure into isolated layers of concern.

### Phase 2: Core Domain & Data Layer
- **[3-domain-model.md](../codev/specs/3-domain-model.md)**: Formalizes the technical language of the project (Users, Research, Notifications) through explicit TypeScript types.
- **[4-infrastructure-adapters.md](../codev/specs/4-infrastructure-adapters.md)**: Creates the "pipes" to external services (PocketBase, Resend, Gemini) without coupling the core logic to their specific APIs.
- **[5-backend-migration.md](../codev/specs/5-backend-migration.md)**: The "heart" of the backend update. It swaps out the `localStorage` mocks in `store.ts` for real-time persistence and secure authentication.

### Phase 3: Business Logic & Application Refinement
- **[6-use-cases.md](../codev/specs/6-use-cases.md)**: Extracts critical workflows (Submitting Research, Approving, Publishing) into testable, frameworks-agnostic functions.
- **[7-application-layer.md](../codev/specs/7-application-layer.md)**: Cleans up the React components by offloading state management and side effects to custom hooks and context providers.

### Phase 4: Verification & Polish
- **[8-testing-strategy.md](../codev/specs/8-testing-strategy.md)**: Implements an integration test suite that verifies the entire research lifecycle, including email delivery assertions via Mailpit.
- **[9-performance-audit.md](../codev/specs/9-performance-audit.md)**: Quantifies the "health" of the new architecture, ensuring the bundle size and load times meet MVP targets.
- **[10-ui-layer.md](../codev/specs/10-ui-layer.md)**: Finalizes component separation and implements performance optimizations like route-based code splitting.
- **[11-ci-cd-pipeline.md](../codev/specs/11-ci-cd-pipeline.md)**: Automates the path to production, ensuring every change is verified before deployment.

## Implementation Priority
The sequence prioritized is **Infrastructure First → Backend Implementation → Application Refinement → UI Polish**. This ensures a solid foundation before adding complex frontend features.

## Future-Proofing: Migrating to Supabase
A key benefit of this architectural refactor (specifically the **Ports and Adapters** pattern) is provider independence. By isolating the PocketBase SDK within the infrastructure layer and using generic interfaces in the core, the platform remains flexible. 

If the project outgrows PocketBase, migrating to **Supabase** (or any other provider) will only require writing a new adapter implementation. The core business logic, domain models, and React UI components will remain untouched, significantly reducing the cost and risk of future transitions.
