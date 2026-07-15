import prisma from '../../config/prisma.js';

export const processRepeats = (enrollments: any[]) => {
  const courseMap = new Map<number, any>();

  // Sort enrollments by completedat to process chronologically
  const sorted = [...enrollments].sort((a, b) => {
    return new Date(a.completedat).getTime() - new Date(b.completedat).getTime();
  });

  const finalRecords = [];

  for (const enrollment of sorted) {
    const courseId = enrollment.courseoffering.courseid;
    
    if (courseMap.has(courseId)) {
      const previous = courseMap.get(courseId);
      
      // Highest Grade Wins Policy
      if (enrollment.gradepoints > previous.gradepoints) {
        // Tag previous as repeated (overwritten)
        previous.isRepeatedOut = true;
        
        // This is the new active highest
        enrollment.isRepeatedIn = true; 
        courseMap.set(courseId, enrollment);
      } else {
        // New attempt is lower, tag it as repeated out
        enrollment.isRepeatedOut = true;
        previous.isRepeatedIn = true;
      }
    } else {
      courseMap.set(courseId, enrollment);
    }
    finalRecords.push(enrollment);
  }

  // Filter out the ones that are repeated out (don't count towards GPA/credits)
  const activeEnrollments = finalRecords.filter(r => !r.isRepeatedOut);

  return { allRecords: finalRecords, activeEnrollments };
};
