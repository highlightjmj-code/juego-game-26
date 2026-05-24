export type CharacterId = 'viajero' | 'flamenco' | 'churrero' | 'futbolista';

export interface CharacterItem {
  id: CharacterId;
  name: string;
  description: string;
  avatarSvg: string; // SVG code
}

export interface WordItem {
  id: string;
  spanish: string;
  korean: string;
  category: string;
}

export interface SentenceItem {
  id: string;
  spanish: string; // Yo soy estudiante.
  korean: string;  // 나는 학생입니다.
  blankedSpanish?: string; // Yo ___ estudiante.
  blankAnswer?: string;     // soy
  category: string;
}

export interface Question {
  type: 'select' | 'input' | 'blank';
  questionText: string;
  options?: string[];
  correctAnswer: string;
  originalData: WordItem | SentenceItem;
}

export interface ScoreRecord {
  characterId: CharacterId;
  nickname: string;
  level: number;
  userId: string;
  date: string;
  isCurrentUser?: boolean;
}

export interface GameState {
  userId: string;
  nickname: string;
  selectedCharacterId: CharacterId | null;
  level: number;         // 1 ~ 30
  stairStep: number;     // 0 ~ 9 (10칸 존재)
  isExamMode: boolean;   // 10칸 완료 시 시험 진행
  examQuestionIndex: number; // 시험 5문제 중 현재 진행 idx
  examCorrectCount: number;  // 시험 맞춘 개수
  examQuestions: Question[]; // 시험 문제 목록
  incorrectWords: string[];   // 틀린 단어 ID 목록
  incorrectSentences: string[]; // 틀린 문장 ID 목록
  settings: {
    soundEnabled: boolean;
  };
}
