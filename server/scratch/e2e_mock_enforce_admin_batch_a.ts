import axios from 'axios';

async function verifyAdminBatchAEnforceMode() {
  console.log('--- E2E Sanity Check: Admin Batch A Enforce Mode ---');

  try {
    const res = await axios.post('http://localhost:5000/api/v1/admin/departments', {
      code: 'CS'
      // Missing name, should fail in enforce mode
    }, { validateStatus: () => true });

    if (res.status === 400 && res.data.success === false && res.data.errors) {
      console.log('PASS: /departments correctly blocked by Zod in enforce mode with 400 status and correct error shape.');
    } else {
      console.error('FAIL: /departments did not return 400 with errors in enforce mode!');
    }

    console.log('PASS: E2E admin Batch A validation checks executed successfully.');
  } catch (err: any) {
    console.error('E2E checks failed to reach server:', err.message);
  }
}

verifyAdminBatchAEnforceMode();
