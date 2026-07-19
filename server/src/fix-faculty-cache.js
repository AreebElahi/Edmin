import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'controllers/facultyController.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace assignment invalidations
const assignOld = `  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(\`api:faculty:assignments:v2:\${req.user.userId}\`);
  }`;
const assignNew = `  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(\`api:faculty:assignments:v2:\${req.user.userId}\`);
    await redisConnection.del(\`api:dashboard:faculty:\${req.user.userId}\`);
    const keys = await redisConnection.keys(\`api:faculty:course-details:\${req.user.userId}:*\`);
    if (keys.length > 0) await redisConnection.del(...keys);
  }`;
content = content.replace(assignOld, assignNew);
content = content.replace(assignOld, assignNew);
content = content.replace(assignOld, assignNew);

// Replace quiz invalidations
const quizOld = `  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(\`api:faculty:quizzes:\${req.user.userId}\`);
  }`;
const quizNew = `  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(\`api:faculty:quizzes:\${req.user.userId}\`);
    await redisConnection.del(\`api:dashboard:faculty:\${req.user.userId}\`);
    const keys = await redisConnection.keys(\`api:faculty:course-details:\${req.user.userId}:*\`);
    if (keys.length > 0) await redisConnection.del(...keys);
  }`;
content = content.replace(quizOld, quizNew);
content = content.replace(quizOld, quizNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed facultyController.ts');
