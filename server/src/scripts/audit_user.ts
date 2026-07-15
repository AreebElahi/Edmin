
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

import prisma from '../config/prisma.js';

async function run() {
  try {
    const email = 'user2@edmin.com';
    console.log(`\n=== 1. DB IDENTITY CHECK ===`);
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        faculty: true,
      }
    });

    if (!user) {
      console.log(`User ${email} not found.`);
      return;
    }

    console.log(`User ID: ${user.userid}`);
    console.log(`Role: ${user.role}`);
    console.log(`Is Faculty: ${user.faculty?.length > 0}`);

    const faculty = user.faculty?.[0];
    const facultyId = faculty?.facultyid;
    console.log(`Faculty ID: ${facultyId}`);

    console.log(`\n=== 2. PER-MODULE DATA TRACE ===`);
    
    // Courses/teaching assignments
    let courseOfferings: any[] = [];
    if (facultyId) {
      courseOfferings = await prisma.courseoffering.findMany({
        where: {
          OR: [{ facultyid: facultyId }, { instructorid: facultyId }]
        },
        include: { course: true }
      });
    }
    console.log(`Course Offerings: ${courseOfferings.length}`);
    courseOfferings.forEach(o => console.log(` - Offering ID: ${o.courseofferingid}, Course: ${o.course.code}`));

    // Teaching loads
    let teachingLoads: any[] = [];
    if (facultyId) {
      teachingLoads = await prisma.teachingload.findMany({
        where: { facultyid: facultyId },
        include: { teachingassignment: true }
      });
    }
    console.log(`Teaching Loads: ${teachingLoads.length}`);
    teachingLoads.forEach(tl => console.log(` - Load ID: ${tl.teachingloadid}, Status: ${tl.status}, Assignments: ${tl.teachingassignment.length}`));

    // Attendance
    let classSessions: any[] = [];
    if (facultyId) {
       classSessions = await prisma.classsession.findMany({
           where: {
               courseofferingid: { in: courseOfferings.map(o => o.courseofferingid) }
           },
           include: { attendance: true }
       });
    }
    console.log(`Class Sessions: ${classSessions.length}`);
    let attendanceCount = 0;
    classSessions.forEach(cs => attendanceCount += cs.attendance.length);
    console.log(`Total Attendances Marked: ${attendanceCount}`);
    
    const auditLogs = await prisma.attendanceauditlog.findMany({
        where: { editedbyid: user.userid }
    });
    console.log(`Attendance Audit Logs: ${auditLogs.length}`);

    // Assignments
    const assignments = await prisma.assignment.findMany({
      where: {
          courseofferingid: { in: courseOfferings.map(o => o.courseofferingid) }
      }
    });
    console.log(`Assignments Created: ${assignments.length}`);

    // Daily activity reports
    const activityReports = await prisma.dailyactivityreport.findMany({
      where: { facultyid: facultyId },
      include: { dailyreportactivity: true }
    });
    console.log(`Daily Activity Reports: ${activityReports.length}`);
    activityReports.forEach(ar => console.log(` - Report ID: ${ar.dailyactivityreportid}, Date: ${ar.reportdate}, Activities: ${ar.dailyreportactivity.length}`));

    // Leave requests
    const leaveRequests = await prisma.leaverequest.findMany({
      where: { userid: user.userid }
    });
    console.log(`Leave Requests: ${leaveRequests.length}`);
    leaveRequests.forEach(lr => console.log(` - Leave ID: ${lr.leaverequestid}, Type: ${lr.leavetype}, Status: ${lr.status}`));

    // Payroll
    const payrolls = await prisma.payroll.findMany({
      where: { userid: user.userid }
    });
    console.log(`Payroll Records: ${payrolls.length}`);

    // Notifications
    const notifications = await prisma.notification.findMany({
      where: { userid: user.userid }
    });
    console.log(`Notifications: ${notifications.length}`);


    console.log(`\n=== 3. PER-ENDPOINT LIVE CHECK ===`);
    // Create JWT for user
    const token = jwt.sign(
      {
        userId: user.userid,
        email: user.email,
        role: user.role,
        facultyId: facultyId || null,
        studentId: null
      },
      process.env.JWT_ACCESS_SECRET || 'access_secret_fallback',
      { expiresIn: '1h' }
    );

    const baseUrl = 'http://localhost:5000/api/v1';

    const endpoints = [
      { name: 'GET /faculty/courses', method: 'GET', url: '/faculty/courses' },
      { name: 'GET /faculty/teaching-loads/available-courses', method: 'GET', url: '/faculty/teaching-loads/available-courses' },
      { name: 'GET /faculty/schedule', method: 'GET', url: '/faculty/schedule' },
      { name: 'GET /faculty/assignments', method: 'GET', url: '/faculty/assignments' },
      { name: 'GET /faculty/attendance (sessions)', method: 'GET', url: '/faculty/attendance/sessions' },
      { name: 'GET /faculty/activity', method: 'GET', url: '/faculty/activity' },
      { name: 'GET /faculty/leaves', method: 'GET', url: '/faculty/leaves' },
      { name: 'GET /faculty/approvals', method: 'GET', url: '/faculty/approvals' },
      { name: 'GET /faculty/hr-summary', method: 'GET', url: '/faculty/hr-summary' },
      { name: 'GET /faculty/dashboard', method: 'GET', url: '/faculty/dashboard' },
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(baseUrl + ep.url, {
          method: ep.method,
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`${ep.name}: ${res.status}`);
        const data = await res.json();
        
        if (res.status !== 200) {
            console.log(`   Response:`, data);
        } else {
            console.log(`   Data keys:`, Object.keys(data));
            if (Array.isArray(data.data)) {
                console.log(`   Array Length:`, data.data.length);
            } else if (data.data && typeof data.data === 'object') {
                console.log(`   Data object keys:`, Object.keys(data.data));
            }
        }
      } catch (err: any) {
        console.log(`${ep.name}: ERROR ${err.message}`);
      }
    }

  } catch (err) {
    console.error('Error during script execution:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
