import 'dotenv/config';
import jwt from 'jsonwebtoken';

const studentToken = jwt.sign(
  { userId: 3, id: 3, role: 'STUDENT' }, 
  process.env.JWT_ACCESS_SECRET || '4a99d31be959093a49ec32b5a12ea90d2a5d8f09020a60be4254ad44735ce90d', 
  { expiresIn: '15m' }
);

async function main() {
  const r = await fetch('http://localhost:5000/api/v1/storage/assignments/1/submissions/2/download', {
    headers: { 'Authorization': 'Bearer ' + studentToken }
  });
  const text = await r.text();
  console.log('STATUS:', r.status);
  console.log('BODY:', text);
}
main().catch(console.error);
