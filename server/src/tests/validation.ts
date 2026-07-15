

import http from 'http';
import jwt from 'jsonwebtoken';

import prisma from '../config/prisma.js';
const API_URL = 'http://localhost:5000/api/v1';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runValidation() {
  console.log('--- Starting End-to-End System Validation ---');

  // 1. Prepare User Data
  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error("No users exist in the database! Please run seeds first.");
  }

  // Ensure user has ADMIN role for tests
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: user.userid, role_id: adminRole.id } },
      update: {},
      create: { user_id: user.userid, role_id: adminRole.id }
    });
    // Invalidate cache
    const { redisConnection } = await import('../config/queue.js');
    if (redisConnection) await redisConnection.del(`RBAC_V2:${user.userid}`);
  }

  // Generate JWT manually to bypass bcrypt issues in test
  const token = jwt.sign(
    { userId: user.userid, role: 'ADMIN' }, 
    process.env.JWT_SECRET || 'dev_secret_fallback', 
    { expiresIn: '1h' }
  );

  console.log('✅ Auth JWT Generated');

  // 2. Create a Test Ticket
  let ticket = await prisma.ticket.create({
    data: {
      subject: 'E2E Validation Ticket',
      status: 'OPEN',
      priority: 'HIGH',
      source_type: 'MANUAL',
      requester_id: user.userid,
      version: 1
    }
  });
  console.log(`✅ Test Ticket Created: ID ${ticket.id}`);

  // 3. Start SSE Connection Manually
  console.log('🔄 Connecting to SSE Stream...');
  const sseReq = http.request(`${API_URL}/admin/tickets/stream?token=${token}`, (res) => {
    console.log(`✅ SSE Connected (Status: ${res.statusCode})`);
    
    res.on('data', (chunk) => {
      const dataStr = chunk.toString();
      if (dataStr.includes('TicketResolvedEvent')) {
        console.log('✅ SSE Stream Received TicketResolvedEvent!');
        console.log(dataStr);
      }
    });
  });
  sseReq.end();

  await delay(2000); // Give SSE time to connect

  // 4. Resolve Ticket via API (Triggers Outbox -> Redis -> SSE)
  console.log('🔄 Triggering Ticket Resolution via API...');
  try {
    const res = await fetch(`${API_URL}/admin/tickets/${ticket.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        resolutionText: 'Resolved via automated E2E validation script',
        version: ticket.version,
        adminId: user.userid
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw { message: data.error?.message || 'API request failed', details: data };
    }
    console.log(`✅ Ticket Resolved. Success: ${data.success}, ID: ${data.ticketId}`);
  } catch (err: any) {
    console.error(`❌ API Error: ${err.message || 'Unknown error'}`, err.details || '');
  }

  console.log('🔄 Waiting for Outbox Poller and Redis Worker to process event...');
  await delay(6000); // Wait > 5s for outbox poller

  // 5. Verify Outbox Processed State
  const outboxEvent = await prisma.outboxEvent.findFirst({
    where: { 
      event_type: 'TICKET_RESOLVED',
      aggregate_id: ticket.id
    }
  });

  if (outboxEvent) {
    console.log('Outbox Event found:', outboxEvent);
    if (outboxEvent.status === 'COMPLETED') {
      console.log('✅ Outbox Event Processed Successfully!');
    } else {
      console.log(`❌ Outbox Event NOT Processed! (Status: ${outboxEvent.status})`);
    }
  } else {
    console.log('❌ Outbox Event NOT FOUND at all!');
  }

  // Cleanup
  console.log('🧹 Cleaning up test data...');
  await prisma.ticket.delete({ where: { id: ticket.id } });
  if (outboxEvent) {
    await prisma.outboxEvent.delete({ where: { id: outboxEvent.id } });
  }

  sseReq.destroy();
  await prisma.$disconnect();
  console.log('--- Validation Complete ---');
}

runValidation().catch(console.error);
