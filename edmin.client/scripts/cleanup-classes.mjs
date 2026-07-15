#!/usr/bin/env node
/**
 * M365 Fluent UI v9 — Repository-wide CSS class cleanup
 * Run: node scripts/cleanup-classes.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = 'app/dashboard';

const REPLACEMENTS = [
  // Radii
  ['rounded-3xl', 'rounded-[2px]'],
  ['rounded-2xl', 'rounded-[2px]'],
  ['rounded-xl',  'rounded-[2px]'],
  ['rounded-lg',  'rounded-[2px]'],
  ['rounded-md',  'rounded-[2px]'],
  ['rounded-full','rounded-[2px]'],
  // Shadows
  ['shadow-2xl', 'shadow-none'],
  ['shadow-xl',  'shadow-none'],
  ['shadow-lg',  'shadow-none'],
  ['shadow-md',  'shadow-none'],
  ['shadow-sm',  'shadow-none'],
  // BG colors → M365 neutrals
  ['bg-emerald-50',  'bg-[#F3F2F1]'],
  ['bg-emerald-100', 'bg-[#F3F2F1]'],
  ['bg-amber-50',    'bg-[#FFF4CE]'],
  ['bg-amber-100',   'bg-[#FFF4CE]'],
  ['bg-rose-50',     'bg-[#FDE7E9]'],
  ['bg-rose-100',    'bg-[#FDE7E9]'],
  ['bg-violet-50',   'bg-[#F3F2F1]'],
  ['bg-purple-50',   'bg-[#F3F2F1]'],
  ['bg-teal-50',     'bg-[#F3F2F1]'],
  ['bg-sky-50',      'bg-[#EFF6FC]'],
  ['bg-indigo-50',   'bg-[#EFF6FC]'],
  ['bg-blue-50',     'bg-[#EFF6FC]'],
  ['bg-blue-100',    'bg-[#DEECF9]'],
  ['bg-slate-100',   'bg-[#F3F2F1]'],
  ['bg-slate-50',    'bg-[#FAF9F8]'],
  ['bg-gray-50',     'bg-[#FAF9F8]'],
  ['bg-gray-100',    'bg-[#F3F2F1]'],
  ['bg-gray-200',    'bg-[#EDEBE9]'],
  ['bg-zinc-50',     'bg-[#FAF9F8]'],
  ['bg-zinc-100',    'bg-[#F3F2F1]'],
  // Gradient icon backgrounds
  ['bg-gradient-to-br from-blue-500 to-indigo-600',   'bg-[#0078D4]'],
  ['bg-gradient-to-br from-sky-500 to-blue-600',      'bg-[#0078D4]'],
  ['bg-gradient-to-br from-emerald-500 to-teal-600',  'bg-[#107C10]'],
  ['bg-gradient-to-br from-violet-500 to-purple-600', 'bg-[#8764B8]'],
  ['bg-gradient-to-br from-teal-500 to-emerald-600',  'bg-[#00B7C3]'],
  ['bg-gradient-to-br from-amber-500 to-orange-600',  'bg-[#835B00]'],
  ['bg-gradient-to-br from-rose-500 to-pink-600',     'bg-[#A4262C]'],
  ['bg-gradient-to-br from-indigo-500 to-violet-600', 'bg-[#4F6BED]'],
  // Text colors → M365 palette
  ['text-emerald-600', 'text-[#107C10]'],
  ['text-emerald-700', 'text-[#107C10]'],
  ['text-amber-600',   'text-[#835B00]'],
  ['text-amber-700',   'text-[#835B00]'],
  ['text-rose-600',    'text-[#A4262C]'],
  ['text-rose-700',    'text-[#A4262C]'],
  ['text-violet-600',  'text-[#0078D4]'],
  ['text-purple-600',  'text-[#0078D4]'],
  ['text-teal-600',    'text-[#0078D4]'],
  ['text-sky-600',     'text-[#0078D4]'],
  ['text-sky-700',     'text-[#0078D4]'],
  ['text-indigo-600',  'text-[#0078D4]'],
  ['text-indigo-700',  'text-[#0078D4]'],
  ['text-blue-600',    'text-[#0078D4]'],
  ['text-blue-700',    'text-[#0078D4]'],
  ['text-slate-600',   'text-[#605E5C]'],
  ['text-slate-700',   'text-[#323130]'],
  ['text-slate-800',   'text-[#11100F]'],
  ['text-gray-300',    'text-[#D2D0CE]'],
  ['text-gray-400',    'text-[#C8C6C4]'],
  ['text-gray-500',    'text-[#A19F9D]'],
  ['text-gray-600',    'text-[#605E5C]'],
  ['text-gray-700',    'text-[#323130]'],
  ['text-gray-800',    'text-[#11100F]'],
  ['text-gray-900',    'text-[#11100F]'],
  ['text-zinc-500',    'text-[#A19F9D]'],
  // Border colors
  ['border-emerald-100', 'border-[#EDEBE9]'],
  ['border-amber-100',   'border-[#EDEBE9]'],
  ['border-blue-100',    'border-[#EDEBE9]'],
  ['border-indigo-100',  'border-[#EDEBE9]'],
  ['border-rose-100',    'border-[#EDEBE9]'],
  ['border-sky-100',     'border-[#EDEBE9]'],
  ['border-gray-100',    'border-[#EDEBE9]'],
  ['border-gray-200',    'border-[#EDEBE9]'],
  ['border-slate-100',   'border-[#EDEBE9]'],
  ['border-slate-200',   'border-[#EDEBE9]'],
  ['divide-gray-50',     'divide-[#EDEBE9]'],
  ['divide-gray-100',    'divide-[#EDEBE9]'],
  // Font weight
  ['font-black',    'font-semibold'],
  ['font-extrabold','font-semibold'],
  // Misc
  ['active:scale-95', ''],
  ['active:scale-90', ''],
  ['hover:-translate-y-1',   ''],
  ['hover:-translate-y-0.5', ''],
  ['green-50',  '[#DFF6DD]'],
  ['green-600', '[#107C10]'],
  ['red-50',    '[#FDE7E9]'],
  ['red-600',   '[#A4262C]'],
];

function walkDir(dir, cb) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, cb);
    } else if (['.tsx', '.ts'].includes(extname(entry))) {
      cb(fullPath);
    }
  }
}

let updatedCount = 0;
walkDir(ROOT, (filePath) => {
  let content = readFileSync(filePath, 'utf8');
  const original = content;
  for (const [find, replace] of REPLACEMENTS) {
    content = content.split(find).join(replace);
  }
  if (content !== original) {
    writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    const shortPath = filePath.replace(ROOT + '/', '');
    console.log(`  ✓ ${shortPath}`);
  }
});

console.log(`\nDone. Updated ${updatedCount} files.`);
