const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.ticket.updateMany({
    where: { id: 4 },
    data: { status: 'OPEN', version: 1, assignee_id: null }
  });
  console.log("Ticket 4 reset!");
}

main().then(() => prisma.$disconnect());
