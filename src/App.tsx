import React, { useState, useEffect } from 'react';
import {
  Play,
  Layers,
  Sparkles,
  Trophy,
  Settings,
  Shield,
  Zap,
  Sword,
  Heart,
  Volume2,
  VolumeX,
  Tv,
  Gamepad2,
  ChevronRight,
  Flame,
  ArrowUp,
  RotateCcw,
  Smartphone,
  RotateCw,
  Palette,
} from 'lucide-react';
import { GameCanvas } from './components/GameCanvas';
import { HeroSelectModal } from './components/HeroSelectModal';
import { WorldSelectModal } from './components/WorldSelectModal';
import { LevelEditor } from './components/LevelEditor';
import { SettingsModal } from './components/SettingsModal';
import { AchievementsModal } from './components/AchievementsModal';
import { VictoryModal } from './components/VictoryModal';
import { OrientationPrompt } from './components/OrientationPrompt';
import { SkinsModal } from './components/SkinsModal';
import { HERO_CLASSES } from './data/defaultLevels';
import { getLevelByNumber, TOTAL_LEVELS } from './data/levelGenerator';
import {
  Achievement,
  DIFFICULTY_CONFIGS,
  DifficultyMode,
  GameSettings,
  HandheldSkin,
  HeroClassType,
  LevelData,
  LevelStats,
  SKIN_CONFIGS,
  SkinConfig,
  getHighestLevelReached,
  isSkinUnlocked,
} from './types';
import { soundManager } from './audio/SoundManager';

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_step', name: 'First Steps', description: 'Complete your first campaign realm.', icon: '👟', unlocked: false },
  { id: 'coin_hoarder', name: 'Coin Hoarder', description: 'Collect over 50 gold coins.', icon: '🪙', unlocked: false },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Beat any level under par time.', icon: '⚡', unlocked: false },
  { id: 'boss_slayer', name: 'Titan Slayer', description: 'Defeat The Iron Titan in Clockwork Citadel.', icon: '👾', unlocked: false },
  { id: 'overlord_slayer', name: 'Core Annihilator', description: 'Defeat The Supreme Overlord Core in the Final Chamber.', icon: '👑', unlocked: false },
  { id: 'hardcore_champ', name: 'NES Hardcore Legend', description: 'Complete any stage on Hard or Nightmare difficulty.', icon: '💀', unlocked: false },
  { id: 'architect', name: 'Realm Architect', description: 'Playtest a level in the Level Builder.', icon: '📐', unlocked: false },
  { id: 'flawless', name: 'Master Champion', description: 'Earn 3 stars on any campaign stage.', icon: '🌟', unlocked: false },
];

export default function App() {
  // Game Screen Navigation
  const [screen, setScreen] = useState<'menu' | 'game' | 'editor'>('menu');
  const [currentLevel, setCurrentLevel] = useState<LevelData>(() => getLevelByNumber(1));
  const [selectedHero, setSelectedHero] = useState<HeroClassType>('knight');

  // Modals
  const [showHeroModal, setShowHeroModal] = useState(false);
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showSkinsModal, setShowSkinsModal] = useState(false);
  const [newlyUnlockedSkin, setNewlyUnlockedSkin] = useState<SkinConfig | null>(null);
  const [victoryData, setVictoryData] = useState<{
    levelName: string;
    clearTime: number;
    score: number;
    coins: number;
    targetTime: number;
  } | null>(null);

  // Settings
  const [settings, setSettings] = useState<GameSettings>(() => {
    const isTouchOrMobileDevice = typeof window !== 'undefined' && (
      'ontouchstart' in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Tablet|Mobi|Silk/i.test(navigator.userAgent || '') ||
      window.innerWidth <= 1280
    );

    const defaultSettings: GameSettings = {
      soundEnabled: true,
      musicEnabled: true,
      sfxVolume: 0.6,
      musicVolume: 0.5,
      crtFilter: true,
      colorPalette: 'default',
      showFps: false,
      showTouchControls: true,
      screenShake: true,
      difficulty: 'normal',
      handheldSkin: 'vibrant',
      mobileControlMode: 'overlay',
      vibrationEnabled: true,
      forceOrientation: 'auto',
    };

    try {
      const stored = localStorage.getItem('pixel_quest_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaultSettings,
          ...parsed,
          // Always ensure touch controls are enabled on mobile/tablet
          showTouchControls: isTouchOrMobileDevice ? true : (parsed.showTouchControls ?? true),
          mobileControlMode: parsed.mobileControlMode || 'overlay',
        };
      }
    } catch (e) {}
    return defaultSettings;
  });

  // Level Progression & Stats
  const [levelStats, setLevelStats] = useState<Record<string, LevelStats>>(() => {
    try {
      const stored = localStorage.getItem('pixel_quest_stats');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  });

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const stored = localStorage.getItem('pixel_quest_achievements');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return INITIAL_ACHIEVEMENTS;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pixel_quest_settings', JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('pixel_quest_stats', JSON.stringify(levelStats));
    } catch (e) {}
  }, [levelStats]);

  useEffect(() => {
    try {
      localStorage.setItem('pixel_quest_achievements', JSON.stringify(achievements));
    } catch (e) {}
  }, [achievements]);

  const unlockAchievement = (id: string) => {
    setAchievements((prev) =>
      prev.map((a) => (a.id === id && !a.unlocked ? { ...a, unlocked: true } : a))
    );
  };

  const handleUpdateSettings = (newSet: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSet }));
  };

  const handleStartGame = (level: LevelData) => {
    setCurrentLevel(level);
    setScreen('game');
    setVictoryData(null);
  };

  const handleLevelComplete = (time: number, score: number, coins: number) => {
    const diffConf = DIFFICULTY_CONFIGS[settings.difficulty || 'normal'] || DIFFICULTY_CONFIGS.normal;
    const adjustedTarget = currentLevel.targetTime * diffConf.parTimeMultiplier;

    let stars = 1;
    if (time <= adjustedTarget) stars = 3;
    else if (time <= adjustedTarget * 1.35) stars = 2;

    const prevHighest = getHighestLevelReached(levelStats);

    const existing = levelStats[currentLevel.id] || {
      completed: false,
      highScore: 0,
      bestTime: null,
      coinsCollected: 0,
      stars: 0,
      difficulty: settings.difficulty,
    };

    const updatedStats: Record<string, LevelStats> = {
      ...levelStats,
      [currentLevel.id]: {
        completed: true,
        highScore: Math.max(existing.highScore, score),
        bestTime: existing.bestTime === null ? time : Math.min(existing.bestTime, time),
        coinsCollected: existing.coinsCollected + coins,
        stars: Math.max(existing.stars, stars),
        difficulty: settings.difficulty,
      },
    };

    setLevelStats(updatedStats);

    // Check if player reached a new level that unlocks a new hardware skin
    const newHighest = getHighestLevelReached(updatedStats);
    if (newHighest > prevHighest) {
      const newlyUnlocked = Object.values(SKIN_CONFIGS).find(
        (s) => s.requiredLevel > prevHighest && s.requiredLevel <= newHighest
      );
      if (newlyUnlocked) {
        soundManager.playVictory();
        setNewlyUnlockedSkin(newlyUnlocked);
      } else {
        setNewlyUnlockedSkin(null);
      }
    } else {
      setNewlyUnlockedSkin(null);
    }

    // Check Achievements
    unlockAchievement('first_step');
    if (stars === 3) unlockAchievement('flawless');
    if (time <= adjustedTarget) unlockAchievement('speed_demon');
    if (currentLevel.id === 'w3_s2' || currentLevel.id === 'w3_s1') unlockAchievement('boss_slayer');
    if (currentLevel.id === 'w4_s2') unlockAchievement('overlord_slayer');
    if (settings.difficulty === 'hard' || settings.difficulty === 'nightmare') {
      unlockAchievement('hardcore_champ');
    }
    if (coins >= 50) unlockAchievement('coin_hoarder');

    setVictoryData({
      levelName: currentLevel.name,
      clearTime: time,
      score,
      coins,
      targetTime: currentLevel.targetTime,
    });
  };

  const handleNextLevel = () => {
    const currentNum = currentLevel.levelNumber || 1;
    if (currentNum < TOTAL_LEVELS) {
      const nextLvl = getLevelByNumber(currentNum + 1);
      setCurrentLevel(nextLvl);
      setVictoryData(null);
    } else {
      setScreen('menu');
      setVictoryData(null);
    }
  };

  const currentHeroConfig = HERO_CLASSES[selectedHero];
  const activeDiffConfig = DIFFICULTY_CONFIGS[settings.difficulty || 'normal'] || DIFFICULTY_CONFIGS.normal;
  const activeSkinConf = SKIN_CONFIGS[settings.handheldSkin || 'vibrant'] || SKIN_CONFIGS.vibrant;
  const unlockedSkinsCount = Object.values(SKIN_CONFIGS).filter((s) => isSkinUnlocked(s.id, levelStats)).length;
  const highestLevelReached = getHighestLevelReached(levelStats);

  return (
    <div className="w-screen h-screen bg-[#0f0c29] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* ----------------------------------------------------
          ORIENTATION PROMPT NOTICE (Mobile Landscape Prompt)
          ---------------------------------------------------- */}
      <OrientationPrompt
        onSwitchOrientation={() => {
          handleUpdateSettings({ forceOrientation: 'landscape' });
        }}
        onSelectPortrait={() => {
          handleUpdateSettings({ forceOrientation: 'portrait' });
        }}
      />

      {/* ----------------------------------------------------
          1. MAIN MENU SCREEN (Vibrant Palette Theme)
          ---------------------------------------------------- */}
      {screen === 'menu' && (
        <div className="relative w-full h-full flex flex-col items-center justify-between p-4 sm:p-8 overflow-y-auto bg-[#0f0c29]">
          {/* Cyber Grid Background with Glowing Ambient Color Orbs */}
          <div className="absolute inset-0 vibrant-grid opacity-30 pointer-events-none" />
          <div className="absolute top-16 right-16 w-64 h-64 bg-[#FF416C] rounded-full blur-[100px] opacity-25 pointer-events-none" />
          <div className="absolute bottom-20 left-16 w-72 h-72 bg-[#00B4DB] rounded-full blur-[120px] opacity-25 pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#4A00E0] rounded-full blur-[140px] opacity-20 pointer-events-none" />
          {settings.crtFilter && <div className="absolute inset-0 crt-overlay crt-flicker pointer-events-none z-10" />}

          {/* TOP BAR / GOLD MARQUEE & NEO-ARCADE BUTTONS */}
          <div className="w-full max-w-5xl flex items-center justify-between z-20">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-[#1a1a2e] rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 border-2 sm:border-3 border-white flex items-center gap-2 shadow-[4px_4px_0_0_#000]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00FFD1] animate-ping" />
                <span className="font-pixel text-[10px] sm:text-xs text-[#FFD700] tracking-wider font-bold">
                  ARCADE_SYS // NINTENDO
                </span>
              </div>

              {/* Quick Orientation Mode Pill on Mobile */}
              <button
                onClick={() => {
                  soundManager.playCoin();
                  const next = settings.forceOrientation === 'portrait' ? 'landscape' : 'portrait';
                  handleUpdateSettings({ forceOrientation: next });
                }}
                className="px-2.5 py-1.5 sm:px-3 bg-[#1a1a2e] hover:bg-[#24243e] border-2 border-white/60 text-[#FFD700] rounded-xl active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[2px_2px_0_0_#000] flex items-center gap-1.5 font-pixel text-[8px] sm:text-[9px]"
                title="Toggle Mobile Orientation Mode"
              >
                <Smartphone size={13} className={settings.forceOrientation === 'portrait' ? '' : 'rotate-90 text-[#00FFD1]'} />
                <span className="hidden xs:inline uppercase">{settings.forceOrientation === 'portrait' ? 'PORTRAIT' : 'LANDSCAPE'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                onClick={() => setShowSkinsModal(true)}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#1a1a2e] hover:bg-[#24243e] border-2 sm:border-3 border-white text-[#00FFD1] rounded-xl active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-all shadow-[4px_4px_0_0_#000] flex items-center gap-1.5 font-pixel text-[9px] sm:text-[10px]"
                title="Hardware Skins & Capabilities"
              >
                <Gamepad2 size={14} className="text-[#00FFD1]" />
                <span className="hidden sm:inline">SKINS ({unlockedSkinsCount}/5)</span>
              </button>

              <button
                onClick={() => setShowAchievementsModal(true)}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#1a1a2e] hover:bg-[#24243e] border-2 sm:border-3 border-white text-[#FFD700] rounded-xl active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-all shadow-[4px_4px_0_0_#000] flex items-center gap-1.5 font-pixel text-[9px] sm:text-[10px]"
                title="Achievements"
              >
                <Trophy size={14} className="text-[#FFD700]" />
                <span className="hidden sm:inline">TROPHIES</span>
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#1a1a2e] hover:bg-[#24243e] border-2 sm:border-3 border-white text-white rounded-xl active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-all shadow-[4px_4px_0_0_#000] flex items-center gap-1.5 font-pixel text-[9px] sm:text-[10px]"
                title="Settings"
              >
                <Settings size={14} className="text-[#00FFD1]" />
                <span className="hidden sm:inline">CONFIG</span>
              </button>
            </div>
          </div>

          {/* HERO LOGO & TITLE SECTION */}
          <div className="flex flex-col items-center text-center space-y-3.5 my-auto z-20 max-w-2xl px-2 w-full">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#1a1a2e] border-2 border-[#00FFD1] rounded-full text-xs font-pixel text-[#00FFD1] shadow-[0_0_20px_rgba(0,255,209,0.3)]">
              <Sparkles size={13} className="text-[#FFD700] animate-spin" />
              <span className="tracking-widest uppercase text-[9px] sm:text-[10px]">
                NINTENDO HANDHELD & RETRO PLATFORMER
              </span>
            </div>

            <div className="relative">
              <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white uppercase drop-shadow-[0_8px_16px_rgba(255,65,108,0.5)]">
                PIXEL <span className="text-[#FFD700] drop-shadow-[0_8px_20px_rgba(255,215,0,0.6)]">QUEST</span>
              </h1>
              <div className="h-2 w-36 mx-auto mt-1 bg-gradient-to-r from-[#FF416C] via-[#FFD700] to-[#00FFD1] rounded-full shadow-[0_0_12px_#FFD700]" />
            </div>

            <p className="text-xs sm:text-sm text-[#8E9299] max-w-lg leading-relaxed font-mono font-medium">
              1,000 campaign realms across 100 worlds, 8 difficulty tiers, authentic Nintendo D-pad & ABXY controls, translucent hardware skins with capabilities!
            </p>

            {/* DIFFICULTY SELECTOR PILL ROW */}
            <div className="w-full max-w-md bg-[#1a1a2e] border-3 border-white p-2.5 rounded-2xl shadow-[4px_4px_0_0_#000] flex flex-col items-center gap-2">
              <div className="flex items-center justify-between w-full px-2">
                <span className="font-pixel text-[9px] uppercase font-black text-[#8E9299] tracking-wider flex items-center gap-1.5">
                  <Flame size={12} className="text-[#FF416C]" /> DIFFICULTY:
                </span>
                <span
                  className="font-pixel text-[9px] uppercase font-black px-2 py-0.5 rounded border border-black"
                  style={{ backgroundColor: activeDiffConfig.color, color: '#000' }}
                >
                  {activeDiffConfig.badge}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 w-full">
                {(
                  [
                    'zen',
                    'easy',
                    'normal',
                    'heroic',
                    'hard',
                    'expert',
                    'nightmare',
                    'inferno',
                  ] as DifficultyMode[]
                ).map((d) => {
                  const conf = DIFFICULTY_CONFIGS[d];
                  const isSel = settings.difficulty === d;
                  return (
                    <button
                      key={d}
                      onClick={() => {
                        soundManager.playCoin();
                        handleUpdateSettings({ difficulty: d });
                      }}
                      className={`py-1.5 px-1 rounded-xl border-2 font-pixel text-[8px] font-black transition-all ${
                        isSel
                          ? 'border-black shadow-[2px_2px_0_0_#000] scale-105'
                          : 'bg-[#24243e] border-white/20 text-[#8E9299] hover:text-white'
                      }`}
                      style={isSel ? { backgroundColor: conf.color, color: '#000' } : {}}
                    >
                      {conf.badge}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CARDS ROW: HERO SELECT & HARDWARE SKIN SELECT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md">
              {/* ACTIVE HERO CHUNKY CARD */}
              <div
                onClick={() => setShowHeroModal(true)}
                className="group cursor-pointer bg-[#1a1a2e] hover:bg-[#24243e] border-3 border-white p-3 rounded-2xl flex items-center gap-3 transition-all shadow-[4px_4px_0_0_#000] hover:shadow-[4px_4px_0_0_#FFD700] active:translate-x-0.5 active:translate-y-0.5"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl border-2 border-black shadow-[2px_2px_0_0_#000] shrink-0"
                  style={{
                    backgroundColor:
                      selectedHero === 'knight' ? '#FFD700' : selectedHero === 'rogue' ? '#00FFD1' : '#FF416C',
                  }}
                >
                  {selectedHero === 'knight' ? '🛡️' : selectedHero === 'rogue' ? '🗡️' : '🔮'}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] uppercase font-black text-[#8E9299] tracking-widest">HERO</span>
                    <span className="text-[7.5px] font-black text-[#FFD700] bg-[#0f0c29] px-1.5 py-0.2 rounded border border-[#FFD700]">
                      SWITCH
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white italic tracking-tight uppercase truncate">
                    {currentHeroConfig.name}
                  </h3>
                  <span className="text-[9px] text-[#00FFD1] font-mono block truncate">{currentHeroConfig.title}</span>
                </div>
              </div>

              {/* HARDWARE SKIN & CAPABILITY CARD */}
              <div
                onClick={() => setShowSkinsModal(true)}
                className="group cursor-pointer bg-[#1a1a2e] hover:bg-[#24243e] border-3 border-white p-3 rounded-2xl flex items-center gap-3 transition-all shadow-[4px_4px_0_0_#000] hover:shadow-[4px_4px_0_0_#00FFD1] active:translate-x-0.5 active:translate-y-0.5"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl border-2 border-black shadow-[2px_2px_0_0_#000] shrink-0"
                  style={{ backgroundColor: activeSkinConf.themeColor, color: '#000' }}
                >
                  {activeSkinConf.id === 'dmg_gameboy'
                    ? '👾'
                    : activeSkinConf.id === 'nes_classic'
                    ? '🕹️'
                    : activeSkinConf.id === 'snes'
                    ? '🎮'
                    : activeSkinConf.id === 'switch_neon'
                    ? '⚡'
                    : '💎'}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] uppercase font-black text-[#8E9299] tracking-widest">SKIN PERK</span>
                    <span className="text-[7.5px] font-pixel text-[#00FFD1] bg-[#0f0c29] px-1.5 py-0.2 rounded border border-[#00FFD1]">
                      {unlockedSkinsCount}/{Object.keys(SKIN_CONFIGS).length}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white italic tracking-tight uppercase truncate">
                    {activeSkinConf.name}
                  </h3>
                  <span
                    className="text-[8px] font-pixel font-bold uppercase block truncate"
                    style={{ color: activeSkinConf.themeColor }}
                  >
                    {activeSkinConf.capability.badge}
                  </span>
                </div>
              </div>
            </div>

            {/* MAIN MENU BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md pt-1">
              {highestLevelReached > 1 ? (
                <>
                  <button
                    onClick={() => {
                      soundManager.playVictory();
                      handleStartGame(getLevelByNumber(highestLevelReached));
                    }}
                    className="col-span-1 sm:col-span-2 py-3 bg-[#FFD700] hover:bg-[#ffea00] text-black font-black tracking-wider text-sm rounded-2xl shadow-[5px_5px_0_0_#B8860B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0_0_#B8860B] transition-all flex items-center justify-center gap-2 border-4 border-black uppercase italic"
                  >
                    <Play size={18} className="fill-black" /> RESUME LEVEL {highestLevelReached}
                  </button>
                  <button
                    onClick={() => {
                      soundManager.playCheckpoint();
                      setShowWorldModal(true);
                    }}
                    className="py-2.5 bg-[#1a1a2e] hover:bg-[#4A00E0] text-white font-black text-xs rounded-xl border-3 border-white shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                  >
                    <Layers size={15} className="text-[#00FFD1]" /> 1,000 REALMS MAP
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    soundManager.playVictory();
                    handleStartGame(getLevelByNumber(1));
                  }}
                  className="col-span-1 sm:col-span-2 py-3 bg-[#FFD700] hover:bg-[#ffea00] text-black font-black tracking-wider text-sm rounded-2xl shadow-[5px_5px_0_0_#B8860B] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0_0_#B8860B] transition-all flex items-center justify-center gap-3 border-4 border-black uppercase italic"
                >
                  <Play size={18} className="fill-black" /> START CAMPAIGN (1,000 REALMS)
                </button>
              )}

              {highestLevelReached <= 1 && (
                <button
                  onClick={() => {
                    soundManager.playCheckpoint();
                    setShowWorldModal(true);
                  }}
                  className="py-2.5 bg-[#1a1a2e] hover:bg-[#4A00E0] text-white font-black text-xs rounded-xl border-3 border-white shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                  <Layers size={15} className="text-[#00FFD1]" /> 1,000 REALMS MAP
                </button>
              )}

              <button
                onClick={() => {
                  soundManager.playCheckpoint();
                  setScreen('editor');
                }}
                className="py-2.5 bg-[#1a1a2e] hover:bg-[#FF416C] text-white font-black text-xs rounded-xl border-3 border-white shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                <Sparkles size={15} className="text-[#FFD700]" /> LEVEL BUILDER
              </button>
            </div>
          </div>

          {/* FOOTER CONTROLS HELPER */}
          <div className="w-full max-w-5xl flex items-center justify-between text-[11px] text-[#8E9299] font-mono pt-3 border-t border-[#302b63]/60 z-20">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00F260]" />
              D-Pad / WASD to Move • A / Space to Jump • B / X to Attack • Skill Boost
            </span>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline font-bold text-[#FFD700]">NINTENDO JOYPAD 🎮</span>
              <span className="font-bold text-[#00FFD1] uppercase">
                SKIN: {activeSkinConf.name} ({activeSkinConf.capability.badge})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          2. ACTIVE GAMEPLAY CANVAS
          ---------------------------------------------------- */}
      {screen === 'game' && (
        <GameCanvas
          level={currentLevel}
          heroType={selectedHero}
          settings={settings}
          levelStats={levelStats}
          onLevelComplete={handleLevelComplete}
          onExitToMenu={() => {
            soundManager.stopBGM();
            setScreen('menu');
          }}
          onRestart={() => {
            const lvl = currentLevel;
            setCurrentLevel({ ...lvl });
          }}
          onSelectHero={() => setShowHeroModal(true)}
          onUpdateSettings={handleUpdateSettings}
          onOpenSkinsModal={() => setShowSkinsModal(true)}
        />
      )}

      {/* ----------------------------------------------------
          3. CUSTOM LEVEL BUILDER
          ---------------------------------------------------- */}
      {screen === 'editor' && (
        <LevelEditor
          onPlayTest={(customLevel) => {
            unlockAchievement('architect');
            handleStartGame(customLevel);
          }}
          onExit={() => setScreen('menu')}
        />
      )}

      {/* ----------------------------------------------------
          MODALS
          ---------------------------------------------------- */}
      {showHeroModal && (
        <HeroSelectModal
          selectedHero={selectedHero}
          onSelectHero={(hero) => setSelectedHero(hero)}
          onClose={() => setShowHeroModal(false)}
        />
      )}

      {showWorldModal && (
        <WorldSelectModal
          levelStats={levelStats}
          currentDifficulty={settings.difficulty || 'normal'}
          onSelectLevel={(lvl) => {
            setShowWorldModal(false);
            handleStartGame(lvl);
          }}
          onUpdateDifficulty={(diff) => handleUpdateSettings({ difficulty: diff })}
          onClose={() => setShowWorldModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          levelStats={levelStats}
          onUpdateSettings={handleUpdateSettings}
          onOpenSkinsModal={() => {
            setShowSettingsModal(false);
            setShowSkinsModal(true);
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showSkinsModal && (
        <SkinsModal
          currentSkin={settings.handheldSkin || 'vibrant'}
          levelStats={levelStats}
          onSelectSkin={(skin) => {
            handleUpdateSettings({ handheldSkin: skin });
          }}
          onClose={() => setShowSkinsModal(false)}
        />
      )}

      {showAchievementsModal && (
        <AchievementsModal
          achievements={achievements}
          onClose={() => setShowAchievementsModal(false)}
        />
      )}

      {victoryData && (
        <VictoryModal
          levelName={victoryData.levelName}
          clearTime={victoryData.clearTime}
          score={victoryData.score}
          coins={victoryData.coins}
          targetTime={victoryData.targetTime}
          onNextLevel={handleNextLevel}
          onReplay={() => {
            setVictoryData(null);
            const lvl = currentLevel;
            setCurrentLevel({ ...lvl });
          }}
          onMenu={() => {
            setVictoryData(null);
            setScreen('menu');
          }}
          hasNextLevel={(currentLevel.levelNumber || 1) < TOTAL_LEVELS}
          newlyUnlockedSkin={newlyUnlockedSkin}
          onEquipSkin={(skin) => handleUpdateSettings({ handheldSkin: skin })}
        />
      )}
    </div>
  );
}
