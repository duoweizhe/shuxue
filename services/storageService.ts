
import { WrongQuestion, AppView } from '../types';

const STORAGE_KEY = 'math_explorer_wrong_questions';

export const saveWrongQuestion = (data: Omit<WrongQuestion, 'id' | 'timestamp'>) => {
  const existing = getWrongQuestions();
  
  // 避免短期内重复添加完全相同的题目
  const isDuplicate = existing.some(q => 
    q.questionDisplay === data.questionDisplay && 
    (Date.now() - q.timestamp < 10000)
  );

  if (isDuplicate) return;

  const newQuestion: WrongQuestion = {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  };

  const updated = [newQuestion, ...existing].slice(0, 100); // 最多保留100个
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getWrongQuestions = (): WrongQuestion[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const removeWrongQuestion = (id: string) => {
  const existing = getWrongQuestions();
  const updated = existing.filter(q => q.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const clearWrongQuestions = () => {
  localStorage.removeItem(STORAGE_KEY);
};
