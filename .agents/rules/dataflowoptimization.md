---
trigger: always_on
---

# Antigravity Agent Rule — Data Flow Response Enhancement

You are responsible for enhancing the **data flow, API responses, and synchronization** across the entire **Edmin University ERP System**. Your goal is to ensure that every user receives **accurate, consistent, role-aware, and real-time data** regardless of which module they are using.

This enhancement must **not** change the business logic or redesign the system. Instead, improve the quality, consistency, and reliability of the data exchanged between the frontend, backend, and database.

---

# OBJECTIVE

Enhance the complete data flow and API response architecture to provide:

* Consistent API responses
* Reliable data synchronization
* Standardized response structures
* Accurate dashboard statistics
* Role-aware data filtering
* Automatic UI updates after changes
* Better error handling
* Faster data retrieval
* Elimination of stale or duplicated data

Every response returned by the backend should be predictable, reusable, and easy to consume by the frontend.

---

# STANDARDIZED API RESPONSE FORMAT

Every API endpoint should return a consistent structure.

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "timestamp": "ISO-8601"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "Email is required."
    }
  ],
  "timestamp": "ISO-8601"
}
```

All endpoints should follow this contract.

---

# ROLE-AWARE RESPONSES

Every response must automatically filter data based on the authenticated user's role and department.

Examples:

### Admin

* Full university data

### HR

* Employee and HR records only

### HOD

* Assigned department data only

### Supervisor

* Assigned department operational data only

### Teaching Faculty

* Assigned courses and sections only

### Student (future)

* Enrolled courses and personal academic records only

Never expose unauthorized records.

---

# RESPONSE CONSISTENCY

Verify every endpoint returns:

* Correct HTTP status codes
* Standard messages
* Proper validation errors
* Consistent pagination
* Search results
* Sorting information
* Filter metadata

Avoid inconsistent naming such as:

* `courseName`
* `course_name`
* `course_title`

Use one naming convention throughout the application.

---

# DASHBOARD DATA SYNCHRONIZATION

After any Create, Update, Delete, Approval, or Rejection action:

Automatically update:

* Dashboard statistics
* Cards
* Tables
* Charts
* Notifications
* Pending counts
* Recent activities

Users should never need to manually refresh the page.

---

# CROSS-MODULE SYNCHRONIZATION

Ensure changes propagate across every affected module.

Examples:

* Creating a department updates Admin, HR, HOD, and Supervisor dashboards.
* Assigning a faculty member updates HR records, Teaching Faculty dashboard, HOD workload, and Supervisor monitoring.
* Publishing a semester updates Academic Core, Courses, Teaching Load, and Enrollment.
* Approving enrollment updates Sections, Teaching Faculty class lists, Attendance, and Reports.
* Submitting attendance updates Academic Reports and Eligibility calculations.

Every related module should remain synchronized.

---

# DATA VALIDATION

Before returning responses:

Validate:

* Foreign key relationships
* Department ownership
* Role permissions
* Active status
* Soft-deleted records
* Duplicate entries

Return meaningful validation messages instead of generic errors.

---

# FRONTEND DATA HANDLING

Ensure the frontend:

* Uses the centralized API layer.
* Reuses existing hooks and services.
* Avoids duplicate API requests.
* Handles loading, empty, success, and error states consistently.
* Invalidates cached data after mutations.
* Refreshes affected views automatically.

---

# PERFORMANCE ENHANCEMENTS

Optimize responses by:

* Returning only required fields.
* Using efficient Prisma `select` and `include`.
* Eliminating N+1 queries.
* Supporting server-side pagination.
* Supporting server-side filtering and sorting.
* Reducing payload size.
* Caching safe read operations where appropriate.

Never sacrifice correctness for speed.

---

# AUDIT & TRACEABILITY

Every response-changing action should generate an audit record when applicable.

Examples:

* Department Created
* Course Assigned
* Semester Published
* Teaching Load Approved
* Enrollment Approved
* Leave Approved
* Attendance Updated

Audit logs should include:

* User
* Role
* Department
* Action
* Timestamp
* Entity affected

---

# ERROR HANDLING

Standardize all backend errors.

Return:

* Validation errors
* Authentication errors
* Authorization errors
* Resource not found
* Conflict errors
* Database errors
* Internal server errors

Each error should provide enough information for the frontend to display meaningful feedback without exposing sensitive implementation details.

---

# TEST DATA FLOW

Verify complete workflows end-to-end.

Examples:

* Admin creates a department → available to HOD and Supervisor.
* HR creates a faculty member → available for role assignment and course allocation.
* Faculty selects teaching load → Supervisor and HOD receive approval requests.
* Supervisor approves enrollment → student appears in section and attendance registers.
* Teacher submits attendance → reports and analytics update immediately.

Every workflow should maintain consistent data across all affected modules.

---

# FINAL ACCEPTANCE CRITERIA

The enhancement is complete only when:

* ✅ All API responses follow a single standardized format.
* ✅ Role-based filtering is consistently enforced.
* ✅ Cross-module data synchronization works automatically.
* ✅ Dashboard statistics reflect live database values.
* ✅ CRUD operations update all dependent modules.
* ✅ No stale, duplicated, or inconsistent data remains.
* ✅ Validation and error responses are standardized.
* ✅ Audit logs capture all critical actions.
* ✅ Existing UI, routing, authentication, RBAC, and business logic remain unchanged.
* ✅ The application builds successfully with **zero TypeScript, Prisma, ESLint, runtime, or data consistency errors**.
* ✅ The ERP behaves as a single, cohesive enterprise platform where every role receives accurate, synchronized, and timely information.
