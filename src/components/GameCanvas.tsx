import React, { useEffect, useRef, useState } from 'react';
import {
  Heart,
  Coins,
  Key,
  Zap,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Shield,
  Sparkles,
  Maximize2,
  Minimize2,
  Smartphone,
  RotateCw,
  Palette,
  Gamepad2,
} from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { HERO_CLASSES } from '../data/defaultLevels';
import { DIFFICULTY_CONFIGS, GameSettings, HandheldSkin, HeroClassType, LevelData, LevelStats, SKIN_CONFIGS, isSkinUnlocked } from '../types';
import { soundManager } from '../audio/SoundManager';
import { NintendoController } from './NintendoController';

interface GameCanvasProps {
  level: LevelData;
  heroType: HeroClassType;
  settings: GameSettings;
  levelStats?: Record<string, LevelStats>;
  onLevelComplete: (time: number, score: number, coins: number) => void;
  onExitToMenu: () => void;
  onRestart: () => void;
  onSelectHero?: () => void;
  onUpdateSettings?: (newSettings: Partial<GameSettings>) => void;
  onOpenSkinsModal?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  heroType,
  settings,
  levelStats = {},
  onLevelComplete,
  onExitToMenu,
  onRestart,
  onSelectHero,
  onUpdateSettings,
  onOpenSkinsModal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Difficulty Config
  const diffConfig = DIFFICULTY_CONFIGS[settings.difficulty] || DIFFICULTY_CONFIGS.normal;
  const activeSkinConf = SKIN_CONFIGS[settings.handheldSkin || 'vibrant'] || SKIN_CONFIGS.vibrant;
  const initialMaxHp = Math.max(
    2,
    (HERO_CLASSES[heroType]?.maxHealth || 5) + diffConfig.healthBonus + (activeSkinConf.capability.healthBonus || 0)
  );

  // In-Game UI state
  const [health, setHealth] = useState(initialMaxHp);
  const [maxHealth, setMaxHealth] = useState(initialMaxHp);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [keys, setKeys] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [bossHp, setBossHp] = useState<{ current: number; max: number; name: string } | null>(null);
  const [specialCooldown, setSpecialCooldown] = useState(0);
  const [timerDisplay, setTimerDisplay] = useState('00:00.0');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Device & Orientation State
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 768);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(true);
  const [forcedOrientation, setForcedOrientation] = useState<'auto' | 'landscape' | 'portrait'>(
    settings.forceOrientation || 'auto'
  );

  const heroConfig = HERO_CLASSES[heroType] || HERO_CLASSES.knight;

  // Keep forcedOrientation synced with settings
  useEffect(() => {
    if (settings.forceOrientation) {
      setForcedOrientation(settings.forceOrientation);
    }
  }, [settings.forceOrientation]);

  // Accurately detect whether device is a mobile phone / tablet vs a PC / laptop
  useEffect(() => {
    const detectDevice = () => {
      if (typeof window === 'undefined') return;
      const ua = navigator.userAgent || '';
      // Mobile and tablet user agents (iPhone, iPad, Android tablets/phones, etc.)
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Tablet|Mobi|Silk/i.test(ua);
      const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
      const isSmallScreen = window.innerWidth <= 1024;

      // Controls should show if:
      // 1. settings.showTouchControls is explicitly true, OR
      // 2. Mobile user agent, OR
      // 3. Touch is supported, OR
      // 4. Small screen viewport <= 1024px.
      // Can be toggled anytime via the HUD Gamepad icon!
      const shouldShowControls = settings.showTouchControls ?? (isMobileUA || hasTouch || isSmallScreen);
      setIsMobileOrTablet(shouldShowControls);

      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
      setIsFullscreen(!!document.fullscreenElement);
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    window.addEventListener('orientationchange', detectDevice);
    document.addEventListener('fullscreenchange', detectDevice);

    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
      document.removeEventListener('fullscreenchange', detectDevice);
    };
  }, [settings.showTouchControls]);

  const physicalIsLandscape = windowWidth > windowHeight;
  const effectiveIsLandscape =
    forcedOrientation === 'auto'
      ? physicalIsLandscape
      : forcedOrientation === 'landscape';

  // Virtual Landscape: When Landscape is active but physical phone is held vertically in portrait
  const needsVirtualLandscape = effectiveIsLandscape && !physicalIsLandscape;

  // Only consider portrait handheld console mode if in portrait and not in virtual landscape
  const isPortraitHandheld = isMobileOrTablet && !effectiveIsLandscape;

  // Toggle On-Screen Touch Controls directly from HUD
  const handleToggleTouchControls = () => {
    soundManager.playCoin();
    const nextVal = !isMobileOrTablet;
    setIsMobileOrTablet(nextVal);
    onUpdateSettings?.({ showTouchControls: nextVal });
  };

  // Toggle Screen Orientation manually
  const handleToggleOrientation = async () => {
    soundManager.playCoin();
    const nextMode: 'landscape' | 'portrait' = effectiveIsLandscape ? 'portrait' : 'landscape';
    setForcedOrientation(nextMode);
    onUpdateSettings?.({ forceOrientation: nextMode });

    try {
      if (nextMode === 'landscape') {
        if (!document.fullscreenElement && containerRef.current?.requestFullscreen) {
          try {
            await containerRef.current.requestFullscreen();
          } catch (e) {}
        }
        if (screen.orientation && (screen.orientation as any).lock) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (e) {}
        }
      } else {
        if (screen.orientation && (screen.orientation as any).lock) {
          try {
            await (screen.orientation as any).lock('portrait');
          } catch (e) {}
        }
      }
    } catch (e) {}
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((document.documentElement as any).requestFullscreen) {
          await (document.documentElement as any).requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Fullscreen error:', e);
    }
  };

  // Cycle Console Skin among unlocked skins
  const handleCycleSkin = () => {
    soundManager.playCoin();
    const skins: HandheldSkin[] = ['vibrant', 'dmg_gameboy', 'nes_classic', 'snes', 'switch_neon'];
    const unlocked = skins.filter((s) => isSkinUnlocked(s, levelStats));
    if (unlocked.length <= 1) return;
    const currentIdx = unlocked.indexOf(settings.handheldSkin || 'vibrant');
    const nextSkin = unlocked[(currentIdx + 1) % unlocked.length];
    onUpdateSettings?.({ handheldSkin: nextSkin });
  };

  const handleTogglePause = () => {
    if (engineRef.current) {
      engineRef.current.isPaused = !isPaused;
      setIsPaused(!isPaused);
    }
  };

  const handleRestartStage = () => {
    soundManager.playCoin();
    setIsPaused(false);
    setIsGameOver(false);
    setScore(0);
    setCoins(0);
    setKeys(0);
    setSpecialCooldown(0);
    setTimerDisplay('00:00.0');
    setBossHp(null);
    setHealth(initialMaxHp);
    setMaxHealth(initialMaxHp);

    if (engineRef.current) {
      engineRef.current.restartStage();
    } else {
      onRestart?.();
    }
  };

  const handleRespawn = () => {
    if (engineRef.current) {
      engineRef.current.resetToCheckpoint();
      setIsGameOver(false);
      setIsPaused(false);
    }
  };

  // Initialize Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = 480;
    canvas.height = 270;

    const engine = new GameEngine(
      canvas,
      level,
      heroType,
      settings.difficulty || 'normal',
      settings.handheldSkin || 'vibrant',
      {
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
          setMaxHealth(mHp);
        },
        onBossHealthUpdate: (current, max, name) => {
          setBossHp({ current, max, name });
        },
      }
    );

    engineRef.current = engine;
    engine.start();

    // Keyboard handlers (PC Controls)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyZ', 'KeyX', 'KeyC'].includes(e.code)) {
        e.preventDefault();
      }

      // Quick restart hotkey (R)
      if (e.code === 'KeyR' && !e.repeat) {
        handleRestartStage();
        return;
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
  }, [level, heroType, settings.difficulty, settings.handheldSkin]);

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

  // Virtual Landscape CSS transform when phone is held vertically in portrait
  const virtualLandscapeStyle: React.CSSProperties = needsVirtualLandscape
    ? {
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: `${windowHeight}px`,
        height: `${windowWidth}px`,
        transform: 'translate(-50%, -50%) rotate(90deg)',
        transformOrigin: 'center center',
        zIndex: 40,
        maxWidth: 'none',
        maxHeight: 'none',
      }
    : {};

  return (
    <div
      ref={containerRef}
      style={virtualLandscapeStyle}
      className={`relative w-full h-full flex ${
        isPortraitHandheld ? 'flex-col' : 'flex-col items-center justify-center p-1 sm:p-3'
      } bg-[#0f0c29] overflow-hidden select-none font-sans`}
    >
      {/* Background Cyber Glow & Grid */}
      <div className="absolute inset-0 vibrant-grid opacity-20 pointer-events-none" />
      <div className="absolute top-10 right-10 w-48 h-48 bg-[#FF416C] rounded-full blur-[90px] opacity-15 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-60 h-60 bg-[#00B4DB] rounded-full blur-[100px] opacity-15 pointer-events-none" />

      {/* ----------------------------------------------------
          PORTRAIT TRANSLUCENT HEADER (Visible on Mobile/Tablet in Portrait)
          ---------------------------------------------------- */}
      {isPortraitHandheld && (
        <div className="w-full bg-[#141226]/60 backdrop-blur-md border-b border-white/15 px-4 py-2 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444] animate-pulse" />
              <span className="font-pixel text-[8px] text-[#8E9299] tracking-wider uppercase">BATTERY</span>
            </div>
            <span className="text-white/40">•</span>
            <span className="font-pixel text-[9px] text-[#FFD700] tracking-wider font-bold">
              PIXEL_BOY // TOUCH
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-[8px] font-pixel font-bold uppercase border border-black shadow-sm"
              style={{ backgroundColor: diffConfig.color, color: '#000000' }}
            >
              {diffConfig.badge}
            </span>

            <button
              onClick={handleToggleTouchControls}
              className={`p-1.5 rounded-lg border transition-all ${
                isMobileOrTablet
                  ? 'bg-[#00FFD1]/20 border-[#00FFD1] text-[#00FFD1]'
                  : 'bg-white/10 hover:bg-white/20 border-white/25 text-white/50'
              }`}
              title="Toggle Touch Controls"
            >
              <Gamepad2 size={13} />
            </button>

            <button
              onClick={handleToggleOrientation}
              className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/25 text-[#00FFD1] rounded-lg active:scale-95 transition-all"
              title="Switch to Landscape Mode"
            >
              <Smartphone size={13} className="rotate-90" />
            </button>

            <button
              onClick={handleCycleSkin}
              className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/25 text-[#FFD700] rounded-lg active:scale-95 transition-all"
              title={`Skin: ${settings.handheldSkin || 'vibrant'}`}
            >
              <Palette size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          CANVAS VIEWPORT
          On PC: pristine 16:9 box with no on-screen touch controls
          On Mobile/Tablet: widescreen with translucent controls
          ---------------------------------------------------- */}
      <div
        className={`relative w-full ${
          isPortraitHandheld
            ? 'flex-none aspect-video border-b-2 border-white/20 bg-[#24243e] shadow-lg'
            : 'max-w-5xl aspect-video flex items-center justify-center rounded-2xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.8)] border-2 sm:border-4 border-[#302b63] bg-[#24243e] max-h-[96vh]'
        }`}
      >
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

        {/* TOP HUD BAR */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 flex items-center justify-between pointer-events-none z-20">
          {/* LEFT: Hero Tag, Crystals/Coins & Active Skin Capability Perk */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
            <div className="bg-[#1a1a2e]/90 backdrop-blur-md rounded-xl sm:rounded-2xl py-0.5 sm:py-1 px-2 sm:px-3 border-2 sm:border-3 border-white flex flex-col justify-center shadow-[3px_3px_0_0_#000]">
              <span className="text-[7px] sm:text-[8px] uppercase font-black text-[#8E9299] tracking-widest leading-none">Hero</span>
              <span className="text-[11px] sm:text-xs font-black text-white italic tracking-tighter uppercase leading-tight">
                {heroConfig.name}
              </span>
            </div>

            <div className="bg-[#1a1a2e]/90 backdrop-blur-md rounded-xl sm:rounded-2xl py-0.5 sm:py-1 px-2 sm:px-3 border-2 sm:border-3 border-white flex flex-col justify-center shadow-[3px_3px_0_0_#000]">
              <span className="text-[7px] sm:text-[8px] uppercase font-black text-[#8E9299] tracking-widest leading-none">Crystals</span>
              <span className="text-[11px] sm:text-xs font-black text-[#00FFD1] leading-tight flex items-center gap-1 font-mono">
                <Coins size={12} className="text-[#00FFD1]" /> {coins.toString().padStart(2, '0')}
              </span>
            </div>

            {/* Hardware Skin Perk Badge */}
            <div
              onClick={() => (onOpenSkinsModal ? onOpenSkinsModal() : handleCycleSkin())}
              className="bg-[#1a1a2e]/90 backdrop-blur-md rounded-xl sm:rounded-2xl py-0.5 sm:py-1 px-2 sm:px-2.5 border-2 sm:border-3 border-white flex flex-col justify-center shadow-[3px_3px_0_0_#000] cursor-pointer hover:border-[#00FFD1] transition-all"
              title={`Hardware Perk: ${activeSkinConf.name} - ${activeSkinConf.capability.description} (Click to switch)`}
            >
              <span className="text-[6.5px] sm:text-[7.5px] uppercase font-black text-[#8E9299] tracking-widest leading-none">Perk</span>
              <span
                className="text-[8.5px] sm:text-[9.5px] font-pixel font-bold uppercase leading-tight truncate max-w-[85px] sm:max-w-[120px]"
                style={{ color: activeSkinConf.themeColor }}
              >
                {activeSkinConf.capability.badge}
              </span>
            </div>

            {keys > 0 && (
              <div className="bg-[#1a1a2e]/90 backdrop-blur-md rounded-xl sm:rounded-2xl py-0.5 sm:py-1 px-2 border-2 sm:border-3 border-[#FFD700] flex items-center gap-1 shadow-[3px_3px_0_0_#000]">
                <Key size={12} className="text-[#FFD700]" />
                <span className="text-xs font-black text-[#FFD700] font-mono">{keys}</span>
              </div>
            )}
          </div>

          {/* CENTER: Health Meter */}
          <div className="bg-[#1a1a2e]/90 backdrop-blur-md rounded-xl sm:rounded-2xl py-0.5 sm:py-1 px-2.5 sm:px-3.5 border-2 sm:border-3 border-white flex flex-col items-center justify-center shadow-[3px_3px_0_0_#000] pointer-events-auto">
            <div className="flex items-center gap-1 sm:gap-1.5">
              {Array.from({ length: maxHealth }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full border border-black sm:border-2 shadow-[1px_1px_0_0_#000] transition-all ${
                    idx < health ? 'bg-[#FF416C] shadow-[0_0_8px_#FF416C]' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <span className="text-[6px] sm:text-[8px] font-black text-[#8E9299] uppercase tracking-widest mt-0.5 leading-none">
              Health ({diffConfig.badge})
            </span>
          </div>

          {/* RIGHT: Special Skill, Controls, Orientation, Fullscreen & Pause */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
            {/* Special Skill Pill */}
            <div
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl border-2 sm:border-3 font-pixel text-[8px] sm:text-[9px] flex items-center gap-1 sm:gap-1.5 shadow-[3px_3px_0_0_#000] transition-all ${
                specialCooldown <= 0
                  ? 'bg-[#00B4DB] border-white text-black font-black shadow-[0_0_12px_rgba(0,180,219,0.5)]'
                  : 'bg-[#1a1a2e] border-white/60 text-[#8E9299]'
              }`}
            >
              <Zap size={11} className={specialCooldown <= 0 ? 'fill-black text-black' : ''} />
              <span>{specialCooldown <= 0 ? 'BOOST' : `${specialCooldown.toFixed(1)}s`}</span>
            </div>

            {/* Touch Controls Toggle Button */}
            <button
              onClick={handleToggleTouchControls}
              className={`p-1.5 sm:p-2 border-2 sm:border-3 rounded-xl sm:rounded-2xl active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[3px_3px_0_0_#000] ${
                isMobileOrTablet
                  ? 'bg-[#00FFD1]/20 border-[#00FFD1] text-[#00FFD1] shadow-[0_0_10px_rgba(0,255,209,0.3)]'
                  : 'bg-[#1a1a2e] hover:bg-[#24243e] border-white/50 text-neutral-400'
              }`}
              title={isMobileOrTablet ? 'Touch Controls: Active (Click to Hide)' : 'Touch Controls: Off (Click to Enable)'}
            >
              <Gamepad2 size={13} className={isMobileOrTablet ? 'text-[#00FFD1]' : 'text-neutral-400'} />
            </button>

            {/* Switch Orientation Button */}
            <button
              onClick={handleToggleOrientation}
              className="p-1.5 sm:p-2 bg-[#1a1a2e] hover:bg-[#24243e] border-2 sm:border-3 border-white text-[#FFD700] rounded-xl sm:rounded-2xl active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[3px_3px_0_0_#000]"
              title={`Orientation: ${effectiveIsLandscape ? 'Landscape' : 'Portrait'} (Click to Switch)`}
            >
              <Smartphone size={13} className={effectiveIsLandscape ? 'rotate-90 text-[#FFD700]' : 'text-[#00FFD1]'} />
            </button>

            {/* Quick Restart Button */}
            <button
              onClick={handleRestartStage}
              className="p-1.5 sm:p-2 bg-[#1a1a2e] hover:bg-[#24243e] border-2 sm:border-3 border-white text-[#00FFD1] hover:text-white rounded-xl sm:rounded-2xl active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[3px_3px_0_0_#000]"
              title="Restart Level (R)"
              aria-label="Restart Level"
            >
              <RotateCcw size={13} />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 bg-[#1a1a2e] hover:bg-[#24243e] border-2 sm:border-3 border-white text-[#FFD700] rounded-xl sm:rounded-2xl active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[3px_3px_0_0_#000]"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            {/* Pause Button */}
            <button
              onClick={handleTogglePause}
              className="p-1.5 sm:p-2 bg-[#1a1a2e] hover:bg-[#24243e] border-2 sm:border-3 border-white text-white rounded-xl sm:rounded-2xl active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[3px_3px_0_0_#000]"
              title="Pause Game"
            >
              {isPaused ? <Play size={13} className="text-[#FFD700]" /> : <Pause size={13} className="text-white" />}
            </button>
          </div>
        </div>

        {/* BOSS HEALTH BAR */}
        {bossHp && bossHp.current > 0 && (
          <div className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 w-72 sm:w-[420px] bg-[#1a1a2e] border-3 border-white rounded-2xl p-2 sm:p-2.5 z-20 text-center pointer-events-none shadow-[6px_6px_0_0_#000]">
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-[#FF416C] mb-1">
              <span className="italic">{bossHp.name}</span>
              <span className="font-mono text-[#FFD700]">
                {bossHp.current} / {bossHp.max} HP
              </span>
            </div>
            <div className="w-full h-3.5 sm:h-4 bg-black rounded-xl border-2 border-black overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#FF416C] via-[#FF0080] to-[#FFD700] rounded-lg transition-all duration-200 shadow-[0_0_10px_#FF416C]"
                style={{ width: `${Math.max(0, (bossHp.current / bossHp.max) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* PAUSE MODAL OVERLAY */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-30 font-sans">
            <div className="bg-[#1a1a2e] border-4 border-white p-6 sm:p-7 rounded-3xl text-center max-w-sm w-full mx-4 shadow-[8px_8px_0_0_#000] space-y-3 sm:space-y-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#24243e] rounded-full border border-white/20">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: diffConfig.color }}
                  />
                  <span className="font-pixel text-[9px] text-white uppercase">{diffConfig.name}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter">GAME PAUSED</h2>
              </div>
              <p className="text-xs text-[#8E9299] font-mono leading-relaxed">
                Stage: <span className="text-[#00FFD1] font-bold">{level.name}</span> • Timer: {timerDisplay}
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleTogglePause}
                  className="w-full py-3 sm:py-3.5 bg-[#FFD700] hover:bg-[#ffea00] text-black font-black text-xs rounded-xl shadow-[4px_4px_0_0_#B8860B] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 border-3 border-black uppercase italic"
                >
                  <Play size={16} className="fill-black" /> RESUME GAME
                </button>

                {isMobileOrTablet && (
                  <button
                    onClick={handleToggleOrientation}
                    className="w-full py-2.5 bg-[#24243e] hover:bg-[#302b63] text-[#00FFD1] font-black text-xs rounded-xl border-3 border-white shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase"
                  >
                    <RotateCw size={14} /> SWITCH ORIENTATION ({effectiveIsLandscape ? 'LANDSCAPE' : 'PORTRAIT'})
                  </button>
                )}

                <button
                  onClick={() => (onOpenSkinsModal ? onOpenSkinsModal() : handleCycleSkin())}
                  className="w-full py-2.5 bg-[#24243e] hover:bg-[#302b63] text-white font-black text-xs rounded-xl border-2 border-white/60 transition-all flex items-center justify-center gap-2 uppercase"
                >
                  <Palette size={14} className="text-[#FFD700]" /> HARDWARE: {activeSkinConf.name.toUpperCase()} ({activeSkinConf.capability.badge})
                </button>

                <button
                  onClick={handleRestartStage}
                  className="w-full py-2 bg-[#24243e] hover:bg-[#302b63] text-white font-black text-xs rounded-xl border-2 border-white/60 transition-all flex items-center justify-center gap-2 uppercase"
                >
                  <RotateCcw size={14} className="text-[#00FFD1]" /> RESTART STAGE
                </button>

                <button
                  onClick={onExitToMenu}
                  className="w-full py-2 bg-[#1a1a2e] hover:bg-[#FF416C] text-[#8E9299] hover:text-white font-black text-xs rounded-xl border-2 border-white/40 transition-all uppercase"
                >
                  QUIT TO MENU
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER OVERLAY */}
        {isGameOver && (
          <div className="absolute inset-0 bg-[#0f0c29]/90 backdrop-blur-md flex flex-col items-center justify-center z-30 font-sans">
            <div className="bg-[#1a1a2e] border-4 border-[#FF416C] p-6 sm:p-7 rounded-3xl text-center max-w-sm w-full mx-4 shadow-[8px_8px_0_0_#000] space-y-3 sm:space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-[#FF416C] tracking-widest">CRITICAL FAILURE</span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#FF416C] italic tracking-tighter">YOU DIED</h2>
              </div>
              <p className="text-xs text-[#8E9299] font-mono leading-relaxed">
                Mode: <span className="text-[#FFD700] uppercase font-bold">{diffConfig.name}</span>. Respawn at the last checkpoint or restart the zone.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleRespawn}
                  className="w-full py-3 sm:py-3.5 bg-[#FF416C] hover:bg-[#ff577f] text-white font-black text-xs rounded-xl shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 border-3 border-black uppercase italic"
                >
                  <RotateCcw size={16} /> RESPAWN AT CHECKPOINT
                </button>
                <button
                  onClick={handleRestartStage}
                  className="w-full py-2.5 sm:py-3 bg-[#24243e] hover:bg-[#302b63] text-white font-black text-xs rounded-xl border-3 border-white shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase"
                >
                  RESTART STAGE
                </button>
                <button
                  onClick={onExitToMenu}
                  className="w-full py-2 bg-[#1a1a2e] hover:bg-neutral-800 text-[#8E9299] font-black text-xs rounded-xl border-2 border-white/60 transition-all uppercase"
                >
                  EXIT TO MENU
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------
          LANDSCAPE TRANSLUCENT CONTROLLER (ONLY on Phones & Tablets in Landscape)
          Anchored to screen edges so hands rest comfortably!
          ---------------------------------------------------- */}
      {isMobileOrTablet && effectiveIsLandscape && (
        <NintendoController
          engineRef={engineRef}
          skin={settings.handheldSkin || 'vibrant'}
          layout={settings.mobileControlMode === 'handheld' ? 'landscape_wings' : 'compact_overlay'}
          isVirtualLandscape={needsVirtualLandscape}
          onTogglePause={handleTogglePause}
          onRestart={handleRestartStage}
          onSelectHero={onSelectHero}
          vibrationEnabled={settings.vibrationEnabled ?? true}
        />
      )}

      {/* ----------------------------------------------------
          PORTRAIT TRANSLUCENT CONTROLLER (ONLY on Phones & Tablets in Portrait)
          Never rendered on PC!
          ---------------------------------------------------- */}
      {isPortraitHandheld && (
        <NintendoController
          engineRef={engineRef}
          skin={settings.handheldSkin || 'vibrant'}
          layout="portrait_console"
          isVirtualLandscape={false}
          onTogglePause={handleTogglePause}
          onRestart={handleRestartStage}
          onSelectHero={onSelectHero}
          vibrationEnabled={settings.vibrationEnabled ?? true}
        />
      )}

      {/* ----------------------------------------------------
          PC KEYBOARD HELPER BAR (Clean indicator for PC players)
          Disappears on mobile/tablets
          ---------------------------------------------------- */}
      {!isMobileOrTablet && (
        <div className="w-full max-w-5xl px-4 py-2 mt-2 hidden md:flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-5 text-xs text-[#8E9299] font-mono bg-[#1a1a2e]/80 backdrop-blur-md px-5 py-2 rounded-2xl border-2 border-white/30 shadow-[4px_4px_0_0_#000] mx-auto">
            <div className="flex items-center gap-1.5 font-bold">
              <kbd className="px-2 py-0.5 bg-[#FFD700] text-black rounded font-black border border-black shadow-[1px_1px_0_0_#000]">WASD / ARROWS</kbd>
              <span className="text-white text-[11px]">MOVE</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <kbd className="px-2 py-0.5 bg-[#FFD700] text-black rounded font-black border border-black shadow-[1px_1px_0_0_#000]">SPACE</kbd>
              <span className="text-white text-[11px]">JUMP</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <kbd className="px-2 py-0.5 bg-[#FF416C] text-white rounded font-black border border-black shadow-[1px_1px_0_0_#000]">X</kbd>
              <span className="text-white text-[11px]">SLASH</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <kbd className="px-2 py-0.5 bg-[#00B4DB] text-black rounded font-black border border-black shadow-[1px_1px_0_0_#000]">C</kbd>
              <span className="text-white text-[11px]">BOOST</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <kbd className="px-2 py-0.5 bg-[#00FFD1] text-black rounded font-black border border-black shadow-[1px_1px_0_0_#000]">R</kbd>
              <span className="text-white text-[11px]">RESTART</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold border-l border-white/20 pl-4">
              <span className="text-[#FFD700] font-pixel text-[9px]">{diffConfig.badge}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
