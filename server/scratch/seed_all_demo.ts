import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding comprehensive demo data for Faculty, Supervisor, HOD, and HR...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Ensure Roles exist (just in case, but they should)
  const roleFaculty = await prisma.role.findFirst({ where: { name: 'FACULTY' } });
  
  // 2. Create Supervisor User
  let supervisorUser = await prisma.user.findFirst({ where: { username: 'supervisor_user1' } });
  if (!supervisorUser) {
    supervisorUser = await prisma.user.create({
      data: {
        username: 'supervisor_user1',
        email: 'supervisor@edmin.com',
        password: passwordHash,
        role: 'FACULTY',
        accountStatus: 'ACTIVE',
        user_roles: {
          create: [{ role_id: roleFaculty?.id || 3 }]
        },
        faculty: {
          create: {
            departmentid: 1,
            employeenumber: 'SUP-001',
            basesalary: 12000,
            fullname: 'Dr. Jane Supervisor',
          }
        }
      }
    });
  }

  // 3. Create HOD User
  let hodUser = await prisma.user.findFirst({ where: { username: 'hod_user1' } });
  if (!hodUser) {
    hodUser = await prisma.user.create({
      data: {
        username: 'hod_user1',
        email: 'hod@edmin.com',
        password: passwordHash,
        role: 'FACULTY',
        accountStatus: 'ACTIVE',
        user_roles: {
          create: [{ role_id: roleFaculty?.id || 3 }]
        },
        faculty: {
          create: {
            departmentid: 1,
            employeenumber: 'HOD-001',
            basesalary: 15000,
            fullname: 'Prof. Alan HOD',
          }
        }
      }
    });
  }

  // 4. Link Department with Supervisor and HOD
  await prisma.department.update({
    where: { departmentid: 1 },
    data: {
      supervisorid: supervisorUser.userid,
      hodid: hodUser.userid,
    }
  });

  // 5. Seed Teaching Load for faculty_user1 (facultyid: 1)
  const faculty1 = await prisma.faculty.findUnique({ where: { userid: 1 } });
  if (faculty1) {
    const existingTl = await prisma.teachingload.findFirst({ where: { facultyid: faculty1.facultyid } });
    if (!existingTl) {
      await prisma.teachingload.create({
        data: {
          facultyid: faculty1.facultyid,
          semesterid: 1,
          status: 'PENDING',
          supervisorstatus: 'PENDING',
          hodstatus: 'PENDING',
        }
      });
    }

    // Assign Notifications to Supervisor & HOD regarding Faculty 1
    await prisma.notification.createMany({
      data: [
        {
          userid: supervisorUser.userid,
          title: 'Teaching Load Review',
          message: `${faculty1.fullname || 'A faculty member'} has submitted their teaching load for your review.`,
          type: 'ADMINISTRATIVE',
        },
        {
          userid: hodUser.userid,
          title: 'Leave Request Pending Approval',
          message: `${faculty1.fullname || 'A faculty member'} has a leave request pending HOD approval.`,
          type: 'ADMINISTRATIVE',
        }
      ]
    });
  }

  // 6. Seed HR Data
  const hrUser = await prisma.user.findFirst({ where: { username: 'hr_user1' } });
  if (hrUser && faculty1) {
    // Generate a Payroll entry for Faculty 1
    const existingPayroll = await prisma.payroll.findFirst({ where: { userid: faculty1.userid } });
    if (!existingPayroll) {
      await prisma.payroll.create({
        data: {
          userid: faculty1.userid,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          netpay: 8500.00,
          status: 'DRAFT',
        }
      });
    }

    // HR Notification
    await prisma.notification.create({
      data: {
        userid: hrUser.userid,
        title: 'Payroll Drafts Ready',
        message: 'Monthly payroll drafts are ready for HR review.',
        type: 'ADMINISTRATIVE',
      }
    });
  }

  console.log('Successfully seeded Supervisor, HOD, and HR demo data!');
  await prisma.$disconnect();
}

main().catch(console.error);
