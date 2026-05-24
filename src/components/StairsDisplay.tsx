import { motion } from 'motion/react';
import { originalCharacters } from '../data/spanishData';
import { CharacterId } from '../types';
import { Award, GraduationCap, School } from 'lucide-react';

interface StairsDisplayProps {
  currentStep: number; // 0 ~ 9
  characterId: CharacterId;
  isExamMode: boolean;
  level: number;
}

export default function StairsDisplay({ currentStep, characterId, isExamMode, level }: StairsDisplayProps) {
  const character = originalCharacters.find((c) => c.id === characterId) || originalCharacters[0];

  // 10칸의 계단 배열 (좌우로 번갈아가며 지그재그 혹은 위로 쭉 올라가는 방식)
  // 여기서는 지그재그형 등반 방식으로 3D 계단 느낌을 세련된 반응형 디자인으로 연출
  const stairsCount = 10;

  return (
    <div className="relative w-full aspect-[4/3] min-h-[350px] bg-white border-4 border-amber-300 border-b-8 rounded-3xl p-6 shadow-xl overflow-hidden flex flex-col justify-between">
      {/* 귀여운 스카이라인 & 학교 내부 데코 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-col justify-between p-8">
        <div className="flex justify-between items-start">
          <School className="w-16 h-16 text-amber-900" />
          <GraduationCap className="w-16 h-16 text-amber-900" strokeWidth={1} />
        </div>
        <div className="flex justify-around items-end text-3xl">
          <span>📚</span>
          <span>✏️</span>
          <span>⚽</span>
        </div>
      </div>

      {/* 실시간 층수 안내판 */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="bg-amber-100 text-amber-900 font-extrabold text-xs px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-sm border border-amber-200">
          <GraduationCap className="w-4 h-4 text-orange-500" />
          <span>현재 {level}층 복도_Aventurero</span>
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-orange-600 block leading-tight">계단 진행률: {currentStep}/10</span>
          <span className="text-[10px] text-amber-800 font-bold block">10칸 도달 시 즉시 레벨업 시험</span>
        </div>
      </div>

      {/* 계단 메인 영역 */}
      <div className="relative flex-1 flex items-end justify-center py-4">
        {/* 지그재그 계단 배치 */}
        <div className="relative w-full max-w-[500px] h-[220px] flex items-end">
          {Array.from({ length: stairsCount }).map((_, idx) => {
            const stepIndex = idx; // 0 (제일 아래) ~ 9 (제일 위)
            const isActive = stepIndex === currentStep && !isExamMode;
            
            // X% 좌표 기하학적 배열 (지그재그식)
            const leftPct = 6 + (stepIndex * 8.4);
            // Y축 정비례 높이
            const bottomPct = stepIndex * 8.6;

            return (
              <div
                key={stepIndex}
                className="absolute transition-all duration-300"
                style={{
                  left: `${leftPct}%`,
                  bottom: `${bottomPct}%`,
                  zIndex: stepIndex + 1,
                }}
              >
                {/* 계단 부재 블록 */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  className={`w-12 h-8 rounded shadow-md border-2 border-b-4 transition-all flex items-center justify-center font-bold text-xs ${
                    isExamMode
                      ? 'bg-amber-50 border-amber-200 text-amber-400 opacity-60'
                      : stepIndex < currentStep
                      ? 'bg-orange-400 border-orange-600 text-white opacity-60 shadow-inner'
                      : isActive
                      ? 'bg-orange-100 border-orange-500 text-orange-900 scale-105 shadow-md relative'
                      : 'bg-white border-amber-400 text-amber-900'
                  }`}
                >
                  {stepIndex + 1}

                  {/* 계단 밑부분 그림자 보정 */}
                  <div className="absolute bottom-[-6px] left-[10%] right-[10%] h-1 bg-amber-900/10 rounded-full blur-[1px]" />
                </motion.div>

                {/* 계단 위에 위치하는 액티브 캐릭터 렌더링 & 풍선 닉네임 */}
                {isActive && (
                  <div className="absolute -top-[52px] left-1/2 -translate-x-1/2 flex flex-col items-center select-none pointer-events-none">
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                      className="w-9 h-9"
                    >
                      <div 
                        className="w-full h-full drop-shadow-md" 
                        dangerouslySetInnerHTML={{ __html: character.avatarSvg }}
                      />
                    </motion.div>
                    <div className="bg-white px-1.5 py-0.5 rounded text-[8px] font-black border border-orange-200 shadow-sm whitespace-nowrap text-orange-950 uppercase">
                      {character.name}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* 10번째 계단 위에 놓여진 거대한 시험 관문 (보스성, 시험 모드 아이콘) */}
          <div
            className="absolute transition-all duration-300"
            style={{
              left: '90%',
              bottom: '87%',
              zIndex: 12,
            }}
          >
            <motion.div
              animate={{
                scale: isExamMode ? 1.15 : 1,
                rotate: isExamMode ? [-2, 2, -2] : 0,
              }}
              transition={isExamMode ? { repeat: Infinity, duration: 1.5 } : {}}
              className={`w-14 h-11 rounded-t-lg border-x-4 border-t-4 shadow-md flex flex-col items-center justify-center transition-all ${
                isExamMode
                  ? 'bg-yellow-400 border-amber-600 text-amber-900 animate-pulse'
                  : 'bg-amber-100 border-amber-300 text-amber-700'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider">EXAM</span>
            </motion.div>

            {/* 시험 모드일 때 캐릭터가 게이트 문 앞에 서있음 */}
            {isExamMode && (
              <div className="absolute -top-[44px] left-[-15px] flex flex-col items-center">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-9 h-9"
                >
                  <div 
                    className="w-full h-full drop-shadow-lg" 
                    dangerouslySetInnerHTML={{ __html: character.avatarSvg }}
                  />
                </motion.div>
                <div className="bg-white px-1.5 py-0.5 rounded text-[8px] font-black border border-amber-300 shadow-xs whitespace-nowrap text-amber-950">
                  {character.name}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 멋진 레벨 진행 막대 (Progress Path Bar) */}
      <div className="relative mt-2 p-1 bg-amber-50 rounded-full border-2 border-amber-200 overflow-hidden h-7">
        <div 
          className="h-full bg-gradient-to-r from-orange-400 to-amber-450 rounded-full flex items-center justify-center text-[10px] font-black text-white uppercase tracking-widest transition-all duration-500"
          style={{ width: `${Math.max(10, currentStep * 10)}%` }}
        >
          {isExamMode ? 'EXAM PASS PROGRESS' : `STAIR RUN: ${currentStep * 10}%`}
        </div>
      </div>

      {/* 안내 문구 한 줄 */}
      <div className="relative z-10 text-center text-xs font-bold text-amber-800 mt-2 bg-amber-50/50 py-1 rounded-xl">
        {isExamMode ? (
          <span className="text-orange-600 font-extrabold block animate-pulse">
            🔥 {level}층 최종 승급 시험 진행 중! 5문제 중 4문제 이상 해결 시 레벨업!
          </span>
        ) : (
          <span>현재 계단 <strong>{currentStep + 1}단계</strong> 밟고 있습니다. 올바른 뜻을 맞춰 꼭대기까지 올라가세요!</span>
        )}
      </div>
    </div>
  );
}
