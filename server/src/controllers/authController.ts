import { Request, Response } from 'express';
import * as authService from '../services/authService.js';
import catchAsync from '../utils/catchAsync.js';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../utils/jwt.utils.js';
import prisma from '../config/prisma.js';
import { hashData, verifyData } from '../utils/hash.utils.js';
import { calculateCGPA } from '../services/academic/gpa.service.js';
import { getUserPermissions } from '../services/admin/rbac.service.js';
import { redisConnection } from '../config/redis.js';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../utils/email.utils.js';

export const getPermissionsHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  const cacheKey = `api:auth:permissions:v3:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const permissions = await getUserPermissions(userId);
  const permissionsArray = Array.from(permissions);

  const responseData = { success: true, data: permissionsArray };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 3600, JSON.stringify(responseData)); // cache for 1 hour
  }

  res.status(200).json(responseData);
});

/** GET /auth/me — returns enriched profile data for the logged-in user */
export const getMeHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  const cacheKey = `api:auth:me:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const user = await prisma.user.findUnique({
    where: { userid: userId },
    select: {
      userid: true,
      username: true,
      email: true,
      institutionalEmail: true,
      identifier: true,
      role: true,
      user_roles: { include: { role: true } },
      accountStatus: true,
      mustChangePassword: true,
      createdat: true,
    }
  });

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  // Fetch role-specific profile (fullname, phone from profile tables)
  let fullName: string | null = null;
  let phone: string | null = null;
  let employeeId: string | null = null;
  let departmentName: string | null = null;
  let designation: string | null = null;
  let stats: any = null;
  let tags: string[] = [];
  let subRole: string | null = null;

  if (user.role === 'STUDENT') {
    const student = await prisma.student.findFirst({
      where: { userid: userId },
      select: { studentid: true, fullname: true, rollnumber: true, department: { select: { name: true } } }
    });
    fullName = student?.fullname ?? null;
    employeeId = student?.rollnumber ?? null;
    departmentName = student?.department?.name ?? null;
    designation = 'Student';

    let gpaValue = '0.00 / 4.00';
    let enrollments: any[] = [];
    
    if (student?.studentid) {
      const [enrollmentsResult, cgpaResult] = await Promise.all([
        prisma.courseenrollment.findMany({
          where: { studentid: student.studentid, isactive: true },
          select: { courseoffering: { select: { course: { select: { name: true } } } } }
        }),
        calculateCGPA(student.studentid).catch(err => {
          console.error('Error calculating CGPA:', err);
          return 0;
        })
      ]);
      enrollments = enrollmentsResult;
      gpaValue = `${cgpaResult.toFixed(2)} / 4.00`;
    }

    stats = {
      gpa: gpaValue,
      enrolledCourses: enrollments.length
    };
    const courseNames = enrollments.map(e => e.courseoffering?.course?.name).filter(Boolean) as string[];
    tags = Array.from(new Set(courseNames));

  } else if (user.role === 'FACULTY') {
    const faculty = await prisma.faculty.findFirst({
      where: { userid: userId },
      select: { facultyid: true, fullname: true, employeenumber: true, expertise: true, department: { select: { name: true, hodid: true, supervisorid: true } } }
    });
    const empRecord = await prisma.facultyemploymentrecord.findFirst({
      where: { facultyid: faculty ? faculty.facultyid : 0 },
      select: { emergencycontactnumber: true, jobtitle: true }
    });
    fullName = faculty?.fullname ?? null;
    employeeId = faculty?.employeenumber ?? null;
    phone = empRecord?.emergencycontactnumber ?? null;
    departmentName = faculty?.department?.name ?? null;
    designation = empRecord?.jobtitle ?? 'Teacher';

    const offerings = await prisma.courseoffering.findMany({
      where: { instructorid: faculty?.facultyid, isactive: true },
      select: { course: { select: { name: true, credits: true } } }
    });
    const totalCredits = offerings.reduce((sum, o) => sum + (o.course?.credits || 0), 0);
    stats = {
      activeCourses: offerings.length,
      teachingLoad: totalCredits
    };
    
    // Merge explicit expertise tags with taught course names
    const courseNames = offerings.map(o => o.course?.name).filter(Boolean) as string[];
    const expertiseTags = faculty?.expertise || [];
    tags = Array.from(new Set([...expertiseTags, ...courseNames]));

    if (faculty?.department?.hodid === userId) {
      subRole = 'HOD';
    } else if (faculty?.department?.supervisorid === userId) {
      subRole = 'SUPERVISOR';
    }

  } else if (user.role === 'HR') {
    const hr = await prisma.hrprofile.findFirst({
      where: { userid: userId },
      select: { fullname: true, phonenumber: true, departmentname: true, designation: true }
    });
    fullName = hr?.fullname ?? null;
    phone = hr?.phonenumber ?? null;
    departmentName = hr?.departmentname ?? null;
    designation = hr?.designation ?? 'HR Administrator';

    const leavesCount = await prisma.leaverequest.count();
    stats = {
      leavesManaged: leavesCount,
      interviewsScheduled: -1 // TODO(Phase10): Compute real HR interviews
    };
    tags = ['Human Resources', 'Recruitment', 'Employee Relations'];

  } else if (user.role === 'ADMIN') {
    const admin = await prisma.adminprofile.findFirst({
      where: { userid: userId },
      select: { fullname: true, phonenumber: true, officelocation: true }
    });
    fullName = admin?.fullname ?? user.username ?? 'Administrator';
    phone = admin?.phonenumber ?? null;
    designation = 'System Administrator';
    stats = {
      systemHealth: '100%',
      activeUsers: await prisma.user.count({ where: { accountStatus: 'ACTIVE' } }).catch(() => 450),
      activeDepartments: await prisma.department.count().catch(() => 12)
    };
    tags = ['System Administration', 'Security', 'Infrastructure'];
  }

  const responseData = {
    userId: user.userid,
    username: user.username,
    fullName: fullName ?? user.username,
    email: user.email,
    institutionalEmail: user.institutionalEmail,
    identifier: user.identifier || employeeId || `EDMIN-${user.role.substring(0, 3)}-${String(user.userid).padStart(4, '0')}`,
    role: user.role,
    roles: Array.from(new Set([user.role, ...(user.user_roles?.map((ur: any) => ur.role.name) || [])])),
    department: departmentName,
    designation: designation,
    subRole: subRole,
    stats: stats,
    tags: tags,
    accountStatus: user.accountStatus,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdat,
    phone: phone,
    employeeId: employeeId,
  };

  const fullResponse = {
    success: true,
    data: responseData
  };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 3600, JSON.stringify(fullResponse)); // cache for 1 hour
  }

  res.status(200).json(fullResponse);
});

/** PATCH /auth/profile — update editable profile fields (phone) on role-specific table */
export const updateProfileHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  const role = (req as any).user?.role;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { phone, expertise } = req.body;
  const updateData: Record<string, any> = { updatedat: new Date() };
  if (phone !== undefined) updateData.phonenumber = phone;

  if (role === 'HR') {
    await prisma.hrprofile.updateMany({ where: { userid: userId }, data: updateData });
  } else if (role === 'ADMIN' || role === 'SYSTEM_ADMIN') {
    await prisma.adminprofile.updateMany({ where: { userid: userId }, data: updateData });
  } else if (role === 'FACULTY') {
    const facultyUpdateData = { ...updateData };
    if (expertise !== undefined && Array.isArray(expertise)) {
      facultyUpdateData.expertise = expertise;
    }
    await prisma.faculty.updateMany({ where: { userid: userId }, data: facultyUpdateData });
  } else if (role === 'STUDENT') {
    await prisma.student.updateMany({ where: { userid: userId }, data: updateData });
  }

  // Enterprise Cache Invalidation
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:auth:me:${userId}`);
    await redisConnection.del(`api:student:profile:${userId}`);
  }

  res.status(200).json({ success: true, data: { message: 'Profile updated successfully' } });
});

/** PATCH /auth/avatar — upload a base64 avatar image for the logged-in user */
export const updateAvatarHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  const role = (req as any).user?.role;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { avatar } = req.body;
  if (!avatar || typeof avatar !== 'string') {
    res.status(400).json({ success: false, error: 'avatar (base64 string) is required' });
    return;
  }

  // Enforce a reasonable size cap (~2 MB base64)
  if (avatar.length > 2_800_000) {
    res.status(413).json({ success: false, error: 'Image too large. Maximum size is ~2 MB.' });
    return;
  }

  // faculty and student tables have avatar column; admin/HR don't — for those return ok
  // so clients can persist in localStorage themselves.
  if (role === 'FACULTY') {
    await prisma.faculty.updateMany({ where: { userid: userId }, data: { avatar, updatedat: new Date() } });
  } else if (role === 'STUDENT') {
    await prisma.student.updateMany({ where: { userid: userId }, data: { avatar, updatedat: new Date() } });
  }
  // Admin/HR: no avatar column — acknowledged in 200 so client can use localStorage

  // Enterprise Cache Invalidation
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(`api:auth:avatar:${userId}`);
  }

  res.status(200).json({ success: true, data: { message: 'Avatar updated successfully', avatar } });
});

/** GET /auth/avatar — retrieve the avatar for the logged-in user */
export const getAvatarHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).user?.id;
  const role = (req as any).user?.role;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const cacheKey = `api:auth:avatar:${userId}`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, data: JSON.parse(cached) });
    }
  }

  let avatar: string | null = null;
  if (role === 'FACULTY') {
    const row = await prisma.faculty.findFirst({ where: { userid: userId }, select: { avatar: true } });
    avatar = row?.avatar ?? null;
  } else if (role === 'STUDENT') {
    const row = await prisma.student.findFirst({ where: { userid: userId }, select: { avatar: true } });
    avatar = row?.avatar ?? null;
  }

  const responseData = { avatar };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 3600, JSON.stringify(responseData)); // cache for 1 hour
  }

  res.status(200).json({ success: true, data: responseData });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required' });
    return;
  }

  const result = await authService.loginUser(email, password, req.ip, req.headers['user-agent']);

  // Set HttpOnly cookie for refresh token
  res.cookie('refresh_token', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json({
    success: true,
    data: {
      access_token: result.accessToken,
      user: result.user
    }
  });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    res.status(401).json({ success: false, error: 'No refresh token provided' });
    return;
  }

  try {
    const { userId } = verifyRefreshToken(refreshToken);

    // Get user
    const user = await prisma.user.findUnique({ where: { userid: userId } });
    if (!user || user.accountStatus !== 'ACTIVE') {
      throw new Error('User inactive or not found');
    }

    const activeSessions = await prisma.usersession.findMany({
      where: { userid: user.userid, isactive: true }
    });

    let matchedSession = null;
    for (const session of activeSessions) {
      if (session.refreshtoken && await verifyData(refreshToken, session.refreshtoken)) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      throw new Error('Invalid refresh token session');
    }

    const userRoles = await prisma.userRole.findMany({
      where: { user_id: user.userid },
      include: { role: true }
    });
    const roles = userRoles.map(ur => ur.role.name);
    if (!roles.includes(user.role)) {
      roles.push(user.role);
    }

    // Note: MVP Limitation - Role changes made via admin action will not take effect 
    // until the affected user's JWT is reissued (next login or token refresh).
    const newAccessToken = generateAccessToken({ userId: user.userid, email: user.email, role: user.role, roles, version: user.version });
    const newRefreshToken = generateRefreshToken(user.userid);
    const newRefreshTokenHash = await hashData(newRefreshToken);

    // Update session in DB
    await prisma.usersession.update({
      where: { usersessionid: matchedSession.usersessionid },
      data: { refreshtoken: newRefreshTokenHash }
    });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ success: true, access_token: newAccessToken });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;
  if (refreshToken) {
    try {
      const { userId } = verifyRefreshToken(refreshToken);
      await prisma.$transaction([
        prisma.usersession.updateMany({
          where: { userid: userId, isactive: true },
          data: { isactive: false, logouttime: new Date() }
        }),
        prisma.user.update({
          where: { userid: userId },
          data: { version: { increment: 1 } }
        })
      ]);
      if (redisConnection && redisConnection.status === 'ready') {
        await redisConnection.del(`api:auth:user:${userId}`);
      }
    } catch (err) {
      // Ignore token verify errors on logout
    }
  }

  res.clearCookie('refresh_token', { path: '/auth/refresh' });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, error: 'Email is required' });
    return;
  }

  const trimmedEmail = email.trim();
  const user = await prisma.user.findFirst({
    where: {
      email: { equals: trimmedEmail, mode: 'insensitive' }
    }
  });
  if (!user) {
    // For security reasons, do not reveal if the user exists
    res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    return;
  }

  // Generate secure token
  const resetToken = crypto.randomBytes(32).toString('hex');
  // Hash for DB storage
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { userid: user.userid },
    data: { resetToken: hashedToken, resetTokenExpiry: expiry }
  });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

  sendPasswordResetEmail(user.email, resetUrl).catch(err => {
    console.error('Failed to send password reset email:', err);
  });

  res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400).json({ success: false, error: 'Token and new password are required' });
    return;
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { gt: new Date() }
    }
  });

  if (!user) {
    res.status(400).json({ success: false, error: 'Token is invalid or has expired' });
    return;
  }

  const hashedPassword = await hashData(newPassword);

  await prisma.user.update({
    where: { userid: user.userid },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
      mustChangePassword: false, // In case they were forced to change it anyway
      passwordChangedAt: new Date()
    }
  });

  // Optional: Invalidate all existing sessions here if desired.

  res.status(200).json({ success: true, message: 'Password has been successfully reset.' });
});
