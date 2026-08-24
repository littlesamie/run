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
} from 'lucide-react';
import { GameCanvas } from './components/GameCanvas';
import { HeroSelectModal } from './components/HeroSelectModal';
import { WorldSelectModal } from './components/WorldSelectModal';
import { LevelEditor } from './components/LevelEditor';
import { SettingsModal } from './components/SettingsModal';
import { AchievementsModal } from './components/AchievementsModal';
import { VictoryModal } from './components/VictoryModal';
import { CAMPAIGN_LEVELS, HERO_CLASSES } from './data/defaultLevels';
import { Achievement, GameSettings, HeroClassType, LevelData, LevelStats } from './types';
import { soundManager } from './audio/SoundManager';

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_step', name: 'First Steps', description: 'Complete your first campaign realm.', icon: '👟', unlocked: false },
  { id: 'coin_hoarder', name: 'Coin Hoarder', description: 'Collect over 50 gold coins.', icon: '🪙', unlocked: false },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Beat any level under par time.', icon: '⚡', unlocked: false },
  { id: 'boss_slayer', name: 'Titan Slayer', description: 'Defeat The Iron Titan in Clockwork Citadel.', icon: '👾', unlocked: false },
  { id: 'architect', name: 'Realm Architect', description: 'Playtest a level in the Level Builder.', icon: '📐', unlocked: false },
  { id: 'flawless', name: 'Master Champion', description: 'Earn 3 stars on any campaign stage.', icon: '🌟', unlocked: false },
];

export default function App() {
  // Game Screen Navigation
  const [screen, setScreen] = useState<'menu' | 'game' | 'editor'>('menu');
  const [currentLevel, setCurrentLevel] = useState<LevelData>(CAMPAIGN_LEVELS[0]);
  const [selectedHero, setSelectedHero] = useState<HeroClassType>('knight');

  // Modals
  const [showHeroModal, setShowHeroModal] = useState(false);
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [victoryData, setVictoryData] = useState<{
    levelName: string;
    clearTime: number;
    score: number;
    coins: number;
    targetTime: number;
  } | null>(null);

  // Settings
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const stored = localStorage.getItem('pixel_quest_settings');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      soundEnabled: true,
      musicEnabled: true,
      sfxVolume: 0.6,
      musicVolume: 0.5,
      crtFilter: true,
      colorPalette: 'default',
      showFps: false,
      showTouchControls: false,
      screenShake: true,
    };
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
    let stars = 1;
    if (time <= currentLevel.targetTime) stars = 3;
    else if (time <= currentLevel.targetTime * 1.35) stars = 2;

    setLevelStats((prev) => {
      const existing = prev[currentLevel.id] || {
        completed: false,
        highScore: 0,
        bestTime: null,
        coinsCollected: 0,
        stars: 0,
      };

      return {
        ...prev,
        [currentLevel.id]: {
          completed: true,
          highScore: Math.max(existing.highScore, score),
          bestTime: existing.bestTime === null ? time : Math.min(existing.bestTime, time),
          coinsCollected: existing.coinsCollected + coins,
          stars: Math.max(existing.stars, stars),
        },
      };
    });

    // Check Achievements
    unlockAchievement('first_step');
    if (stars === 3) unlockAchievement('flawless');
    if (time <= currentLevel.targetTime) unlockAchievement('speed_demon');
    if (currentLevel.id === 'w3_s1') unlockAchievement('boss_slayer');
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
    const currentIndex = CAMPAIGN_LEVELS.findIndex((l) => l.id === currentLevel.id);
    if (currentIndex !== -1 && currentIndex + 1 < CAMPAIGN_LEVELS.length) {
      setCurrentLevel(CAMPAIGN_LEVELS[currentIndex + 1]);
      setVictoryData(null);
    } else {
      setScreen('menu');
      setVictoryData(null);
    }
  };

  const currentHeroConfig = HERO_CLASSES[selectedHero];

  return (
    <div className="w-screen h-screen bg-[#0f0c29] text-white flex flex-col overflow-hidden font-sans select-none">
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
            <div className="flex items-center gap-3">
              <div className="bg-[#1a1a2e] rounded-xl px-4 py-2 border-2 sm:border-3 border-white flex items-center gap-2 shadow-[4px_4px_0_0_#000]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00FFD1] animate-ping" />
                <span className="font-pixel text-[10px] sm:text-xs text-[#FFD700] tracking-wider font-bold">
                  ARCADE_SYS // VIBRANT
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAchievementsModal(true)}
                className="px-3.5 py-2 bg-[#1a1a2e] hover:bg-[#24243e] border-2 sm:border-3 border-white text-[#FFD700] rounded-xl active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-all shadow-[4px_4px_0_0_#000] flex items-center gap-2 font-pixel text-[10px]"
                title="Achievements"
              >
                <Trophy size={14} className="text-[#FFD700]" />
                <span className="hidden sm:inline">TROPHIES</span>
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-3.5 py-2 bg-[#1a1a2e] hover:bg-[#24243e] border-2 sm:border-3 border-white text-white rounded-xl active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-all shadow-[4px_4px_0_0_#000] flex items-center gap-2 font-pixel text-[10px]"
                title="Settings"
              >
                <Settings size={14} className="text-[#00FFD1]" />
                <span className="hidden sm:inline">CONFIG</span>
              </button>
            </div>
          </div>

          {/* HERO LOGO & TITLE SECTION */}
          <div className="flex flex-col items-center text-center space-y-5 my-auto z-20 max-w-2xl px-2">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-[#1a1a2e] border-2 border-[#00FFD1] rounded-full text-xs font-pixel text-[#00FFD1] shadow-[0_0_20px_rgba(0,255,209,0.3)]">
              <Sparkles size={14} className="text-[#FFD700] animate-spin" />
              <span className="tracking-widest uppercase text-[10px]">2D CYBER PLATFORMER QUEST</span>
            </div>

            <div className="relative">
              <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white uppercase drop-shadow-[0_8px_16px_rgba(255,65,108,0.5)]">
                PIXEL <span className="text-[#FFD700] drop-shadow-[0_8px_20px_rgba(255,215,0,0.6)]">QUEST</span>
              </h1>
              <div className="h-2 w-36 mx-auto mt-1 bg-gradient-to-r from-[#FF416C] via-[#FFD700] to-[#00FFD1] rounded-full shadow-[0_0_12px_#FFD700]" />
            </div>

            <p className="text-xs sm:text-sm text-[#8E9299] max-w-lg leading-relaxed font-mono font-medium">
              Dash, slash, and jump across neon hazard zones. Master unique hero mechanics, defeat gargantuan bosses, or craft your own retro stages!
            </p>

            {/* ACTIVE HERO CHUNKY CARD (Vibrant Palette Neo-Brutalist Card) */}
            <div
              onClick={() => setShowHeroModal(true)}
              className="group cursor-pointer bg-[#1a1a2e] hover:bg-[#24243e] border-4 border-white p-3.5 px-6 rounded-2xl flex items-center gap-4 transition-all shadow-[6px_6px_0_0_#000] hover:shadow-[6px_6px_0_0_#FFD700] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_0_#000]"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-3 border-black shadow-[3px_3px_0_0_#000]"
                style={{ backgroundColor: selectedHero === 'knight' ? '#FFD700' : selectedHero === 'rogue' ? '#00FFD1' : '#FF416C' }}
              >
                {selectedHero === 'knight' ? '🛡️' : selectedHero === 'rogue' ? '🗡️' : '🔮'}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black text-[#8E9299] tracking-widest">ACTIVE HERO</span>
                  <span className="text-[9px] font-black text-[#FFD700] bg-[#0f0c29] px-2 py-0.5 rounded-md border border-[#FFD700]">SWITCH</span>
                </div>
                <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">{currentHeroConfig.name}</h3>
                <span className="text-[10px] text-[#00FFD1] font-mono block">{currentHeroConfig.title}</span>
              </div>
            </div>

            {/* MAIN MENU BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-md pt-2">
              <button
                onClick={() => {
                  soundManager.playVictory();
                  handleStartGame(CAMPAIGN_LEVELS[0]);
                }}
                className="col-span-1 sm:col-span-2 py-4 bg-[#FFD700] hover:bg-[#ffea00] text-black font-black tracking-wider text-sm rounded-2xl shadow-[6px_6px_0_0_#B8860B] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_0_#B8860B] transition-all flex items-center justify-center gap-3 border-4 border-black uppercase italic"
              >
                <Play size={20} className="fill-black" /> START CAMPAIGN
              </button>

              <button
                onClick={() => {
                  soundManager.playCheckpoint();
                  setShowWorldModal(true);
                }}
                className="py-3.5 bg-[#1a1a2e] hover:bg-[#4A00E0] text-white font-black text-xs rounded-2xl border-4 border-white shadow-[4px_4px_0_0_#000] hover:shadow-[4px_4px_0_0_#2E008C] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0_0_#000] transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                <Layers size={16} className="text-[#00FFD1]" /> SELECT REALM
              </button>

              <button
                onClick={() => {
                  soundManager.playCheckpoint();
                  setScreen('editor');
                }}
                className="py-3.5 bg-[#1a1a2e] hover:bg-[#FF416C] text-white font-black text-xs rounded-2xl border-4 border-white shadow-[4px_4px_0_0_#000] hover:shadow-[4px_4px_0_0_#9E0045] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0_0_#000] transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                <Sparkles size={16} className="text-[#FFD700]" /> LEVEL BUILDER
              </button>
            </div>
          </div>

          {/* FOOTER CONTROLS HELPER */}
          <div className="w-full max-w-5xl flex items-center justify-between text-[11px] text-[#8E9299] font-mono pt-4 border-t border-[#302b63]/60 z-20">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00F260]" />
              WASD / Arrows to Move • Space to Jump • X to Attack • C for Skill
            </span>
            <span className="hidden sm:inline font-bold text-[#FFD700]">GAMEPAD READY 🎮</span>
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
          onLevelComplete={handleLevelComplete}
          onExitToMenu={() => {
            soundManager.stopBGM();
            setScreen('menu');
          }}
          onRestart={() => {
            // Force re-render by toggling
            const lvl = currentLevel;
            setCurrentLevel({ ...lvl });
          }}
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
          onSelectLevel={(lvl) => {
            setShowWorldModal(false);
            handleStartGame(lvl);
          }}
          onClose={() => setShowWorldModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettingsModal(false)}
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
          hasNextLevel={
            CAMPAIGN_LEVELS.findIndex((l) => l.id === currentLevel.id) < CAMPAIGN_LEVELS.length - 1
          }
        />
      )}
    </div>
  );
}
