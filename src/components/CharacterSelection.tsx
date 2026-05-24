import React, { useState } from 'react';
import { motion } from 'motion/react';
import { originalCharacters } from '../data/spanishData';
import { CharacterId } from '../types';
import { soundManager } from './SoundManager';
import { Sparkles, Trophy, Check } from 'lucide-react';

interface CharacterSelectionProps {
  onStartGame: (nickname: string, characterId: CharacterId) => void;
}

export default function CharacterSelection({ onStartGame }: CharacterSelectionProps) {
  const [nickname, setNickname] = useState('');
  const [selectedId, setSelectedId] = useState<CharacterId | null>(null);
  const [errorText, setErrorText] = useState('');

  const handleSelect = (id: CharacterId) => {
    soundManager.playClick();
    setSelectedId(id);
    setErrorText('');
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();

    if (!nickname.trim()) {
      setErrorText('멋진 닉네임을 입력해 주세요!');
      return;
    }
    if (nickname.trim().length > 10) {
      setErrorText('닉네임은 10글자 이내로 입력해 주세요.');
      return;
    }
    if (!selectedId) {
      setErrorText('스페인어를 배울 캐릭터를 선택해 주세요!');
      return;
    }

    onStartGame(nickname.trim(), selectedId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-100/60 backdrop-blur-sm overflow-y-auto">
      {/* Background School Corridor Deco in popup as well */}
      <div className="absolute inset-0 opacity-5 pointer-events-none flex flex-col overflow-hidden">
        <div className="w-full h-1/2 border-b-8 border-amber-900/10"></div>
        <div className="w-full h-1/2 grid grid-cols-12 gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r-2 border-amber-900/10 h-full"></div>
          ))}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-amber-300 border-b-8 p-6 md:p-8 text-amber-950 z-10"
      >
        {/* Header Branding */}
        <div className="text-center mb-6">
          <motion.div 
            animate={{ rotate: [0, -3, 3, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="inline-block bg-orange-400 text-white font-black text-xs px-4 py-1.5 rounded-full border-b-2 border-orange-600 uppercase tracking-wider mb-2"
          >
            🇪🇸 ¡Hola, Escuela de Español!
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-black text-amber-950 tracking-tight">
            스페인어 계단 RPG
          </h1>
          <p className="text-sm text-amber-800/80 mt-1 max-w-md mx-auto font-medium">
            학교 건물 3층에서 30층까지, 스페인어 계단을 등반하고 진정한 아카데미 마스터가 되어보세요!
          </p>
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          {/* Nickname Field */}
          <div>
            <label className="block text-sm font-black text-amber-900 mb-2 flex items-center gap-1.5" htmlFor="nickname">
              <Sparkles className="w-4 h-4 text-orange-500" />
              모험가의 세례명닉네임
            </label>
            <input
              id="nickname"
              type="text"
              autoComplete="off"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (errorText) setErrorText('');
              }}
              placeholder="예: Juan, Miguel, Elena, Carmen"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-400 focus:outline-none font-extrabold bg-slate-50 italic text-slate-800 transition-all text-base placeholder-slate-400"
            />
          </div>

          {/* Character Selection Grid */}
          <div>
            <label className="block text-sm font-black text-amber-900 mb-3 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-orange-500" />
              배역 캐릭터 선택 (4종 오리지널 디자인)
            </label>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {originalCharacters.map((char) => {
                const isSelected = selectedId === char.id;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => handleSelect(char.id)}
                    className={`relative flex flex-col items-center p-3.5 rounded-2xl cursor-pointer transition-all border-2 text-center h-full border-b-4 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 text-orange-950 border-b-4 shadow-inner'
                        : 'border-slate-100 bg-slate-55 hover:border-amber-300 hover:bg-amber-50/50'
                    }`}
                  >
                    {/* SVG Avatar */}
                    <div 
                      className={`w-16 h-16 md:w-20 md:h-20 transition-transform ${
                        isSelected ? 'scale-110 rotate-1 animate-[bounce_1.5s_infinite]' : 'group-hover:scale-105'
                      }`}
                      dangerouslySetInnerHTML={{ __html: char.avatarSvg }}
                    />
                    
                    <span className="font-extrabold text-xs text-amber-955 mt-3 block leading-tight">
                      {char.name.split(' ')[1]}
                    </span>
                    <span className="text-[10px] text-orange-700 font-extrabold bg-orange-100/80 rounded-lg px-2 py-0.5 mt-1 block">
                      {char.name.split(' ')[0]}
                    </span>

                    {/* Selected Check Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white p-1 rounded-full shadow border border-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Character Description Panel */}
          {selectedId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 text-xs md:text-sm text-amber-800 leading-relaxed flex items-start gap-3"
            >
              <span className="text-xl">💡</span>
              <div>
                <strong className="text-amber-950 font-black block mb-1">
                  {originalCharacters.find(c => c.id === selectedId)?.name}
                </strong>
                {originalCharacters.find(c => c.id === selectedId)?.description}
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {errorText && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-rose-600 text-xs md:text-sm font-black text-center bg-rose-50 border-2 border-rose-100 rounded-xl py-2"
            >
              ⚠️ {errorText}
            </motion.p>
          )}

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-2xl shadow-lg border-b-4 border-orange-700 hover:shadow-orange-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-[2px] active:border-b-2"
          >
            배움의 학교 계단 오르기 시작! 🚀
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
