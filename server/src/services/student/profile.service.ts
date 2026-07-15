import { findStudentByUserId, findPersonalRecordByStudentId } from '../../models/student/profile.model.js';
import { AppError } from '../../utils/AppError.js';

export const getProfile = async (userId: number) => {
  const student = await findStudentByUserId(userId);
  if (!student) {
    throw new AppError(404, 'Student profile not found');
  }

  const personalRecord = await findPersonalRecordByStudentId(student.studentid);
  
  return {
    student,
    personalRecord,
  };
};
