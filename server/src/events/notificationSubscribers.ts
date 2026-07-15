import { eventBus, Events } from './eventBus.js';
import * as notificationService from '../services/notificationService.js';
import prisma from '../config/prisma.js';

export const setupNotificationSubscribers = () => {
  
  eventBus.on(Events.ASSIGNMENT_CREATED, async ({ assignmentId, courseOfferingId, title }) => {
    try {
      // Find all students enrolled in this course offering
      const enrollments = await prisma.courseenrollment.findMany({
        where: { courseofferingid: courseOfferingId, isactive: true },
        include: { student: true }
      });

      const userIds = enrollments.map(e => e.student.userid);
      
      if (userIds.length > 0) {
        await notificationService.createBulkNotifications(
          userIds,
          'New Assignment Published',
          `A new assignment "${title}" has been published in your course.`
        );
        console.log(`[Event] Notification sent to ${userIds.length} students for new assignment ${assignmentId}`);
      }
    } catch (error) {
      console.error('[Event Error] Failed to process ASSIGNMENT_CREATED event:', error);
    }
  });

  eventBus.on(Events.QUIZ_PUBLISHED, async ({ quizId, courseOfferingId, title }) => {
    try {
      const enrollments = await prisma.courseenrollment.findMany({
        where: { courseofferingid: courseOfferingId, isactive: true },
        include: { student: true }
      });

      const userIds = enrollments.map(e => e.student.userid);
      
      if (userIds.length > 0) {
        await notificationService.createBulkNotifications(
          userIds,
          'New Quiz Available',
          `A new quiz "${title}" is now available to take.`
        );
        console.log(`[Event] Notification sent to ${userIds.length} students for new quiz ${quizId}`);
      }
    } catch (error) {
      console.error('[Event Error] Failed to process QUIZ_PUBLISHED event:', error);
    }
  });

  eventBus.on(Events.USER_ENROLLED, async ({ userId, courseName }) => {
    try {
      await notificationService.createNotification(
        userId,
        'Enrollment Successful',
        `You have been successfully enrolled in ${courseName}.`
      );
    } catch (error) {
      console.error('[Event Error] Failed to process USER_ENROLLED event:', error);
    }
  });

};
