import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import prisma from '../config/prisma.js';
import PDFDocument from 'pdfkit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'Edmin bucket';

function generatePdfBuffer(title: string, studentName: string, studentId: string, contentLines: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', err => reject(err));

    // PDF Content
    doc.fontSize(22).fillColor('#1E3A8A').text(title, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#4B5563').text(`Student: ${studentName} (${studentId})`, { align: 'center' });
    doc.text(`Submitted Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1.5);

    doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    doc.fontSize(14).fillColor('#111827').text('Submission Content & Answers:', { underline: true });
    doc.moveDown(0.8);

    doc.fontSize(11).fillColor('#374151');
    contentLines.forEach(line => {
      doc.text(line);
      doc.moveDown(0.5);
    });

    doc.moveDown(2);
    doc.fontSize(10).fillColor('#9CA3AF').text('--- End of Student Submission PDF ---', { align: 'center' });

    doc.end();
  });
}

async function fixSubmissions() {
  console.log('Generating valid PDF buffers...');

  const alicePdf = await generatePdfBuffer(
    'Lab 1: Variable Scopes and Types',
    'Alice Smith',
    'CS-2026-001',
    [
      'Question 1: What is the difference between var, let, and const in JavaScript?',
      'Answer: "var" is function-scoped and hoisted. "let" and "const" are block-scoped. "const" creates a read-only reference to a value, meaning the variable identifier cannot be reassigned.',
      '',
      'Question 2: Explain primitive vs reference types.',
      'Answer: Primitives (number, string, boolean, null, undefined, symbol, bigint) are passed by value and immutable. Reference types (objects, arrays, functions) are stored in heap memory and passed by reference.',
      '',
      'Code Snippet Implementation:',
      'function testScope() {',
      '   if (true) {',
      '      let blockScoped = "Available inside block only";',
      '      var funcScoped = "Available across entire function";',
      '   }',
      '   console.log(funcScoped); // Works',
      '}'
    ]
  );

  const bobPdf = await generatePdfBuffer(
    'Lab 1: Variable Scopes and Types',
    'Bob Jones',
    'CS-2026-002',
    [
      'Question 1: Scope Explanation',
      'Answer: Variable scoping defines where variables are accessible in code. Global scope is accessible everywhere, function scope is constrained to the enclosing function, and block scope is constrained to curly braces {...}.',
      '',
      'Question 2: Type Coercion',
      'Answer: Implicit type coercion happens when JS automatically converts data types during operations, e.g., "5" + 2 results in string "52", while "5" - 2 results in number 3.',
      '',
      'Conclusion:',
      'All unit tests for variable scoping and type checking pass successfully.'
    ]
  );

  const alicePath = 'assignments/lab1_alice_smith_scopes.pdf';
  const bobPath = 'assignments/lab1_bob_jones_types.pdf';

  console.log(`Uploading ${alicePath} to Supabase storage...`);
  const uploadAlice = await supabase.storage.from(BUCKET_NAME).upload(alicePath, alicePdf, {
    contentType: 'application/pdf',
    upsert: true
  });
  if (uploadAlice.error) throw uploadAlice.error;

  console.log(`Uploading ${bobPath} to Supabase storage...`);
  const uploadBob = await supabase.storage.from(BUCKET_NAME).upload(bobPath, bobPdf, {
    contentType: 'application/pdf',
    upsert: true
  });
  if (uploadBob.error) throw uploadBob.error;

  console.log('Updating database records...');
  // Update Alice Smith submission
  await prisma.assignmentsubmission.updateMany({
    where: { studentid: 1, assignmentid: 1 },
    data: { fileUrl: `uploads/${alicePath}` }
  });

  // Update Bob Jones submission
  await prisma.assignmentsubmission.updateMany({
    where: { studentid: 3, assignmentid: 1 },
    data: { fileUrl: `uploads/${bobPath}` }
  });

  console.log('Successfully updated submissions to valid PDF files!');
}

fixSubmissions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
