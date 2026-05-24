import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Question } from '../types';
import { soundManager } from './SoundManager';
import { CheckCircle, XCircle, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';

interface QuestionCardProps {
  key?: string;
  question: Question;
  onAnswerResult: (isCorrect: boolean) => void;
  isExam?: boolean;
}

export default function QuestionCard({ question, onAnswerResult, isExam = false }: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // 문제 바뀔 때 상태 리셋
  useEffect(() => {
    setSelectedOption(null);
    setTypedAnswer('');
    setIsSubmitted(false);
    setIsCorrect(false);
  }, [question]);

  const checkAnswerString = (userAns: string, correctAns: string): boolean => {
    const clean = (s: string) => s.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // 악센트 무시하고 문자 비교하는 안전 장치 탑재
    
    const rawCleanUser = userAns.trim().toLowerCase();
    const rawCleanCorrect = correctAns.trim().toLowerCase();

    // 1. 악센트 정확한 매치 우선
    if (rawCleanUser === rawCleanCorrect) return true;
    // 2. 입력장치 한계 방지를 위해 악센트 기호를 가볍게 무시하고 철자 매칭
    return clean(userAns) === clean(correctAns);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitted) return;

    let userAns = '';
    if (question.type === 'select') {
      if (!selectedOption) return;
      userAns = selectedOption;
    } else {
      if (!typedAnswer.trim()) return;
      userAns = typedAnswer;
    }

    const correct = checkAnswerString(userAns, question.correctAnswer);
    setIsCorrect(correct);
    setIsSubmitted(true);

    if (correct) {
      soundManager.playCorrect();
    } else {
      soundManager.playIncorrect();
    }
  };

  const handleNext = () => {
    soundManager.playClick();
    onAnswerResult(isCorrect);
  };

  // 스페인어 특수부호 입력 버튼 패널 작동 장치
  const handleInsertChar = (char: string) => {
    soundManager.playClick();
    setTypedAnswer(prev => prev + char);
  };

  const specialChars = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'];

  let headerBgClass = "bg-orange-500 text-white";
  if (isSubmitted) {
    if (isCorrect) {
      headerBgClass = "bg-emerald-500 text-white";
    } else {
      headerBgClass = "bg-rose-500 text-white";
    }
  } else if (isExam) {
    headerBgClass = "bg-[#FFBB00] text-amber-950";
  }

  return (
    <div className="w-full bg-white rounded-3xl border-b-8 border-gray-200 shadow-2xl overflow-hidden text-slate-800">
      {/* Immersive Theme Word Header */}
      <div className={`${headerBgClass} p-6 md:p-8 text-center transition-all duration-300 relative`}>
        <p className="text-xs font-black uppercase tracking-widest opacity-80 font-mono">
          {isExam ? '🇵🇹 SPANISH EXAM LEVEL' : `VOCABULARIO #${question.originalData.id}`}
        </p>
        <h2 className="text-4xl md:text-5xl font-black mt-2 font-sans tracking-tight">
          {question.originalData.spanish}
        </h2>
      </div>

      <div className="p-6 md:p-8">
        {/* 질문 카테고리 태그 */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-black px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200/50 uppercase tracking-wider">
            {isExam ? '검증 시험' : `카테고리: ${question.originalData.category}`}
          </span>
          <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
            {question.type === 'select' ? '4지선다형' : question.type === 'blank' ? '빈칸 채우기' : '주관식 입력'}
          </span>
        </div>

        {/* 질문 본문 */}
        <div className="mb-6">
          <h3 className="text-base md:text-lg font-bold text-slate-600 leading-snug">
            {question.questionText}
          </h3>
        </div>

        {/* 주관식 입력형 / 빈칸채우기 UI */}
        {(question.type === 'input' || question.type === 'blank') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative flex gap-2">
              <input
                id="answer_input"
                type="text"
                autoComplete="off"
                disabled={isSubmitted}
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="정확한 스페인어 단어를 입력하세요..."
                className={`flex-1 px-4 py-3 border-2 rounded-xl text-base font-extrabold focus:outline-none transition-all ${
                  isSubmitted
                    ? isCorrect
                      ? 'border-emerald-550 bg-emerald-50/20 text-emerald-800 font-mono'
                      : 'border-rose-550 bg-rose-50/20 text-rose-800 font-mono'
                    : 'border-slate-200 focus:border-amber-400 bg-slate-50 italic text-slate-700'
                }`}
              />
              
              {!isSubmitted && (
                <button
                  type="submit"
                  disabled={!typedAnswer.trim()}
                  className={`px-5 py-3 rounded-xl font-bold text-sm shadow transition-all flex items-center gap-1.5 cursor-pointer border-b-4 ${
                    typedAnswer.trim()
                      ? 'bg-amber-400 hover:bg-amber-500 border-amber-600 text-amber-950 active:translate-y-[2px] active:border-b-2'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-350'
                  }`}
                >
                  확인
                </button>
              )}
            </div>

            {/* 스페인어 특수문자 가상 패널 */}
            {!isSubmitted && (
              <div className="bg-amber-50/40 rounded-2xl p-3 border border-amber-200/40">
                <span className="text-[10px] font-extrabold text-amber-805 block mb-2 uppercase tracking-wide">💡 특수 문자 원터치 입력기:</span>
                <div className="flex flex-wrap gap-1.5">
                  {specialChars.map(char => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => handleInsertChar(char)}
                      className="px-3 py-1.5 text-xs font-black bg-white text-slate-800 rounded-xl border-b-2 border border-slate-200 shadow-sm hover:border-amber-400 hover:bg-amber-50 hover:-translate-y-[1px] active:translate-y-0 transition-all cursor-pointer font-mono"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}

        {/* 4지 선다 선택형 UI */}
        {question.type === 'select' && question.options && (
          <div className="grid grid-cols-1 gap-3">
            {question.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isOptionCorrect = option === question.correctAnswer;
              
              let optionStyle = 'border-slate-200 hover:border-sky-400 hover:bg-sky-50 shadow-sm';
              let circleStyle = 'border-slate-200 bg-white';
              if (isSubmitted) {
                if (isOptionCorrect) {
                  optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-md border-b-4';
                  circleStyle = 'border-emerald-500 bg-emerald-500 text-white';
                } else if (isSelected && !isCorrect) {
                  optionStyle = 'border-rose-500 bg-rose-50 text-rose-950 shadow-inner opacity-80 border-b-4';
                  circleStyle = 'border-rose-500 bg-rose-500 text-white';
                } else {
                  optionStyle = 'border-slate-100 opacity-40 bg-slate-50';
                  circleStyle = 'border-slate-100';
                }
              } else if (isSelected) {
                optionStyle = 'border-sky-400 bg-sky-50 text-sky-900 ring-2 ring-sky-300/20 border-b-4';
                circleStyle = 'border-sky-400 bg-sky-450';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => setSelectedOption(option)}
                  className={`w-full py-4 px-6 bg-white border-2 rounded-2xl text-left flex justify-between items-center group transition-all text-slate-700 cursor-pointer ${optionStyle} ${
                    !isSubmitted && 'active:scale-[0.99] active:translate-y-[1px]'
                  }`}
                >
                  <span className="text-base font-bold text-slate-700 group-hover:text-sky-600 font-sans">
                    <span className="font-mono text-xs opacity-60 mr-2">[{idx + 1}]</span>
                    {option}
                  </span>
                  <span className={`w-6 h-6 rounded-full border-2 transition-transform duration-200 flex items-center justify-center shrink-0 ${circleStyle}`}>
                    {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-white block" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 서브미션 미완료 시 하단 수동 확인 버튼 (선택형 전용) */}
        {!isSubmitted && question.type === 'select' && (
          <div className="mt-6">
            <button
              type="button"
              disabled={!selectedOption}
              onClick={() => handleSubmit()}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all border-b-4 ${
                selectedOption
                  ? 'bg-amber-400 text-amber-950 border-amber-600 hover:bg-amber-500 shadow-md active:translate-y-[2px] active:border-b-2'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border-b-0'
              }`}
            >
              정답 제출하기
            </button>
          </div>
        )}

        {/* 결과 피드백 & 다음 기회 안내 */}
        <AnimatePresence>
          {isSubmitted && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 15 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-6 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border transition-colors ${
                isCorrect 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-900 border-b-4' 
                  : 'bg-rose-50 border-rose-100 text-rose-900 border-b-4'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl shrink-0">
                  {isCorrect ? '🎉' : '💡'}
                </span>
                <div>
                  <h4 className="font-black text-sm">
                    {isCorrect ? 'Correcto! 계단을 한 칸 올라갑니다!' : '인정 정인! 올바른 답안'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {!isCorrect && (
                      <>
                        정답은 <strong className="text-rose-700 font-mono font-black">"{question.correctAnswer}"</strong> 입니다.{' '}
                      </>
                    )}
                    번역: <strong className="text-slate-850 font-extrabold">"{question.originalData.korean}"</strong>
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md border cursor-pointer whitespace-nowrap justify-center border-b-4 ${
                  isCorrect
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-700'
                    : 'bg-rose-500 hover:bg-rose-600 text-white border-rose-700'
                }`}
              >
                <span>{isExam ? '다음 시험 문제' : '다음 계단 오르기'}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
