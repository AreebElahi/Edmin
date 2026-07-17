import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') && !file.includes('AdminUsersContent') && !file.includes('TranscriptPreview')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('d:/edmin-afterupdate/edmin.client/app/dashboard/admin');
const targetStr = '<div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col flex-1 min-h-[calc(100vh-4rem)]">';
const targetStr2 = '<div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8  space-y-8 text-text-primary">';

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    let target = targetStr;
    if (!content.includes(targetStr)) {
        if (content.includes(targetStr2)) {
             target = targetStr2;
        } else {
             return;
        }
    }
    
    const startIdx = content.indexOf(target);
    
    let nestedCount = 0;
    let matchEndIdx = -1;
    
    let i = startIdx;
    while (i < content.length) {
        if (content.startsWith('<div', i)) {
            nestedCount++;
            i += 4;
        } else if (content.startsWith('</div', i)) {
            nestedCount--;
            if (nestedCount === 0) {
                matchEndIdx = i;
                break;
            }
            i += 5;
        } else {
            i++;
        }
    }
    
    if (matchEndIdx !== -1) {
        content = content.substring(0, startIdx) + '<AdminPageWrapper>' + content.substring(startIdx + target.length, matchEndIdx) + '</AdminPageWrapper>' + content.substring(matchEndIdx + 6);
        
        if (!content.includes("import AdminPageWrapper")) {
            const importMatch = content.match(/import .+\n(?:import .+\n)*/);
            if (importMatch) {
                content = content.replace(importMatch[0], importMatch[0] + `import AdminPageWrapper from '@/components/admin/AdminPageWrapper';\n`);
            } else {
                content = `import AdminPageWrapper from '@/components/admin/AdminPageWrapper';\n` + content;
            }
        }
        
        fs.writeFileSync(file, content);
        console.log("Updated", file);
    }
});
