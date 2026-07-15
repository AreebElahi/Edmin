import axios from 'axios';

async function verifyAdminBatchCEnforceMode() {
  console.log('--- E2E Sanity Check: Admin Batch C Enforce Mode ---');

  try {
    const res = await axios.post('http://localhost:5000/api/v1/admin/semesters', {
      name: '', // Invalid empty name
    }, { validateStatus: () => true });

    if (res.status === 400 && res.data.success === false && res.data.errors) {
      console.log('PASS: /semesters correctly blocked by Zod in enforce mode with 400 status.');
    } else {
      console.error('FAIL: /semesters did not return 400 with errors in enforce mode!');
    }

    const resComms = await axios.post('http://localhost:5000/api/v1/admin/communications/broadcast', {
      title: '', // Invalid empty title
    }, { validateStatus: () => true });

    if (resComms.status === 400 && resComms.data.success === false && resComms.data.errors) {
      console.log('PASS: /communications/broadcast correctly blocked by Zod in enforce mode with 400 status.');
    } else {
      console.error('FAIL: /communications/broadcast did not return 400 with errors in enforce mode!');
    }

    console.log('PASS: E2E admin Batch C validation checks executed successfully.');
  } catch (err: any) {
    console.error('E2E checks failed to reach server:', err.message);
  }
}

verifyAdminBatchCEnforceMode();
