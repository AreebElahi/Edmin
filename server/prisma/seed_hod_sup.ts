import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HOD and Supervisor accounts...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Get a department to assign them to (e.g., Computer Science or the first one)
  let department = await prisma.department.findFirst({
    where: { isactive: true }
  });

  if (!department) {
    department = await prisma.department.create({
      data: {
        name: 'Computer Science',
        isactive: true,
        type: 'ACADEMIC'
      }
    });
  }

  // Create HOD
  let hodUser = await prisma.user.findFirst({ where: { username: 'hod@edmin.com' } });
  if (!hodUser) {
    hodUser = await prisma.user.create({
      data: {
        username: 'hod@edmin.com',
        email: 'hod@edmin.com',
        password: passwordHash,
        role: 'FACULTY'
      }
    });
    
    await prisma.faculty.create({
      data: {
        userid: hodUser.userid,
        fullname: 'Dr. Alan Turing',
        departmentid: department.departmentid,
        isactive: true,
        employeenumber: 'F-HOD-01',
        basesalary: 120000.00
      }
    });

    console.log('Created HOD user: hod@edmin.com');
  }

  // Create Supervisor
  let supUser = await prisma.user.findFirst({ where: { username: 'supervisor@edmin.com' } });
  if (!supUser) {
    supUser = await prisma.user.create({
      data: {
        username: 'supervisor@edmin.com',
        email: 'supervisor@edmin.com',
        password: passwordHash,
        role: 'FACULTY'
      }
    });
    
    await prisma.faculty.create({
      data: {
        userid: supUser.userid,
        fullname: 'Dr. Grace Hopper',
        departmentid: department.departmentid,
        isactive: true,
        employeenumber: 'F-SUP-01',
        basesalary: 110000.00
      }
    });

    console.log('Created Supervisor user: supervisor@edmin.com');
  }

  // Update Department with HOD and Supervisor
  await prisma.department.update({
    where: { departmentid: department.departmentid },
    data: {
      hodid: hodUser.userid,
      supervisorid: supUser.userid
    }
  });
  console.log(`Assigned HOD and Supervisor to department: ${department.name}`);

  // Create department members
  // HOD Member
  const hodMember = await prisma.departmentmember.findFirst({
    where: { userid: hodUser.userid, departmentid: department.departmentid }
  });
  if (!hodMember) {
    await prisma.departmentmember.create({
      data: {
        userid: hodUser.userid,
        departmentid: department.departmentid,
        subrole: 'HOD',
        isactive: true
      }
    });
  }

  // Supervisor Member
  const supMember = await prisma.departmentmember.findFirst({
    where: { userid: supUser.userid, departmentid: department.departmentid }
  });
  if (!supMember) {
    await prisma.departmentmember.create({
      data: {
        userid: supUser.userid,
        departmentid: department.departmentid,
        subrole: 'TEACHER', // Supervisor is handled via department.supervisorid
        isactive: true
      }
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
