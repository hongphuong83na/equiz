export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  class?: string;
  role: UserRole;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  duration: number; // minutes
  totalQuestions: number;
  code: string;
  createdAt: any;
}

export type QuestionType = 'MCQ' | 'TRUE_FALSE';

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  question: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: string;
}

export interface Result {
  id?: string;
  userId: string;
  userName: string;
  userClass: string;
  examId: string;
  examTitle: string;
  score: number;
  answers: Record<string, string>;
  submitTime: any;
}
