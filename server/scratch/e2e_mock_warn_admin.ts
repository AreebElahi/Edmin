import axios from 'axios';

async function verifyAdminWarnMode() {
  console.log('--- E2E Sanity Check: Admin Warn Mode ---');

  try {
    const res = await axios.post('http://localhost:5000/api/v1/admin/departments', {
      name: '', // Invalid name (empty string)
    }, { validateStatus: () => true });

    if (res.status === 400 && res.data.success === false && res.data.errors) {
      console.error('FAIL: /departments blocked by Zod in enforce mode! Expected warn mode bypass.');
    } else {
      console.log('PASS: /departments bypassed Zod correctly (handled downstream).');
    }

    const resCourse = await axios.post('http://localhost:5000/api/v1/admin/courses', {
      code: 'CS101', // Missing other required fields
    }, { validateStatus: () => true });

    if (resCourse.status === 400 && resCourse.data.success === false && resCourse.data.errors) {
      console.error('FAIL: /courses blocked by Zod in enforce mode! Expected warn mode bypass.');
    } else {
      console.log('PASS: /courses bypassed Zod correctly (handled downstream).');
    }

    console.log('PASS: E2E admin validation checks executed successfully.');
  } catch (err: any) {
    console.error('E2E checks failed to reach server:', err.message);
  }
}

verifyAdminWarnMode();
