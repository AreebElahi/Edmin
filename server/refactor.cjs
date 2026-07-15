const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, 'src', 'controllers', 'facultyController.ts');
const servicePath = path.join(__dirname, 'src', 'services', 'faculty', 'faculty.service.ts');

let code = fs.readFileSync(controllerPath, 'utf8');

// We will construct the service code by copying the controller and modifying it
let serviceCode = `import prisma from '../../config/prisma.js';
import { createClassSession } from '../attendance/attendance.service.js';

// Extracted from facultyController.ts
`;

// Helper to replace catchAsync wrapper and req,res
// It's a bit manual, so let's just do it with a more controlled regex or AST if we could.
// Since it's a script, let's just do basic replacements for the service:
serviceCode += code
  .replace(/import .* from 'express';\n/g, '')
  .replace(/import catchAsync from '\.\.\/utils\/catchAsync\.js';\n/g, '')
  .replace(/import prisma from '\.\.\/config\/prisma\.js';\n/g, '')
  .replace(/import \{ createClassSession \} from '\.\.\/services\/attendance\/attendance\.service\.js';\n/g, '')
  .replace(/export const (\w+) = catchAsync\(async \(req: Request, res: Response\) => \{/g, 'export const $1 = async (req: any) => {')
  .replace(/res\.status\(\d+\)\.json\(\{ success: (true|false), data: (.*?) \}\);/g, 'return $2;')
  .replace(/res\.status\(\d+\)\.json\(\{ success: (true|false), message: (.*?) \}\);/g, 'return { message: $2 };')
  .replace(/return res\.status\(\d+\)\.json\(\{ success: (true|false), error: (.*?) \}\);/g, 'throw new Error($2);')
  .replace(/res\.status\(\d+\)\.json\(\{ success: (true|false), error: (.*?) \}\);/g, 'throw new Error($2);');

// Now we write serviceCode
fs.writeFileSync(servicePath, serviceCode, 'utf8');

console.log('faculty.service.ts generated. Review it before continuing.');
