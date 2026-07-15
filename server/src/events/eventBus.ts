import { EventEmitter } from 'events';

class EventBus extends EventEmitter {}

export const eventBus = new EventBus();

// Define Event Types for type safety (optional but good practice)
export const Events = {
  COURSE_CREATED: 'course.created',
  USER_ENROLLED: 'user.enrolled',
  ASSIGNMENT_CREATED: 'assignment.created',
  QUIZ_PUBLISHED: 'quiz.published',
  GRADE_UPDATED: 'grade.updated',
  MODULE_PROVISIONED: 'module.provisioned',
};
