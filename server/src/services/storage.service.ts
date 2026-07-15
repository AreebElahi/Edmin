import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in environment");
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'Edmin bucket';

/**
 * Strips the legacy "uploads/" prefix from database paths if present
 */
function normalizePath(url: string): string {
  return url.replace(/^uploads\//, '');
}

/**
 * Save a file buffer to storage.
 * @param buffer File content
 * @param extension File extension including dot (e.g., '.pdf')
 * @param subDir Sub-directory under uploads (e.g., 'quizzes', 'assignments')
 * @returns The relative URL or file path (e.g., 'uploads/quizzes/filename.pdf')
 */
export async function saveFile(buffer: Buffer, extension: string = '.pdf', subDir: string = 'quizzes', contentType?: string): Promise<string> {
  const filename = `${crypto.randomUUID()}${extension}`;
  const bucketPath = `${subDir}/${filename}`;

  const resolvedContentType = contentType || (
    extension === '.pdf' ? 'application/pdf' : 
    extension === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
    extension === '.zip' ? 'application/zip' :
    extension === '.png' ? 'image/png' :
    extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' :
    extension === '.txt' ? 'text/plain' :
    'application/octet-stream'
  );

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(bucketPath, buffer, {
      contentType: resolvedContentType,
      upsert: false
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  // Return the path starting with uploads/ for backward compatibility with existing expectations
  // e.g. "uploads/assignments/abc.pdf"
  return `uploads/${bucketPath}`;
}

/**
 * Read a file from storage.
 * @param url The stored file path or URL
 * @returns File content as Buffer
 */
export async function readFile(url: string): Promise<Buffer> {
  const normalizedPath = normalizePath(url);
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(normalizedPath);

  if (error) {
    throw new Error(`Supabase download failed: ${error.message}`);
  }
  
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Delete a file from storage.
 * @param url The stored file path or URL
 */
export async function deleteFile(url: string): Promise<void> {
  const normalizedPath = normalizePath(url);
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([normalizedPath]);

  if (error) {
    console.error(`Failed to delete file at ${url} from Supabase:`, error.message);
  }
}

/**
 * Generate a secure, signed URL for a private file download
 * @param url The stored file path or URL
 * @param expiresIn Time until URL expires in seconds (default 3600)
 */
export async function getSignedUrl(url: string, expiresIn: number = 3600): Promise<string> {
  const normalizedPath = normalizePath(url);
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(normalizedPath, expiresIn);

  if (error || !data) {
    throw new Error(`Supabase signed URL generation failed: ${error?.message}`);
  }

  return data.signedUrl;
}
