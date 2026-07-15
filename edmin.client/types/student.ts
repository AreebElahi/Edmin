export interface Program {
  programid: number;
  name: string;
  code: string;
}

export interface Department {
  departmentid: number;
  name: string;
  code: string;
}

export interface Student {
  studentid: number;
  userid: number;
  fullname: string;
  rollnumber: string;
  status: string;
  program: Program;
  department: Department;
}

export interface PersonalRecord {
  studentpersonalrecordid: number;
  studentid_ref: number;
  firstname: string;
  lastname: string;
  dateofbirth: string;
  gender: string;
  nationality: string;
  contactnumber: string;
  emailaddress: string;
}

export interface ProfileResponse {
  student: Student;
  personalRecord: PersonalRecord | null;
}

export interface AttendanceSummary {
  attendancesummaryid: number;
  courseOfferingId: number;
  courseName: string;
  courseCode: string;
  totalpresent: number;
  totalabsent: number;
  totalclasses: number;
  percentage: number;
}

export interface AttendanceSessionLog {
  attendanceid: number;
  sessionid: number;
  status: string;
  sessiondate: string;
  starttime: string;
  endtime: string;
  topic: string | null;
}

export interface EnrollmentGrade {
  courseenrollmentid: number;
  courseofferingid: number;
  courseName: string;
  courseCode: string;
  credits: number;
  status: string;
  grade: string | null;
  gradepoints: number | null;
  percentage: number | null;
}

export interface GradesResponse {
  enrollments: EnrollmentGrade[];
  cgpa: number;
  creditsCompleted: number;
  creditsRegistered: number;
}

export interface ScheduleItem {
  timetableid: number;
  courseofferingid: number;
  courseName: string;
  courseCode: string;
  dayofweek: string;
  starttime: string;
  endtime: string;
  room: string | null;
}

export interface CourseOffering {
  courseofferingid: number;
  courseName: string;
  courseCode: string;
  credits: number;
  semesterName: string;
}

export interface EnrollmentRequest {
  courseenrollmentid: number;
  courseofferingid: number;
  courseName: string;
  courseCode: string;
  status: string;
  createdat: string;
}

export interface AssignmentSubmission {
  assignmentsubmissionid: number;
  status: string;
  fileurl: string | null;
  downloadUrl?: string;
  marksawarded: number | null;
  submittedat: string | null;
  feedback: string | null;
}

export interface StudentAssignment {
  assignmentid: number;
  title: string;
  description: string | null;
  duedate: string;
  maxmarks: number;
  courseName: string;
  courseCode: string;
  submission: AssignmentSubmission | null;
}

export interface StudentQuiz {
  quizid: number;
  title: string;
  description: string | null;
  duration: number;
  totalmarks: number;
  courseName: string;
  courseCode: string;
  attempted: boolean;
  score: number | null;
  submittedat: string | null;
}

export interface QuizOption {
  quizoptionid: number;
  optiontext: string;
}

export interface QuizQuestion {
  quizquestionid: number;
  questionbankid: number;
  points: number;
  questiontext: string;
  difficulty: string;
  options: QuizOption[];
}

export interface StudentQuizDetail extends StudentQuiz {
  questions: QuizQuestion[];
}

export interface QuizAttemptAnswer {
  questionId: number;
  selectedOptionId: number;
}

export interface QuizAttemptRequest {
  answers: QuizAttemptAnswer[];
}

export interface QuizResultAnswer {
  quizanswerid: number;
  questiontext: string;
  options: QuizOption[];
  selectedOptionId: number;
  correctOptionId: number;
  iscorrect: boolean;
  marksawarded: number;
}

export interface QuizResultResponse {
  quizattemptid: number;
  score: number;
  maxmarks: number;
  startedat: string;
  submittedat: string;
  answers: QuizResultAnswer[];
}

export interface StudentNotification {
  notificationid: number;
  title: string;
  message: string;
  isread: boolean;
  type: string;
  createdat: string;
}
