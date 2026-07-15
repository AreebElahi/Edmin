# Supabase Storage Migration Walkthrough

## What was Changed

1. **Bucket Creation**: Created the `edmin-uploads` private bucket via the Supabase Client.
2. **`storage.service.ts` Refactoring**: Replaced all `fs` (local disk) operations with `@supabase/supabase-js`. 
   - `saveFile()` now streams the buffer directly to the `edmin-uploads` bucket.
   - `readFile()` now downloads the array buffer from Supabase and converts it back to a Node Buffer.
   - Built a `normalizePath()` helper to automatically strip `uploads/` for backward compatibility with older DB records.
3. **Secure Download Endpoint**: 
   - Built a new `storage.controller.ts` logic to fetch a signed URL for an `assignmentsubmission`.
   - Included rigorous RBAC logic:
     - **Admin**: Full access
     - **Student**: Can only access their *own* submission
     - **Faculty**: Can only access submissions for courses they are currently assigned to teach.
   - Added `server/src/routes/v1/storage.routes.ts` and mounted it at `/api/v1/storage`.
4. **Assignment Response Enhancements**:
   - Modified `assignments.service.ts` (`getAssignmentsWithStatus` and `getAssignmentDetail`) to automatically append a relative `downloadUrl` to the `submission` object returned to the frontend.
   - Example path: `/api/v1/storage/assignments/:assignmentId/submissions/:submissionId/download`

## Testing and Verification

- **End-to-End Test Execution**: I created a script (`e2e_supabase.ts`) that runs the full lifecycle:
  1. Authenticates a student via JWT.
  2. Submits a dummy PDF to the backend (`/api/v1/student/assignments/:id/submit`).
  3. Verifies the backend uploaded it to Supabase instead of local disk.
  4. Fetches the assignment detail to obtain the new `downloadUrl`.
  5. Hits the download endpoint to receive the JSON-formatted `{ url: signedUrl, expiresIn: 3600 }`.
  6. Fetches the signed URL over HTTP to ensure the file buffer was successfully retrieved from Supabase and its length matched exactly (58 bytes).
- **Cleanup**: I subsequently completely sanitized the local file system (removing stray test PDFs) and removed all test rows from the DB, leaving only the 1 original `assignmentsubmission` record.

The entire persistence layer is now seamlessly wired to Supabase Storage and safely insulated from Render's ephemeral filesystem wipes.
