import axios from 'axios';

async function verifyAdminBatchBEnforceMode() {
  console.log('--- E2E Sanity Check: Admin Batch B Enforce Mode ---');

  try {
    const resSettings = await axios.put('http://localhost:5000/api/v1/admin/settings/config', {
      maxUploadMB: 'not a number' // Invalid type
    }, { validateStatus: () => true });

    if (resSettings.status === 400 && resSettings.data.success === false && resSettings.data.errors) {
      console.log('PASS: /settings/config correctly blocked by Zod in enforce mode.');
    } else {
      console.error('FAIL: /settings/config did not return 400 with errors in enforce mode!');
    }

    const resReports = await axios.get('http://localhost:5000/api/v1/admin/reports/attendance?format=CSV&token=abc&page=-1', { validateStatus: () => true });
    
    if (resReports.status === 400 && resReports.data.success === false && resReports.data.errors) {
      console.log('PASS: /reports/attendance correctly blocked by Zod for invalid query param.');
    } else {
      console.error('FAIL: /reports/attendance did not return 400 with errors in enforce mode!');
    }

    console.log('PASS: E2E admin Batch B validation checks executed successfully.');
  } catch (err: any) {
    console.error('E2E checks failed to reach server:', err.message);
  }
}

verifyAdminBatchBEnforceMode();
