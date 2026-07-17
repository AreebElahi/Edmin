const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix department[0]
    content = content.replace(/department\[0\]/g, 'department');

    // Fix req.params.id -> req.params.id as string
    if (filePath.endsWith('supervisorController.ts')) {
        content = content.replace(/req\.params\.id/g, 'req.params.id as string');
        content = content.replace(/'APPROVE'/g, "'APPROVED'");
        content = content.replace(/'REJECT'/g, "'REJECTED'");
        content = content.replace(/getAnalyticsHealth/g, 'getAnalytics');
    }

    if (filePath.endsWith('audit_dashboard_access.ts')) {
        content = content.replace(/user:\s*\{\s*faculty:\s*\{\s*some:\s*\{\s*departmentid: deptId\s*\}\s*\}\s*\}/g, 'user: { faculty: { departmentid: deptId } }');
        content = content.replace(/req\.user\.faculty/g, 'req.user.faculty?');
    }

    if (filePath.endsWith('audit_user.ts')) {
        content = content.replace(/user\.faculty\.length/g, 'user.faculty');
    }

    if (filePath.endsWith('report.service.ts')) {
        content = content.replace(/department\[0\]/g, 'department');
    }

    if (filePath.endsWith('supervisor.service.ts')) {
        content = content.replace(/leave\.user\.faculty\?\.some\(\(f: any\) => f\.departmentid === deptId\)/g, '(leave.user.faculty?.departmentid === deptId)');
    }

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
            processFile(filePath);
        }
    });
}

walk(path.join(__dirname, 'src'));
