const fs = require('fs');
let facultyCode = fs.readFileSync('src/controllers/facultyController.ts', 'utf8');

// Fix string | string[] to string for parseInt
facultyCode = facultyCode.replace(/parseInt\((enrollmentId|assignmentId|quizId|courseOfferingId|id)\)/g, 'parseInt($1 as string)');

// Fix Enumaiquiz_attempt_statusFilter
facultyCode = facultyCode.replace(/status: 'COMPLETED'/g, "status: 'SUBMITTED'");

// Fix courseoffering property does not exist...
// Looking at the errors, line 340, 341 might be:
// include: { courseoffering: true }
// wait, if courseoffering doesn't exist, it means the model doesn't have courseoffering. But aiquiz does.
// Let me just regex replace all "courseoffering: " with "courseoffering: " to check if it's a typo.
// Actually, I can just write the modified content back.
fs.writeFileSync('src/controllers/facultyController.ts', facultyCode, 'utf8');

let aiQuizCtrlCode = fs.readFileSync('src/controllers/aiQuizController.ts', 'utf8');
aiQuizCtrlCode = aiQuizCtrlCode.replace("import pdfParse from 'pdf-parse';", "// @ts-ignore\nimport pdfParse from 'pdf-parse';");
fs.writeFileSync('src/controllers/aiQuizController.ts', aiQuizCtrlCode, 'utf8');

let testCode = fs.readFileSync('src/scripts/testRoundtrip.ts', 'utf8');
testCode = testCode.replace(/correctOption\./g, 'correctOption!.')
  .replace(/correctOption2\./g, 'correctOption2!.');
fs.writeFileSync('src/scripts/testRoundtrip.ts', testCode, 'utf8');

console.log('Fixed simple errors');
