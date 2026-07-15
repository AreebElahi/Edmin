# HR Dashboard Refactor Summary

## Completed Tasks

1.  **Sidebar Navigation**:
    *   Removed "Recruitment" from the HR menu.
    *   Added "Reports" to the HR menu.

2.  **Centralized Employee Data**:
    *   Created `app/dashboard/hr/data.ts` with a constant `EMPLOYEES` array containing 8 specific employee records.
    *   All HR modules now reference this central data source for consistency.

3.  **Employees Page (`/dashboard/hr/employees`)**:
    *   Updated the employee list to use the centralized data.
    *   Added a "Department" field to the "Add Employee" modal.
    *   The "Add Employee" button functions correctly within the page context.

4.  **Reports Page (`/dashboard/hr/reports`)**:
    *   Created a new page to display daily submitted reports.
    *   Data is mocked based on the employee list, simulating daily activity logs.
    *   Does NOT redirect to Payroll.

5.  **Payroll Page (`/dashboard/hr/payroll`)**:
    *   Refactored to be a **static table** as requested.
    *   Displays: Employee Name, Salary, and Status (Paid/Unpaid).
    *   Uses the same employee names from the centralized list.

6.  **Leave Management Page (`/dashboard/hr/leaves`)**:
    *   Updated the table columns to: Employee Name, Leave Type, From Date, To Date.
    *   Removed the generic "Duration" column in favor of specific dates.
    *   Populated with mock requests linked to the centralized employees.

7.  **Attendance Page (`/dashboard/hr/attendance`)**:
    *   Added filter functionality for: Present, Late, Absent, On Leave.
    *   Table columns: Employee, Department, Time In, Status, Actions.
    *   Populated with mock attendance logs for "Today" based on the employee list.

## Verification

*   **Navigation**: The sidebar correctly links to all new and updated pages.
*   **Data Consistency**: All pages (`Employees`, `Reports`, `Payroll`, `Leaves`, `Attendance`) show the same set of 8 employees.
*   **Functionality**: Filters on Attendance and Leaves pages work as expected.
