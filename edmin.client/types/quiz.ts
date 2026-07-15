// AI Quiz TypeScript Types — shared between client and server

export type AIQuizDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type AIQuizQuestionType = 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER';
export type AIQuizStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AIQuizAttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED';

export interface AIQuizQuestion {
  aiquizquestionid: number;
  aiquizid: number;
  questionorder: number;
  type: AIQuizQuestionType;
  questiontext: string;
  options: string[] | null; // JSON array of option strings for MCQ
  correctanswer: string;
  points: number;
}

export interface AIQuiz {
  aiquizid: number;
  title: string;
  description: string | null;
  facultyid: number;
  courseofferingid: number | null;
  difficulty: AIQuizDifficulty;
  questiontype: AIQuizQuestionType;
  questioncount: number;
  timelimitminutes: number;
  topic: string | null;
  status: AIQuizStatus;
  maxwarnings: number;
  createdat: string;
  updatedat: string;
  isactive: boolean;
  pdfurl?: string | null;
  questions?: AIQuizQuestion[];
  // Joined data
  faculty?: { fullname: string | null };
  courseoffering?: {
    course: { name: string; code: string };
  } | null;
  _count?: {
    attempts: number;
  };
}

export interface AIQuizAttempt {
  aiquizattemptid: number;
  aiquizid: number;
  studentid: number;
  status: AIQuizAttemptStatus;
  answers: Record<string, string>; // questionId -> selectedAnswer
  score: number | null;
  accuracy: number | null;
  violationcount: number;
  startedat: string;
  submittedat: string | null;
  // Joined
  student?: {
    studentid: number;
    fullname: string | null;
    rollnumber: string | null;
  };
  aiquiz?: AIQuiz;
}

export interface AIQuizReattemptGrant {
  aiquizreattemptgrantid: number;
  aiquizid: number;
  studentid: number;
  grantedby: number;
  reason: string | null;
  used: boolean;
  createdat: string;
}

// For AI generation request
export interface GenerateQuizRequest {
  topic: string;
  difficulty: AIQuizDifficulty;
  questionType: AIQuizQuestionType;
  questionCount: number;
  title: string;
  description?: string;
  courseOfferingId?: number;
  timeLimitMinutes?: number;
  maxWarnings?: number;
}

// For AI generation response (preview before save)
export interface GeneratedQuestion {
  questiontext: string;
  options: string[];
  correctanswer: string;
  type: AIQuizQuestionType;
}

export interface GenerateQuizPreview {
  title: string;
  topic: string;
  difficulty: AIQuizDifficulty;
  questions: GeneratedQuestion[];
}

// For attempt submission
export interface SubmitAttemptRequest {
  answers: Record<string, string>;
  violationCount?: number;
}
