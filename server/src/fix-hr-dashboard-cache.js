import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'controllers/dashboardController.ts');
let content = fs.readFileSync(filePath, 'utf8');

const summaryOld = `export const getHrDashboardSummary = catchAsync(async (req: Request, res: Response) => {
  const data = await dashboardService.getHrDashboardSummary(req.user.userId);
  res.status(200).json({ success: true, data });
});`;

const summaryNew = `export const getHrDashboardSummary = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const cacheKey = \`api:dashboard:hr:summary:\${userId}\`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const data = await dashboardService.getHrDashboardSummary(userId);
  const fullResponse = { success: true, data };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 900, JSON.stringify(fullResponse)); // cache for 15 mins
  }

  res.status(200).json(fullResponse);
});`;

const leavesOld = `export const getHrLeavesToday = catchAsync(async (req: Request, res: Response) => {
  const data = await dashboardService.getHrLeavesToday();
  res.status(200).json({ success: true, data });
});`;

const leavesNew = `export const getHrLeavesToday = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = \`api:dashboard:hr:leaves:today\`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const data = await dashboardService.getHrLeavesToday();
  const fullResponse = { success: true, data };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 900, JSON.stringify(fullResponse)); // cache for 15 mins
  }

  res.status(200).json(fullResponse);
});`;

const complianceOld = `export const getHrCompliance = catchAsync(async (req: Request, res: Response) => {
  const data = await dashboardService.getHrCompliance();
  res.status(200).json({ success: true, data });
});`;

const complianceNew = `export const getHrCompliance = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = \`api:dashboard:hr:compliance\`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const data = await dashboardService.getHrCompliance();
  const fullResponse = { success: true, data };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 3600, JSON.stringify(fullResponse)); // cache for 1 hour
  }

  res.status(200).json(fullResponse);
});`;

const approvalsOld = `export const getHrApprovalsPending = catchAsync(async (req: Request, res: Response) => {
  const data = await dashboardService.getHrApprovalsPending();
  res.status(200).json({ success: true, data });
});`;

const approvalsNew = `export const getHrApprovalsPending = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = \`api:dashboard:hr:approvals\`;

  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const data = await dashboardService.getHrApprovalsPending();
  const fullResponse = { success: true, data };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 300, JSON.stringify(fullResponse)); // cache for 5 mins
  }

  res.status(200).json(fullResponse);
});`;

content = content.replace(summaryOld, summaryNew);
content = content.replace(leavesOld, leavesNew);
content = content.replace(complianceOld, complianceNew);
content = content.replace(approvalsOld, approvalsNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed HR dashboard caching');
