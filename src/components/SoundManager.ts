// Web Audio API를 이용해 백그라운드 오디오 효과음 신디사이저를 구현합니다.
// 어떤 외부 파일 오버헤드도 없이 매혹적이고 기분 좋은 레트로풍 효과음을 즉석에서 발생시킵니다.

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Lazy initialization of AudioContext to prevent autoplay restriction issues on startup
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // 1. 정답 시 효과음: 도 미 솔 파파슝~ 하는 신나는 주파수 도약
  public playCorrect() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      
      const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'sine') => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        
        // 부드럽게 볼륨 페이드아웃
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      };

      // 기분 좋은 도약 코드 (C Major Arpeggio)
      playTone(523.25, now, 0.15, 'triangle'); // C5
      playTone(659.25, now + 0.08, 0.15, 'triangle'); // E5
      playTone(783.99, now + 0.16, 0.25, 'triangle'); // G5
      playTone(1046.50, now + 0.24, 0.35, 'sine'); // C6 (클라이맥스)
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // 2. 오답 시 효과음: 낮은 주파수의 둔탁한 뚜우- 소리
  public playIncorrect() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.linearRampToValueAtTime(140, now + 0.35); // 슬라이드 다운 효과

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // 3. 레벨 업 및 보스 시험 합격 시: 화려하게 울려 퍼지는 팡파르 아르페지오
  public playLevelUp() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      
      const playChime = (freq: number, start: number, duration: number) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        
        // 비브라토/트레몰로 느낌으로 주파수를 LFO 흉내
        osc.frequency.linearRampToValueAtTime(freq * 1.01, start + duration * 0.5);
        osc.frequency.linearRampToValueAtTime(freq, start + duration);

        gain.gain.setValueAtTime(0.1, start);
        gain.gain.linearRampToValueAtTime(0.05, start + duration * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      };

      // F Major 파워풀 팡파르
      playChime(349.23, now, 0.2); // F4
      playChime(440.00, now + 0.1, 0.2); // A4
      playChime(523.25, now + 0.2, 0.2); // C5
      playChime(698.46, now + 0.3, 0.4); // F5
      playChime(880.00, now + 0.4, 0.5); // A5
      playChime(1046.50, now + 0.5, 0.8); // C6
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // 4. 터치/클릭 등 기본 인라인 사운드: 귀엽고 짧은 똑 소리
  public playClick() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(2000, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }
}

export const soundManager = new SoundManager();
