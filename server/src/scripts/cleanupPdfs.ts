import fs from 'fs/promises';
import path from 'path';
import prisma from '../config/prisma.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'quizzes');

/**
 * Script to clean up orphaned PDFs (older than 24h) and PDFs for deleted AI quizzes
 */
async function cleanupPdfs() {
  console.log('[Cleanup] Starting PDF cleanup...');
  
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    
    // Get all valid PDF URLs currently used by active AI quizzes
    const activeQuizzes = await prisma.aiquiz.findMany({
      where: { pdfurl: { not: null }, isactive: true, deletedat: null },
      select: { pdfurl: true }
    });
    
    const validFilenames = new Set(
      activeQuizzes.map(q => q.pdfurl?.split('/').pop()).filter(Boolean)
    );
    
    const now = Date.now();
    let deletedCount = 0;
    
    for (const file of files) {
      if (file.endsWith('.pdf')) {
        const filePath = path.join(UPLOAD_DIR, file);
        const stats = await fs.stat(filePath);
        const ageHours = (now - stats.mtimeMs) / (1000 * 60 * 60);
        
        // If file is not in DB and older than 24 hours, delete it
        if (!validFilenames.has(file) && ageHours > 24) {
          await fs.unlink(filePath);
          console.log(`[Cleanup] Deleted orphaned PDF: ${file}`);
          deletedCount++;
        }
      }
    }
    
    console.log(`[Cleanup] Finished. Deleted ${deletedCount} files.`);
  } catch (error) {
    console.error('[Cleanup] Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupPdfs();
