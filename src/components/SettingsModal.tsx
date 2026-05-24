import { motion } from 'motion/react';
import { soundManager } from './SoundManager';
import { Settings, Volume2, VolumeX, RotateCcw, Info, X } from 'lucide-react';

interface SettingsModalProps {
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
  onResetData: () => void;
  onClose: () => void;
}

export default function SettingsModal({
  soundEnabled,
  onSoundToggle,
  onResetData,
  onClose
}: SettingsModalProps) {

  const handleSoundChange = () => {
    const nextState = !soundEnabled;
    soundManager.setEnabled(nextState);
    onSoundToggle(nextState);
    if (nextState) {
      soundManager.playClick();
    }
  };

  const handleReset = () => {
    soundManager.playClick();
    if (window.confirm('🚨 정말로 지금까지의 모든 학습 레벨과 오답노트 데이터를 초기화하고 처음부터 다시 시작할까요? 이 작업은 되돌릴 수 없습니다.')) {
      onResetData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-300 border-b-8 flex flex-col"
      >
        {/* 헤더 */}
        <div className="bg-[#4F46E5] p-5 text-white flex justify-between items-center shrink-0 border-b-4 border-indigo-700">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-yellow-300 stroke-[2.5] animate-[spin_10s_linear_infinite]" />
            <h2 className="text-lg font-black font-sans">게임 환경 설정</h2>
          </div>
          <button
            onClick={() => { soundManager.playClick(); onClose(); }}
            className="text-white hover:text-indigo-100 p-1 bg-indigo-600/50 hover:bg-indigo-700 rounded-lg transition-transform hover:rotate-90 cursor-pointer border border-indigo-700/20"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 설정 내용 */}
        <div className="p-6 space-y-5 bg-[#FFFDF9]">
          {/* 소리 설정 토글 */}
          <div className="flex items-center justify-between bg-amber-50/30 p-4 rounded-2xl border-2 border-amber-100/50 shadow-xs">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border-2 border-b-4 ${soundEnabled ? 'bg-amber-100 border-amber-300 text-orange-600' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <span className="font-extrabold text-sm block text-amber-955">배경 효과음</span>
                <span className="text-[10px] text-amber-800/60 block font-bold leading-tight">정치/오답 타종 효과를 연출합니다</span>
              </div>
            </div>
            
            <button
              onClick={handleSoundChange}
              className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-amber-900/10 transition-colors duration-200 ease-in-out focus:outline-none ${
                soundEnabled ? 'bg-orange-400' : 'bg-slate-300'
              }`}
            >
              <span className="sr-only">소리 상태 토글</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-[1px] ${
                  soundEnabled ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 시스템 초기화 */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-rose-500 block uppercase tracking-wider">⚠️ DANGER ZONE</span>
            
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-50 hover:bg-rose-100/80 border-2 border-b-4 border-rose-350 text-rose-600 rounded-2xl font-black text-xs transition-all cursor-pointer active:translate-y-[2px] active:border-b-2"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>전체 학습 데이터 완전 초기화</span>
            </button>
            <p className="text-[9px] text-amber-800/60 font-medium text-center leading-relaxed">
              * 캐릭터, 닉네임, 아카데미 진척 층수, 오답 사서함이 기기(localStorage)에서 물리적으로 전격 폭파 및 초기 영구 소멸됩니다.
            </p>
          </div>

          {/* 단축키 및 편의기능 설명 가이드 */}
          <div className="bg-amber-50/45 border-2 border-amber-150 rounded-2xl p-4 text-xs text-amber-800 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-950 font-black block mb-1">모험 안내 가이드</strong>
              스페인어 특수부호 철자(á, é, í, ñ 등) 입력에 어려움을 겪는 모험가를 위해 주관식 패널에 '특수 기호 가상 키패드'가 장착되어 있습니다! 설령 악센트를 간과하더라도 한국어 의미가 정확하다면 정통 정답으로 파격 전향 채점 적용됩니다!
            </div>
          </div>
        </div>

        {/* 푸터 버전 */}
        <div className="bg-amber-50/30 py-3.5 text-center text-[10px] text-amber-805 font-mono font-black shrink-0 border-t-2 border-amber-100">
          Escuela de Español v1.0.0 — Licensed in Spain Academy
        </div>
      </motion.div>
    </div>
  );
}
