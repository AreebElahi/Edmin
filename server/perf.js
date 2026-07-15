import autocannon from 'autocannon';
import fetch from 'node-fetch';

async function runPerf() {
    console.log('Logging in...');
    const res = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user1@edmin.com', password: 'password123' })
    });
    
    const data = await res.json();
    const token = data.session?.access_token;
    
    if (!token) {
        console.error('Failed to get token:', data);
        return;
    }
    
    console.log('Token acquired. Starting load test on /api/courses...');
    
    const instance = autocannon({
        url: 'http://localhost:5000/api/courses',
        connections: 100,
        duration: 10,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }, console.log);
    
    autocannon.track(instance, { renderProgressBar: true });
}

runPerf();
