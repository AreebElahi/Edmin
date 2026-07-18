import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'controllers/aiQuizController.ts');
let content = fs.readFileSync(filePath, 'utf8');

const oldStr = `  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(\`api:faculty:quizzes:\${userId}\`);
  }`;

const newStr = `  if (redisConnection && redisConnection.status === 'ready') {
    await redisConnection.del(\`api:faculty:quizzes:\${userId}\`);
    await redisConnection.del(\`api:dashboard:faculty:\${userId}\`);
    const keys = await redisConnection.keys(\`api:faculty:course-details:\${userId}:*\`);
    if (keys.length > 0) await redisConnection.del(...keys);
  }`;

content = content.replace(oldStr, newStr);
content = content.replace(oldStr, newStr);
content = content.replace(oldStr, newStr);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed aiQuizController.ts');
