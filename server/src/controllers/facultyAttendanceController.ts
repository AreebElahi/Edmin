import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import catchAsync from '../utils/catchAsync.js';
import * as cardService from '../services/faculty/attendanceCard.service.js';

// Get department IDs for HOD/Supervisor
const getScopedDepartmentIds = async (userId: number): Promise<number[] | null> => {
  const user = await prisma.user.findUnique({
    where: { userid: userId },
    select: {
      role: true,
      department: { select: { departmentid: true } },
      departments_supervised: { select: { departmentid: true } },
    },
  });

  if (!user) return [];

  if (user.role === 'ADMIN' || user.role === 'HR') {
    return null; // Full access
  }

  const deptIds = [
    ...user.department.map((d) => d.departmentid),
    ...user.departments_supervised.map((d) => d.departmentid),
  ];

  return deptIds;
};

// GET /api/faculty-attendance
export const getAttendanceLogs = catchAsync(async (req: Request, res: Response) => {
  // Automatically run auto check-out processing
  await cardService.processAutoCheckouts();

  const userId = req.user.userId;
  const role = req.user.role;

  const { search, departmentId, date, status, cardReaderId, employeeId } = req.query;

  const deptIds = await getScopedDepartmentIds(userId);
  const facultyProfile = await prisma.faculty.findFirst({ where: { userid: userId }, select: { facultyid: true } });

  // Build Prisma query condition
  const where: any = {};

  // Role Scope checks
  if (role === 'FACULTY') {
    if (deptIds && deptIds.length > 0) {
      // HOD or Supervisor: can see their own + their department's faculty records
      where.OR = [
        { facultyid: facultyProfile?.facultyid || 0 },
        {
          faculty: {
            departmentid: { in: deptIds },
          },
        },
      ];
    } else {
      // Normal faculty: can only see their own attendance
      where.facultyid = facultyProfile?.facultyid || 0;
    }
  } else if (deptIds !== null) {
    // Other role with department scope
    where.faculty = {
      departmentid: { in: deptIds },
    };
  }

  // Filter params
  if (search) {
    where.faculty = {
      ...where.faculty,
      fullname: { contains: String(search), mode: 'insensitive' },
    };
  }

  if (departmentId) {
    where.faculty = {
      ...where.faculty,
      departmentid: Number(departmentId),
    };
  }

  if (employeeId) {
    where.faculty = {
      ...where.faculty,
      employeenumber: String(employeeId),
    };
  }

  if (date) {
    const parsedDate = new Date(String(date));
    parsedDate.setHours(0, 0, 0, 0);
    where.attendancedate = parsedDate;
  }

  if (status) {
    where.status = String(status);
  }

  if (cardReaderId) {
    where.cardreaderid = String(cardReaderId);
  }

  const logs = await prisma.facultyattendance.findMany({
    where,
    include: {
      faculty: {
        include: {
          user: true,
          department: true,
        },
      },
    },
    orderBy: {
      attendancedate: 'desc',
    },
  });

  // Map to fit table columns cleanly
  const formattedLogs = logs.map((log) => ({
    id: log.facultyattendanceid,
    facultyId: log.facultyid,
    name: log.faculty.fullname || 'Unknown Faculty',
    employeeId: log.faculty.employeenumber || '-',
    department: log.faculty.department?.name || '-',
    cardNumber: log.faculty.cardnumber || '-',
    date: log.attendancedate.toISOString().split('T')[0],
    checkInTime: log.checkintime ? log.checkintime.toISOString() : null,
    checkOutTime: log.checkouttime ? log.checkouttime.toISOString() : null,
    workingHours: log.workinghours || 0,
    status: log.status,
    attendanceSource: log.attendancesource,
    cardReaderId: log.cardreaderid || '-',
    lastUpdated: log.updatedat.toISOString(),
  }));

  res.status(200).json({ success: true, data: formattedLogs });
});

// GET /api/faculty-attendance/:id
export const getAttendanceById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const log = await prisma.facultyattendance.findUnique({
    where: { facultyattendanceid: Number(id) },
    include: {
      faculty: {
        include: {
          user: true,
          department: true,
        },
      },
      auditlogs: {
        include: {
          editor: true,
        },
        orderBy: {
          createdat: 'desc',
        },
      },
      corrections: {
        orderBy: {
          createdat: 'desc',
        },
      },
    },
  });

  if (!log) {
    return res.status(404).json({ success: false, message: 'Attendance record not found' });
  }

  res.status(200).json({ success: true, data: log });
});

// POST /api/faculty-attendance/check-in (Process smart card tap/check-in/out toggle)
export const checkInCard = catchAsync(async (req: Request, res: Response) => {
  const { cardNumber, readerId } = req.body;

  if (!cardNumber) {
    return res.status(400).json({ success: false, message: 'Card number is required' });
  }

  try {
    const result = await cardService.processCardTap(cardNumber, readerId || 'READER-01');
    const msg = `${result.faculty.fullname} ${result.action === 'CHECKIN' ? 'checked in' : 'checked out'} successfully.`;
    res.status(200).json({
      success: true,
      message: msg,
      data: { ...result, message: msg },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Smart card verification failed' });
  }
});

// POST /api/faculty-attendance/check-out
export const checkOutCard = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Since processCardTap automatically toggles check-in / check-out, we route both to the same process
  return checkInCard(req, res, next);
});

// POST /api/faculty-attendance/correction-request
export const submitCorrectionRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { attendanceId, requestedCheckIn, requestedCheckOut, reason, attachment } = req.body;

  const facultyProfile = await prisma.faculty.findFirst({ where: { userid: userId } });
  if (!facultyProfile) {
    return res.status(403).json({ success: false, message: 'Only faculty members can request corrections' });
  }

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Reason is required for manual corrections' });
  }

  const correction = await prisma.facultyattendancecorrectionrequest.create({
    data: {
      attendanceid: attendanceId ? Number(attendanceId) : null,
      facultyid: facultyProfile.facultyid,
      requestedcheckin: requestedCheckIn ? new Date(requestedCheckIn) : null,
      requestedcheckout: requestedCheckOut ? new Date(requestedCheckOut) : null,
      reason,
      attachment: attachment || null,
      status: 'PENDING',
    },
  });

  res.status(201).json({
    success: true,
    message: 'Correction request submitted successfully.',
    data: correction,
  });
});

// PATCH /api/faculty-attendance/correction/:id
export const reviewCorrectionRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const role = req.user.role;
  const { id } = req.params;
  // Accept both {action, reviewNote} (admin monitor) and {status, comments} (legacy)
  const status = req.body.action ?? req.body.status;
  const comments = req.body.reviewNote ?? req.body.comments;

  if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid review action. Must be APPROVE or REJECT.' });
  }

  const request = await prisma.facultyattendancecorrectionrequest.findUnique({
    where: { correctionrequestid: Number(id) },
    include: {
      attendance: true,
    },
  });

  if (!request) {
    return res.status(404).json({ success: false, message: 'Correction request not found' });
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update request status
    const updatedRequest = await tx.facultyattendancecorrectionrequest.update({
      where: { correctionrequestid: Number(id) },
      data: {
        status,
        reviewedby: userId,
        reviewedat: new Date(),
        comments: comments || null,
      },
    });

    if (status === 'APPROVED') {
      const checkIn = request.requestedcheckin || request.attendance?.checkintime;
      const checkOut = request.requestedcheckout || request.attendance?.checkouttime;
      let workingHours = 0;
      if (checkIn && checkOut) {
        workingHours = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60);
      }

      if (request.attendanceid) {
        // Update existing attendance record
        await tx.facultyattendance.update({
          where: { facultyattendanceid: request.attendanceid },
          data: {
            checkintime: checkIn,
            checkouttime: checkOut,
            workinghours: workingHours,
            status: 'Manual Entry',
            manualcorrection: true,
            updatedat: new Date(),
          },
        });

        // Audit log
        await tx.facultyattendanceauditlog.create({
          data: {
            attendanceid: request.attendanceid,
            action: 'UPDATE',
            oldcheckin: request.attendance?.checkintime,
            newcheckin: checkIn,
            oldcheckout: request.attendance?.checkouttime,
            newcheckout: checkOut,
            reason: `Correction approved: ${request.reason}. comments: ${comments || ''}`,
            performedby: userId,
            performedrole: role,
            ipaddress: req.ip || '127.0.0.1',
            device: req.headers['user-agent'] || 'Web App',
          },
        });
      } else {
        // Create or update attendance record for target date
        const todayDate = checkIn ? new Date(checkIn) : new Date();
        todayDate.setHours(0, 0, 0, 0);

        const existingRecord = await tx.facultyattendance.findFirst({
          where: {
            facultyid: request.facultyid,
            attendancedate: todayDate,
          },
        });

        let targetAttendanceId: number;

        if (existingRecord) {
          const updated = await tx.facultyattendance.update({
            where: { facultyattendanceid: existingRecord.facultyattendanceid },
            data: {
              checkintime: checkIn,
              checkouttime: checkOut,
              workinghours: workingHours,
              status: 'Manual Entry',
              manualcorrection: true,
              updatedat: new Date(),
            },
          });
          targetAttendanceId = updated.facultyattendanceid;
        } else {
          const newAttendance = await tx.facultyattendance.create({
            data: {
              facultyid: request.facultyid,
              attendancedate: todayDate,
              checkintime: checkIn,
              checkouttime: checkOut,
              workinghours: workingHours,
              status: 'Manual Entry',
              manualcorrection: true,
              attendancesource: 'MANUAL',
            },
          });
          targetAttendanceId = newAttendance.facultyattendanceid;
        }

        await tx.facultyattendanceauditlog.create({
          data: {
            attendanceid: targetAttendanceId,
            action: 'UPDATE',
            oldcheckin: existingRecord?.checkintime || null,
            newcheckin: checkIn,
            oldcheckout: existingRecord?.checkouttime || null,
            newcheckout: checkOut,
            reason: `Correction approved (manual entry): ${request.reason}. comments: ${comments || ''}`,
            performedby: userId,
            performedrole: role,
            ipaddress: req.ip || '127.0.0.1',
            device: req.headers['user-agent'] || 'Web App',
          },
        });

        // Link request to the updated/created attendance
        await tx.facultyattendancecorrectionrequest.update({
          where: { correctionrequestid: Number(id) },
          data: {
            attendanceid: targetAttendanceId,
          },
        });
      }
    }

    return updatedRequest;
  });

  res.status(200).json({
    success: true,
    message: `Correction request ${status.toLowerCase()} successfully.`,
    data: result,
  });
});

// GET /api/faculty-attendance/audit
export const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const logs = await prisma.facultyattendanceauditlog.findMany({
    include: {
      editor: true,
      attendance: {
        include: {
          faculty: true,
        },
      },
    },
    orderBy: {
      createdat: 'desc',
    },
  });

  res.status(200).json({ success: true, data: logs });
});

// GET /api/faculty-attendance/settings
export const getSettings = catchAsync(async (req: Request, res: Response) => {
  const settings = await cardService.getOrCreateSettings();
  res.status(200).json({ success: true, data: settings });
});

// PATCH /api/faculty-attendance/settings
export const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const body = req.body;
  // Accept both camelCase and lowercase (from different callers)
  const mapped = {
    officeStartTime: body.officeStartTime ?? body.officestarttime,
    officeEndTime:   body.officeEndTime   ?? body.officeendtime,
    gracePeriod:     body.gracePeriod     ?? body.graceperiod,
    autoCheckoutEnabled: body.autoCheckoutEnabled ?? body.autocheckoutenabled,
    maxWorkingHours: body.maxWorkingHours ?? body.maxworkinghours,
    lateThreshold:   body.lateThreshold   ?? body.latethreshold,
    earlyDepartureThreshold: body.earlyDepartureThreshold ?? body.earlydeparturethreshold,
  };
  const settings = await cardService.updateSettings(mapped);
  res.status(200).json({ success: true, data: settings, message: 'Settings updated successfully' });
});

// GET /api/faculty-attendance/today
export const getTodayAttendance = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const facultyProfile = await prisma.faculty.findFirst({ where: { userid: userId }, select: { facultyid: true } });

  if (!facultyProfile) {
    return res.status(404).json({ success: false, message: 'Faculty profile not found' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.facultyattendance.findFirst({
    where: {
      facultyid: facultyProfile.facultyid,
      attendancedate: today,
    },
  });

  res.status(200).json({ success: true, data: attendance });
});

// GET /api/faculty-attendance/dashboard
export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  await cardService.processAutoCheckouts();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalFacultyCount, todayLogs, pendingCorrections] = await Promise.all([
    prisma.faculty.count({ where: { isactive: true } }),
    prisma.facultyattendance.findMany({ where: { attendancedate: today } }),
    prisma.facultyattendancecorrectionrequest.count({ where: { status: 'PENDING' } }),
  ]);

  const present = todayLogs.filter(
    (l) => l.status === 'Present' || l.status === 'Late Arrival' || l.status === 'Early Departure' || l.status === 'Manual Entry'
  ).length;

  const checkedInOnly = todayLogs.filter((l) => l.status === 'Currently Working').length;
  const missingCheckOut = todayLogs.filter((l) => l.status === 'Forgot Check Out').length;
  const lateArrivals = todayLogs.filter((l) => l.islate).length;
  const currentlyWorking = checkedInOnly;
  const autoCheckedOut = todayLogs.filter((l) => l.isautocheckout).length;
  
  // Absent: Active faculty who have no attendance logs today
  const attendedFacultyIds = todayLogs.map((l) => l.facultyid);
  const missingCheckIn = await prisma.faculty.count({
    where: {
      isactive: true,
      facultyid: { notIn: attendedFacultyIds },
    },
  });

  res.status(200).json({
    success: true,
    data: {
      facultyPresent: present,
      checkedInOnly,
      missingCheckIn,
      missingCheckOut,
      lateArrivals,
      currentlyWorking,
      autoCheckedOut,
      totalFacultyCount,
      pendingCorrections,
    },
  });
});

export const getCorrectionRequests = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const role = req.user.role;
  const deptIds = await getScopedDepartmentIds(userId);
  const facultyProfile = await prisma.faculty.findFirst({ where: { userid: userId }, select: { facultyid: true } });

  const where: any = {};

  if (role === 'FACULTY') {
    if (deptIds && deptIds.length > 0) {
      where.OR = [
        { facultyid: facultyProfile?.facultyid || 0 },
        {
          faculty: {
            departmentid: { in: deptIds },
          },
        },
      ];
    } else {
      where.facultyid = facultyProfile?.facultyid || 0;
    }
  } else if (deptIds !== null) {
    where.faculty = {
      departmentid: { in: deptIds },
    };
  }

  const requests = await prisma.facultyattendancecorrectionrequest.findMany({
    where,
    include: {
      faculty: {
        include: {
          department: true,
          user: true,
        },
      },
      attendance: true,
    },
    orderBy: {
      createdat: 'desc',
    },
  });

  res.status(200).json({ success: true, data: requests });
});

