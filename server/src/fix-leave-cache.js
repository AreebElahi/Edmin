import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'controllers/leaveController.ts');
let content = fs.readFileSync(filePath, 'utf8');

const createOld = `  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(\`api:leaves:\${userId}:\${req.user.role}\`);
  }`;
const createNew = `  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(\`api:leaves:\${userId}:\${req.user.role}\`);
    await redisConnection.del(\`api:dashboard:hr:approvals\`);
  }`;

const approveOld = `  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(\`api:leaves:\${hrUserId}:\${req.user.role}\`);
  }`;
const approveNew = `  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(\`api:leaves:\${hrUserId}:\${req.user.role}\`);
    await redisConnection.del(\`api:dashboard:hr:approvals\`);
    await redisConnection.del(\`api:dashboard:hr:leaves:today\`);
    await redisConnection.del(\`api:dashboard:faculty:\${leave.userid}\`);
    const summaryKeys = await redisConnection.keys(\`api:dashboard:hr:summary:*\`);
    if (summaryKeys.length > 0) await redisConnection.del(...summaryKeys);
  }`;

content = content.replace(createOld, createNew);
content = content.replace(approveOld, approveNew);
content = content.replace(approveOld, approveNew); // for rejectLeave

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed leaveController caching');
