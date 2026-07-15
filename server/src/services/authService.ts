import prisma from '../config/prisma.js';
import { verifyData, hashData } from '../utils/hash.utils.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils.js';
import { ensureRoleProfile } from './identity/profileProvisioning.service.js';
import { AppError } from '../utils/AppError.js';

export const loginUser = async (loginId: string, password: string, ipaddress?: string, deviceinfo?: string) => {
  const trimmedLogin = loginId.trim();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: trimmedLogin, mode: 'insensitive' } },
        { institutionalEmail: { equals: trimmedLogin, mode: 'insensitive' } },
        { username: { equals: trimmedLogin, mode: 'insensitive' } },
        { identifier: { equals: trimmedLogin, mode: 'insensitive' } }
      ]
    }
  });
  
  if (!user || user.accountStatus !== 'ACTIVE') {
    throw new AppError(401, 'Invalid login credentials');
  }

  // Verify password hash
  const isValid = await verifyData(password, user.password);
  if (!isValid) {
    throw new AppError(401, 'Invalid login credentials');
  }

  // Self-Healing Profile Synchronization
  await ensureRoleProfile(user.userid);

  // Fetch all assigned UserRole entries
  const userRoles = await prisma.userRole.findMany({
    where: { user_id: user.userid },
    include: { role: true }
  });
  const roles = userRoles.map(ur => ur.role.name);
  if (!roles.includes(user.role)) {
    roles.push(user.role);
  }

  // Generate tokens
  // Note: MVP Limitation - Role changes made via admin action will not take effect 
  // until the affected user's JWT is reissued (next login or token refresh).
  const accessToken = generateAccessToken({ userId: user.userid, email: user.email, role: user.role, roles, version: user.version });
  const refreshToken = generateRefreshToken(user.userid);
  const refreshTokenHash = await hashData(refreshToken);

  // Store session in DB
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await prisma.usersession.create({
    data: {
      userid: user.userid,
      ipaddress: ipaddress || null,
      deviceinfo: deviceinfo || null,
      refreshtoken: refreshTokenHash,
      expiresat: expiresAt,
      isactive: true,
      logintime: new Date()
    }
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.userid,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword
    }
  };
};

export const logoutUser = async (refreshToken: string) => {
  // In a full implementation, you would verify the token, extract userId, 
  // and mark the specific session as inactive.
  // For simplicity here, we'll just search for the session if we wanted to 
  // (but we'd need to compare hashes, so typically you send the session ID or 
  // just clear cookies).
};
