const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/controllers/student');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/const userId = \(req as any\)\.user\.id;/g, 'const userId = (req as any).user.userId || (req as any).user.id;');
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
