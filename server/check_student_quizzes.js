import { generateToken } from './src/utils/jwt.utils.js';

async function test() {
  const token = generateToken(1, 'student', 'student@edmin.com');
  try {
    const res = await fetch('http://localhost:5000/api/v1/student/quizzes', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("STATUS:", res.status);
    console.log("BODY:", await res.text());
  } catch (err) {
    console.error(err.message);
  }
}
test();
