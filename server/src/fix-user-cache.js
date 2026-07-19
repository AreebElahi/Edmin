import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'controllers/admin/user.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes("import { redisConnection }")) {
  content = content.replace("import { parseString", "import { redisConnection } from '../../config/redis.js';\nimport { parseString");
}

const getAllUsersOld = `export const getAllUsersHandler = async (req: Request, res: Response) => {
  try {
    const filters = {
      role: parseOptionalString(req.query.role),
      status: parseOptionalString(req.query.status),
      departmentId: parseOptionalString(req.query.departmentId),
      search: parseOptionalString(req.query.search),
    };`;

const getAllUsersNew = `export const getAllUsersHandler = async (req: Request, res: Response) => {
  try {
    const filters = {
      role: parseOptionalString(req.query.role),
      status: parseOptionalString(req.query.status),
      departmentId: parseOptionalString(req.query.departmentId),
      search: parseOptionalString(req.query.search),
    };

    const cacheKey = \`api:admin:users:\${JSON.stringify(filters)}\`;
    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }`;

const mappedUsersOld = `    return sendSuccess(res, mappedUsers);
  } catch (error: any) {`;

const mappedUsersNew = `    const responseBody = { success: true, data: mappedUsers };
    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.setex(cacheKey, 300, JSON.stringify(responseBody));
    }

    return res.status(200).json(responseBody);
  } catch (error: any) {`;

const registerOld = `    const createdUser = {
      id: result.user.userid.toString(),
      name: result.user.username,
      email: result.user.email,
      role: result.user.role,
      dept: deptName,
      status: result.user.accountStatus === 'ACTIVE' ? 'Active' : 'Inactive',
    };

    return sendSuccess(res, { user: createdUser, tempPassword: result.tempPassword }, 201);`;

const registerNew = `    const createdUser = {
      id: result.user.userid.toString(),
      name: result.user.username,
      email: result.user.email,
      role: result.user.role,
      dept: deptName,
      status: result.user.accountStatus === 'ACTIVE' ? 'Active' : 'Inactive',
    };

    if (redisConnection && redisConnection.status === 'ready') {
      const keys = await redisConnection.keys('api:admin:users:*');
      if (keys.length > 0) await redisConnection.del(...keys);
    }

    return sendSuccess(res, { user: createdUser, tempPassword: result.tempPassword }, 201);`;

const toggleOld = `    const adminId = (req as any).user?.userid || 1;
    const updatedUser = await updateUserStatus(userId, isActive, adminId);

    return sendSuccess(res, { id: updatedUser.userid.toString(), status: updatedUser.accountStatus === 'ACTIVE' ? 'Active' : 'Inactive' });`;

const toggleNew = `    const adminId = (req as any).user?.userid || 1;
    const updatedUser = await updateUserStatus(userId, isActive, adminId);

    if (redisConnection && redisConnection.status === 'ready') {
      const keys = await redisConnection.keys('api:admin:users:*');
      if (keys.length > 0) await redisConnection.del(...keys);
    }

    return sendSuccess(res, { id: updatedUser.userid.toString(), status: updatedUser.accountStatus === 'ACTIVE' ? 'Active' : 'Inactive' });`;

const assignRoleOld = `    const result = await assignUserRole(userId, roleName as role_enum, action, adminId);

    return sendSuccess(res, {
      message: \`Successfully \${action}ed \${roleName} \${action === 'assign' ? 'to' : 'from'} user\`,
      user: {
        id: result.userid.toString(),
        role: result.role,
        departmentRole: result.departmentRole,
      }
    });`;

const assignRoleNew = `    const result = await assignUserRole(userId, roleName as role_enum, action, adminId);

    if (redisConnection && redisConnection.status === 'ready') {
      const keys = await redisConnection.keys('api:admin:users:*');
      if (keys.length > 0) await redisConnection.del(...keys);
    }

    return sendSuccess(res, {
      message: \`Successfully \${action}ed \${roleName} \${action === 'assign' ? 'to' : 'from'} user\`,
      user: {
        id: result.userid.toString(),
        role: result.role,
        departmentRole: result.departmentRole,
      }
    });`;

content = content.replace(getAllUsersOld, getAllUsersNew);
content = content.replace(mappedUsersOld, mappedUsersNew);
content = content.replace(registerOld, registerNew);
content = content.replace(toggleOld, toggleNew);
content = content.replace(assignRoleOld, assignRoleNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed user controller');
