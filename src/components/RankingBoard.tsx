import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { originalCharacters } from '../data/spanishData';
import { CharacterId, ScoreRecord } from '../types';
import { soundManager } from './SoundManager';
import { Trophy, Medal, Star, X, Loader2 } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';

interface RankingBoardProps {
  currentUserNickname: string;
  currentUserCharacterId: CharacterId;
  currentUserLevel: number;
  firebaseUser: User | null;
  onGoogleLogin: () => void;
  onGoogleLogout: () => void;
  onClose: () => void;
}

export default function RankingBoard({
  currentUserNickname,
  currentUserCharacterId,
  currentUserLevel,
  firebaseUser,
  onGoogleLogin,
  onGoogleLogout,
  onClose
}: RankingBoardProps) {

  const [realRankers, setRealRankers] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Firestore 실시간 랭킹 가동
  useEffect(() => {
    if (!firebaseUser) {
      setRealRankers([]);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'scores'), orderBy('level', 'desc'), limit(30));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ScoreRecord[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.userId) {
          list.push({
            userId: doc.id,
            nickname: data.nickname || '익명 러너',
            characterId: (data.characterId || 'viajero') as CharacterId,
            level: Number(data.level) || 1,
            date: '실시간',
            isCurrentUser: doc.id === firebaseUser.uid
          });
        }
      });
      setRealRankers(list);
      setLoading(false);
    }, (error) => {
      console.error('Leaderboard load blocked:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  // 가상의 경쟁 상대 목록 준비
  const mockRankers: ScoreRecord[] = [
    { userId: 'bot1', nickname: 'Kevin 🇪🇸', characterId: 'futbolista', level: 25, date: '스페인' },
    { userId: 'bot2', nickname: 'Sofía 💃', characterId: 'flamenco', level: 20, date: '안달루시아' },
    { userId: 'bot3', nickname: 'Mateo ✈️', characterId: 'viajero', level: 15, date: '마드리드' },
    { userId: 'bot4', nickname: 'Carmen ☕', characterId: 'churrero', level: 10, date: '세비야' },
    { userId: 'bot5', nickname: 'Lucía 🎶', characterId: 'flamenco', level: 5, date: '바르셀로나' },
    { userId: 'bot6', nickname: 'Hugo 🎒', characterId: 'viajero', level: 3, date: '톨레도' },
    { userId: 'bot7', nickname: 'Ronaldo ⚽', characterId: 'futbolista', level: 1, date: '그라나다' }
  ];

  // 현재 유저 레코드 구성
  const userRecord: ScoreRecord = {
    userId: firebaseUser ? firebaseUser.uid : 'current_user',
    nickname: currentUserNickname || '나',
    characterId: currentUserCharacterId,
    level: currentUserLevel,
    date: '오늘',
    isCurrentUser: true
  };

  // 실시간 랭킹과 봇의 정렬 결합
  const userInReal = firebaseUser && realRankers.some(real => real.userId === firebaseUser.uid);
  const baseMerged = firebaseUser 
    ? (userInReal ? realRankers : [...realRankers, userRecord])
    : [...mockRankers, userRecord];

  const entireRanks = firebaseUser
    ? [
        ...baseMerged,
        ...mockRankers.filter(bot => !baseMerged.some(item => item.nickname.split(' ')[0] === bot.nickname.split(' ')[0]))
      ].sort((a, b) => b.level - a.level)
    : baseMerged.sort((a, b) => b.level - a.level);

  // 순위 및 트로피/메달 아이콘 반환 함수
  const getRankBadge = (idx: number) => {
    const rank = idx + 1;
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-500 fill-amber-300 animate-bounce" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400 fill-slate-200" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700 fill-amber-600" />;
    return <span className="font-mono text-xs font-black text-slate-400 w-5 text-center">{rank}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-300 border-b-8 flex flex-col max-h-[85vh]"
      >
        {/* 헤더 */}
        <div className="bg-[#FFBB00] p-5 text-amber-950 flex justify-between items-center shrink-0 border-b-4 border-amber-600">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 stroke-[2.5] text-amber-950 fill-amber-300" />
            <h2 className="text-xl font-black font-sans">실시간 명예의 전당</h2>
          </div>
          <button
            onClick={() => { soundManager.playClick(); onClose(); }}
            className="text-amber-950/80 hover:text-amber-950 p-1 bg-amber-250/50 hover:bg-amber-100 rounded-lg border border-amber-800/10 transition-transform hover:rotate-90 cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 구글 연동 전용 상단 패널 제어 */}
        <div className="bg-amber-100/40 border-b-2 border-amber-200 p-3 px-5 flex items-center justify-between gap-3 text-xs font-bold text-amber-900 shrink-0">
          {firebaseUser ? (
            <>
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                <span>실시간 클라우드 동기화 활성화됨</span>
              </div>
              <button
                onClick={onGoogleLogout}
                className="text-[10px] bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-black px-2.5 py-1 rounded-xl transition-all cursor-pointer border border-amber-800/10 active:translate-y-[1px]"
              >
                연동 해제
              </button>
            </>
          ) : (
            <>
              <div className="text-[10.5px] text-amber-800/90 leading-tight font-extrabold">
                게스트 상태입니다. 구글 계정을 연동해 명예의 전당에 박제되어 보세요!
              </div>
              <button
                onClick={onGoogleLogin}
                className="flex items-center gap-1 text-[10.5px] bg-orange-400 hover:bg-orange-500 text-white font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer border-b-2 border-orange-700 active:translate-y-[1px] active:border-b-0 shrink-0"
              >
                구글 로그인
              </button>
            </>
          )}
        </div>

        {/* 안내판 */}
        <div className="bg-amber-50 px-5 py-3 border-b-2 border-amber-100 text-[11px] font-extrabold text-amber-800 flex items-center gap-2 shrink-0">
          <Star className="w-4 h-4 fill-amber-350 stroke-orange-500 shrink-0" />
          <span>학습 계단을 많이 돌파하여 층들을 누적할수록 순위가 실시간 업그레이드됩니다.</span>
        </div>

        {/* 랭킹 리스트 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-amber-50/10 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 backdrop-blur-xs">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <span className="text-xs font-bold text-amber-900">클라우드 랭킹 동기화 중...</span>
              </div>
            </div>
          )}

          {entireRanks.map((ranker, idx) => {
            const charData = originalCharacters.find(c => c.id === ranker.characterId);
            const isSelf = ranker.isCurrentUser;

            return (
              <div
                key={ranker.userId}
                className={`flex items-center justify-between p-3 rounded-2xl border-2 border-b-4 transition-all ${
                  isSelf
                    ? 'bg-amber-50/70 border-orange-450 shadow-md scale-[1.01]'
                    : 'bg-white border-slate-100 hover:border-amber-200'
                }`}
              >
                {/* 왼쪽 순위와 캐릭터 프로필 */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 shrink-0">
                    {getRankBadge(idx)}
                  </div>

                  <div className="w-10 h-10 shrink-0">
                    {charData && (
                      <div
                        className="w-full h-full drop-shadow-sm"
                        dangerouslySetInnerHTML={{ __html: charData.avatarSvg }}
                      />
                    )}
                  </div>

                  <div>
                    <span className={`font-black text-sm block ${isSelf ? 'text-orange-950 font-black' : 'text-slate-800'}`}>
                      {ranker.nickname}
                      {isSelf && (
                        <span className="ml-1.5 align-middle text-[8px] bg-orange-500 text-white font-mono font-black py-0.5 px-2 rounded-full uppercase border border-white">
                          나
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-amber-805 font-bold">
                      {charData?.name.split(' ')[1] || '모험가'}
                    </span>
                  </div>
                </div>

                {/* 오른쪽 층수 레벨 */}
                <div className="text-right">
                  <div className="flex items-center gap-1 bg-amber-50/60 rounded-xl px-2.5 py-1 text-orange-900 font-black border border-amber-200 shadow-xs">
                    <span className="text-xs font-mono">Lv.{ranker.level}층</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 자신 랭킹 요약 푸터 편의성 */}
        <div className="bg-amber-950 text-white p-4 shrink-0 flex items-center justify-between font-black text-xs rounded-t-2xl border-t-2 border-amber-850 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-amber-300 font-mono">RANK:</span>
            <span className="text-sm">{entireRanks.findIndex(r => r.isCurrentUser) + 1}위 / {entireRanks.length}명</span>
          </div>
          <span className="text-[10px] text-amber-300">내 학습 진척도: {currentUserLevel}층 계단 복도</span>
        </div>
      </motion.div>
    </div>
  );
}
useEffect(() => {
  setDoc(doc(db, 'scores', 'test_user'), {
    userId: 'test_user',
    nickname: '테스트유저',
    characterId: 'viajero',
    level: 10,
    updatedAt: serverTimestamp()
  });
}, []);
