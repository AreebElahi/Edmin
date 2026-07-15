import fetch from 'node-fetch';

const users = [
  'student@edmin.com',
  'user1@edmin.com',
  'user4@edmin.com',
  'user3@edmin.com'
];

async function testLogin() {
  for (const email of users) {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password: 'password123' })
      });
      
      if (!response.ok) {
        console.log(`Failed for ${email}: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(text);
        continue;
      }
      
      const data = await response.json();
      const role = data.data.user.role;
      let dashboard = '/dashboard/admin'; // default in AuthProvider
      if (role === 'FACULTY') dashboard = '/dashboard/faculty';
      else if (role === 'STUDENT') dashboard = '/dashboard/student';
      else if (role === 'HR') dashboard = '/dashboard/hr';
      
      console.log(`Success: ${email} -> Role: ${role} -> Dashboard: ${dashboard}`);
    } catch (e) {
      console.error(`Error for ${email}: ${e.message}`);
    }
  }
}

testLogin();
