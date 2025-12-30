
export enum AppView {
  HOME = 'HOME',
  TABLE = 'TABLE',
  QUIZ = 'QUIZ',
  AI_STORY = 'AI_STORY',
  PICTURE_MATH = 'PICTURE_MATH',
  UNIT_CONVERSION = 'UNIT_CONVERSION',
  PRACTICAL = 'PRACTICAL',
  PATTERNS = 'PATTERNS',
  CONCEPT = 'CONCEPT',
  COMPARISON = 'COMPARISON',
  WRONG_QUESTIONS = 'WRONG_QUESTIONS', // 新增错题本视图
  SETTINGS = 'SETTINGS'
}

export interface WrongQuestion {
  id: string;
  viewType: AppView;
  categoryName: string;
  questionDisplay: string;
  correctAnswer: string | number;
  userAnswer: string | number;
  timestamp: number;
  // 可选：存储原始题目对象以便重做
  rawQuestion?: any;
}

export interface AISettings {
  provider: 'gemini' | 'openai';
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  enableAI?: boolean;
}

export interface Question {
  num1: number;
  num2: number;
  num3?: number;
  operator1: string;
  operator2?: string;
  answer: number;
  options: number[];
  type: 'SIMPLE' | 'MIXED';
}

export interface WordProblem {
  story: string;
  question: string;
  answer: number;
  options: number[];
}

export interface UnitProblem {
  scenario: string;
  question: string;
  answer: number;
  options: number[];
  unit: string;
}

export type PatternLayout = 'LINEAR' | 'GRID' | 'CIRCLE';

export interface PatternProblem {
  layout: PatternLayout;
  sequence: (number | string)[];
  answer: number;
  options: number[];
  explanation: string;
  theme?: string;
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}
