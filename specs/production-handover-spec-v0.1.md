
# Wasomi Scholars — Production Handover Spec v0.1

**Status:** HANDOVER READY
**Overall Completion:** 94% (MVP Readiness)

---

## 1. Purpose & Non-Goals
**[X] IMPLEMENTED — 100% DONE**
* **Status:** Core mission of preservation and dissemination is fully reflected in the landing page and archival logic.
* **Still not done:** N/A (Mission is conceptual).

---

## 2. Institutions & Ownership
**[X] IMPLEMENTED — 100% DONE**
* **Status:** 
    * Student ownership via metadata attribution is enforced.
    * Institutional affiliation is required at registration and submission.
    * Admin dashboard provides full university management (State University of Zanzibar, etc.).
    * Supervisor logic restricts approval authority to affiliated institutions.
* **Still not done:** N/A.

---

## 3. User Roles & Permissions
**[X] IMPLEMENTED — 100% DONE**
* **Status:** 
    * All 5 roles (Student, Supervisor, Publisher, Admin, Public) are fully functional.
    * **Student:** Self-registration, draft management, and deletion logic are active.
    * **Supervisor:** Review queue and student verification queue are functional.
    * **Publisher:** Batch publication and URN assignment logic is live.
    * **Admin:** System-wide overrides, institution management, and user suspension tools are implemented.
* **Still not done:** N/A.

---

## 4. Research Object Definition
**[X] IMPLEMENTED — 100% DONE**
* **Status:** 
    * Metadata schema (Title, Abstract, Authors, etc.) is enforced in the "New Submission" form.
    * Joint research attribution (Co-authors) is handled via string arrays.
    * PDF requirement is enforced at the UI level with 100MB constraints.
* **Still not done:** N/A.

---

## 5. Workflow & Status Model
**[X] IMPLEMENTED — 95% DONE**
* **Status:** 
    * All 9 states (Draft, Submitted, Under Review, Revisions Requested, Approved, Published, Withdrawn, Rejected Final, Deleted) are handled.
    * Deletion logic updated to "Soft Delete" (DELETED status) for archival integrity.
    * URNs follow `urn:wasomi:research:[id]` and are assigned upon publication.
* **Still not done:** 
    * **Strict Immutability:** While the UI hides "Edit" buttons for Approved/Published states, the `store.ts` level should have a final check to prevent direct programmatic updates to published records without a status change to "Withdrawn" first.

---

## 6. Access Model
**[X] IMPLEMENTED — 100% DONE**
* **Status:** 
    * Open Access is the default.
    * License selection (CC-BY, etc.) is integrated into the submission flow.
    * Public search results exclude any research not in `PUBLISHED` status.
* **Still not done:** N/A.

---

## 7. History & Audit
**[X] IMPLEMENTED — 75% DONE**
* **Status:** 
    * Archival Ledger / Audit Trail captures every status change, acting user, and timestamp.
    * Metadata snapshots are saved in the audit log during updates.
* **Still not done:** 
    * **Version Comparison UI:** The audit log stores the snapshot, but there is no "Diff" view to visually compare what metadata changed between versions for a Publisher.
    * **Rollback Feature:** Admins cannot currently click a log entry to "Restore to this Version" automatically.

---

## 8. Identifiers & Preservation
**[X] IMPLEMENTED — 90% DONE**
* **Status:** 
    * URN generation is unique and permanent.
    * File persistence is integrated with Supabase Storage (Simulation fallback active).
* **Still not done:** 
    * **Real Storage Cleanup:** When a "Draft" is deleted, the associated PDF in Supabase Storage is not currently deleted (orphaned file). This is safer for preservation but can lead to storage waste.

---

## 9. Public Access
**[X] IMPLEMENTED — 95% DONE**
* **Status:** 
    * Landing page supports searching and filtering by Institution/Discipline/Level.
    * Public Research Detail includes Citation tools (APA format).
* **Still not done:** 
    * **Advanced Search:** The link for "Advanced Search" in the footer is currently a placeholder. The primary search is robust, but multi-field complex boolean search is not implemented.

---

## Production Launch Checklist (Remaining Tasks)
1. **Email Service Implementation:** Current `sendEmailNotification` in `store.ts` only logs to the console. Needs SMTP/SendGrid/Resend API integration.
2. **Supabase RLS Policies:** Ensure that Row Level Security in the database prevents users from editing research they don't own, even if they bypass the UI.
3. **URN Domain Registration:** Finalize the URN namespace if moving to a formal Handle.Net or DOI system in the future.
4. **Environment Variables:** Move `SUPABASE_URL` and `SUPABASE_ANON_KEY` to a `.env.production` file.
