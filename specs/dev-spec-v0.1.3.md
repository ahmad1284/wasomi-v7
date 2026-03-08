# Wasomi Scholars — Developer Specification v0.1.3 (Frozen)

**Status:** FROZEN

**Change policy:** This specification is immutable. Any change requires a new version (v0.2+) with an explicit changelog.

---

## 1. Purpose & Non-Goals

### 1.1 Purpose

Wasomi Scholars is a web-based academic research repository whose primary purpose is to:

* Preserve and disseminate **university-validated student research**
* Increase **public visibility of academic work**, starting in Zanzibar
* Provide a **trusted, long-term archive** for final student research outputs

The platform is inspired by **Theseus.fi**, adapted for local academic and institutional context.

### 1.2 Non-Goals

Wasomi Scholars is explicitly **NOT**:

* A peer-review system
* A plagiarism-detection platform
* A citation indexing service (e.g. Scopus, Google Scholar)
* A journal or conference publishing platform

Academic quality assurance remains the responsibility of universities and supervisors.

### 1.3 Scope

* Multi-country by design
* Zanzibar is the initial pilot deployment

---

## 2. Institutions & Ownership

### 2.1 Research Ownership

* **Student (author):** Retains copyright and intellectual property
* **University:** Holds non-exclusive rights to review, approve, and authorize publication
* **Wasomi Scholars:** Hosts and disseminates research; does not own content

Rule:

> Student owns → University validates → Wasomi Scholars publishes & hosts

### 2.2 Institutional Affiliation

* All research submissions **must** be affiliated with:

  * A registered university
  * At least one verified supervisor

### 2.3 University Management

* Universities are:

  * Pre-registered by admins
  * Verified manually
  * Not self-registering

### 2.4 Supervisors

* Must have a primary university affiliation
* May have secondary affiliations
* Approval authority is limited to the student’s institution

---

## 3. User Roles & Permissions

### 3.1 Roles

* Student
* Supervisor
* Publisher (Wasomi Scholars staff)
* Admin
* Public (unauthenticated)

---

### 3.2 Students

* Students self-register and must select a registered university
* Students select a supervisor from an approved list within their university

* Supervisor assignment is finalized at submission time.
* No additional supervisor acceptance step is required for review to begin.

#### Permissions

* Create and submit research
* Edit research **before** supervisor review
* Delete research **before** review starts
* View all own research and their statuses
* Submit multiple or joint researches
* Request withdrawal **after** publication (admin decision)

Restrictions:

* Cannot edit after supervisor approval
* Cannot edit or delete after publication

---

### 3.3 Supervisors

* Supervisors do not freely self-register
* Supervisors are pre-registered or invited by Admin / University authority
* Supervisors may only approve research where they are explicitly assigned as supervisor

#### Permissions

* View assigned student research
* Reject with comments
* Request revisions
* Approve research

Constraints:

* Must be verified via university email
* Can approve only their own students
* Cannot batch-approve

---

### 3.4 Publisher Permissions

* View all supervisor-approved research
* Publish research (make publicly visible)
* **Batch publish** multiple approved researches
* Assign permanent identifiers (URN / Handle)
* Lock content from further edits
* Modify non-substantive metadata
* Change access/licensing settings
* Unpublish research (audit logged)

---

### 3.5 Admin Permissions

* Full system visibility
* Override approvals
* Delete content
* Suspend users
* Manage institutions

---

## 4. Research Object Definition

### 4.1 Definition

A **research** is a single academic work produced by one or more students, validated by a university supervisor, and published by Wasomi Scholars.

---

### 4.2 Required Metadata

* Title
* Abstract
* Author(s)
* Supervisor(s)
* University
* Degree level (Diploma / BSc / MSc / PhD)
* Year

---

### 4.3 Joint Research

* A research may have multiple student authors.
* One student is designated as the primary submitter and must be a registered user.
* Additional co-authors are recorded as attribution metadata and are not required to have user accounts in v0.1.
* Only the primary submitter may upload files, submit for review, and respond to revision requests.

---

### 4.4 Files

* PDF: **Required** for publication

Constraints:

* Recommended maximum size: 50–100 MB

---

### 4.5 Language

* English only (v0.1)

---

## 5. Workflow & Status Model

### 5.1 States

* Draft
* Submitted
* Under Review
* Revisions Requested
* Approved
* Published
* Withdrawn
* Rejected Final — A terminal state indicating the supervisor has rejected the research and no further revisions are expected for this submission.

#### Clarification
RevisionsRequested is a non-terminal state that allows resubmission. RejectedFinal is terminal and ends the submission lifecycle

No other states are allowed.

---

### 5.2 State Transitions

* Draft → Submitted
* Submitted → Under Review
* Under Review → Revisions Requested
* Revisions Requested → Submitted
* Under Review → Approved
* Approved → Published
* Published → Withdrawn

Invalid transitions must be rejected.

---

### 5.3 Immutability Rules

* Approved research is immutable
* Published research is immutable
* Published files must never be overwritten

---

### 5.4 Persistent Identifiers

* Each published research is assigned a permanent URN.
* Wasomi Scholars acts as the naming authority in v0.1.
* URNs must be immutable and globally unique.
* The URN scheme must allow future mapping to external identifier systems.

---

### 5.5 Licensing

* Students must select an open-access license during the Draft stage.
* The selected license is finalized at publication and becomes immutable thereafter.
* Publishers may modify license selection only prior to publication.

---

## 6. Access Model

### 6.1 Access Type

* All research is **open access** in v0.1

### 6.2 Licensing

* Research must declare a license at publication time
* Supported licenses:

  * Creative Commons family (configurable)

Licensing support must be implemented in a way that allows future expansion via feature flags.

---

## 7. History & Audit

### 7.1 Audit Requirements

The system must record:

* Status changes
* Approval actions
* Publication actions
* Unpublish actions

Audit logs must be:

* Immutable
* Timestamped
* Linked to acting user

---

### 7.2 Versioning

* Research metadata versions must be preserved
* File versions must not be overwritten

---

## 8. Identifiers & Preservation

### 8.1 Identifiers

* Each published research must receive a unique, permanent identifier (URN or Handle)
* Identifiers must never be reused

---

### 8.2 Storage

* Files must be stored in durable object storage
* Published files must be treated as permanent

---

## 9. Public Access

### 9.1 Public Visibility

* Unauthenticated users can:

  * Browse published research
  * View metadata
  * Download files

Unpublished research must never be publicly accessible.

---

## 10. Developer Acceptance Criteria

A feature is considered complete only if:

* All relevant acceptance tests pass
* No invariant defined in this spec is violated
* Audit and history requirements are met
* No behavior contradicts the workflow or access model

---

**END OF FROZEN SPEC v0.1**
