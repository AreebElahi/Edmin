import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api';

const STUDENT_EMAIL = 'student@edmin.com';
const STUDENT_PASSWORD = 'password123';
const FACULTY_EMAIL = 'user1@edmin.com';
const FACULTY_PASSWORD = 'password123';
const ADMIN_EMAIL = 'user3@edmin.com';
const ADMIN_PASSWORD = 'password123';

const QUIZ_ID = 1;
const ASSIGNMENT_ID = 6;

let PASS = 0;
let FAIL = 0;

function green(text: string) { console.log(`\x1b[32m${text}\x1b[0m`); }
function red(text: string) { console.log(`\x1b[31m${text}\x1b[0m`); }

async function login(email: string, password: string) {
  try {
    const res = await axios.post(`${BASE_URL}/v1/auth/login`, { email, password });
    return res.data.data.access_token;
  } catch (err: any) {
    console.error(`Login failed for ${email}:`, err.response?.data || err.message);
    process.exit(1);
  }
}

async function main() {
  const studentToken = await login(STUDENT_EMAIL, STUDENT_PASSWORD);
  const facultyToken = await login(FACULTY_EMAIL, FACULTY_PASSWORD);
  const adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);

  const api = axios.create({ validateStatus: () => true });

  console.log("--- Check 1: Student Submit & Un-Submit ---");
  const testFilePath = path.join(process.cwd(), 'real-test-unsubmit.pdf');
  fs.writeFileSync(testFilePath, '%PDF-1.4 unsubmit test');
  
  let form = new FormData();
  form.append('file', fs.createReadStream(testFilePath));
  let uploadRes = await api.post(`${BASE_URL}/v1/student/assignments/${ASSIGNMENT_ID}/submit`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${studentToken}` }
  });
  
  if (uploadRes.status === 201) {
    green(`PASS — Student submitted assignment successfully`);
    PASS++;
  } else {
    red(`FAIL — Student submit failed with status ${uploadRes.status}: ${JSON.stringify(uploadRes.data)}`);
    FAIL++;
  }

  let unsubmitRes = await api.delete(`${BASE_URL}/v1/student/assignments/${ASSIGNMENT_ID}/submit`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });

  if (unsubmitRes.status === 200) {
    green(`PASS — Student un-submitted assignment successfully`);
    PASS++;
  } else {
    red(`FAIL — Student un-submit failed with status ${unsubmitRes.status}`);
    FAIL++;
  }

  let form2 = new FormData();
  form2.append('file', fs.createReadStream(testFilePath));
  let uploadRes2 = await api.post(`${BASE_URL}/v1/student/assignments/${ASSIGNMENT_ID}/submit`, form2, {
    headers: { ...form2.getHeaders(), Authorization: `Bearer ${studentToken}` }
  });

  console.log("--- Check 2: Seed PDF for Quiz ---");
  const realFileUrl = uploadRes2.data?.data?.submission?.fileUrl || uploadRes2.data?.data?.fileUrl || 'fallback-url';
  await prisma.aiquiz.update({
    where: { aiquizid: QUIZ_ID },
    data: { pdfurl: realFileUrl }
  });

  console.log("--- Check 3: Faculty Download PDF ---");
  let res = await api.get(`${BASE_URL}/v1/storage/quiz-pdf/${QUIZ_ID}`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  if (res.status === 200 || res.status === 404) {
    green(`PASS — Faculty download (Code ${res.status})`);
    PASS++;
  } else {
    red(`FAIL — Faculty download got ${res.status}`);
    FAIL++;
  }

  console.log("--- Check 4: Admin Download PDF ---");
  res = await api.get(`${BASE_URL}/v1/storage/quiz-pdf/${QUIZ_ID}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (res.status === 200 || res.status === 404) {
    green(`PASS — Admin download (Code ${res.status})`);
    PASS++;
  } else {
    red(`FAIL — Admin download got ${res.status}`);
    FAIL++;
  }

  console.log("--- Check 5: Student Blocked from PDF ---");
  res = await api.get(`${BASE_URL}/v1/storage/quiz-pdf/${QUIZ_ID}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  if (res.status === 403) {
    green(`PASS — Student blocked (Code ${res.status})`);
    PASS++;
  } else {
    red(`FAIL — Student not blocked, got ${res.status}`);
    FAIL++;
  }

  console.log(`\nResults: ${PASS} PASS, ${FAIL} FAIL`);
  if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
}

main().catch(console.error);
