

import prisma from '../config/prisma.js';

async function runAudit() {
  console.log("--- DASHBOARD ACCESS AUDIT ---");

  // 1. Check for Faculty members who also have the base User role 'HR'
  // (In case this is how 'HR sub-access' is modeled)
  const dualHrFaculty = await prisma.user.findMany({
    where: {
      role: 'HR',
      faculty: { some: {} }
    },
    include: { faculty: true }
  });
  console.log(`\nFaculty users with base User.role = 'HR': ${dualHrFaculty.length}`);
  dualHrFaculty.forEach(u => console.log(` - UserID: ${u.userid}, Name: ${u.faculty[0].fullname}`));

  // 2. Check for Faculty with departmentmember subroles
  const deptMembers = await prisma.departmentmember.groupBy({
    by: ['subrole'],
    _count: { subrole: true }
  });
  console.log(`\nDepartmentMember subrole counts:`);
  console.log(deptMembers);

  // 3. Find HODs from the department table
  const hods = await prisma.department.findMany({
    where: { hodid: { not: null } },
    select: { hodid: true, name: true }
  });
  console.log(`\nCurrent HOD assignments: ${hods.length}`);
  hods.forEach(h => console.log(` - UserID: ${h.hodid} is HOD of ${h.name}`));

  // 4. Find Supervisors from the department table
  const supervisors = await prisma.department.findMany({
    where: { supervisorid: { not: null } },
    select: { supervisorid: true, name: true }
  });
  console.log(`\nCurrent Supervisor assignments: ${supervisors.length}`);
  supervisors.forEach(s => console.log(` - UserID: ${s.supervisorid} is Supervisor of ${s.name}`));

  // 5. Check for overlaps (HOD and Supervisor)
  const hodIds = new Set(hods.map(h => h.hodid));
  const supervisorIds = new Set(supervisors.map(s => s.supervisorid));
  
  const dualHodSupervisors = [...hodIds].filter(id => supervisorIds.has(id));
  console.log(`\nUsers with BOTH HOD and Supervisor designations: ${dualHodSupervisors.length}`);
  dualHodSupervisors.forEach(id => console.log(` - UserID: ${id}`));

}

runAudit()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
