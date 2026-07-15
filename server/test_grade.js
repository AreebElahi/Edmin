import { calculateLetterGrade } from './src/services/assessment/gradeBoundary.service.js';

async function main() {
  const result = await calculateLetterGrade(70.003);
  console.log('Result for 70.003:', result);
}

main().catch(console.error);
