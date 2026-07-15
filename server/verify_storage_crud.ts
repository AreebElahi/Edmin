import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';

const STUDENT_EMAIL = 'student@edmin.com';
const STUDENT_PASSWORD = 'password123';
const FACULTY_EMAIL = 'user1@edmin.com';
const FACULTY_PASSWORD = 'password123';
const ADMIN_EMAIL = 'user3@edmin.com';
const ADMIN_PASSWORD = 'password123';

const ASSIGNMENT_ID = 6;
const QUIZ_ID = 1;

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

  const api = axios.create({ validateStatus: () => true }); // don't throw on 4xx/5xx

  console.log("--- Check: First Submission ---");
  const testFile1Path = path.join(process.cwd(), 'test1.pdf');
  fs.writeFileSync(testFile1Path, '%PDF-1.4 first submission content');
  
  let form = new FormData();
  form.append('file', fs.createReadStream(testFile1Path));
  
  let res = await api.post(`${BASE_URL}/v1/student/assignments/${ASSIGNMENT_ID}/submit`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${studentToken}` }
  });
  
  if (res.status === 201) {
    green(`PASS — first submission succeeded`);
    PASS++;
  } else {
    red(`FAIL — first submission failed with status ${res.status}: ${JSON.stringify(res.data)}`);
    FAIL++;
  }

  console.log("--- Check: Resubmission over existing submission ---");
  const testFile2Path = path.join(process.cwd(), 'test2.pdf');
  fs.writeFileSync(testFile2Path, '%PDF-1.4 second submission content');
  
  form = new FormData();
  form.append('file', fs.createReadStream(testFile2Path));
  
  res = await api.post(`${BASE_URL}/v1/student/assignments/${ASSIGNMENT_ID}/submit`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${studentToken}` }
  });
  
  if (res.status === 201) {
    green(`PASS — resubmission succeeded`);
    PASS++;
  } else {
    red(`FAIL — resubmission failed with status ${res.status}: ${JSON.stringify(res.data)}`);
    FAIL++;
  }

  console.log("--- Check: Un-submit ---");
  res = await api.delete(`${BASE_URL}/v1/student/assignments/${ASSIGNMENT_ID}/submit`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  
  if (res.status === 200 || res.status === 403) { // 403 if past duedate
    green(`PASS — un-submit handled properly (Code ${res.status})`);
    PASS++;
  } else {
    red(`FAIL — expected 200 or 403 for un-submit, got ${res.status}: ${JSON.stringify(res.data)}`);
    FAIL++;
  }

  console.log("--- Check: Quiz PDF Serve for Admin ---");
  res = await api.get(`${BASE_URL}/v1/storage/quiz-pdf/${QUIZ_ID}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (res.status === 200 || res.status === 404) {
    green(`PASS — quiz pdf serve handled properly for Admin (Code ${res.status})`);
    PASS++;
  } else {
    red(`FAIL — expected 200/404 for Admin, got ${res.status}`);
    FAIL++;
  }

  console.log("--- Check: Quiz PDF Serve for Faculty Owner ---");
  res = await api.get(`${BASE_URL}/v1/storage/quiz-pdf/${QUIZ_ID}`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  
  if (res.status === 200 || res.status === 404) {
    green(`PASS — quiz pdf serve handled properly for Faculty Owner (Code ${res.status})`);
    PASS++;
  } else {
    red(`FAIL — expected 200/404 for Faculty Owner, got ${res.status}`);
    FAIL++;
  }

  console.log("--- Check: Quiz PDF Serve blocks Student with 403 ---");
  res = await api.get(`${BASE_URL}/v1/storage/quiz-pdf/${QUIZ_ID}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  
  if (res.status === 403 || res.status === 404) {
    green(`PASS — quiz pdf serve blocks Student (Code ${res.status})`);
    PASS++;
  } else {
    red(`FAIL — expected 403/404 for Student, got ${res.status}`);
    FAIL++;
  }

  fs.unlinkSync(testFile1Path);
  fs.unlinkSync(testFile2Path);
  console.log(`\nTest complete: ${PASS} passed, ${FAIL} failed.`);
}

main().catch(err => {
  console.error("Test script crashed", err);
  process.exit(1);
});
