/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- ENTERPRISE SEEDING: FACULTY CARD & ATTENDANCE SYSTEM ---');

  // 1. GetOrCreate Attendance Settings
  let settings = await prisma.facultyattendancesettings.findFirst();
  if (!settings) {
    settings = await prisma.facultyattendancesettings.create({
      data: {
        officestarttime: '09:00',
        officeendtime: '17:00',
        graceperiod: 30,
        autocheckoutenabled: true,
        maxworkinghours: 12.0,
        latethreshold: 15,
        earlydeparturethreshold: 15,
      },
    });
    console.log('✓ Created default attendance settings.');
  } else {
    console.log('✓ Attendance settings verified.');
  }

  // 2. Fetch all faculty profiles with user relation
  const facultyMembers = await prisma.faculty.findMany({
    where: { isactive: true },
    include: { user: true },
  });

  if (facultyMembers.length === 0) {
    console.warn('⚠️ No active faculty members found in database.');
    return;
  }

  console.log(`Found ${facultyMembers.length} active faculty members.`);

  // 3. Assign unique RFID cards to all faculty members
  let cardCounter = 10001;
  const cardsMap: Record<string, string> = {
    'user1@edmin.com': '10001',
    'supervisor@edmin.com': '10002',
    'hod@edmin.com': '10003',
  };

  for (const f of facultyMembers) {
    const email = f.user.email || f.user.institutionalEmail || '';
    const assignedCard = cardsMap[email] || String(cardCounter++);
    
    await prisma.faculty.update({
      where: { facultyid: f.facultyid },
      data: { cardnumber: assignedCard },
    });
    console.log(`  - Assigned RFID Card #${assignedCard} to ${f.fullname || f.user.username}`);
  }

  // 4. Wipe existing attendance records & correction requests to ensure clean seed
  console.log('Clearing old attendance records & correction requests...');
  await prisma.facultyattendancecorrectionrequest.deleteMany({});
  await prisma.facultyattendanceauditlog.deleteMany({});
  await prisma.facultyattendance.deleteMany({});
  console.log('✓ Database cleaned.');

  // 5. Seed Attendance Logs across past 7 days + Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const readers = ['READER-01', 'READER-02', 'GATE-NORTH', 'MAIN-FACULTY-BLOCK'];

  for (let i = 6; i >= 0; i--) {
    const currentDay = new Date(today);
    currentDay.setDate(today.getDate() - i);
    currentDay.setHours(0, 0, 0, 0);

    const isToday = i === 0;

    for (let fIdx = 0; fIdx < facultyMembers.length; fIdx++) {
      const faculty = facultyMembers[fIdx];
      const reader = readers[fIdx % readers.length];

      if (isToday) {
        // TODAY'S LIVE DATA
        if (fIdx === 0) {
          // Faculty 1 (Dr. John Doe): Present today
          const checkIn = new Date(currentDay);
          checkIn.setHours(8, 45, 0, 0);
          const checkOut = new Date(currentDay);
          checkOut.setHours(17, 10, 0, 0);

          const att = await prisma.facultyattendance.create({
            data: {
              facultyid: faculty.facultyid,
              attendancedate: currentDay,
              checkintime: checkIn,
              checkouttime: checkOut,
              status: 'Present',
              workinghours: 8.42,
              attendancesource: 'CARD',
              cardreaderid: reader,
              islate: false,
              isearlydeparture: false,
            },
          });

          await prisma.facultyattendanceauditlog.createMany({
            data: [
              {
                attendanceid: att.facultyattendanceid,
                action: 'CHECKIN',
                oldcheckin: null,
                newcheckin: checkIn,
                oldcheckout: null,
                newcheckout: null,
                reason: 'Smart card tap check-in',
                performedby: faculty.userid,
                performedrole: 'FACULTY',
                ipaddress: '127.0.0.1',
                device: `Card Reader (${reader})`,
                createdat: checkIn,
              },
              {
                attendanceid: att.facultyattendanceid,
                action: 'CHECKOUT',
                oldcheckin: checkIn,
                newcheckin: checkIn,
                oldcheckout: null,
                newcheckout: checkOut,
                reason: 'Smart card tap check-out',
                performedby: faculty.userid,
                performedrole: 'FACULTY',
                ipaddress: '127.0.0.1',
                device: `Card Reader (${reader})`,
                createdat: checkOut,
              },
            ],
          });
        } else if (fIdx === 1) {
          // Faculty 2 (Dr. Jane Supervisor): Currently Working (Checked In, Not Checked Out)
          const checkIn = new Date(currentDay);
          checkIn.setHours(9, 18, 0, 0); // Late by 18 mins

          const att = await prisma.facultyattendance.create({
            data: {
              facultyid: faculty.facultyid,
              attendancedate: currentDay,
              checkintime: checkIn,
              checkouttime: null,
              status: 'Currently Working',
              workinghours: 0,
              attendancesource: 'CARD',
              cardreaderid: reader,
              islate: true,
              isearlydeparture: false,
            },
          });

          await prisma.facultyattendanceauditlog.create({
            data: {
              attendanceid: att.facultyattendanceid,
              action: 'CHECKIN',
              oldcheckin: null,
              newcheckin: checkIn,
              oldcheckout: null,
              newcheckout: null,
              reason: 'Smart card tap check-in (Late arrival)',
              performedby: faculty.userid,
              performedrole: 'FACULTY',
              ipaddress: '127.0.0.1',
              device: `Card Reader (${reader})`,
              createdat: checkIn,
            },
          });
        } else {
          // Faculty 3 (Prof. Alan HOD): Early Departure
          const checkIn = new Date(currentDay);
          checkIn.setHours(8, 55, 0, 0);
          const checkOut = new Date(currentDay);
          checkOut.setHours(16, 20, 0, 0); // Left at 4:20 PM

          const att = await prisma.facultyattendance.create({
            data: {
              facultyid: faculty.facultyid,
              attendancedate: currentDay,
              checkintime: checkIn,
              checkouttime: checkOut,
              status: 'Early Departure',
              workinghours: 7.42,
              attendancesource: 'CARD',
              cardreaderid: reader,
              islate: false,
              isearlydeparture: true,
            },
          });

          await prisma.facultyattendanceauditlog.create({
            data: {
              attendanceid: att.facultyattendanceid,
              action: 'CHECKIN',
              oldcheckin: null,
              newcheckin: checkIn,
              oldcheckout: null,
              newcheckout: checkOut,
              reason: 'Smart card tap check-in & check-out',
              performedby: faculty.userid,
              performedrole: 'FACULTY',
              ipaddress: '127.0.0.1',
              device: `Card Reader (${reader})`,
              createdat: checkIn,
            },
          });
        }
      } else {
        // HISTORICAL DAYS
        const checkIn = new Date(currentDay);
        checkIn.setHours(8 + (fIdx % 2), 50 + (i * 3) % 20, 0, 0);

        const checkOut = new Date(currentDay);
        checkOut.setHours(17, 5 + (i * 7) % 30, 0, 0);

        let status = 'Present';
        let isLate = false;
        let isEarly = false;
        let isAuto = false;
        let actualCheckout: Date | null = checkOut;

        if (i === 1 && fIdx === 0) {
          status = 'Forgot Check Out';
          actualCheckout = null;
        } else if (i === 2 && fIdx === 1) {
          status = 'Auto Checked Out';
          isAuto = true;
        } else if (i === 3 && fIdx === 2) {
          status = 'Late Arrival';
          isLate = true;
        }

        const att = await prisma.facultyattendance.create({
          data: {
            facultyid: faculty.facultyid,
            attendancedate: currentDay,
            checkintime: checkIn,
            checkouttime: actualCheckout,
            status,
            workinghours: actualCheckout ? 8.2 : 0,
            attendancesource: 'CARD',
            cardreaderid: reader,
            islate: isLate,
            isearlydeparture: isEarly,
            isautocheckout: isAuto,
          },
        });

        await prisma.facultyattendanceauditlog.create({
          data: {
            attendanceid: att.facultyattendanceid,
            action: isAuto ? 'AUTO_CHECKOUT' : 'CHECKIN',
            oldcheckin: null,
            newcheckin: checkIn,
            oldcheckout: null,
            newcheckout: actualCheckout,
            reason: `Historical log entry (${status})`,
            performedby: faculty.userid,
            performedrole: 'FACULTY',
            ipaddress: '127.0.0.1',
            device: `Card Reader (${reader})`,
            createdat: checkIn,
          },
        });
      }
    }
  }

  // 6. Seed Realistic Correction Requests
  const faculty1 = facultyMembers[0]; // Dr. John Doe
  const faculty2 = facultyMembers[1] || facultyMembers[0]; // Dr. Jane Supervisor

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const reqCheckIn = new Date(yesterday);
  reqCheckIn.setHours(9, 0, 0, 0);
  const reqCheckOut = new Date(yesterday);
  reqCheckOut.setHours(17, 30, 0, 0);

  // Correction 1: PENDING
  await prisma.facultyattendancecorrectionrequest.create({
    data: {
      facultyid: faculty2.facultyid,
      requestedcheckin: reqCheckIn,
      requestedcheckout: reqCheckOut,
      reason: 'RFID scanner at Main Gate was unresponsive during check-out at 5:30 PM.',
      status: 'PENDING',
      createdat: new Date(),
    },
  });

  // Correction 2: APPROVED
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);

  await prisma.facultyattendancecorrectionrequest.create({
    data: {
      facultyid: faculty1.facultyid,
      requestedcheckin: new Date(twoDaysAgo.setHours(8, 50, 0, 0)),
      requestedcheckout: new Date(twoDaysAgo.setHours(17, 15, 0, 0)),
      reason: 'Forgot smart card in vehicle; security granted visitor pass.',
      status: 'APPROVED',
      comments: 'Approved by HR Administrator',
      createdat: twoDaysAgo,
    },
  });

  console.log('✓ Seeded 2 correction requests (1 PENDING, 1 APPROVED).');
  console.log('SUCCESS: Enterprise faculty attendance data successfully seeded!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
