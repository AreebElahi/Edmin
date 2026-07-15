import http from 'http';

function request(options: http.RequestOptions, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log("Health Check: 127.0.0.1");
  try {
    const res = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/health',
      method: 'GET'
    });
    console.log(`Status: ${res.status}`);
    console.log(res.data);
  } catch (e: any) {
    console.log('Failed:', e.message);
  }
}
main();
