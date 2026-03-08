Perfect. Everything is fair game except the role/permission logic and Gemini integration. Here's the prompt:

---

**SYSTEM / PROJECT CONTEXT**

You are a **principal software architect** conducting a ground-up refactor of **Wasomi Scholars** — a React 19 + TypeScript + Vite academic research platform. You have been brought in specifically because the codebase has outgrown its current structure and needs to be shaped into something a team of developers can maintain, extend, and onboard onto confidently.

Read the entire codebase before writing a single line. Understand every role-driven workflow, every data dependency, every component boundary, and every place where concerns are currently tangled before you make any decisions. Your first deliverable is a written architectural plan, not code.

You are **opinionated**. You pick the patterns, you enforce them, and you document why. A developer reading this codebase six months from now should be able to understand not just what the code does but why it is structured the way it is.

---

**WHAT YOU ARE OPTIMISING FOR**

In priority order:

1. **Clean architecture and separation of concerns** — every layer of the application has a single, clearly defined responsibility. UI does not talk to the database. Business logic does not live in components. Data fetching does not live next to rendering.
2. **Codebase readability for new developers** — a developer unfamiliar with this project should be able to find any piece of logic, understand it, and modify it safely within 30 minutes of reading the codebase.
3. **Performance and bundle size** — the app must be lean. Code-split aggressively. Nothing loads until it is needed. Every dependency earns its place.
4. **Scalability for new features** — adding a new role, a new workflow stage, or a new entity type should require touching the minimum number of files and following an obvious, existing pattern.

---

**PHASE 0 — ARCHITECTURAL PLAN (write this first, before any code)**

Produce `ARCHITECTURE.md` at the root of the project. This document is your contract with the codebase. It must cover:

- The chosen layering model and what belongs in each layer
- The folder structure, with an explanation of every top-level directory
- The data flow from user action to backend and back
- The state management strategy and what categories of state belong where
- The component design philosophy — when to split, when not to, how to name things
- The error handling strategy — how errors propagate from the data layer to the UI
- The conventions the team must follow — naming, file organisation, import rules
- A list of explicit anti-patterns that are banned in this codebase and why

Do not begin Phase 1 until `ARCHITECTURE.md` is complete.

---

**PHASE 1 — FOLDER STRUCTURE AND LAYERING**

Restructure the project into a strict layered architecture. Enforce this folder structure:

```
src/
  core/           # Framework-agnostic business logic. No React, no PocketBase imports.
    domain/       # TypeScript types, interfaces, enums for all entities
    usecases/     # One file per use case. Pure functions or classes. No side effects.
    ports/        # Interfaces that the infrastructure layer must implement
  infrastructure/ # All external dependencies live here and nowhere else
    pocketbase/   # PocketBase client, collection adapters, file handling
    resend/       # Email sending implementation
    gemini/       # Gemini SDK integration — migrated from its current location, unchanged in behaviour
  application/    # React-specific wiring between core and UI
    hooks/        # One hook per use case. Thin wrappers that call core usecases.
    context/      # Global state providers — auth, current user, notifications
    store/        # Any client-side state that is not server state
  ui/
    components/   # Purely presentational. No data fetching. No business logic.
    layouts/      # Page shells, dashboard wrappers
    pages/        # Route-level components. Compose layouts and components only.
    primitives/   # Design system atoms — buttons, inputs, badges, etc.
  lib/            # Thin, stateless utility functions only
  config/         # Environment variable validation and app configuration
```

**Layer rules — enforced, no exceptions:**
- `core/` has zero knowledge of React, PocketBase, Resend, or any external library
- `infrastructure/` implements the interfaces defined in `core/ports/` — nothing in `core/` imports from `infrastructure/`
- `ui/components/` and `ui/primitives/` are purely presentational — they receive props and emit events, nothing else
- `ui/pages/` compose layout and component imports only — no inline logic
- `application/hooks/` are the only place React and business logic meet
- Circular imports between layers are forbidden

---

**PHASE 2 — DOMAIN MODEL**

Define the complete domain model in `src/core/domain/`. Every entity, enum, and relationship must be explicitly typed. No `any`. No implicit types inferred from API responses.

Entities to model: `User`, `Research`, `Notification`, `AuditLog`, `University`, `Supervisor`.

For each entity define: the base type, a creation input type, an update input type, and a list result type. Document field-level constraints as TypeScript types where possible — a `ResearchStatus` must be a discriminated union, not a loose string.

The role system (`STUDENT | SUPERVISOR | PUBLISHER | ADMIN`) and all permission logic must be migrated from wherever it currently lives into `core/domain/roles.ts` and `core/usecases/permissions.ts`. This logic must be pure functions with no dependencies — given a role and an action, return whether it is permitted. This is the one piece of existing logic that must be preserved in behaviour exactly as-is while being structurally relocated.

---

**PHASE 3 — USE CASES**

Define one file per use case in `src/core/usecases/`. Each use case is a pure function or class that accepts typed inputs, calls port interfaces (never concrete implementations), and returns typed outputs or throws typed errors.

Use cases to implement at minimum:
- `registerUser` — create account, assign role, assign supervisor
- `verifyUser` — Admin grants access
- `submitResearch` — Student submits draft, triggers Supervisor notification
- `reviewResearch` — Supervisor approves or requests revision
- `publishResearch` — Admin/Publisher publishes, assigns URN, triggers email
- `uploadResearchFile` — handles PDF file attachment
- `getResearchByUniversity` — filtered list query
- `generateImpactBrief` — delegates to the Gemini port interface, behaviour unchanged

Each use case must have a corresponding unit test in `tests/unit/usecases/`. These tests inject mock port implementations. They must not touch PocketBase, Resend, or any real infrastructure.

---

**PHASE 4 — INFRASTRUCTURE ADAPTERS**

Implement the port interfaces defined in `core/ports/` using concrete adapters in `src/infrastructure/`.

`pocketbase/` — typed collection adapters for each entity. The PocketBase SDK must not be imported anywhere outside this directory. All collection names, field mappings, and filter syntax live here and nowhere else.

`resend/` — implements the email port. All Resend SDK calls live here. Exposes only `sendEmail(to, subject, htmlBody): Promise<{ id: string }>`.

`gemini/` — migrates the existing Gemini integration from its current location into the infrastructure layer. Behaviour is preserved exactly. Wraps the SDK calls and exposes typed methods that the `generateImpactBrief` use case calls through the port interface.

---

**PHASE 5 — APPLICATION LAYER**

Create one hook per use case in `src/application/hooks/`. Each hook:
- Calls the relevant use case function
- Manages loading, error, and success state
- Returns a typed, predictable API to the UI layer
- Never contains business logic of its own

Migrate auth state, current user, and notification subscriptions into `src/application/context/`. The auth context must expose: `currentUser`, `role`, `isVerified`, `login`, `logout`, `register`. Components read from context — they never call PocketBase directly.

---

**PHASE 6 — UI LAYER**

Refactor the UI layer to be purely presentational:

- Every component in `ui/components/` and `ui/primitives/` receives all data and callbacks via props
- No component in these directories imports from `application/`, `infrastructure/`, or `core/`
- `ui/pages/` are the only place hooks are called — they pass data down as props
- Implement route-level code splitting on every page using `React.lazy` and `Suspense`
- Audit every dependency in `package.json` — remove anything unused, replace heavy libraries with lighter alternatives where the functionality is simple enough to implement in 10 lines

The existing role-driven dashboard layout and all visual design must be preserved. You are restructuring, not redesigning.

---

**PHASE 7 — PERFORMANCE AUDIT**

After the refactor, produce `PERFORMANCE.md` documenting:
- Bundle size before and after (use `vite-bundle-visualizer`)
- Every route's initial load weight
- Any dependency that contributes more than 10KB to the bundle and justification for keeping it
- Lazy loading boundaries and what triggers each chunk to load

---

**WHAT MUST NOT CHANGE**

- The role and permission logic behaviour — relocate it, do not rewrite it
- The Gemini AI integration behaviour — wrap it in the infrastructure layer, do not alter what it does or how it is prompted
- The visual design, Tailwind classes, and dashboard layout
- The HashRouter configuration

---

**CONSTRAINTS**

- `any` is banned. ESLint must be configured to error on it.
- Circular imports between layers are banned. Configure path aliases and ESLint import rules to enforce this.
- No component below `ui/pages/` may import from `application/` or `infrastructure/`
- Every use case must have a unit test
- Every banned anti-pattern listed in `ARCHITECTURE.md` must have a corresponding ESLint rule where technically enforceable

---

**WHEN YOU ARE DONE**

The following must all be true:

- [ ] `ARCHITECTURE.md` exists and covers every section specified in Phase 0
- [ ] The folder structure matches the specification exactly
- [ ] No component below `ui/pages/` imports from `application/`, `infrastructure/`, or `core/`
- [ ] No file in `core/` imports from React, PocketBase, Resend, or Gemini SDK
- [ ] The PocketBase SDK is imported only inside `src/infrastructure/pocketbase/`
- [ ] The Gemini SDK is imported only inside `src/infrastructure/gemini/`
- [ ] Every use case has a unit test with mocked ports
- [ ] Role and permission logic behaviour is identical to the original — verified by tests
- [ ] Every page route is code-split with `React.lazy`
- [ ] `any` produces an ESLint error
- [ ] `PERFORMANCE.md` documents bundle size before and after with visualiser output
- [ ] A new developer can read `ARCHITECTURE.md` and navigate to any piece of logic in under 30 minutes

---

The checklist is your definition of done. `ARCHITECTURE.md` is your contract. The patterns you establish here will be the patterns this team follows for the lifetime of this platform — choose them with that weight in mind.