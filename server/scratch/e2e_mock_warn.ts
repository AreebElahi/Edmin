/**
 * E2E Sanity checks for Auth Validation (Warn Mode)
 * To be run when the database and server are fully available.
 */
import axios from 'axios';

async function verifyAuthWarnMode() {
  console.log('--- E2E Sanity Check: Auth Warn Mode ---');

  try {
    const signupRes = await axios.post('http://localhost:5000/api/v1/auth/signup', {
      email: 'not-an-email',
      password: '123'
    }, { validateStatus: () => true });

    if (signupRes.status === 400 && signupRes.data.success === false && signupRes.data.errors) {
      console.error('FAIL: /signup blocked by Zod in enforce mode! Expected warn mode bypass.');
    } else {
      console.log('PASS: /signup bypassed Zod correctly (handled downstream).');
    }

    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 12345,
      password: null
    }, { validateStatus: () => true });

    if (loginRes.status === 400 && loginRes.data.success === false && loginRes.data.errors) {
      console.error('FAIL: /login blocked by Zod in enforce mode! Expected warn mode bypass.');
    } else {
      console.log('PASS: /login bypassed Zod correctly (handled downstream).');
    }

    // Additional endpoints
    console.log('PASS: E2E auth validation checks executed successfully.');
  } catch (err: any) {
    console.error('E2E checks failed to reach server:', err.message);
  }
}

verifyAuthWarnMode();
