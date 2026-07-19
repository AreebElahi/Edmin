---
trigger: always_on
---

This is an excellent foundation for your complete university lifecycle ERP. The main improvement is to convert it into a formal enterprise governance specification that an AI agent can enforce across backend, frontend, workflows, deadlines, RBAC, audit logs, and escalations.

Use the following as your master Antigravity prompt.

### Antigravity Master Rules — Complete University Lifecycle Governance Engine

You are a Principal Enterprise Architect and Staff+ ERP Engineer responsible for validating, repairing, and enforcing the complete operational lifecycle of the Edmin University ERP System.

Think like an architect from SAP, Oracle, Workday, ServiceNow, Microsoft, or Google.

This system is a single integrated university platform, not a collection of pages.

Your job is to ensure that every workflow, every role, every approval, every escalation, and every audit log behaves consistently across the entire ERP.

### 1. SYSTEM AUTHORITY MODEL

The ERP contains five operational authorities:

| Authority        | Scope                         | Can Approve                      |
| ---------------- | ----------------------------- | -------------------------------- |
| Admin            | University-wide               | All workflows                    |
| HR               | Human resources               | Leave only                       |
| HOD              | Department academic authority | Teaching load (dual approval)    |
| Supervisor       | Department operations         | Teaching load + enrollment       |
| Teaching Faculty | Assigned courses only         | Attendance / activity submission |

HOD and Supervisor are not separate employees. They are Teaching Faculty members with department-specific elevated roles.

A teacher may simultaneously hold:

* Teacher

* Supervisor

* HOD

…but only within the departments assigned by Admin.

### 2. ADMIN-CONTROLLED SYSTEM SETUP

### 2.1 Department Creation Flow

```
Admin Login
   ↓
Create Department
   ↓
Assign HOD (existing teacher)
   ↓
Assign Supervisor (existing teacher)
   ↓
Activate Department
```

### Validation Rules

* HOD must already exist as Teaching Faculty.

* Supervisor must already exist as Teaching Faculty.

* One department can have one active HOD.

* One department can have one active Supervisor.

* A teacher cannot be assigned to another department without explicit approval.

### Required Audit Logs

* `DEPARTMENT_CREATED`

* `HOD_ASSIGNED`

* `SUPERVISOR_ASSIGNED`

* `DEPARTMENT_ACTIVATED`

### 2.2 Course Management Flow

```
Admin Login
   ↓
Create Course
   ↓
Assign Credit Hours
   ↓
Map Course to Department(s)
   ↓
Add Course to Semester Pool
```

### Rules

* Courses are global reusable entities.

* Departments receive course mappings through a junction table.

* Credit hours are mandatory.

* Courses may belong to multiple departments.

* Semester pools are published independently.

### Audit Logs

* `COURSE_CREATED`

* `COURSE_MAPPED_TO_DEPARTMENT`

* `COURSE_ADDED_TO_SEMESTER_POOL`

### 2.3 User Registration (No Self Registration)

```
Admin Login
   ↓
Register User
   ↓
Assign Role
   ↓
Generate Credentials
   ↓
Activate Account
```

### Rules

* No public signup.

* System-generated temporary password.

* Password change required on first login.

* Email/SMS notification optional.

* Role assignment is mandatory.

### Audit Logs

* `USER_CREATED`

* `ROLE_ASSIGNED`

* `ACCOUNT_ACTIVATED`

### 3. AUTHENTICATION & RBAC

### Login Flow

```
Credentials
   ↓
JWT Authentication
   ↓
RBAC Authorization
   ↓
Role-Based Dashboard
```

### Role Matrix

| Role             | Department Scope      | Cross-Department Access |
| ---------------- | --------------------- | ----------------------- |
| Admin            | All                   | ✅                       |
| HR               | All HR records        | ❌                       |
| HOD              | Assigned only         | ❌                       |
| Supervisor       | Assigned only         | ❌                       |
| Teaching Faculty | Assigned courses only | ❌                       |

Never expose data outside the authorized department scope.

### 4. SEMESTER TEACHING LOAD ENGINE

### Phase A — Semester Publishing

```
Admin creates semester
   ↓
Department course pool published
```

### Phase B — Teacher Course Selection

```
Teacher Login
   ↓
View Available Courses
   ↓
Select Courses
   ↓
System Calculates Credit Hours
```

### Credit Enforcement

* Minimum required credits = department policy.

* Maximum overload = configurable.

* Duplicate course selection prohibited.

### Auto Load Balancing

If selected credits are below the minimum:

```
System identifies unassigned courses
   ↓
Auto-assigns remaining courses
   ↓
Admin notified
```

### Audit

* `TEACHING_LOAD_SUBMITTED`

* `AUTO_LOAD_BALANCING_APPLIED`

### Phase C — Dual Approval (Strict Rule)

```
Supervisor Review
   ↓
HOD Review
   ↓
BOTH approve → ACTIVE
ANY reject → RETURNED
```

### State Machine

DRAFTPENDING_SUPERVISORPENDING_HODACTIVEREJECTED

A teaching load becomes ACTIVE only when both approvals are completed.

### Phase D — Escalation

If the deadline expires:

```
Escalated to Admin
   ↓
Admin Approve / Modify / Reject
```

Admin decisions override departmental approvals.

### 5. STUDENT ENROLLMENT WORKFLOW

### Enrollment Request

```
Student Login
   ↓
Browse Courses
   ↓
Submit Enrollment Request
   ↓
Supervisor Review
```

### Decision Rules

* Approve

* Reject

* Request changes (optional)

### Escalation

```
No supervisor action
   ↓
Escalate to Admin
   ↓
Admin Final Decision
```

### Hard Constraint

A student is NOT enrolled until approval is completed.

### Audit Logs

* `ENROLLMENT_REQUESTED`

* `ENROLLMENT_APPROVED`

* `ENROLLMENT_REJECTED`

* `ENROLLMENT_ESCALATED`

### 6. ATTENDANCE GOVERNANCE

### Submission Flow

```
Teacher Login
   ↓
Select Course Session
   ↓
Mark Attendance
   ↓
Submit
```

### Edit Policy

* Teachers may edit attendance.

* Every edit creates an immutable audit record.

* Original value must be preserved.

### Attendance Impacts

Attendance affects:

* Academic eligibility

* Examination eligibility

* Warning generation

* Department analytics

### Audit

* `ATTENDANCE_SUBMITTED`

* `ATTENDANCE_UPDATED`

### 7. DAILY ACTIVITY REPORTING

### Submission

```
Teacher submits EOD report
   ↓
Visible to Supervisor + HOD
```

### Review Chain

```
Supervisor Review
   ↓
HOD Review
```

### Escalation

```
No review within deadline
   ↓
Escalate to Admin
```

### Audit

* `ACTIVITY_REPORT_SUBMITTED`

* `ACTIVITY_REPORT_REVIEWED`

* `ACTIVITY_REPORT_ESCALATED`

### 8. LEAVE MANAGEMENT (HR AUTHORITY)

### Submission

```
Teacher submits leave request
   ↓
Notify Supervisor, HOD, HR
```

### Approval Authority

```
HR Review
   ↓
Approve / Reject
```

### Important Rule

Only HR can approve or reject leave.

Supervisor and HOD may comment only.

### Escalation

```
No HR action within deadline
   ↓
Escalate to Admin
```

### Admin Override

Admin may override HR decisions with mandatory justification.

### Audit

* `LEAVE_REQUESTED`

* `LEAVE_COMMENTED`

* `LEAVE_APPROVED`

* `LEAVE_REJECTED`

* `LEAVE_ESCALATED`

* `LEAVE_OVERRIDDEN`

### 9. PAYROLL (MANUAL PROCESS)

```
HR Login
   ↓
View Attendance + Leave
   ↓
Manual Salary Processing
   ↓
Generate Payroll Report
   ↓
Archive Payroll
```

### Constraints

* No automatic salary calculation.

* Payroll is manually entered by HR.

* Attendance and leave are reference data only.

* Archived payroll records become read-only.

### Audit

* `PAYROLL_CREATED`

* `PAYROLL_ARCHIVED`

### 10. AI MODULE GOVERNANCE

### AI Chatbot

Available to:

* Students

* Teaching Faculty

Target response time: < 5 seconds

Log:

* Query

* Response time

* User role

* Error state

### AI Quiz Generator

Available to: Teaching Faculty only

```
Topic + Difficulty
   ↓
Generate MCQs
   ↓
Teacher Review
   ↓
Publish Quiz
```

### Constraints

* AI output is draft content.

* Teacher approval is mandatory before publishing.

Audit:

* `AI_QUIZ_GENERATED`

* `AI_QUIZ_PUBLISHED`

### 11. SYSTEM-WIDE ESCALATION ENGINE

### Applicable Workflows

* Teaching Load

* Student Enrollment

* Leave Requests

* Daily Activity Reports

### Standard Pattern

```
Request Submitted
   ↓
Primary Authority
   ↓
Deadline Timer
   ↓
Escalate to Admin
```

### Requirements

* Configurable deadlines

* Escalation notifications

* Escalation history

* Admin override tracking

### 12. DATA INTEGRITY RULES

### Single Source of Truth

* Departments → authoritative

* Courses → authoritative

* Faculty → authoritative

* Teaching Load → authoritative

* Attendance → authoritative

* Leave Records → authoritative

Never duplicate operational data across modules.

### Transaction Requirements

Use database transactions for:

* Teaching load approval

* Enrollment approval

* Leave approval

* Department activation

* Role assignment

Rollback all changes if any step fails.

### 13. REQUIRED DASHBOARDS

Admin Dashboard

Departments, users, escalations, semesters, analytics, audit overview.

HR Dashboard

Faculty records, leave queue, payroll archive, staffing overview.

HOD Dashboard

Department analytics, teaching loads, approvals, faculty performance.

Supervisor Dashboard

Operational monitoring, enrollments, workload review, activity tracking.

Teaching Faculty Dashboard

Assigned courses, sections, attendance tasks, assessments, AI quiz tools, daily activity reports.

All dashboard counts must come from live database queries.

### 14. FINAL ACCEPTANCE CRITERIA

The ERP is considered valid only if:

* ✅ Department setup is fully controlled by Admin.

* ✅ HOD and Supervisor are implemented as department-scoped faculty roles.

* ✅ Teaching load uses strict dual approval.

* ✅ Credit-hour enforcement and auto load balancing work correctly.

* ✅ Enrollment cannot bypass Supervisor/Admin approval.

* ✅ Attendance edits are fully audited.

* ✅ Leave approval is controlled exclusively by HR.

* ✅ Escalation deadlines function for all governed workflows.

* ✅ Admin override actions are tracked with justification.

* ✅ AI quiz publishing requires teacher approval.

* ✅ All workflows generate audit logs.

* ✅ RBAC prevents cross-department data leakage.

* ✅ All modules share a single source of truth.

* ✅ The application builds with zero TypeScript, Prisma, ESLint, runtime, or data-integrity errors.

### 15. NON-NEGOTIABLE PRINCIPLE

This ERP must behave like a real university governance system, not a demo application.

Every approval, rejection, escalation, override, and audit record must be traceable, role-aware, department-aware, and historically immutable.
