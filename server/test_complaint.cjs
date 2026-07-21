const jwt = require('jsonwebtoken');

async function test() {
  const token = jwt.sign({ userId: 3, role: 'ADMIN', email: 'user3@edmin.com' }, 'supersecretjwtkeythatisverylongandsecure123!@#', { expiresIn: '1h' });
  const headers = { 'Authorization': `Bearer ${token}` };
  
  try {
    const r1 = await fetch('http://localhost:5000/api/v1/complaints', { headers });
    const text1 = await r1.text();
    console.log("R1 Data:", text1.substring(0, 150));
    
    const r2 = await fetch('http://localhost:5000/api/v1/complaints', { headers });
    const text2 = await r2.text();
    console.log("R2 Data:", text2.substring(0, 150));
  } catch (e) {
    console.error(e.message);
  }
}
test();
