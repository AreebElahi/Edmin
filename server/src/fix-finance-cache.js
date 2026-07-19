import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'controllers/admin/financeController.ts');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes("import { redisConnection }")) {
  content = content.replace("import catchAsync from '../../utils/catchAsync.js';", "import catchAsync from '../../utils/catchAsync.js';\nimport { redisConnection } from '../../config/redis.js';");
}

const getPayrollsOld = `export const getPayrollsHandler = catchAsync(async (req: Request, res: Response) => {
  const payrolls = await getAllPayrolls();
  res.status(200).json({
    success: true,
    data: payrolls
  });
});`;

const getPayrollsNew = `export const getPayrollsHandler = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = 'api:finance:payrolls';
  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const payrolls = await getAllPayrolls();
  const responseBody = { success: true, data: payrolls };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 900, JSON.stringify(responseBody)); // cache for 15 mins
  }

  res.status(200).json(responseBody);
});`;

const getPayrollByIdOld = `export const getPayrollByIdHandler = catchAsync(async (req: Request, res: Response) => {
  const payrollId = Number(req.params.id);
  if (isNaN(payrollId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payroll ID'
    });
  }

  const payroll = await getPayrollById(payrollId);
  if (!payroll) {
    return res.status(404).json({
      success: false,
      message: 'Payroll record not found'
    });
  }

  res.status(200).json({
    success: true,
    data: payroll
  });
});`;

const getPayrollByIdNew = `export const getPayrollByIdHandler = catchAsync(async (req: Request, res: Response) => {
  const payrollId = Number(req.params.id);
  if (isNaN(payrollId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payroll ID'
    });
  }

  const cacheKey = \`api:finance:payroll:\${payrollId}\`;
  if (redisConnection && redisConnection.status === 'ready') {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }
  }

  const payroll = await getPayrollById(payrollId);
  if (!payroll) {
    return res.status(404).json({
      success: false,
      message: 'Payroll record not found'
    });
  }

  const responseBody = { success: true, data: payroll };

  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.setex(cacheKey, 1800, JSON.stringify(responseBody)); // cache for 30 mins
  }

  res.status(200).json(responseBody);
});`;

content = content.replace(getPayrollsOld, getPayrollsNew);
content = content.replace(getPayrollByIdOld, getPayrollByIdNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed finance controller');
