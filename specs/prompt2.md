Here's the complete prompt:

---

**SYSTEM / PROJECT CONTEXT**

You are a senior full-stack engineer and DevOps architect onboarding onto **Wasomi Scholars** — a React 19 + TypeScript + Vite academic research platform. Read the entire codebase before doing anything. Understand the role-driven workflows (Student → Supervisor → Publisher/Admin), the research lifecycle (DRAFT → SUBMITTED → APPROVED → PUBLISHED), the notification architecture, and the Gemini AI integrations before making any decisions.

The current stack uses localStorage mocks in `store.ts` as a fake backend, with a dormant Supabase integration in `lib/supabase.ts`. Your mission is to replace this with a production-ready PocketBase + Resend backend, containerise the entire stack with Docker, and then build a CI/CD pipeline that reuses that Docker environment exactly — making the team fearless about shipping.

---

**WHAT YOU ARE OPTIMISING FOR**

- A developer on this team should be able to go from `git clone` to a fully running local environment in under 5 minutes
- Every iteration — does this test pass, does PocketBase seed correctly, does the email assertion work — must produce feedback in seconds locally, not minutes waiting for CI
- A push to `main` should automatically test, build, and deploy without any manual steps, using the exact same Docker environment that works locally
- A bug introduced in a PR should be caught before it ever reaches production
- The team should never have to SSH into a server to deploy

---

**YOUR MANDATE**

Architect and implement the full solution. You have autonomy over the specific approach, libraries, and tooling choices — but your decisions must be justified in a brief `DECISIONS.md` file you create at the root of the project.

At minimum your solution must cover:

---

**PHASE 1 — BACKEND MIGRATION**

Move all data, auth, file storage, and notifications from the localStorage mock to PocketBase. Resend handles transactional email. The Gemini AI integration, all UI components, routing, and styling are out of scope and must not be touched.

Create `lib/pocketbase.ts` — a typed PocketBase singleton client with TypeScript interfaces for all four collections:
- `User`: email, name, role (`STUDENT | SUPERVISOR | PUBLISHER | ADMIN`), institution, supervisorId, verified (boolean)
- `Research`: title, abstract, status (`DRAFT | SUBMITTED | APPROVED | PUBLISHED`), authorId, supervisorId, universityId, urn, pdfFile
- `AuditLog`: action, actorId, targetId, timestamp
- `Notification`: recipientId, role, message, read (boolean)

Replace auth in `Auth.tsx`:
- Register: `pb.collection('users').create({...})` then `pb.collection('users').authWithPassword()`
- Login: `pb.collection('users').authWithPassword()`
- Logout: `pb.authStore.clear()`
- Current user and role: read from `pb.authStore.model` — keep all existing role-based redirect logic, just swap the data source
- Session persistence is automatic via `pb.authStore` — remove all manual JWT or session handling

Replace `store.ts` with PocketBase collection calls:
- List: `pb.collection('research').getFullList({ filter: '...' })`
- Create, update, delete: standard PocketBase SDK calls
- `createNotification()` and `notifyRole()`: write to the `notifications` collection
- Real-time broadcasts: `pb.collection('notifications').subscribe('*', callback)`

Replace PDF handling with PocketBase file fields:
- Upload via `FormData` to `pb.collection('research').create(formData)`
- Retrieve via `pb.files.getUrl(record, record.pdfFile)`

Create `lib/email.ts` with a `sendEmail(to, subject, htmlBody)` function using the Resend SDK. Replace the simulated `sendEmailNotification()` in `store.ts` with real calls to `sendEmail()`. Trigger on: research published, account verified, revision requested.

Cleanup:
- Delete `lib/supabase.ts`
- Remove `@supabase/supabase-js` from `package.json`
- Remove every `localStorage.getItem / setItem / removeItem` call
- Remove all seed data and mock functions from `store.ts`

---

**PHASE 2 — DOCKER ENVIRONMENT**

Containerise the entire stack using Docker Compose before touching CI/CD. The compose file is the source of truth for every environment — local, test, and CI. If it works in Docker locally, it must work in CI without modification.

Define three services in `docker-compose.yml`:

`pocketbase` — use a stable PocketBase image. Mount a named volume at `/pb/pb_data` so the SQLite database survives container restarts. Expose port `8090`. Add a healthcheck that polls `/api/health` every 5 seconds with up to 5 retries before reporting unhealthy.

`app` — build from the project `Dockerfile`. Expose port `5173`. Load environment variables from `.env`. Set `depends_on` with `condition: service_healthy` so the app never starts before PocketBase is ready.

`test` — build from the same `Dockerfile`. Override the command to `npm run test:integration`. Load environment variables from `.env.test`. Set `depends_on` with `condition: service_healthy`. Place behind a `test` profile so it only runs when explicitly invoked and never starts as part of the default `docker compose up`.

The local workflow must be exactly:
```bash
docker compose up                        # start the full stack
docker compose --profile test run test   # run integration tests
docker compose down                      # tear everything down
```

Create two environment files:
- `.env` — for local development, with `VITE_PB_URL`, `VITE_RESEND_API_KEY`, `VITE_GEMINI_API_KEY`
- `.env.test` — identical structure but with Resend magic test addresses pre-configured and a separate PocketBase data path so test runs never pollute development data

Add both to `.gitignore`. Create `.env.example` and `.env.test.example` with all required keys documented but no real values.

All environment variables must be validated at application startup. If a required variable is missing the app must fail immediately with a clear, human-readable error identifying exactly which variable is absent — not a silent runtime failure buried in a stack trace.

---

**PHASE 3 — TESTING**

Introduce a testing strategy appropriate for this codebase. You decide the scope and tooling. Prioritise the research lifecycle and auth flows as the highest-risk paths.

The integration test suite must run against a real PocketBase instance — not a mock — using the Docker test service defined in Phase 2. Before each test run, seed PocketBase with a known fixture containing at minimum: one Admin, one Supervisor, one Student, and one piece of research in SUBMITTED state. Tear down and reseed between test suites to ensure isolation.

The following critical path workflows must be covered by integration tests:
- User registration with role and supervisor assignment
- Account verification by Admin
- Research submission triggering a Supervisor notification write
- Research approval triggering a Publisher notification write
- Research publication triggering a Resend email call

**Notification testing** — do not attempt to assert on SSE delivery to a connected client. Assert on the database write instead: after any action that triggers a notification, query the `notifications` collection directly and verify a record exists with the correct `recipientId`, `message` content, and `read: false`. SSE delivery is PocketBase's responsibility and does not require testing.

**Email testing** — all emails in CI and local test runs must be directed to Resend's magic test addresses, never to real inboxes. Use your real `RESEND_API_KEY` stored as a secret — there is no separate test mode key. Use the following addressing convention:
- `delivered@resend.dev` — assert successful send
- `bounced@resend.dev` — assert bounce handling
- `delivered+student@resend.dev`, `delivered+supervisor@resend.dev` — distinguish recipients across test assertions

Assert that `sendEmail()` returns a valid `data.id` from the Resend API. Never assert on inbox delivery.

Unit tests may mock PocketBase. Integration tests must not.

---

**PHASE 4 — CI/CD PIPELINE**

Design and implement a pipeline that runs on every pull request and every push to `main`. Choose the platform based on what makes most sense after reading the project. The pipeline must reuse the Docker Compose configuration from Phase 2 exactly — it must not define a separate environment or duplicate service configuration.

The pipeline must execute in this order, stopping immediately if any step fails:
1. Install dependencies
2. Run TypeScript type checks
3. Start the Docker Compose stack (PocketBase + app)
4. Wait for PocketBase healthcheck to pass
5. Run unit tests
6. Run integration tests via the test profile
7. Build the production bundle
8. Tear down the Docker stack
9. Deploy to staging automatically on push to `main`
10. Require one manual approval to promote staging to production

Staging and production must be separate deployment targets. A failed step must never result in a deployment. PR status checks must block merging until the pipeline passes.

Store all secrets (`RESEND_API_KEY`, `VITE_GEMINI_API_KEY`, PocketBase credentials, deployment tokens) in the CI platform's secret store. They must never appear in any committed file.

---

**CONSTRAINTS**

- The solution must be deployable at zero or near-zero cost at MVP scale (~1,500 research uploads/year, Zanzibar university cohort)
- PocketBase must run with a persistent volume in all non-test environments
- No localStorage references may remain anywhere in the codebase
- No Supabase imports may remain — delete `lib/supabase.ts` and remove the package
- No secrets or API keys may be hardcoded or committed
- Unit tests may mock PocketBase. Integration tests must not
- The CI pipeline must be a thin wrapper around the Docker Compose setup — not a reimplementation of it

---

**WHEN YOU ARE DONE**

The following must all be true:

- [ ] `git clone` → one command → fully running app with live PocketBase backend
- [ ] All environment variables are validated at startup with clear error messages for missing values
- [ ] `docker compose --profile test run test` executes the full integration suite locally in seconds
- [ ] Notification tests assert on `notifications` collection writes, not SSE delivery
- [ ] Email tests use `delivered@resend.dev` addressing and assert on a returned `data.id`
- [ ] A PR triggers the full pipeline and blocks merging until all steps pass
- [ ] Merging to `main` deploys to staging automatically using the same Docker environment
- [ ] Promoting to production requires one manual approval step
- [ ] A Student can register, be verified by an Admin, submit research, and receive a real Resend email on publication — end to end
- [ ] No localStorage, no Supabase imports, no hardcoded secrets exist anywhere in the codebase
- [ ] `.env.example` and `.env.test.example` document every required variable
- [ ] `DECISIONS.md` explains every non-obvious architectural and tooling choice
- [ ] `README.md` documents local setup, environment variables, Docker commands, and the deployment process

---

The checklist is your definition of done. Do not consider the task complete until every item passes.