import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'controllers/admin/reports.controller.ts');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes("import { redisConnection }")) {
  content = content.replace("import PDFDocument", "import { redisConnection } from '../../config/redis.js';\nimport PDFDocument");
}

const attendanceOld = `export const getAttendanceReportHandler = async (req: Request, res: Response) => {
  try {`;

const attendanceNew = `export const getAttendanceReportHandler = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'api:reports:attendance';
    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }`;

const attendanceReturnOld = `    return sendSuccess(res, formatted);
  } catch (error: any) {`;

const attendanceReturnNew = `    const responseBody = { success: true, data: formatted };
    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.setex(cacheKey, 900, JSON.stringify(responseBody)); // cache for 15 mins
    }
    return res.status(200).json(responseBody);
  } catch (error: any) {`;

const enrollmentOld = `export const getEnrollmentReportHandler = async (req: Request, res: Response) => {
  try {`;

const enrollmentNew = `export const getEnrollmentReportHandler = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'api:reports:enrollment';
    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }`;

const enrollmentReturnOld = `    return sendSuccess(res, formatted);
  } catch (error: any) {`;

const enrollmentReturnNew = `    const responseBody = { success: true, data: formatted };
    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.setex(cacheKey, 900, JSON.stringify(responseBody)); // cache for 15 mins
    }
    return res.status(200).json(responseBody);
  } catch (error: any) {`;

const leaveOld = `export const getLeaveReportSummaryHandler = async (req: Request, res: Response) => {
  try {`;

const leaveNew = `export const getLeaveReportSummaryHandler = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'api:reports:leaves';
    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }`;

const leaveReturnOld = `    return sendSuccess(res, {
      summary: {
        pending,
        approved,
        rejected
      },
      list: formattedList
    });
  } catch (error: any) {`;

const leaveReturnNew = `    const responseBody = { success: true, data: {
      summary: {
        pending,
        approved,
        rejected
      },
      list: formattedList
    }};
    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.setex(cacheKey, 900, JSON.stringify(responseBody)); // cache for 15 mins
    }
    return res.status(200).json(responseBody);
  } catch (error: any) {`;

const gradeOld = `export const getGradeDistributionReportHandler = async (req: Request, res: Response) => {
  try {`;

const gradeNew = `export const getGradeDistributionReportHandler = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'api:reports:grades';
    if (redisConnection && redisConnection.status === 'ready') {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cached);
      }
    }`;

const gradeReturnOld = `    return sendSuccess(res, formattedGrades);
  } catch (error: any) {`;

const gradeReturnNew = `    const responseBody = { success: true, data: formattedGrades };
    if (redisConnection && redisConnection.status === 'ready') {
      await redisConnection.setex(cacheKey, 3600, JSON.stringify(responseBody)); // cache for 1 hour
    }
    return res.status(200).json(responseBody);
  } catch (error: any) {`;


content = content.replace(attendanceOld, attendanceNew);
content = content.replace(attendanceReturnOld, attendanceReturnNew);

content = content.replace(enrollmentOld, enrollmentNew);
content = content.replace(enrollmentReturnOld, enrollmentReturnNew);

content = content.replace(leaveOld, leaveNew);
content = content.replace(leaveReturnOld, leaveReturnNew);

content = content.replace(gradeOld, gradeNew);
content = content.replace(gradeReturnOld, gradeReturnNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed reports controller');
