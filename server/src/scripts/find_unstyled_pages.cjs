const fs = require('fs');
const path = require('path');

const dashboardDir = 'd:\\Edmin\\edmin.client\\app\\dashboard';

function findPageFolders(dir, list = []) {
    const files = fs.readdirSync(dir);
    if (files.includes('page.tsx')) {
        list.push(dir);
    }
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findPageFolders(fullPath, list);
        }
    }
    return list;
}

const folders = findPageFolders(dashboardDir);
console.log(`Found ${folders.length} page folders.`);

const unstyled = [];

for (const folder of folders) {
    const filesInFolder = fs.readdirSync(folder).filter(f => f.endsWith('.tsx'));
    let hasLayout = false;
    let redirectOnly = false;
    
    // Check if page.tsx is a redirect-only page (e.g. redirect('/something'))
    const pageContent = fs.readFileSync(path.join(folder, 'page.tsx'), 'utf8');
    if (pageContent.includes('redirect(') && !pageContent.includes('<DashboardLayout')) {
        redirectOnly = true;
    }
    
    for (const file of filesInFolder) {
        const content = fs.readFileSync(path.join(folder, file), 'utf8');
        if (content.includes('DashboardLayout')) {
            hasLayout = true;
            break;
        }
    }
    
    if (!hasLayout && !redirectOnly) {
        unstyled.push(folder);
    }
}

console.log('\n--- Unstyled Pages (No DashboardLayout found in folder) ---');
unstyled.forEach(f => console.log(path.relative(dashboardDir, f)));
