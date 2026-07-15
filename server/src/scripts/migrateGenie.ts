
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Prisma
import prisma from '../config/prisma.js';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'edmin-genie',
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@edmin-genie.iam.gserviceaccount.com',
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

async function run() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`Starting Migration ${isDryRun ? '(DRY RUN)' : '(REAL RUN)'}...`);

  const quizzesSnapshot = await db.collection('quizzes').get();
  const quizzes = quizzesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`Found ${quizzes.length} total quizzes in Firebase.`);

  let ambiguousCourseCount = 0;
  let missingFacultyCount = 0;
  let migratedCount = 0;

  for (const quizData of quizzes) {
    const {
      id: firebase_id,
      title,
      description,
      questionCount,
      questions,
      createdAt,
      userId: firebaseUid,
      pdfStorageUrl,
      difficulty,
      questionType,
      topic,
      timeLimit,
      maxWarnings,
      isPublic
    } = quizData as any;

    // 1. Resolve Faculty via Email Match
    let facultyid = null;
    let facultyRecord = null;
    try {
      const fbUser = await getAuth().getUser(firebaseUid);
      if (fbUser.email) {
        facultyRecord = await prisma.faculty.findFirst({
          where: { user: { email: fbUser.email } }
        });
      }
    } catch (e) {
      console.error(`Could not fetch Firebase user ${firebaseUid}`);
    }

    if (!facultyRecord) {
      missingFacultyCount++;
      // Fallback to a system admin or first faculty
      facultyRecord = await prisma.faculty.findFirst();
    }
    
    if (facultyRecord) {
      facultyid = facultyRecord.facultyid;
    }

    // 2. Resolve Course Offering
    let courseofferingid = null;
    if (isPublic && facultyid) {
      const offerings = await prisma.courseoffering.findMany({
        where: { facultyid }
      });
      if (offerings.length === 1) {
        courseofferingid = offerings[0].courseofferingid;
      } else if (offerings.length > 1) {
        ambiguousCourseCount++;
      }
    }

    if (!isDryRun && facultyid) {
      // Execute the migration for this quiz
      try {
        const createdQuiz = await prisma.aiquiz.create({
          data: {
            title: title || 'Untitled Quiz',
            description: description || null,
            facultyid,
            courseofferingid,
            difficulty: difficulty || 'MEDIUM',
            questiontype: questionType || 'MCQ',
            questioncount: questionCount || questions?.length || 0,
            timelimitminutes: timeLimit || 30,
            topic: topic || null,
            maxwarnings: maxWarnings || 3,
            status: 'DRAFT', // DEFAULT STATUS
            pdfurl: pdfStorageUrl || null,
            firebase_id,
            ai_model: 'gemini-2.5-flash',
            createdat: createdAt ? (typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt)) : new Date(),
          }
        });

        // Insert questions
        if (questions && Array.isArray(questions)) {
          const qData = questions.map((q: any, i: number) => ({
            aiquizid: createdQuiz.aiquizid,
            questionorder: i + 1,
            type: q.questionType || createdQuiz.questiontype,
            questiontext: q.questionText || '',
            options: q.options || [],
            correctanswer: typeof q.correctAnswerIndex === 'number' 
              ? String(q.correctAnswerIndex) 
              : (q.correctAnswerText || ''),
            points: 1,
          }));
          await prisma.aiquizquestion.createMany({ data: qData });
        }
        migratedCount++;
      } catch (err) {
        console.error(`Failed to migrate quiz ${firebase_id}:`, err);
      }
    }
  }

  console.log('\n--- MIGRATION REPORT ---');
  console.log(`Total Firebase Quizzes: ${quizzes.length}`);
  console.log(`Ambiguous Course Mappings (isPublic=true but multiple/no courses): ${ambiguousCourseCount}`);
  console.log(`Missing Faculty Mappings (No Edmin account for Firebase UID): ${missingFacultyCount}`);
  
  if (!isDryRun) {
    console.log(`Successfully Migrated: ${migratedCount}`);
  } else {
    console.log(`DRY RUN COMPLETE. Run without --dry-run to commit.`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
