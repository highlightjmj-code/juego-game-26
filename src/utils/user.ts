import { CharacterId } from '../types';

/**
 * Generates a unique anonymous guest user ID.
 */
export function generateGuestId(): string {
  return 'player_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Maps each Character ID to its representative emoji and name.
 */
export interface CharacterMeta {
  emoji: string;
  koreanName: string;
  spanishTitle: string;
  description: string;
}

export const CHARACTER_METADATA: Record<CharacterId, CharacterMeta> = {
  viajero: {
    emoji: '🎒',
    koreanName: '여행자 (Viajero)',
    spanishTitle: 'El Viajero',
    description: '스페인 전국을 누비며 새로운 단어를 수집하는 호기심 많은 모험가.'
  },
  flamenco: {
    emoji: '💃',
    koreanName: '플라멩코 무용수 (Flamenco)',
    spanishTitle: 'La Bailarina de Flamenco',
    description: '열정적인 발구름과 리듬으로 단어의 억양을 몸소 익히는 춤꾼.'
  },
  churrero: {
    emoji: '☕',
    koreanName: '츄러스 장인 (Churrero)',
    spanishTitle: 'El Churrero',
    description: '달콤한 초콜릿과 갓 튀긴 츄러스처럼 맛있는 일상 대화를 비벼내는 요리사.'
  },
  futbolista: {
    emoji: '⚽',
    koreanName: '축구 선수 (Futbolista)',
    spanishTitle: 'El Futbolista',
    description: '거침없는 돌파력과 뜨거운 열정으로 단어 계단을 드리블로 뚫고 나가는 공격수.'
  }
};

/**
 * Gets character metadata for a given character ID.
 */
export function getCharacterMeta(characterId: CharacterId | null): CharacterMeta {
  if (!characterId || !CHARACTER_METADATA[characterId]) {
    return {
      emoji: '👤',
      koreanName: '게스트',
      spanishTitle: 'Invitado',
      description: '아직 캐릭터가 지정되지 않은 익명의 견습 러너.'
    };
  }
  return CHARACTER_METADATA[characterId];
}

/**
 * Returns a special Spanish level/rank title according to the stair level (1 ~ 30).
 */
export function getSpanishLevelTitle(level: number): { title: string; subtitle: string; color: string } {
  if (level >= 25) {
    return {
      title: '에스파냐 마에스트로 (Maestro de Español)',
      subtitle: '스페인어 계단의 정점에 도달하여 일상 회화와 원어 표현을 지배한 달인',
      color: 'text-rose-600 bg-rose-50 border-rose-200'
    };
  }
  if (level >= 20) {
    return {
      title: '엘리트 정복자 (Conquistador de Palabras)',
      subtitle: '현지인 수준의 어휘 연계를 자랑하며 문장 구사가 물 흐르듯 유창한 등반가',
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    };
  }
  if (level >= 15) {
    return {
      title: '베테랑 투우사 (Torero Avanzado)',
      subtitle: '복잡한 필수 문장 응용력을 갖추어 다양한 상황의 대화 소통이 가능한 모험가',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    };
  }
  if (level >= 10) {
    return {
      title: '열정의 순례자 (Peregrino de Santiago)',
      subtitle: '에센셜 주요 명사와 형용사를 마스터하여 기본 회화에 자신감이 생긴 러너',
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    };
  }
  if (level >= 5) {
    return {
      title: '한눈파는 아미고 (Amigo Curioso)',
      subtitle: '스페인어의 걸음마를 떼고 기초 일상 단어가 조금씩 보이기 시작하는 연습생',
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    };
  }
  return {
    title: '아기 투우송아지 (Novato)',
    subtitle: '에스파냐 대륙에 첫발을 디딘 호기심 많은 생짜 초보 모험생',
    color: 'text-slate-600 bg-slate-50 border-slate-200'
  };
}

/**
 * Estimates progress percentage on the entire staircase game (30 levels total).
 */
export function getGameProgressPercentage(level: number, step: number): number {
  const totalSteps = 30 * 10;
  const currentStep = ((level - 1) * 10) + step;
  return Math.min(Math.round((currentStep / totalSteps) * 100), 100);
}

/**
 * Validates nickname parameters. Returns trimmed string, or raises/returns fallback if invalid.
 */
export function sanitizeNickname(rawNickname: string): string {
  const trimmed = rawNickname.trim();
  if (!trimmed) {
    return '아미고';
  }
  // Max string size limit to prevent overflow or rule breach
  return trimmed.substring(0, 16);
}

export const initUser = (nickname: string) => {
  let userId = localStorage.getItem("userId");

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("userId", userId);
  }

  localStorage.setItem("nickname", nickname);

  return userId;
};

export const getNickname = () => {
  return localStorage.getItem("nickname") || "익명";
};

