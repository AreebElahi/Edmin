import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: bucket, error: getError } = await supabase.storage.getBucket('edmin-uploads');
  if (getError) {
    console.error("Failed to get bucket:", getError);
    return;
  }
  console.log("Current Bucket Config:", bucket.allowed_mime_types);

  // Update bucket to allow all mime types
  const { data: updatedBucket, error: updateError } = await supabase.storage.updateBucket('edmin-uploads', {
    allowedMimeTypes: null // allow all
  });

  if (updateError) {
    console.error("Failed to update bucket:", updateError);
  } else {
    console.log("Bucket updated successfully!");
  }
}

main();
