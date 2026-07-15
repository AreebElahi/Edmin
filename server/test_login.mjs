async function testLogin(email, password) {
  try {
    const res = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    console.log(`Login for ${email}:`, res.status, data.user?.role || data);
  } catch (err) {
    console.error(`Login error for ${email}:`, err.message);
  }
}

async function run() {
  // Wait a little bit for server to be fully up
  await new Promise(r => setTimeout(r, 2000));
  await testLogin('user1@edmin.com', 'password123'); // Faculty
  await testLogin('user3@edmin.com', 'password123'); // Admin
  await testLogin('user4@edmin.com', 'password123'); // HR
  await testLogin('student@edmin.com', 'password123'); // Student
}
run();
