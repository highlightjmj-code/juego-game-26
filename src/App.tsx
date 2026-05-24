import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterId, Question, WordItem, SentenceItem, GameState } from './types';
import { getFullWords, getFullSentences, originalCharacters } from './data/spanishData';
import { soundManager } from './components/SoundManager';
import CharacterSelection from './components/CharacterSelection';
import StairsDisplay from './components/StairsDisplay';
import QuestionCard from './components/QuestionCard';
import IncorrectNote from './components/IncorrectNote';
import RankingBoard from './components/RankingBoard';
import SettingsModal from './components/SettingsModal';
import { GraduationCap, Trophy, BookOpen, Settings, RotateCcw, Award, CheckCircle, XCircle, Volume2, Sparkles, LogOut, CloudLightning } from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'escuela_espanol_save_state';

const initialGameState: GameState = {
  userId: 'player_' + Math.random().toString(36).substring(2, 9),
  nickname: '',
  selectedCharacterId: null,
  level: 1,
  stairStep: 0,
  isExamMode: false,
  examQuestionIndex: 0,
  examCorrectCount: 0,
  examQuestions: [],
  incorrectWords: [],
  incorrectSentences: [],
  settings: {
    soundEnabled: true
  }
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  // 모달 제어 상태
  const [showIncorrectNote, setShowIncorrectNote] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GameState;
        setGameState(parsed);
        // 사운드 토글 동기화
        soundManager.setEnabled(parsed.settings?.soundEnabled ?? true);
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
  }, []);

  // 데이터 영구 저장
  const saveState = useCallback((state: GameState) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, []);

  // Firebase Auth Observer & Leaderboard Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (u) {
        setSyncing(true);
        const path = `scores/${u.uid}`;
        try {
          const docSnap = await getDoc(doc(db, 'scores', u.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setGameState((prev) => {
              const remoteLevel = Number(data.level) || 1;
              const localLevel = prev.level;
              let mergedLevel = localLevel;

              if (remoteLevel > localLevel) {
                mergedLevel = remoteLevel;
              }

              const updated: GameState = {
                ...prev,
                userId: u.uid,
                nickname: prev.nickname || data.nickname || u.displayName || '러너',
                selectedCharacterId: prev.selectedCharacterId || (data.characterId as any) || 'viajero',
                level: mergedLevel,
              };

              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

              if (localLevel >= remoteLevel) {
                setDoc(doc(db, 'scores', u.uid), {
                  userId: u.uid,
                  nickname: updated.nickname,
                  characterId: updated.selectedCharacterId,
                  level: localLevel,
                  updatedAt: serverTimestamp()
                }).catch((err) => handleFirestoreError(err, OperationType.WRITE, path));
              }

              return updated;
            });
          } else {
            // First time auth, upload standard local state
            setGameState((prev) => {
              if (prev.nickname && prev.selectedCharacterId) {
                setDoc(doc(db, 'scores', u.uid), {
                  userId: u.uid,
                  nickname: prev.nickname,
                  characterId: prev.selectedCharacterId,
                  level: prev.level,
                  updatedAt: serverTimestamp()
                }).catch((err) => handleFirestoreError(err, OperationType.WRITE, path));
              }
              const updated = { ...prev, userId: u.uid };
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
              return updated;
            });
          }
        } catch (e) {
          console.error('Auth sync doc load error:', e);
        } finally {
          setSyncing(false);
        }
      } else {
        setGameState((prev) => {
          const updated = {
            ...prev,
            userId: prev.userId.startsWith('player_') ? prev.userId : 'player_' + Math.random().toString(36).substring(2, 9)
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto sync level progress database changes
  useEffect(() => {
    if (firebaseUser && gameState.nickname && gameState.selectedCharacterId) {
      const path = `scores/${firebaseUser.uid}`;
      const timeoutId = setTimeout(() => {
        setDoc(doc(db, 'scores', firebaseUser.uid), {
          userId: firebaseUser.uid,
          nickname: gameState.nickname,
          characterId: gameState.selectedCharacterId,
          level: gameState.level,
          updatedAt: serverTimestamp()
        }).catch((err) => handleFirestoreError(err, OperationType.WRITE, path));
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [firebaseUser, gameState.level, gameState.nickname, gameState.selectedCharacterId]);

  // 오답 소거 유틸
  const handleRemoveIncorrectWord = (wordId: string) => {
    const updated = {
      ...gameState,
      incorrectWords: gameState.incorrectWords.filter(id => id !== wordId)
    };
    setGameState(updated);
    saveState(updated);
  };

  const handleRemoveIncorrectSentence = (sentenceId: string) => {
    const updated = {
      ...gameState,
      incorrectSentences: gameState.incorrectSentences.filter(id => id !== sentenceId)
    };
    setGameState(updated);
    saveState(updated);
  };

  // 문제 은행 팩토리 함수
  const generateRandomQuestion = useCallback((level: number): Question => {
    const words = getFullWords();
    const sentences = getFullSentences();

    if (level <= 15) {
      // 1. 단어 학습 파트 (Lv 1 ~ 15)
      const randomWord = words[Math.floor(Math.random() * words.length)];
      const questionType = Math.random() < 0.5 ? 'select' : 'input';

      if (questionType === 'select') {
        // 객관식 보기 구성 (뜻 맞추기)
        const wrongOptions = words
          .filter(w => w.id !== randomWord.id)
          .map(w => w.korean);
        
        // 중복 제거 및 무작위 3개 선출 후 정답 병합
        const uniqueWrongs = Array.from(new Set(wrongOptions)).sort(() => 0.5 - Math.random()).slice(0, 3);
        const shuffledOptions = [randomWord.korean, ...uniqueWrongs].sort(() => 0.5 - Math.random());

        return {
          type: 'select',
          questionText: `스페인어 단어 "${randomWord.spanish}"의 알맞은 한글 뜻은 무엇인가요?`,
          options: shuffledOptions,
          correctAnswer: randomWord.korean,
          originalData: randomWord
        };
      } else {
        // 주관식 단어 입력형 문제
        return {
          type: 'input',
          questionText: `한글 "${randomWord.korean}"에 부합하는 올바른 스페인어 단어를 직접 쓰세요.`,
          correctAnswer: randomWord.spanish,
          originalData: randomWord
        };
      }
    } else {
      // 2. 문장 학습 파트 (Lv 16 ~ 30)
      const randomSent = sentences[Math.floor(Math.random() * sentences.length)];
      const questionType = Math.random() < 0.5 ? 'select' : 'blank';

      if (questionType === 'select') {
        // 문장 올바른 해석 고르기
        const wrongOptions = sentences
          .filter(s => s.id !== randomSent.id)
          .map(s => s.korean);

        const uniqueWrongs = Array.from(new Set(wrongOptions)).sort(() => 0.5 - Math.random()).slice(0, 3);
        const shuffledOptions = [randomSent.korean, ...uniqueWrongs].sort(() => 0.5 - Math.random());

        return {
          type: 'select',
          questionText: `다음 스페인어 문장에 들어맞는 알맞은 번역 뜻을 고르세요:\n"${randomSent.spanish}"`,
          options: shuffledOptions,
          correctAnswer: randomSent.korean,
          originalData: randomSent
        };
      } else {
        // 빈칸 채우기형 문제
        const blankedText = randomSent.blankedSpanish || `${randomSent.spanish.split(' ')[0]} ___ ${randomSent.spanish.split(' ').slice(1).join(' ')}`;
        const blankAnswer = randomSent.blankAnswer || randomSent.spanish.split(' ')[1] || 'soy';

        return {
          type: 'blank',
          questionText: `뜻 "${randomSent.korean}"이 되도록 괄호 빈칸에 알맞은 요소를 타이핑하세요:\n"${blankedText}"`,
          correctAnswer: blankAnswer,
          originalData: randomSent
        };
      }
    }
  }, []);

  // 최초 또는 진행 단계 변화 시 신규 문제 충전 공급
  useEffect(() => {
    if (gameState.selectedCharacterId && !gameState.isExamMode && !currentQuestion) {
      setCurrentQuestion(generateRandomQuestion(gameState.level));
    }
  }, [gameState.selectedCharacterId, gameState.level, gameState.isExamMode, currentQuestion, generateRandomQuestion]);

  // 게임 시작 트리거
  const handleStartGame = (nickname: string, characterId: CharacterId) => {
    const updated: GameState = {
      ...gameState,
      nickname,
      selectedCharacterId: characterId
    };
    setGameState(updated);
    saveState(updated);
  };

  // 일반 계단 문제 정답 처리 완료 핸들러
  const handleStepAnswerResult = (isCorrect: boolean) => {
    let nextStair = gameState.stairStep;
    let nextWords = [...gameState.incorrectWords];
    let nextSentences = [...gameState.incorrectSentences];

    if (isCorrect) {
      // 맞췄을 때 계단 한 칸 등반 전진
      nextStair += 1;
    } else if (currentQuestion) {
      // 틀렸을 때 오답노트 보관함에 즉시 축적 보관
      const data = currentQuestion.originalData;
      if ('spanish' in data && !('blankedSpanish' in data)) {
        // 단어인 경우
        if (!nextWords.includes(data.id)) {
          nextWords.push(data.id);
        }
      } else {
        // 문장인 경우
        if (!nextSentences.includes(data.id)) {
          nextSentences.push(data.id);
        }
      }
    }

    // 10칸 계단 완료 시 바로 최종 '레벨업 시험' 모드로 진전 락 해제
    if (nextStair >= 10) {
      // 기분 좋은 시험 전주곡 효과음
      soundManager.playClick();
      
      // 즉석에서 난이도 높은 5개의 시험 문제를 마스터 리스트에서 다채로이 구성
      const examSet: Question[] = [];
      for (let i = 0; i < 5; i++) {
        examSet.push(generateRandomQuestion(gameState.level));
      }

      const updated: GameState = {
        ...gameState,
        stairStep: 10,
        isExamMode: true,
        examQuestionIndex: 0,
        examCorrectCount: 0,
        examQuestions: examSet,
        incorrectWords: nextWords,
        incorrectSentences: nextSentences
      };
      setGameState(updated);
      saveState(updated);
      setCurrentQuestion(null);
    } else {
      // 계속적인 등반 모드 유지
      const updated: GameState = {
        ...gameState,
        stairStep: nextStair,
        incorrectWords: nextWords,
        incorrectSentences: nextSentences
      };
      setGameState(updated);
      saveState(updated);
      setCurrentQuestion(null); // 신규 수집을 위해 초기화
    }
  };

  // 레벨업 팡파르 시험 문제 정답 유무 피드백
  const handleExamAnswerResult = (isCorrect: boolean) => {
    const currentExamIdx = gameState.examQuestionIndex;
    const currentCorrectCount = isCorrect ? gameState.examCorrectCount + 1 : gameState.examCorrectCount;
    let nextWords = [...gameState.incorrectWords];
    let nextSentences = [...gameState.incorrectSentences];

    // 오답 시 기입
    if (!isCorrect && gameState.examQuestions[currentExamIdx]) {
      const data = gameState.examQuestions[currentExamIdx].originalData;
      if ('spanish' in data && !('blankedSpanish' in data)) {
        if (!nextWords.includes(data.id)) nextWords.push(data.id);
      } else {
        if (!nextSentences.includes(data.id)) nextSentences.push(data.id);
      }
    }

    if (currentExamIdx >= 4) {
      // 최종 5번째 문제 끝! 성적 합산 판정 (4개 이상 시 합격 레벨업!)
      const isPassed = currentCorrectCount >= 4;

      if (isPassed) {
        soundManager.playLevelUp();
        const nextLevel = Math.min(30, gameState.level + 1);
        
        const updated: GameState = {
          ...gameState,
          level: nextLevel,
          stairStep: 0,
          isExamMode: false,
          examQuestionIndex: 0,
          examCorrectCount: 0,
          examQuestions: [],
          incorrectWords: nextWords,
          incorrectSentences: nextSentences
        };
        setGameState(updated);
        saveState(updated);
      } else {
        // 불합격 시 계단 0층으로 강제 후퇴 보충 학업 수행
        soundManager.playIncorrect();
        const updated: GameState = {
          ...gameState,
          stairStep: 0,
          isExamMode: false,
          examQuestionIndex: 0,
          examCorrectCount: 0,
          examQuestions: [],
          incorrectWords: nextWords,
          incorrectSentences: nextSentences
        };
        setGameState(updated);
        saveState(updated);
      }
    } else {
      // 다음 시험 문제 단계로 진입
      const updated: GameState = {
        ...gameState,
        examQuestionIndex: currentExamIdx + 1,
        examCorrectCount: currentCorrectCount,
        incorrectWords: nextWords,
        incorrectSentences: nextSentences
      };
      setGameState(updated);
      saveState(updated);
    }
  };

  // 모든 환경 저장정보 초기화 리셋
  const handleResetAllData = async () => {
    setGameState(initialGameState);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setCurrentQuestion(null);
    if (firebaseUser) {
      try {
        await signOut(auth);
      } catch (e) {
        console.error('Logout error during reset', e);
      }
    }
  };

  // 닉네임 수정 및 캐릭터 이주/로그아웃 탈출구
  const handleLogout = () => {
    soundManager.playClick();
    if (window.confirm('다른 캐릭터로 다시 가입하거나 처음으로 돌아갈까요? (진행 기록은 보존됩니다)')) {
      const updated = {
        ...gameState,
        nickname: '',
        selectedCharacterId: null
      };
      setGameState(updated);
      saveState(updated);
    }
  };

  // Google sign in / sign out triggered from ranking dashboard
  const handleGoogleLogin = async () => {
    soundManager.playClick();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google authorization failed:', error);
    }
  };

  const handleGoogleLogout = async () => {
    soundManager.playClick();
    if (window.confirm('구글 연동을 해제하고 로그아웃 하시겠습니까? (현재 기기의 진행기록은 로컬에 남습니다)')) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Google sign out failed:', error);
      }
    }
  };

  // 캐릭터 자산 매핑
  const character = originalCharacters.find(c => c.id === gameState.selectedCharacterId);

  // 미가입 유저는 가맹 시작화면으로 복전
  if (!gameState.selectedCharacterId || !gameState.nickname) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <CharacterSelection onStartGame={handleStartGame} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEF3C7] text-amber-950 font-sans py-6 px-4 md:px-8 relative overflow-hidden select-none">
      {/* Background School Corridor Deco */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-col overflow-hidden">
        <div className="w-full h-1/2 border-b-8 border-amber-900/10"></div>
        <div className="w-full h-1/2 grid grid-cols-12 gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r-2 border-amber-900/10 h-full"></div>
          ))}
        </div>
      </div>

      {/* Decorative Spanish Atmosphere Icons */}
      <div className="absolute bottom-8 left-8 text-8xl opacity-10 rotate-12 pointer-events-none">🎸</div>
      <div className="absolute top-24 left-8 text-8xl opacity-10 -rotate-12 pointer-events-none">⚽</div>
      <div className="absolute bottom-1/3 right-6 text-7xl opacity-10 rotate-45 pointer-events-none">🌮</div>
      <div className="absolute top-1/3 right-12 text-7xl opacity-10 -rotate-12 pointer-events-none">💃</div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        
        {/* 상단 통합 게임 헤더 */}
        <header className="h-auto md:h-20 bg-white border-b-4 border-amber-200 p-4 md:px-8 rounded-3xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-md">
          {/* 캐릭터 미학 및 기본 스코어 */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-[#FF4D4D] text-white px-5 py-2 rounded-full border-b-4 border-red-700 font-extrabold text-xl md:text-2xl shadow-md font-mono flex items-center justify-center">
              LV. {gameState.level}
            </div>

            <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200">
              <div className="w-10 h-10 bg-orange-400 rounded-full border-2 border-white flex items-center justify-center text-2xl shadow-inner relative overflow-hidden shrink-0">
                {character ? (
                  <div 
                    className="w-full h-full p-1"
                    dangerouslySetInnerHTML={{ __html: character.avatarSvg }}
                  />
                ) : '🎒'}
              </div>
              <div className="flex flex-col border-none">
                <div className="flex items-center gap-1.5 font-sans">
                  <span className="font-extrabold text-amber-900 text-sm md:text-base">{gameState.nickname}</span>
                  {firebaseUser && (
                    <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" title="클라우드 동기화 완료" />
                  )}
                  <button
                    onClick={handleLogout}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                    title="다른 캐릭터로 변경"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[10px] text-amber-700 font-bold block leading-none">
                  {firebaseUser ? (
                    <span className="text-emerald-700 font-extrabold flex items-center gap-0.5">☁️ 연동 활성 · LV.{gameState.level}</span>
                  ) : (
                    <span>게스트 모드 · LV.{gameState.level}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 서브 액션 조작기 단추 일체 */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center">
            {/* 랭킹 표 단추 */}
            <button
              onClick={() => { soundManager.playClick(); setShowRanking(true); }}
              className="bg-sky-400 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl border-b-4 border-sky-700 flex items-center gap-2 font-bold transition-all text-sm active:translate-y-[2px] active:border-b-2 shadow cursor-pointer flex-1 md:flex-none justify-center"
            >
              <span>🏆</span>
              <span>랭킹전</span>
            </button>

            {/* 오답 노트 단추 */}
            <button
              onClick={() => { soundManager.playClick(); setShowIncorrectNote(true); }}
              className="bg-[#FF6B8B] hover:bg-[#FF809B] text-white px-5 py-2.5 rounded-xl border-b-4 border-rose-700 flex items-center gap-2 font-bold transition-all text-sm active:translate-y-[2px] active:border-b-2 shadow cursor-pointer flex-1 md:flex-none justify-center relative"
            >
              <span>📓</span>
              <span>오답노트</span>
              {gameState.incorrectWords.length + gameState.incorrectSentences.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-amber-950 font-mono font-black text-[10px] px-2 py-0.5 rounded-full border border-white animate-pulse">
                  {gameState.incorrectWords.length + gameState.incorrectSentences.length}
                </span>
              )}
            </button>

            {/* 세팅 단추 */}
            <button
              onClick={() => { soundManager.playClick(); setShowSettings(true); }}
              className="bg-slate-400 hover:bg-slate-500 text-white p-2.5 rounded-xl border-b-4 border-slate-600 transition-all active:translate-y-[2px] active:border-b-2 shadow cursor-pointer"
              title="환경 설정"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 메인 투 칼럼식 배치 레이아웃 */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* 왼쪽: 계단 렌더링 파트 (8칼럼) */}
          <section className="lg:col-span-7 space-y-4">
            <StairsDisplay
              currentStep={gameState.stairStep}
              characterId={gameState.selectedCharacterId}
              isExamMode={gameState.isExamMode}
              level={gameState.level}
            />
          </section>

          {/* 오른쪽: 문제 풀이 연산 파트 (5칼럼) */}
          <section className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {gameState.isExamMode ? (
                // 1) 최종 보스 시험 멘토 모드
                <motion.div
                  key="exam-card-wrapper"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* 시험 진척 상태 헤더 */}
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 rounded-3xl shadow border-2 border-amber-400 text-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black font-sans tracking-wide uppercase flex items-center gap-1">
                        <Award className="w-4 h-4 text-yellow-300 animate-spin-slow" />
                        최종 패스포트 승급 승인 시험
                      </span>
                      <span className="text-xs font-black font-mono">
                        {gameState.examQuestionIndex + 1} / 5 문항
                      </span>
                    </div>
                    {/* 실시간 시험 게이지 */}
                    <div className="w-full bg-amber-950/25 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${(gameState.examQuestionIndex + 1) * 20}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-white/90">
                      <span>완벽정답 {gameState.examCorrectCount}개</span>
                      <span>통과 기준: 4개 해결</span>
                    </div>
                  </div>

                  {/* 시험 질문 카드 랜딩 */}
                  {gameState.examQuestions[gameState.examQuestionIndex] && (
                    <QuestionCard
                      key={`exam-${gameState.examQuestionIndex}`}
                      question={gameState.examQuestions[gameState.examQuestionIndex]}
                      onAnswerResult={handleExamAnswerResult}
                      isExam={true}
                    />
                  )}
                </motion.div>
              ) : (
                // 2) 일반 일반 계단 정밀 오르기 모드
                currentQuestion ? (
                  <motion.div
                    key="normal-question-wrapper"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                  >
                    <QuestionCard
                      question={currentQuestion}
                      onAnswerResult={handleStepAnswerResult}
                    />
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center p-8 bg-slate-800/40 rounded-3xl border border-slate-700/50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                  </div>
                )
              )}
            </AnimatePresence>
          </section>
        </main>
      </div>

      {/* 모달 팝업 레이어 일체 */}
      <AnimatePresence>
        {/* 오답노트 모달 */}
        {showIncorrectNote && (
          <IncorrectNote
            incorrectWordIds={gameState.incorrectWords}
            incorrectSentenceIds={gameState.incorrectSentences}
            onRemoveWord={handleRemoveIncorrectWord}
            onRemoveSentence={handleRemoveIncorrectSentence}
            onClose={() => setShowIncorrectNote(false)}
          />
        )}

        {/* 랭킹 보드 모달 */}
        {showRanking && (
          <RankingBoard
            currentUserNickname={gameState.nickname}
            currentUserCharacterId={gameState.selectedCharacterId!}
            currentUserLevel={gameState.level}
            firebaseUser={firebaseUser}
            onGoogleLogin={handleGoogleLogin}
            onGoogleLogout={handleGoogleLogout}
            onClose={() => setShowRanking(false)}
          />
        )}

        {/* 설정 창 모달 */}
        {showSettings && (
          <SettingsModal
            soundEnabled={gameState.settings?.soundEnabled ?? true}
            onSoundToggle={(enabled) => {
              const updated = {
                ...gameState,
                settings: { ...gameState.settings, soundEnabled: enabled }
              };
              setGameState(updated);
              saveState(updated);
            }}
            onResetData={handleResetAllData}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
