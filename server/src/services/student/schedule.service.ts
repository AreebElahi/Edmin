import { findTimetableByUserId } from '../../models/student/schedule.model.js';
import { AppError } from '../../utils/AppError.js';

export const getSchedule = async (userId: number) => {
  return findTimetableByUserId(userId);
};
