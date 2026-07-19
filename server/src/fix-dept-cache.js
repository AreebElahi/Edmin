import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'controllers/admin/department.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes("import { redisConnection }")) {
  content = content.replace("import { sendSuccess", "import { redisConnection } from '../../config/redis.js';\nimport { sendSuccess");
}

const getOld = `export const getDepartmentsHandler = catchAsync(async (req: Request, res: Response) => {
  const departments = await getAllDepartments();
  return sendSuccess(res, departments);
});`;

const getNew = `export const getDepartmentsHandler = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = 'api:admin:departments';
  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const departments = await getAllDepartments();
  const responseBody = { success: true, data: departments };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 3600, JSON.stringify(responseBody)); // cache for 1 hour
  }

  return res.status(200).json(responseBody);
});`;

const createOld = `  const result = await createDepartment(payload);
  return sendSuccess(res, result, 201);`;

const createNew = `  const result = await createDepartment(payload);
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:departments');
  }
  return sendSuccess(res, result, 201);`;

const updateOld = `  const result = await updateDepartment(departmentId, payload, adminId);
  return sendSuccess(res, result);`;

const updateNew = `  const result = await updateDepartment(departmentId, payload, adminId);
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:departments');
  }
  return sendSuccess(res, result);`;

const mapOld = `  const result = await mapCourseToDepartment(departmentId, courseId, adminId);
  return sendSuccess(res, result, 201);`;

const mapNew = `  const result = await mapCourseToDepartment(departmentId, courseId, adminId);
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:departments');
  }
  return sendSuccess(res, result, 201);`;

const deleteOld = `  const result = await deleteDepartment(departmentId, adminId);
  return sendSuccess(res, { message: 'Department successfully deactivated' });`;

const deleteNew = `  const result = await deleteDepartment(departmentId, adminId);
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:departments');
  }
  return sendSuccess(res, { message: 'Department successfully deactivated' });`;

const assignManagersOld = `  const result = await assignDepartmentManagers(departmentId, req.body, adminId);
  return sendSuccess(res, result);`;

const assignManagersNew = `  const result = await assignDepartmentManagers(departmentId, req.body, adminId);
  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del('api:admin:departments');
  }
  return sendSuccess(res, result);`;


content = content.replace(getOld, getNew);
content = content.replace(createOld, createNew);
content = content.replace(updateOld, updateNew);
content = content.replace(mapOld, mapNew);
content = content.replace(deleteOld, deleteNew);
content = content.replace(assignManagersOld, assignManagersNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed department controller');
