const fs = require('fs');
const path = require('path');

function fixDoubleBraces(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // fix `user: { faculty: { { departmentid: deptId } } }`
    // to `user: { faculty: { departmentid: deptId } }`
    content = content.replace(/user:\s*\{\s*faculty:\s*\{\s*\{\s*(.*?)\s*\}\s*\}\s*\}/g, 'user: { faculty: { $1 } }');

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
            fixDoubleBraces(filePath);
        }
    });
}

walk(path.join(__dirname, 'src'));
