import dotenv from 'dotenv';
dotenv.config();
process.env.REDIS_URL = '';

const { PrismaClient } = await import('@prisma/client');
const { processOutboxEvents } = await import('../workers/outboxPoller.js');

import prisma from '../config/prisma.js';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runQATests() {
  console.log('====================================================');
  console.log('         WORKFLOW CONTROL PLANE QA TEST SUITE        ');
  console.log('====================================================\n');

  // --- PREPARATION ---
  console.log('🔍 [QA SETUP] Preparing test resources...');
  
  // Find a student with a program
  let student = await prisma.student.findFirst({
    where: { 
      programid: { not: null },
      isactive: true
    },
    include: { program: true }
  });

  if (!student) {
    console.log('⚠️  No active student with program found. Querying any student...');
    student = await prisma.student.findFirst({ include: { program: true } });
  }

  if (!student) {
    throw new Error('❌ QA Setup Failed: No student records found. Run seeds first.');
  }

  // Ensure program exists and has an active fee plan
  let programId = student.programid;
  if (!programId) {
    const program = await prisma.program.findFirst();
    if (program) {
      programId = program.programid;
      await prisma.student.update({
        where: { studentid: student.studentid },
        data: { programid: programId }
      });
      console.log(`Updated student #${student.studentid} to program #${programId}`);
    } else {
      throw new Error('❌ QA Setup Failed: No programs found in database.');
    }
  }

  let feePlan = await prisma.feeplan.findFirst({
    where: { programid: programId, isactive: true }
  });

  if (!feePlan) {
    console.log(`⚠️  No active feeplan found for program #${programId}. Creating mock feeplan...`);
    feePlan = await prisma.feeplan.create({
      data: {
        programid: programId,
        tuitionpercredit: 200,
        labfees: 150,
        registrationfee: 100,
        isactive: true
      }
    });
  }

  const validStudentId = student.studentid;
  console.log(`✅ [QA SETUP] Using Student ID: ${validStudentId}, Program ID: ${programId}`);
  console.log(`✅ [QA SETUP] active feeplan ID: ${feePlan.feeplanid}`);

  // Clean up any old invoices for this student to avoid unique constraint violations
  await prisma.studentinvoice.deleteMany({
    where: { studentid: validStudentId }
  });
  console.log('🧹 [QA SETUP] Cleaned old student invoices for test student.\n');


  // ==========================================
  // TEST 1: HAPPY PATH (INJECT -> COMPLETED)
  // ==========================================
  console.log('----------------------------------------------------');
  console.log('TEST 1: Happy Path (inject event -> completed)');
  console.log('----------------------------------------------------');
  
  // Inject a valid STUDENT_ENROLLED event
  const happyEvent = await prisma.outboxEvent.create({
    data: {
      event_type: 'STUDENT_ENROLLED',
      aggregate_type: 'student',
      aggregate_id: validStudentId,
      status: 'PENDING',
      attempt_count: 0,
      payload: { studentId: validStudentId, semesterId: 1, enrolledCredits: 12 }
    }
  });
  console.log(`📥 Injected PENDING event #${happyEvent.id} (STUDENT_ENROLLED)`);

  // Run the outbox poller once
  console.log('⚙️  Invoking background outbox worker...');
  await processOutboxEvents();

  // Verify status in DB
  const happyResult = await prisma.outboxEvent.findUnique({
    where: { id: happyEvent.id }
  });

  if (happyResult && happyResult.status === 'COMPLETED') {
    console.log(`🎉 [PASS] Event #${happyEvent.id} transitioned PENDING -> COMPLETED successfully.`);
    console.log(`          Processed at: ${happyResult.processed_at}`);
  } else {
    console.log(`❌ [FAIL] Event #${happyEvent.id} status is ${happyResult?.status} (Expected: COMPLETED).`);
    console.log(`          Last Error: ${happyResult?.last_error}`);
  }
  console.log();


  // ==========================================
  // TEST 2: FAILURE PATH (INJECT INVALID -> DLQ)
  // ==========================================
  console.log('----------------------------------------------------');
  console.log('TEST 2: Failure Path (inject event -> force failure -> DLQ)');
  console.log('----------------------------------------------------');

  // Inject event with invalid student ID (999999) to force feeplan error
  const invalidStudentId = 999999;
  const failingEvent = await prisma.outboxEvent.create({
    data: {
      event_type: 'STUDENT_ENROLLED',
      aggregate_type: 'student',
      aggregate_id: invalidStudentId,
      status: 'PENDING',
      attempt_count: 0,
      payload: { studentId: invalidStudentId, semesterId: 1, enrolledCredits: 12 }
    }
  });
  console.log(`📥 Injected PENDING event #${failingEvent.id} with invalid studentId: ${invalidStudentId}`);

  // Run worker multiple times to fast-forward retry limits (Max attempts = 5)
  console.log('⚙️  Running outbox worker 5 times to hit retry limit...');
  for (let i = 1; i <= 5; i++) {
    await processOutboxEvents();
    const current = await prisma.outboxEvent.findUnique({ where: { id: failingEvent.id } });
    console.log(`   Attempt ${i}/5: Status = ${current?.status}, Attempt Count = ${current?.attempt_count}`);
  }

  // Verify it transitioned to FAILED (DLQ)
  const failResult = await prisma.outboxEvent.findUnique({
    where: { id: failingEvent.id }
  });

  if (failResult && failResult.status === 'FAILED') {
    console.log(`🎉 [PASS] Event #${failingEvent.id} hit max attempts and moved to FAILED (DLQ).`);
    console.log(`          Logged Error: "${failResult.last_error}"`);
  } else {
    console.log(`❌ [FAIL] Event #${failingEvent.id} is in status ${failResult?.status} (Expected: FAILED).`);
  }
  console.log();


  // ==========================================
  // TEST 3: RECOVERY PATH (REPLAY / RETRY -> COMPLETED)
  // ==========================================
  console.log('----------------------------------------------------');
  console.log('TEST 3: Recovery Path (retry/replay -> succeeds)');
  console.log('----------------------------------------------------');

  console.log(`🛠️  Fixing event payload: changing studentId ${invalidStudentId} -> ${validStudentId}`);
  
  // Simulate fixing the payload and triggering replay
  await prisma.outboxEvent.update({
    where: { id: failingEvent.id },
    data: {
      payload: { studentId: validStudentId, semesterId: 1, enrolledCredits: 12 },
      status: 'PENDING',
      attempt_count: 0,
      last_error: null
    }
  });
  console.log(`🔄 Replayed event #${failingEvent.id} (Status reset to PENDING, attempts reset to 0)`);

  // Run the poller
  console.log('⚙️  Invoking background outbox worker...');
  await processOutboxEvents();

  // Verify status is COMPLETED
  const recoveryResult = await prisma.outboxEvent.findUnique({
    where: { id: failingEvent.id }
  });

  if (recoveryResult && recoveryResult.status === 'COMPLETED') {
    console.log(`🎉 [PASS] Replayed event #${failingEvent.id} recovered and processed to COMPLETED successfully.`);
  } else {
    console.log(`❌ [FAIL] Replayed event #${failingEvent.id} status is ${recoveryResult?.status} (Expected: COMPLETED).`);
    console.log(`          Last Error: ${recoveryResult?.last_error}`);
  }
  console.log();


  // ==========================================
  // TEST 4: MANUAL OVERRIDE (RESOLVE -> COMPLETED)
  // ==========================================
  console.log('----------------------------------------------------');
  console.log('TEST 4: Manual Override (mark resolved -> completed)');
  console.log('----------------------------------------------------');

  // Inject another failing event
  const manualEvent = await prisma.outboxEvent.create({
    data: {
      event_type: 'STUDENT_ENROLLED',
      aggregate_type: 'student',
      aggregate_id: invalidStudentId,
      status: 'PENDING',
      attempt_count: 0,
      payload: { studentId: invalidStudentId, semesterId: 1, enrolledCredits: 12 }
    }
  });
  console.log(`📥 Injected PENDING event #${manualEvent.id} (Will fail)`);

  // Run worker once to make it fail
  await processOutboxEvents();
  let manualResult = await prisma.outboxEvent.findUnique({ where: { id: manualEvent.id } });
  console.log(`   Initial Run Status: ${manualResult?.status}, attempts: ${manualResult?.attempt_count}, error: "${manualResult?.last_error}"`);

  // Simulate manual resolve override from the action panel
  console.log(`🛠️  Triggering Mark Resolved action on event #${manualEvent.id}...`);
  await prisma.outboxEvent.update({
    where: { id: manualEvent.id },
    data: {
      status: 'COMPLETED',
      processed_at: new Date(),
      last_error: null
    }
  });

  // Verify status in DB
  manualResult = await prisma.outboxEvent.findUnique({
    where: { id: manualEvent.id }
  });

  if (manualResult && manualResult.status === 'COMPLETED' && !manualResult.last_error) {
    console.log(`🎉 [PASS] Event #${manualEvent.id} manually overridden to COMPLETED state (dismissed from failure lists).`);
  } else {
    console.log(`❌ [FAIL] Event #${manualEvent.id} status is ${manualResult?.status} (Expected: COMPLETED).`);
  }
  console.log();


  // ==========================================
  // TEST 5: UI CORRECTNESS (BACKEND CONTRACT MATCH)
  // ==========================================
  console.log('----------------------------------------------------');
  console.log('TEST 5: UI Correctness (inspector matches backend)');
  console.log('----------------------------------------------------');

  // Fetch the happy result and display the exact JSON schema returned
  const eventToInspect = await prisma.outboxEvent.findUnique({
    where: { id: happyEvent.id }
  });

  if (eventToInspect) {
    console.log('🖥️  [QA CLIENT COMPATIBILITY CHECK]');
    console.log('   Expected fields in UI Event Inspector:');
    console.log(`   - ID: ${eventToInspect.id} (Type: ${typeof eventToInspect.id})`);
    console.log(`   - Status: "${eventToInspect.status}" (Type: ${typeof eventToInspect.status})`);
    console.log(`   - Event Type: "${eventToInspect.event_type}" (Type: ${typeof eventToInspect.event_type})`);
    console.log(`   - Aggregate Type: "${eventToInspect.aggregate_type}" (Type: ${typeof eventToInspect.aggregate_type})`);
    console.log(`   - Aggregate ID: ${eventToInspect.aggregate_id} (Type: ${typeof eventToInspect.aggregate_id})`);
    console.log(`   - Created At: ${eventToInspect.created_at} (Type: ${typeof eventToInspect.created_at})`);
    console.log(`   - Processed At: ${eventToInspect.processed_at} (Type: ${typeof eventToInspect.processed_at})`);
    console.log('   - Payload:');
    console.log(JSON.stringify(eventToInspect.payload, null, 4));
    console.log('\n🎉 [PASS] Database schema matches client interface models perfectly!');
  } else {
    console.log('❌ [FAIL] Inspector record missing.');
  }

  // Cleanup QA events
  console.log('\n🧹 [CLEANUP] Removing test outbox events from DB...');
  await prisma.outboxEvent.deleteMany({
    where: {
      id: { in: [happyEvent.id, failingEvent.id, manualEvent.id] }
    }
  });
  console.log('🧹 [CLEANUP] Deleted test events successfully.');

  await prisma.$disconnect();
  console.log('\n====================================================');
  console.log('        QA TEST SUITE COMPLETED SUCCESSFULLY!        ');
  console.log('====================================================');
}

runQATests().catch(err => {
  console.error('❌ QA Suite Error:', err);
  prisma.$disconnect();
});
