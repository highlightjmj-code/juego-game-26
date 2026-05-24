import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WordItem, SentenceItem, Question } from '../types';
import { getFullWords, getFullSentences } from '../data/spanishData';
import { soundManager } from './SoundManager';
import QuestionCard from './QuestionCard';
import { GraduationCap, Trash2, BookOpen, AlertCircle, Sparkles, X } from 'lucide-react';

interface IncorrectNoteProps {
  incorrectWordIds: string[];
  incorrectSentenceIds: string[];
  onRemoveWord: (id: string) => void;
  onRemoveSentence: (id: string) => void;
  onClose: () => void;
}

export default function IncorrectNote({
  incorrectWordIds,
  incorrectSentenceIds,
  onRemoveWord,
  onRemoveSentence,
  onClose
}: IncorrectNoteProps) {
  const [activeTab, setActiveTab] = useState<'words' | 'sentences'>('words');
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQuestion, setReviewQuestion] = useState<Question | null>(null);

  const allWords = getFullWords();
  const allSentences = getFullSentences();

  // 틀린 단어 목록 매핑
  const wrongWords = allWords.filter(w => incorrectWordIds.includes(w.id));
  // 틀린 문장 목록 매핑
  const wrongSentences = allSentences.filter(s => incorrectSentenceIds.includes(s.id));

  // 복습 퀴즈 생성 장치
  const startReview = (type: 'word' | 'sentence', item: WordItem | SentenceItem) => {
    soundManager.playClick();
    
    // 4지선다용 임의 옵션 정제
    let options: string[] = [];
    if (type === 'word') {
      const word = item as WordItem;
      const others = allWords.filter(w => w.id !== word.id).sort(() => 0.5 - Math.random()).slice(0, 3);
      options = [word.korean, ...others.map(o => o.korean)].sort(() => 0.5 - Math.random());
      
      setReviewQuestion({
        type: 'select',
        questionText: `스페인어 단어 "${word.spanish}"의 올바른 한국어 뜻은 무엇일까요?`,
        options,
        correctAnswer: word.korean,
        originalData: word
      });
    } else {
      const sent = item as SentenceItem;
      if (sent.blankedSpanish && sent.blankAnswer) {
        // 빈칸 채우기
        const others = allSentences.filter(s => s.blankAnswer && s.blankAnswer !== sent.blankAnswer)
          .map(s => s.blankAnswer!)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        options = [sent.blankAnswer, ...others].sort(() => 0.5 - Math.random());

        setReviewQuestion({
          type: 'blank',
          questionText: `아래 문장의 빈칸을 채워주세요:\n"${sent.blankedSpanish}"`,
          options,
          correctAnswer: sent.blankAnswer,
          originalData: sent
        });
      } else {
        // 객관식 선택형
        const others = allSentences.filter(s => s.id !== sent.id).sort(() => 0.5 - Math.random()).slice(0, 3);
        options = [sent.korean, ...others.map(o => o.korean)].sort(() => 0.5 - Math.random());

        setReviewQuestion({
          type: 'select',
          questionText: `스페인어 문장 "${sent.spanish}"의 올바른 해석을 고르세요.`,
          options,
          correctAnswer: sent.korean,
          originalData: sent
        });
      }
    }

    setReviewMode(true);
  };

  const handleReviewAnswer = (isCorrect: boolean) => {
    if (isCorrect && reviewQuestion) {
      // 복습 문제 맞혔으므로 리스트에서 즉각 졸업 제거 요청
      const data = reviewQuestion.originalData;
      if ('spanish' in data && !('blankedSpanish' in data)) {
        // 단어인 경우
        onRemoveWord(data.id);
      } else {
        // 문장인 경우
        onRemoveSentence(data.id);
      }
    }
    setReviewMode(false);
    setReviewQuestion(null);
  };

  const clearItem = (type: 'word' | 'sentence', id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    if (type === 'word') {
      onRemoveWord(id);
    } else {
      onRemoveSentence(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-300 border-b-8 flex flex-col max-h-[85vh]"
      >
        {/* 모달 상단 헤더 */}
        <div className="bg-[#FF6B8B] p-5 text-white flex justify-between items-center shrink-0 border-b-4 border-rose-700">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-yellow-300 stroke-[2.5]" />
            <h2 className="text-xl font-black font-sans">비밀의 오답노트</h2>
            <span className="bg-yellow-405 bg-yellow-400 text-amber-950 font-black text-xs px-2.5 py-0.5 rounded-full font-mono">
              {incorrectWordIds.length + incorrectSentenceIds.length}개 저장
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-rose-100 p-1 hover:bg-rose-600/50 rounded-lg transition-transform hover:rotate-90 cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        {!reviewMode && (
          <div className="flex border-b border-amber-100 bg-amber-50/20 shrink-0">
            <button
              onClick={() => { soundManager.playClick(); setActiveTab('words'); }}
              className={`flex-1 py-3.5 text-center text-xs font-black uppercase tracking-wider relative transition-colors cursor-pointer ${
                activeTab === 'words' ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              단어 서고 ({wrongWords.length})
              {activeTab === 'words' && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 rounded-t" />
              )}
            </button>
            <button
              onClick={() => { soundManager.playClick(); setActiveTab('sentences'); }}
              className={`flex-1 py-3.5 text-center text-xs font-black uppercase tracking-wider relative transition-colors cursor-pointer ${
                activeTab === 'sentences' ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              문장 서고 ({wrongSentences.length})
              {activeTab === 'sentences' && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 rounded-t" />
              )}
            </button>
          </div>
        )}

        {/* 바디 내용 패널 */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
          <AnimatePresence mode="wait">
            {reviewMode && reviewQuestion ? (
              // 복습 진행 카드
              <motion.div
                key="review-engine"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-amber-50 border-2 border-amber-100 text-amber-900 rounded-2xl p-4 text-xs font-extrabold leading-relaxed flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                  <span>복습 시험을 맞춰 정답을 이끌어내면 오답 사서함에서 탈출 분해 졸업합니다!</span>
                </div>
                <QuestionCard question={reviewQuestion} onAnswerResult={handleReviewAnswer} />
                <button
                  onClick={() => setReviewMode(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-pointer active:translate-y-[1px]"
                >
                  모험으로 돌아가기
                </button>
              </motion.div>
            ) : (
              // 목록 디스플레이
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-3"
              >
                {activeTab === 'words' ? (
                  wrongWords.length === 0 ? (
                    <div className="text-center py-12 text-slate-450">
                      <GraduationCap className="w-16 h-16 stroke-[1.2] mx-auto mb-3 text-amber-400" />
                      <p className="font-extrabold text-sm text-slate-700">틀린 단어가 한 개도 없습니다!</p>
                      <p className="text-xs text-slate-400 mt-1">완벽주의 스페인어 실력자이시군요!</p>
                    </div>
                  ) : (
                    wrongWords.map(word => (
                      <div
                        key={word.id}
                        onClick={() => startReview('word', word)}
                        className="bg-white rounded-2xl p-4 border-2 border-b-4 border-slate-100 hover:border-rose-400 hover:bg-rose-50/25 transition-all flex items-center justify-between group cursor-pointer shadow-sm"
                      >
                        <div className="space-y-1">
                          <span className="font-extrabold text-base text-amber-950 font-mono tracking-tight block">
                            {word.spanish}
                          </span>
                          <span className="text-[10px] bg-orange-100/75 rounded-lg px-2 py-0.5 mt-1 inline-block text-orange-850 font-black">
                            {word.category}
                          </span>
                          <p className="text-xs font-extrabold text-slate-500 mt-1">뜻: {word.korean}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="opacity-0 group-hover:opacity-100 bg-rose-50 text-rose-600 text-[10px] font-black uppercase px-2 py-1 rounded-xl border border-rose-200 transition-opacity">
                            복습하기 🎯
                          </span>
                          <button
                            onClick={(e) => clearItem('word', word.id, e)}
                            className="p-1.5 text-slate-350 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="목록에서 지우기"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  wrongSentences.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <GraduationCap className="w-16 h-16 stroke-[1.2] mx-auto mb-3 text-amber-400" />
                      <p className="font-extrabold text-sm text-slate-755 text-slate-700">틀린 문장이 존재하지 않습니다!</p>
                      <p className="text-xs text-slate-400 mt-1">이대로 레벨 30 정복까지 달려보세요!</p>
                    </div>
                  ) : (
                    wrongSentences.map(sent => (
                      <div
                        key={sent.id}
                        onClick={() => startReview('sentence', sent)}
                        className="bg-white rounded-2xl p-4 border-2 border-b-4 border-slate-100 hover:border-rose-400 hover:bg-rose-50/25 transition-all flex items-center justify-between group cursor-pointer shadow-sm"
                      >
                        <div className="space-y-1 max-w-[80%]">
                          <span className="font-extrabold text-sm text-amber-950 font-mono tracking-tight block leading-relaxed">
                            {sent.spanish}
                          </span>
                          <span className="text-[10px] bg-rose-100/75 text-rose-800 rounded-lg px-2 py-0.5 mr-2 inline-block font-mono font-black">
                            {sent.category}
                          </span>
                          <p className="text-xs text-slate-500 mt-1 font-extrabold">{sent.korean}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="opacity-0 group-hover:opacity-100 bg-rose-50 text-rose-600 text-[10px] font-black uppercase px-2 py-1 rounded-xl border border-rose-200 transition-opacity">
                            복습하기 🎯
                          </span>
                          <button
                            onClick={(e) => clearItem('sentence', sent.id, e)}
                            className="p-1.5 text-slate-350 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="목록에서 지우기"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 안내 푸터 정보 */}
        {!reviewMode && (
          <div className="bg-amber-50/40 border-t-2 border-slate-150 p-4 shrink-0 flex items-center gap-2 text-amber-900 text-xs text-center justify-center font-extrabold">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span>오답 카드를 클릭해 복습 정답을 제출하면 리스트에서 해금 소거됩니다.</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
