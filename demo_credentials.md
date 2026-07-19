# Edmin Demo Credentials

Here are the complete credentials for all seeded users across the various modules. You can use these **Email** and **Password** combinations to log into the application.

| Role / Persona | Email Address | Password | Description / Status |
|---|---|---|---|
| **Admin** | `user3@edmin.com` | `password123` | Global Administration |
| **Faculty (Instructor)** | `user1@edmin.com` | `password123` | Dr. John Doe (Grades & Submissions) |
| **Faculty (Supervisor)** | `supervisor@edmin.com` | `Password123!` | Department Supervisor |
| **Faculty (HOD)** | `hod@edmin.com` | `Password123!` | Department HOD |
| **HR** | `user4@edmin.com` | `password123` | HR & Payroll Administrator |
| **Student 1** | `student@edmin.com` | `password123` | Alice Smith (Submission: **Submitted** - Pending Grade) |
| **Student 2** | `student2@edmin.com` | `password123` | Bob Jones (Submission: **Graded** - 85/100) |
| **Student 3** | `student3@edmin.com` | `password123` | Charlie Brown (Submission: **Pending** - No submission) |

> [!TIP]
> **Submissions & Grading Testing Flow**
> 1. Log in as **Faculty (Instructor)** (`user1@edmin.com`) and navigate to **Assignments**.
> 2. Open **"Lab 1: Variable Scopes and Types"** (ID: 1) and click **"View Submissions"**.
> 3. Verify the submissions grid:
>    - **Alice Smith**: Click **Grade**, enter a score (e.g. `90`) and remarks (e.g. *"Great work!"*), and click **Save Grade** to grade her.
>    - **Bob Jones**: Click **Download** to download his mock PDF file (`lab1_bob_jones_types.pdf`) from Supabase.
>    - **Charlie Brown**: Status is `Pending` (no file to download).
