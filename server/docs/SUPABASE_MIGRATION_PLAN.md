# Migrate File Uploads to Supabase Storage

Currently, uploaded files (e.g., quiz PDFs and assignment submissions) are saved to the local disk in `uploads/quizzes/` and `uploads/assignments/`. On ephemeral filesystems like Render, these are wiped out on every deploy. 

Additionally, after searching the codebase, I discovered that there are currently **no retrieval endpoints** (like `express.static`, `res.download`, or `res.sendFile`) exposed by the backend for these files. This means local uploads were essentially "write-only" black holes—the frontend could never actually download an assignment submission.

We will migrate all uploads to Supabase Storage, bypassing Row Level Security via the `SUPABASE_SERVICE_ROLE_KEY`.

## Bucket Policy Confirmation
**The `edmin-uploads` bucket will be explicitly marked as PRIVATE.**
Because the backend uses the `SUPABASE_SERVICE_ROLE_KEY` to upload and generate signed URLs on demand, we do not need to enable any public RLS policies. The bucket remains entirely sealed off from direct anonymous access. Only requests hitting our backend with valid session cookies and passing our RBAC checks will receive a signed URL or the file buffer.

## Proposed Changes

### Storage Layer Migration
#### [MODIFY] [storage.service.ts](file:///d:/Edmin/server/src/services/storage.service.ts)
- Replace `fs.writeFile`, `fs.readFile`, and `fs.unlink` with the `@supabase/supabase-js` client.
- Instantiate the client exclusively using `SUPABASE_SERVICE_ROLE_KEY`.
- Update `saveFile(buffer, extension, subDir)` to upload to `supabase.storage.from('edmin-uploads').upload(...)`.
  - It will continue returning a relative path (e.g., `assignments/filename.pdf`). For backward compatibility with existing DB rows, if `subDir` implies `uploads/`, we can strip or normalize it.
- Update `readFile(url)` to download the file directly from the Supabase bucket and return the `Buffer` (this is used internally by the AI Quiz generation).
- **New Method:** Add `getSignedUrl(path: string)` which returns a 1-hour signed URL from Supabase.

### Secure Download Endpoint (New)
#### [NEW] `server/src/routes/v1/storage.routes.ts` or inline in `student.routes.ts` / `faculty.routes.ts`
- We will build an explicit download endpoint (e.g., `/api/v1/assignments/:assignmentId/submissions/:submissionId/download`).
- **RBAC Checks:** The endpoint will verify the JWT and enforce that:
  - If the user is a STUDENT, they must be the owner of the submission.
  - If the user is FACULTY, they must be assigned to the course.
  - If the user is ADMIN, they are permitted.
- Once authorized, the backend will call `storageService.getSignedUrl(submission.fileUrl)` and redirect the client to the signed URL (or return it in a JSON payload).

### Controllers Update
#### [MODIFY] [assignments.controller.ts](file:///d:/Edmin/server/src/controllers/student/assignments.controller.ts)
- We will ensure that when `getAssignmentDetail` returns the submission, it either includes the new secure download link or the frontend knows to call the new download endpoint.

#### [MODIFY] [aiQuizController.ts](file:///d:/Edmin/server/src/controllers/aiQuizController.ts)
- No structural changes needed. The controller calls `storageService.readFile(pdfurl)`, which will transparently switch to fetching the PDF buffer from Supabase memory instead of local disk.

## Backward Compatibility (Local vs Supabase Paths)
- **What happens to old DB rows?**
  - Existing DB rows store paths like `uploads/quizzes/file.pdf`.
  - The new `storage.service.ts` logic will detect if a path begins with `uploads/` and dynamically strip it to query `quizzes/file.pdf` in the bucket.
  - If the file doesn't exist in Supabase (because it was a local file that got wiped), the download will cleanly fail (404) rather than crashing the app.
- **Local Files Migration:**
  - The `uploads/` directory on disk was completely wiped during our previous cleanup passes. There are currently NO actual student submissions or files sitting on disk to migrate.

## Verification Plan

### Automated Tests
- I will run the existing AI Quiz generation flow and Assignment Submission flow via scripts.
- I will query the Supabase REST API / Client to print a confirmed list of objects in the `edmin-uploads` bucket, verifying the upload successfully reached Supabase.

### Manual Verification
- I will write a script to execute the `/assignments/:assignmentId/submit` endpoint with a test PDF.
- I will then attempt to fetch the file through the new secure download endpoint.
- I will verify the RBAC check correctly rejects unauthorized users.
- I will use `curl` or `fetch` against the signed URL to download the file buffer and verify its byte length matches the original upload.
