const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. user: { faculty: { some: { ... } } } -> user: { faculty: { ... } }
    content = content.replace(/user:\s*\{\s*faculty:\s*\{\s*some:\s*(\{[\s\S]*?\})\s*\}\s*\}/g, 'user: { faculty: $1 }');
    
    // 2. user.faculty[0] -> user.faculty
    content = content.replace(/user\.faculty\[0\]/g, 'user.faculty');
    content = content.replace(/user\.faculty\?\.\[0\]/g, 'user.faculty');

    // 3. user.faculty.length -> user.faculty (boolean check instead of array check)
    content = content.replace(/user\.faculty\.length\s*>\s*0/g, 'user.faculty');
    content = content.replace(/user\.faculty\.length/g, '!!user.faculty');

    // 4. department: { some: { ... } } -> department: { ... } (if there's a department issue in finance)
    // Actually the payroll error is on indexing: department[0] -> department
    content = content.replace(/department\[0\]/g, 'department');
    
    // 5. supervisorController.ts: req.query.ids might be string[]
    // Wait, let's fix the faculty relation first.

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', filePath);
    }
}

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            walk(filePath);
        } else if (filePath.endsWith('.ts')) {
            replaceInFile(filePath);
        }
    });
}

walk(path.join(__dirname, 'src'));
