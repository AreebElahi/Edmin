import 'dotenv/config';
import jwt from 'jsonwebtoken';

const studentToken = jwt.sign(
  { userId: 3, id: 3, role: 'STUDENT' }, 
  process.env.JWT_ACCESS_SECRET || '4a99d31be959093a49ec32b5a12ea90d2a5d8f09020a60be4254ad44735ce90d', 
  { expiresIn: '15m' }
);

async function main() {
  console.log('--- UPLOAD ---');
  const formData = new FormData();
  formData.append('file', new Blob(['Hello World!'], { type: 'text/plain' }), 'test_proof.txt');

  const uploadRes = await fetch('http://localhost:5000/api/v1/student/assignments/1/submit', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + studentToken },
    body: formData
  });

  const uploadData = await uploadRes.json();
  console.log('Upload STATUS:', uploadRes.status);
  console.log('Upload BODY:', uploadData);

  if (!uploadData.success) {
    console.log('Upload failed, aborting download test.');
    return;
  }

  const submissionId = uploadData.data.assignmentsubmissionid;

  console.log('\n--- DOWNLOAD ---');
  const downloadRes = await fetch(`http://localhost:5000/api/v1/storage/assignments/1/submissions/${submissionId}/download`, {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + studentToken }
  });

  const downloadData = await downloadRes.json();
  console.log('Download STATUS:', downloadRes.status);
  console.log('Download BODY:', downloadData);

  if (downloadData.success && downloadData.data && downloadData.data.url) {
    console.log('\n--- FETCHING ACTUAL FILE BYTES ---');
    const fileRes = await fetch(downloadData.data.url);
    const fileText = await fileRes.text();
    console.log('File STATUS:', fileRes.status);
    console.log('File CONTENT:', fileText);
  }
}

main().catch(console.error);
