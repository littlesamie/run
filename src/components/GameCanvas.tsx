import React, { useEffect, useRef, useState } from 'react';
import { Heart, Coins, Key, Zap, Pause, Play, RotateCcw, Volume2, VolumeX, Shield, Sparkles } from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { HERO_CLASSES } from '../data/defaultLevels';
import { GameSettings, HeroClassType, LevelData } from '../types';
import { soundManager } from '../audio/SoundManager';
import { VirtualControls } from './VirtualControls';

interface GameCanvasProps {
  level: LevelData;
  heroType: HeroClassType;
  settings: GameSettings;
  onLevelComplete: (time: number, score: number, coins: number) => void;
  onExitToMenu: () => void;
  onRestart: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  heroType,
  settings,
  onLevelComplete,
  onExitToMenu,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // In-Game UI state
  const [health, setHealth] = useState(HERO_CLASSES[heroType].maxHealth);
  const [maxHealth] = useState(HERO_CLASSES[heroType].maxHealth);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [keys, setKeys] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [bossHp, setBossHp] = useState<{ current: number; max: number; name: string } | null>(null);
  const [specialCooldown, setSpecialCooldown] = useState(0);
  const [timerDisplay, setTimerDisplay] = useState('00:00.0');

  const heroConfig = HERO_CLASSES[heroType];

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Game Engine
    const canvas = canvasRef.current;
    canvas.width = 480;
    canvas.height = 270;

    const engine = new GameEngine(canvas, level, heroType, {
      onLevelComplete: (time, finalScore, finalCoins) => {
        onLevelComplete(time, finalScore, finalCoins);
      },
      onGameOver: () => {
        setIsGameOver(true);
      },
      onScoreUpdate: (newScore, newCoins, newKeys) => {
        setScore(newScore);
        setCoins(newCoins);
        setKeys(newKeys);
      },
      onPlayerHurt: (currentHp, mHp) => {
        setHealth(currentHp);
      },
      onBossHealthUpdate: (current, max, name) => {
        setBossHp({ current, max, name });
      },
    });

    engineRef.current = engine;
    engine.start();

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyZ', 'KeyX', 'KeyC'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') engine.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') engine.keys.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space' || e.code === 'KeyZ') {
        engine.keys.up = true;
        engine.keys.jumpPressed = true;
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') engine.keys.down = true;
      if (e.code === 'KeyX' || e.code === 'KeyJ') engine.keys.attack = true;
      if (e.code === 'KeyC' || e.code === 'KeyK' || e.code === 'ShiftLeft') engine.keys.special = true;
      if (e.code === 'Escape' || e.code === 'KeyP') {
        setIsPaused((prev) => {
          engine.isPaused = !prev;
          return !prev;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') engine.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') engine.keys.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space' || e.code === 'KeyZ') engine.keys.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') engine.keys.down = false;
      if (e.code === 'KeyX' || e.code === 'KeyJ') engine.keys.attack = false;
      if (e.code === 'KeyC' || e.code === 'KeyK' || e.code === 'ShiftLeft') engine.keys.special = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Timer sync loop for HUD
    const hudInterval = setInterval(() => {
      if (engineRef.current && !engineRef.current.isPaused) {
        const t = engineRef.current.levelTime;
        const mins = Math.floor(t / 60);
        const secs = Math.floor(t % 60);
        const ms = Math.floor((t * 10) % 10);
        setTimerDisplay(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`);
        setSpecialCooldown(Math.max(0, engineRef.current.player.specialCooldownTimer));
      }
    }, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(hudInterval);
      engine.stop();
    };
  }, [level, heroType]);

  const handleTogglePause = () => {
    if (engineRef.current) {
      engineRef.current.isPaused = !isPaused;
      setIsPaused(!isPaused);
    }
  };

  const handleRespawn = () => {
    if (engineRef.current) {
      engineRef.current.resetToCheckpoint();
      setIsGameOver(false);
    }
  };

  // Color palette filter styles
  const getFilterStyle = () => {
    switch (settings.colorPalette) {
      case 'gameboy':
        return 'filter: sepia(1) hue-rotate(65deg) saturate(3) contrast(1.1);';
      case 'nes':
        return 'filter: contrast(1.2) saturate(1.3);';
      case 'cyberpunk':
        return 'filter: hue-rotate(290deg) saturate(1.8) contrast(1.15);';
      case 'monochrome':
        return 'filter: grayscale(1) contrast(1.3);';
      default:
        return '';
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#0f0c29] overflow-hidden select-none">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 vibrant-grid opacity-25 pointer-events-none" />
      <div className="absolute top-10 right-10 w-48 h-48 bg-[#FF416C] rounded-full blur-[90px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-60 h-60 bg-[#00B4DB] rounded-full blur-[100px] opacity-20 pointer-events-none" />

      {/* Canvas Viewport Container with 16:9 Aspect Ratio & Vibrant Border */}
      <div className="relative w-full max-w-5xl aspect-video max-h-[76vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.8)] border-4 border-[#302b63] bg-[#24243e]">
        <canvas
          ref={canvasRef}
          className="w-full h-full pixelated block object-contain"
          style={{
            imageRendering: 'pixelated',
            cssText: getFilterStyle(),
          }}
        />

        {/* CRT Scanline Overlay */}
        {settings.crtFilter && <div className="absolute inset-0 crt-overlay crt-flicker pointer-events-none z-10" />}

        {/* TOP HUD BAR (Vibrant Palette Theme) */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          {/* LEFT: Hero Tag & Crystals/Coins */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Hero Class Tag */}
            <div className="bg-[#1a1a2e] rounded-2xl py-1 px-3.5 border-3 border-white flex flex-col justify-center shadow-[3px_3px_0_0_#000]">
              <span className="text-[8px] uppercase font-black text-[#8E9299] tracking-widest leading-none">Hero</span>
              <span className="text-xs sm:text-sm font-black text-white italic tracking-tighter uppercase leading-tight">
                {heroConfig.name}
              </span>
            </div>

            {/* Crystals / Coins Counter */}
            <div className="bg-[#1a1a2e] rounded-2xl py-1 px-3.5 border-3 border-white flex flex-col justify-center shadow-[3px_3px_0_0_#000]">
              <span className="text-[8px] uppercase font-black text-[#8E9299] tracking-widest leading-none">Crystals</span>
              <span className="text-xs sm:text-sm font-black text-[#00FFD1] leading-tight flex items-center gap-1 font-mono">
                <Coins size={12} className="text-[#00FFD1]" /> {coins.toString().padStart(2, '0')}
              </span>
            </div>

            {keys > 0 && (
              <div className="bg-[#1a1a2e] rounded-2xl py-1 px-3 border-3 border-[#FFD700] flex items-center gap-1 shadow-[3px_3px_0_0_#000]">
                <Key size={13} className="text-[#FFD700]" />
                <span className="text-xs font-black text-[#FFD700] font-mono">{keys}</span>
              </div>
            )}
          </div>

          {/* CENTER: Health Meter with Vibrant Pips */}
          <div className="bg-[#1a1a2e] rounded-2xl py-1 px-4 border-3 border-white flex flex-col items-center justify-center shadow-[3px_3px_0_0_#000] pointer-events-auto">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: maxHealth }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-black shadow-[1px_1px_0_0_#000] transition-all ${
                    idx < health
                      ? 'bg-[#FF416C] shadow-[0_0_8px_#FF416C]'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <span className="text-[7px] sm:text-[8px] font-black text-[#8E9299] uppercase tracking-widest mt-0.5 leading-none">
              Health Meter
            </span>
          </div>

          {/* RIGHT: Zone Tag, Special Skill & Pause */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Zone Tag */}
            <div className="hidden sm:flex bg-[#1a1a2e] rounded-2xl py-1 px-3.5 border-3 border-white flex-col justify-center shadow-[3px_3px_0_0_#000] text-right">
              <span className="text-[8px] uppercase font-black text-[#8E9299] tracking-widest leading-none">Zone</span>
              <span className="text-xs sm:text-sm font-black text-[#FF6B6B] italic tracking-tighter uppercase leading-tight">
                {level.name}
              </span>
            </div>

            {/* Special Skill Button Pill */}
            <div
              className={`px-3 py-1.5 rounded-2xl border-3 font-pixel text-[9px] flex items-center gap-1.5 shadow-[3px_3px_0_0_#000] transition-all ${
                specialCooldown <= 0
                  ? 'bg-[#00B4DB] border-white text-black font-black shadow-[0_0_12px_rgba(0,180,219,0.5)]'
                  : 'bg-[#1a1a2e] border-white/60 text-[#8E9299]'
              }`}
            >
              <Zap size={12} className={specialCooldown <= 0 ? 'fill-black text-black' : ''} />
              <span>{specialCooldown <= 0 ? 'BOOST' : `${specialCooldown.toFixed(1)}s`}</span>
            </div>

            {/* Pause Button */}
            <button
              onClick={handleTogglePause}
              className="p-2 bg-[#1a1a2e] hover:bg-[#24243e] border-3 border-white text-white rounded-2xl active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-all shadow-[3px_3px_0_0_#000]"
              title="Pause Game"
            >
              {isPaused ? <Play size={14} className="text-[#FFD700]" /> : <Pause size={14} className="text-white" />}
            </button>
          </div>
        </div>

        {/* BOSS HEALTH BAR (If fighting boss) */}
        {bossHp && bossHp.current > 0 && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-80 sm:w-[420px] bg-[#1a1a2e] border-3 border-white rounded-2xl p-2.5 z-20 text-center pointer-events-none shadow-[6px_6px_0_0_#000]">
            <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-[#FF416C] mb-1">
              <span className="italic">{bossHp.name}</span>
              <span className="font-mono text-[#FFD700]">
                {bossHp.current} / {bossHp.max} HP
              </span>
            </div>
            <div className="w-full h-4 bg-black rounded-xl border-2 border-black overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#FF416C] via-[#FF0080] to-[#FFD700] rounded-lg transition-all duration-200 shadow-[0_0_10px_#FF416C]"
                style={{ width: `${Math.max(0, (bossHp.current / bossHp.max) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* PAUSE MODAL OVERLAY (Vibrant Palette) */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-30 font-sans">
            <div className="bg-[#1a1a2e] border-4 border-white p-7 rounded-3xl text-center max-w-sm w-full mx-4 shadow-[8px_8px_0_0_#000] space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-[#FFD700] tracking-widest">SYSTEM_READY_07</span>
                <h2 className="text-3xl font-black text-white italic tracking-tighter">GAME PAUSED</h2>
              </div>
              <p className="text-xs text-[#8E9299] font-mono leading-relaxed">
                Stage: <span className="text-[#00FFD1] font-bold">{level.name}</span> • Timer: {timerDisplay}
              </p>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={handleTogglePause}
                  className="w-full py-3.5 bg-[#FFD700] hover:bg-[#ffea00] text-black font-black text-xs rounded-xl shadow-[4px_4px_0_0_#B8860B] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#B8860B] transition-all flex items-center justify-center gap-2 border-3 border-black uppercase italic"
                >
                  <Play size={16} className="fill-black" /> RESUME GAME
                </button>
                <button
                  onClick={onRestart}
                  className="w-full py-3 bg-[#24243e] hover:bg-[#302b63] text-white font-black text-xs rounded-xl border-3 border-white shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-all flex items-center justify-center gap-2 uppercase"
                >
                  <RotateCcw size={14} className="text-[#00FFD1]" /> RESTART STAGE
                </button>
                <button
                  onClick={onExitToMenu}
                  className="w-full py-2.5 bg-[#1a1a2e] hover:bg-[#FF416C] text-[#8E9299] hover:text-white font-black text-xs rounded-xl border-2 border-white/60 transition-all uppercase"
                >
                  QUIT TO MENU
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER OVERLAY (Vibrant Palette) */}
        {isGameOver && (
          <div className="absolute inset-0 bg-[#0f0c29]/90 backdrop-blur-md flex flex-col items-center justify-center z-30 font-sans">
            <div className="bg-[#1a1a2e] border-4 border-[#FF416C] p-7 rounded-3xl text-center max-w-sm w-full mx-4 shadow-[8px_8px_0_0_#000] space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-[#FF416C] tracking-widest">CRITICAL FAILURE</span>
                <h2 className="text-3xl font-black text-[#FF416C] italic tracking-tighter">YOU DIED</h2>
              </div>
              <p className="text-xs text-[#8E9299] font-mono leading-relaxed">
                You fell in battle. Respawn at the last activated checkpoint or restart the zone.
              </p>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={handleRespawn}
                  className="w-full py-3.5 bg-[#FF416C] hover:bg-[#ff577f] text-white font-black text-xs rounded-xl shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-all flex items-center justify-center gap-2 border-3 border-black uppercase italic"
                >
                  <RotateCcw size={16} /> RESPAWN AT CHECKPOINT
                </button>
                <button
                  onClick={onRestart}
                  className="w-full py-3 bg-[#24243e] hover:bg-[#302b63] text-white font-black text-xs rounded-xl border-3 border-white shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-all flex items-center justify-center gap-2 uppercase"
                >
                  RESTART STAGE
                </button>
                <button
                  onClick={onExitToMenu}
                  className="w-full py-2.5 bg-[#1a1a2e] hover:bg-neutral-800 text-[#8E9299] font-black text-xs rounded-xl border-2 border-white/60 transition-all uppercase"
                >
                  EXIT TO MENU
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VIRTUAL CONTROLS FOR MOBILE / TOUCH / GAMEPAD */}
      <VirtualControls engineRef={engineRef} showOnScreen={settings.showTouchControls} />
    </div>
  );
};
