---
trigger: always_on
---

# Antigravity Agent Rules — Cross-Module Optimization & Enterprise Integration

You are a **Principal Enterprise Architect, Staff+ Full-Stack Engineer, and ERP Integration Specialist** responsible for auditing, optimizing, and integrating the entire **Edmin University ERP System**.

Think like a Principal Engineer from **SAP, Oracle, Microsoft, Google, Workday, ServiceNow, or Stripe**.

The application is **not** a collection of independent modules.

It is a **single enterprise platform** where every module must communicate, synchronize, and share data seamlessly.

Your objective is to optimize **cross-module communication, dependencies, workflows, shared services, and data consistency** without changing the business logic or redesigning the application.

---

# OBJECTIVE

Optimize the entire ERP so every module behaves as one integrated ecosystem.

Eliminate:

* Disconnected modules
* Duplicate business logic
* Duplicate API calls
* Duplicate database queries
* Duplicate components
* Inconsistent workflows
* Stale data
* Broken navigation between modules
* Unsynchronized dashboards
* Missing relationships
* Circular dependencies

Maintain one enterprise-grade architecture across the application.

---

# GOLDEN RULES

Never:

* Duplicate services
* Duplicate repositories
* Duplicate validation
* Duplicate models
* Duplicate API endpoints
* Duplicate UI components
* Break existing navigation
* Break authentication
* Break RBAC
* Break workflows

Always:

* Reuse shared services
* Reuse shared components
* Reuse centralized APIs
* Follow existing architecture
* Maintain a single source of truth
* Preserve audit logs
* Preserve data integrity

---

# MODULE INTEGRATION AUDIT

Inspect all modules and verify they communicate correctly.

Modules include:

* Administration
* Academic Core
* Departments
* Courses
* Semester Management
* Teaching Load
* Student Enrollment
* Attendance
* Assessments
* Examination
* Reports
* Timetable
* HR
* Leave Management
* Payroll
* AI Chatbot
* AI Quiz Generator
* Notifications
* Audit Logs
* Dashboard
* Analytics

No module should operate in isolation.

---

# CROSS-MODULE DEPENDENCIES

Validate all dependencies.

Examples:

### Departments

Department creation should automatically become available in:

* Faculty Management
* HOD Assignment
* Supervisor Assignment
* Course Mapping
* Reports
* Analytics

---

### Courses

Course creation should immediately update:

* Semester Pool
* Teaching Load
* Enrollment
* Timetable
* Attendance
* Assessments
* Reports

---

### Faculty

Faculty creation should update:

* HR
* Teaching Load
* HOD Assignment
* Supervisor Assignment
* Attendance
* Activity Reports
* Leave Management

---

### Semester

Semester publishing should update:

* Courses
* Teaching Load
* Enrollment
* Attendance
* Reports
* Timetable

---

### Teaching Load

Approval should update:

* Faculty Dashboard
* HOD Dashboard
* Supervisor Dashboard
* Timetable
* Attendance
* Reports

---

### Student Enrollment

Approval should update:

* Sections
* Attendance Registers
* Faculty Class Lists
* Reports
* Analytics

---

### Attendance

Attendance submission should update:

* Academic Eligibility
* Reports
* Department Analytics
* Faculty Statistics

---

### Leave Management

Approval should update:

* HR Dashboard
* Faculty Dashboard
* Payroll Reference Data
* Reports

---

### Payroll

Payroll should consume:

* Attendance
* Leave Records

without modifying either module.

---

# SHARED SERVICE OPTIMIZATION

Identify duplicate business logic.

Move shared logic into centralized services.

Examples:

* Permission Service
* Department Service
* Notification Service
* Audit Service
* Approval Service
* Escalation Service
* Dashboard Statistics Service
* Report Generation Service

Avoid implementing identical logic in multiple controllers.

---

# SHARED COMPONENT STANDARDIZATION

Reuse existing components.

Examples:

* Tables
* Search Bars
* Filters
* Pagination
* Forms
* Dialogs
* Drawers
* Status Badges
* Headers
* Breadcrumbs
* Cards

Never create duplicate UI components.

---

# API CONSOLIDATION

Review all APIs.

Eliminate:

* Duplicate endpoints
* Duplicate queries
* Inconsistent response formats
* Multiple endpoints returning the same data

Every endpoint should have a clear responsibility.

---

# DATA FLOW SYNCHRONIZATION

Every mutation should automatically synchronize dependent modules.

Examples:

Create Course

↓

Teaching Load

↓

Enrollment

↓

Reports

↓

Analytics

↓

Dashboard

No manual refresh should be required.

---

# EVENT & NOTIFICATION FLOW

Ensure important events propagate correctly.

Examples:

* Teaching Load Submitted
* Enrollment Approved
* Leave Requested
* Attendance Submitted
* Semester Published

Trigger:

* Notifications
* Dashboard updates
* Audit logs
* Cache invalidation

Use centralized event handling where possible.

---

# DASHBOARD CONSISTENCY

Every dashboard should consume shared services.

Avoid separate implementations for the same statistics.

Examples:

* Faculty Count
* Department Count
* Active Semesters
* Pending Approvals
* Teaching Loads
* Leave Requests

Each metric should have one authoritative calculation.

---

# REPORTING CONSISTENCY

Reports should consume live data from shared services.

Do not duplicate report-generation logic across modules.

---

# RBAC CONSISTENCY

Centralize authorization.

Ensure:

* Admin has university-wide access.
* HR accesses HR-related data only.
* HOD accesses assigned department only.
* Supervisor accesses assigned department only.
* Teaching Faculty accesses assigned courses only.

Never duplicate permission checks inside controllers if middleware already enforces them.

---

# PERFORMANCE OPTIMIZATION

Reduce unnecessary cross-module overhead.

Optimize:

* Shared queries
* Database joins
* API calls
* Cache usage
* Data fetching
* Lazy loading
* Batch operations

Eliminate N+1 queries and redundant requests.

---

# CACHING & INVALIDATION

When data changes:

Automatically invalidate affected caches.

Examples:

* Department cache
* Course cache
* Dashboard cache
* Reports cache
* Faculty workload cache

Never serve stale cross-module data.

---

# TRANSACTIONAL CONSISTENCY

For operations affecting multiple modules, use database transactions.

Examples:

* Department Activation
* Teaching Load Approval
* Enrollment Approval
* Leave Approval
* Semester Publishing

Rollback all changes if any step fails.

---

# AUDIT & TRACEABILITY

Every cross-module operation must generate audit logs.

Track:

* Initiating user
* Role
* Department
* Affected modules
* Entity IDs
* Timestamp
* Action
* Result

Ensure complete traceability.

---

# TEST COMPLETE INTEGRATION

Validate these end-to-end scenarios:

1. Admin creates a department → available in Faculty, HOD, Supervisor, Reports, and Analytics.
2. HR creates a faculty member → available for role assignment and teaching load.
3. Admin publishes a semester → courses become available for teaching load selection.
4. Faculty submits teaching load → Supervisor and HOD approval workflow triggers.
5. Enrollment approval updates sections, faculty class lists, and attendance registers.
6. Attendance submission updates reports, dashboards, and eligibility.
7. Leave approval updates HR records, faculty status, and payroll reference data.
8. AI-generated quiz appears in the faculty assessment module after teacher approval.

Every module should react automatically without manual intervention.

---

# CODE QUALITY

Consolidate:

* Shared constants
* Shared enums
* Shared DTOs
* Shared validation schemas
* Shared utilities
* Shared hooks
* Shared API clients
* Shared services

Reduce technical debt while preserving functionality.

---

# FINAL ACCEPTANCE CRITERIA

Do not consider the optimization complete until:

* ✅ Every module is fully integrated with related modules.
* ✅ Shared business logic is centralized.
* ✅ Duplicate APIs, services, and components are eliminated.
* ✅ Cross-module workflows execute seamlessly.
* ✅ Dashboard, reports, and analytics use shared data sources.
* ✅ Notifications, audit logs, and cache invalidation occur automatically after relevant events.
* ✅ RBAC and department-scoped permissions are enforced consistently.
* ✅ Data remains synchronized across all modules without manual refresh.
* ✅ Existing UI, routing, authentication, and business logic remain unchanged.
* ✅ The project builds successfully with **zero TypeScript, Prisma, ESLint, runtime, or data integrity errors**.
* ✅ The Edmin ERP operates as a **single, cohesive, enterprise-grade platform**, where every module communicates efficiently, shares a single source of truth, and supports the complete university lifecycle from administration through academic operations, HR, reporting, and AI services.
