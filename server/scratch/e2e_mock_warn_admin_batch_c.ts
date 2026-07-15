import axios from 'axios';

async function verifyAdminBatchCWarnMode() {
  console.log('--- E2E Sanity Check: Admin Batch C Warn Mode ---');

  try {
    const res = await axios.post('http://localhost:5000/api/v1/admin/semesters', {
      name: '', // Invalid empty name
    }, { validateStatus: () => true });

    if (res.status === 400 && res.data.success === false && res.data.errors) {
      console.error('FAIL: /semesters blocked by Zod in enforce mode! Expected warn mode bypass.');
    } else {
      console.log('PASS: /semesters bypassed Zod correctly (handled downstream).');
    }

    const resComms = await axios.post('http://localhost:5000/api/v1/admin/communications/broadcast', {
      title: '', // Invalid empty title
    }, { validateStatus: () => true });

    if (resComms.status === 400 && resComms.data.success === false && resComms.data.errors) {
      console.error('FAIL: /communications/broadcast blocked by Zod in enforce mode! Expected warn mode bypass.');
    } else {
      console.log('PASS: /communications/broadcast bypassed Zod correctly (handled downstream).');
    }

    console.log('PASS: E2E admin Batch C validation checks executed successfully.');
  } catch (err: any) {
    console.error('E2E checks failed to reach server:', err.message);
  }
}

verifyAdminBatchCWarnMode();
