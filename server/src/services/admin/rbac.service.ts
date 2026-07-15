import prisma from '../../config/prisma.js';
import { redisConnection } from '../../config/queue.js';

const CACHE_TTL = 3600; // 1 hour

const getCacheKey = (userId: number) => `RBAC:STATIC:${userId}`;

export const getUserPermissions = async (userId: number): Promise<Set<string>> => {
  const cacheKey = getCacheKey(userId);

  // 1. Check Redis Cache
  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      return new Set(JSON.parse(cached));
    }
  }

  // 2. Cache Miss - Query Postgres
  const userRoles = await prisma.userRole.findMany({
    where: { user_id: userId },
    include: {
      role: {
        include: {
          RolePermission: {
            include: { permission: true }
          }
        }
      }
    }
  });

  const permissions = new Set<string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.RolePermission) {
      permissions.add(`${rp.permission.module}:${rp.permission.action}`); // e.g., 'TICKETS:READ'
    }
  }

  // Fallback: Also include permissions from the user's primary enum role
  const user = await prisma.user.findUnique({ where: { userid: userId } });
  if (userRoles.length === 0 && user?.role) {
    console.warn(`[RBAC] WARNING: Fallback triggered for User ${userId}. No UserRole mappings found. Falling back to enum role ${user.role}.`);
  }
  
  if (user?.role) {
    const primaryRole = await prisma.role.findUnique({
      where: { name: user.role },
      include: {
        RolePermission: {
          include: { permission: true }
        }
      }
    });
    if (primaryRole) {
      for (const rp of primaryRole.RolePermission) {
        permissions.add(`${rp.permission.module}:${rp.permission.action}`);
      }
    }
  }

  // 3. Populate Cache
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, CACHE_TTL, JSON.stringify(Array.from(permissions)));
  }

  return permissions;
};

export const hasPermission = async (userId: number, module: string, action: string): Promise<boolean> => {
  const permissions = await getUserPermissions(userId);
  return permissions.has(`${module}:${action}`);
};

export const invalidateUserCache = async (userId: number) => {
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(getCacheKey(userId));
    await redisConnection.del(`api:auth:me:${userId}`);
    await redisConnection.del(`api:auth:user:${userId}`);
  }
};
