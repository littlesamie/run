/**
 * Pure Web Audio API Chiptune Synthesizer & Sound Effects Generator
 * Delivers authentic 8-bit / 16-bit retro arcade sounds without external audio files.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.6;
  private musicPlaying: boolean = false;
  private currentTrackName: string | null = null;
  private musicTimer: number | null = null;
  private bgmGainNode: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.bgmGainNode = this.ctx.createGain();
        this.bgmGainNode.gain.value = this.musicVolume;
        this.bgmGainNode.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.bgmGainNode) {
      this.bgmGainNode.gain.value = muted ? 0 : this.musicVolume;
    }
  }

  public setVolumes(sfx: number, music: number) {
    this.sfxVolume = sfx;
    this.musicVolume = music;
    if (this.bgmGainNode && !this.isMuted) {
      this.bgmGainNode.gain.value = music;
    }
  }

  // ---- SOUND EFFECTS ----

  public playJump() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    const now = this.ctx.currentTime;
    
    // Frequency sweep upward
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.12);

    gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playDoubleJump() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const now = this.ctx.currentTime;
    
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.14);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playDash() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Noise whoosh + low pulse
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(200, now + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  public playAttack() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    const now = this.ctx.currentTime;

    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);

    gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playFireball() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const now = this.ctx.currentTime;

    osc.frequency.setValueAtTime(550, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);

    gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playCoin() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain1.gain.setValueAtTime(0.25 * this.sfxVolume, now);
    gain1.gain.linearRampToValueAtTime(0.25 * this.sfxVolume, now + 0.08);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.28);
  }

  public playGem() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.15);
    });
  }

  public playStomp() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.1);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playPlayerHurt() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.2);

    gain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playSpring() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playCheckpoint() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.2 * this.sfxVolume, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.2);
    });
  }

  public playVictory() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const melody = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.12 }, // G5
      { f: 1046.5, d: 0.24 }, // C6
      { f: 880.0, d: 0.15 },  // A5
      { f: 1046.5, d: 0.4 },  // C6
    ];

    let t = now;
    melody.forEach((note) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, t);
      gain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 1.05;
    });
  }

  public playExplosion() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.09));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(50, now + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // ---- CHIPTUNE BACKGROUND MUSIC ENGINE ----

  public playBGM(theme: 'ruins' | 'cave' | 'volcano' | 'cyber' | 'boss') {
    if (this.currentTrackName === theme && this.musicPlaying) return;
    this.stopBGM();
    this.currentTrackName = theme;
    this.musicPlaying = true;

    this.initContext();
    if (!this.ctx || !this.bgmGainNode) return;

    let step = 0;
    const bpm = theme === 'boss' ? 148 : theme === 'volcano' ? 134 : theme === 'cyber' ? 140 : 124;
    const stepDuration = 60 / bpm / 2; // 16th notes or 8th notes

    // Musical scales for themes
    const themesData: Record<string, { lead: number[], bass: number[], arp: number[] }> = {
      ruins: {
        lead: [261.63, 293.66, 329.63, 392.00, 329.63, 293.66, 261.63, 392.00, 440.00, 392.00, 329.63, 261.63, 293.66, 329.63, 392.00, 523.25],
        bass: [130.81, 0, 130.81, 0, 164.81, 0, 164.81, 0, 174.61, 0, 174.61, 0, 196.00, 0, 196.00, 0],
        arp: [523.25, 659.25, 783.99, 659.25, 587.33, 739.99, 880.00, 739.99]
      },
      cave: {
        lead: [220.00, 0, 261.63, 246.94, 220.00, 196.00, 220.00, 0, 329.63, 293.66, 261.63, 246.94, 220.00, 0, 246.94, 261.63],
        bass: [110.00, 110.00, 0, 110.00, 130.81, 130.81, 0, 130.81, 98.00, 98.00, 0, 98.00, 110.00, 0, 110.00, 0],
        arp: [440.00, 523.25, 659.25, 523.25, 392.00, 493.88, 587.33, 493.88]
      },
      volcano: {
        lead: [146.83, 174.61, 196.00, 220.00, 233.08, 220.00, 196.00, 174.61, 146.83, 220.00, 293.66, 261.63, 233.08, 220.00, 196.00, 174.61],
        bass: [73.42, 73.42, 146.83, 73.42, 87.31, 87.31, 174.61, 87.31, 98.00, 98.00, 196.00, 98.00, 110.00, 110.00, 220.00, 110.00],
        arp: [293.66, 349.23, 440.00, 349.23, 311.13, 392.00, 466.16, 392.00]
      },
      cyber: {
        lead: [329.63, 392.00, 493.88, 587.33, 659.25, 587.33, 493.88, 392.00, 440.00, 523.25, 659.25, 783.99, 880.00, 783.99, 659.25, 523.25],
        bass: [82.41, 164.81, 82.41, 164.81, 110.00, 220.00, 110.00, 220.00, 87.31, 174.61, 87.31, 174.61, 98.00, 196.00, 98.00, 196.00],
        arp: [659.25, 987.77, 1318.51, 987.77, 880.00, 1046.5, 1567.98, 1046.5]
      },
      boss: {
        lead: [110.00, 116.54, 110.00, 123.47, 110.00, 130.81, 110.00, 146.83, 220.00, 233.08, 220.00, 246.94, 220.00, 261.63, 293.66, 329.63],
        bass: [55.00, 55.00, 110.00, 55.00, 58.27, 58.27, 116.54, 58.27, 65.41, 65.41, 130.81, 65.41, 73.42, 73.42, 146.83, 73.42],
        arp: [440.00, 466.16, 523.25, 587.33, 622.25, 587.33, 523.25, 466.16]
      }
    };

    const track = themesData[theme] || themesData.ruins;

    const playStep = () => {
      if (!this.musicPlaying || !this.ctx || !this.bgmGainNode) return;

      const now = this.ctx.currentTime;
      const leadNote = track.lead[step % track.lead.length];
      const bassNote = track.bass[step % track.bass.length];
      const arpNote = track.arp[step % track.arp.length];

      // Channel 1: Pulse Lead
      if (leadNote > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(leadNote, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.9);
        osc.connect(gain);
        gain.connect(this.bgmGainNode);
        osc.start(now);
        osc.stop(now + stepDuration * 0.9);
      }

      // Channel 2: Triangle Bass
      if (bassNote > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bassNote, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.95);
        osc.connect(gain);
        gain.connect(this.bgmGainNode);
        osc.start(now);
        osc.stop(now + stepDuration * 0.95);
      }

      // Channel 3: Arpeggio Chime (every 2nd step)
      if (step % 2 === 0 && arpNote > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(arpNote, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.6);
        osc.connect(gain);
        gain.connect(this.bgmGainNode);
        osc.start(now);
        osc.stop(now + stepDuration * 0.6);
      }

      // Channel 4: Chiptune Noise Snare / Hi-Hat
      if (step % 4 === 2) {
        // Snare
        this.playDrumSnare(now);
      } else if (step % 2 === 0) {
        // Hi-Hat
        this.playDrumHat(now);
      }

      step++;
      this.musicTimer = window.setTimeout(playStep, stepDuration * 1000);
    };

    playStep();
  }

  private playDrumHat(time: number) {
    if (!this.ctx || !this.bgmGainNode) return;
    const bufferSize = this.ctx.sampleRate * 0.03;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5000, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGainNode);
    noise.start(time);
  }

  private playDrumSnare(time: number) {
    if (!this.ctx || !this.bgmGainNode) return;
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.09, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGainNode);
    noise.start(time);
  }

  public stopBGM() {
    this.musicPlaying = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundManager = new SoundManager();
