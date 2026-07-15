import axios from 'axios';

async function verifyAttendanceAssessmentEnforceMode() {
  console.log('--- E2E Sanity Check: Attendance & Assessment Enforce Mode ---');

  try {
    const resAtt = await axios.post('http://localhost:5000/api/v1/faculty/attendance', {
      sessionId: 1,
      records: [{ studentId: 'not-a-number', status: 'invalid-status' }] // Completely invalid
    }, { validateStatus: () => true });

    if (resAtt.status === 400 && resAtt.data.success === false && resAtt.data.errors) {
      console.log('PASS: /faculty/attendance correctly blocked by Zod in enforce mode with 400 status.');
    } else {
      console.error('FAIL: /faculty/attendance did not return 400 with errors in enforce mode!');
    }

    const resAssmt = await axios.patch('http://localhost:5000/api/v1/faculty/students/10/grade', {
      grade: 'Z-', // Invalid grade
    }, { validateStatus: () => true });

    if (resAssmt.status === 400 && resAssmt.data.success === false && resAssmt.data.errors) {
      console.log('PASS: /faculty/students/:id/grade correctly blocked by Zod in enforce mode with 400 status.');
    } else {
      console.error('FAIL: /faculty/students/:id/grade did not return 400 with errors in enforce mode!');
    }

    console.log('PASS: E2E validation checks executed successfully.');
  } catch (err: any) {
    console.error('E2E checks failed to reach server:', err.message);
  }
}

verifyAttendanceAssessmentEnforceMode();
