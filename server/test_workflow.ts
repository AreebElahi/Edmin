import { PrismaClient } from '@prisma/client';
import { approveLeaveRequest } from './src/services/workflows/leaveWorkflow.service';

const prisma = new PrismaClient();
async function run() {
  const hr = await prisma.user.findFirst({ where: { role: 'HR' } });
  if (!hr) return console.log("No HR");
  
  const leave = await prisma.leaverequest.findFirst({ orderBy: { leaverequestid: 'desc' } });
  console.log("Before:", leave?.status);
  
  try {
    await approveLeaveRequest(leave!.leaverequestid, hr.userid, "Approving manually");
    const updated = await prisma.leaverequest.findUnique({ where: { leaverequestid: leave!.leaverequestid } });
    console.log("After:", updated?.status);
  } catch(e: any) {
    console.error("Error:", e.message);
  }
}
run();
