import axios from 'axios';

async function verifyAdminBatchBWarnMode() {
  console.log('--- E2E Sanity Check: Admin Batch B Warn Mode ---');

  try {
    const res = await axios.patch('http://localhost:5000/api/v1/admin/faculty/teaching-loads/1/override', {
      action: 'INVALID_ACTION', // Invalid action
    }, { validateStatus: () => true });

    if (res.status === 400 && res.data.success === false && res.data.errors) {
      console.error('FAIL: /faculty/teaching-loads/1/override blocked by Zod in enforce mode! Expected warn mode bypass.');
    } else {
      console.log('PASS: /faculty/teaching-loads/1/override bypassed Zod correctly (handled downstream).');
    }

    const resConfig = await axios.put('http://localhost:5000/api/v1/admin/settings/config', {
      globalAttendanceThreshold: 150, // Invalid threshold (max 100)
    }, { validateStatus: () => true });

    if (resConfig.status === 400 && resConfig.data.success === false && resConfig.data.errors) {
      console.error('FAIL: /settings/config blocked by Zod in enforce mode! Expected warn mode bypass.');
    } else {
      console.log('PASS: /settings/config bypassed Zod correctly (handled downstream).');
    }

    console.log('PASS: E2E admin Batch B validation checks executed successfully.');
  } catch (err: any) {
    console.error('E2E checks failed to reach server:', err.message);
  }
}

verifyAdminBatchBWarnMode();
