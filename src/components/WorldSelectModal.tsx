import React, { useState, useMemo } from 'react';
import {
  Star,
  Trophy,
  Clock,
  Play,
  Lock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  Compass,
  Flame,
  CheckCircle2,
  Unlock,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { DifficultyMode, LevelData, LevelStats, DIFFICULTY_CONFIGS, getHighestLevelReached } from '../types';
import {
  TOTAL_LEVELS,
  TOTAL_WORLDS,
  LEVELS_PER_WORLD,
  WORLDS,
  SECTORS,
  getLevelByNumber,
  getWorldLevels,
} from '../data/levelGenerator';
import { soundManager } from '../audio/SoundManager';

interface WorldSelectModalProps {
  levelStats: Record<string, LevelStats>;
  currentDifficulty?: DifficultyMode;
  onSelectLevel: (level: LevelData) => void;
  onUpdateDifficulty?: (difficulty: DifficultyMode) => void;
  onClose: () => void;
}

const ALL_DIFFICULTIES: DifficultyMode[] = [
  'zen',
  'easy',
  'normal',
  'heroic',
  'hard',
  'expert',
  'nightmare',
  'inferno',
];

export const WorldSelectModal: React.FC<WorldSelectModalProps> = ({
  levelStats,
  currentDifficulty = 'normal',
  onSelectLevel,
  onUpdateDifficulty,
  onClose,
}) => {
  const highestLevel = useMemo(() => getHighestLevelReached(levelStats), [levelStats]);
  const defaultWorld = useMemo(() => Math.ceil(highestLevel / LEVELS_PER_WORLD), [highestLevel]);

  const [currentWorldIndex, setCurrentWorldIndex] = useState<number>(defaultWorld);
  const [jumpInput, setJumpInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<number>(0); // 0 = all
  const [showWorldDirectory, setShowWorldDirectory] = useState<boolean>(false);
  const [freePlayUnlocked, setFreePlayUnlocked] = useState<boolean>(false);
  const [showDiffPicker, setShowDiffPicker] = useState<boolean>(false);

  // Overall Statistics
  const { totalCompleted, totalStars } = useMemo(() => {
    let completed = 0;
    let stars = 0;
    Object.values(levelStats).forEach((st: LevelStats) => {
      if (st?.completed) completed++;
      if (st?.stars) stars += st.stars;
    });
    return { totalCompleted: completed, totalStars: stars };
  }, [levelStats]);

  // Current World Data
  const currentWorld = WORLDS[currentWorldIndex - 1] || WORLDS[0];
  const currentLevels = useMemo(() => getWorldLevels(currentWorldIndex), [currentWorldIndex]);

  // Handle Level Selection
  const handleLevelClick = (lvl: LevelData, isUnlocked: boolean) => {
    if (!isUnlocked && !freePlayUnlocked) return;
    soundManager.playCheckpoint();
    onSelectLevel(lvl);
  };

  // Jump to specific level number
  const handleJumpToLevel = (targetStr?: string) => {
    const raw = targetStr !== undefined ? targetStr : jumpInput;
    const num = parseInt(raw.trim(), 10);
    if (!isNaN(num) && num >= 1 && num <= TOTAL_LEVELS) {
      soundManager.playCoin();
      const targetWorld = Math.ceil(num / LEVELS_PER_WORLD);
      setCurrentWorldIndex(targetWorld);
      setShowWorldDirectory(false);
      setJumpInput('');
    }
  };

  // Check if a specific level is unlocked
  const checkLevelUnlocked = (lvl: LevelData): boolean => {
    if (freePlayUnlocked) return true;
    if (lvl.levelNumber === 1) return true;
    if (lvl.levelNumber <= highestLevel) return true;

    // Check if previous level was completed in levelStats
    const prevNum = lvl.levelNumber - 1;
    const prevKeyLvl = `lvl_${prevNum}`;
    const legacyMap: Record<number, string> = {
      1: 'w1_s1',
      2: 'w1_s2',
      3: 'w2_s1',
      4: 'w2_s2',
      5: 'w3_s1',
      6: 'w3_s2',
      7: 'w4_s1',
      8: 'w4_s2',
    };
    const legacyKey = legacyMap[prevNum];
    if (levelStats[prevKeyLvl]?.completed || (legacyKey && levelStats[legacyKey]?.completed)) {
      return true;
    }
    return false;
  };

  // Continue at highest unlocked level
  const handleContinueHighest = () => {
    const nextLvl = getLevelByNumber(highestLevel);
    soundManager.playVictory();
    onSelectLevel(nextLvl);
  };

  // Filtered worlds for the directory drawer
  const filteredWorlds = useMemo(() => {
    return WORLDS.filter((w) => {
      if (selectedSector > 0) {
        const startSec = (selectedSector - 1) * 20 + 1;
        const endSec = selectedSector * 20;
        if (w.worldIndex < startSec || w.worldIndex > endSec) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          w.name.toLowerCase().includes(q) ||
          w.worldIndex.toString() === q ||
          w.biome.toLowerCase().includes(q) ||
          (q.startsWith('level') && (q.includes(w.startLevel.toString()) || q.includes(w.endLevel.toString())))
        );
      }
      return true;
    });
  }, [selectedSector, searchQuery]);

  const diffConfig = DIFFICULTY_CONFIGS[currentDifficulty] || DIFFICULTY_CONFIGS.normal;

  return (
    <div className="fixed inset-0 bg-[#070514]/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-200 font-sans select-none">
      <div className="bg-[#141226] border-4 border-white/90 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-[10px_10px_0_0_#000] flex flex-col max-h-[94vh] overflow-hidden gap-3.5">
        
        {/* ----------------------------------------------------
            1. TOP HEADER & GLOBAL CAMPAIGN STATS
            ---------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-white/15 pb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-[#00FFD1] tracking-widest flex items-center gap-1 font-mono">
                <Compass size={12} /> GRAND CAMPAIGN
              </span>
              <span className="px-2 py-0.5 bg-gradient-to-r from-[#FFD700] to-[#FF6B6B] text-black text-[9px] font-black rounded uppercase tracking-wider shadow-sm">
                1,000 REALMS
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tight uppercase flex items-center gap-2">
              REALM SELECTOR
            </h2>
          </div>

          {/* Quick Metrics Pill & Close */}
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2.5 bg-[#1e1b38] px-3 py-1.5 rounded-xl border border-white/20 text-xs font-mono">
              <span className="text-[#00FFD1] font-bold flex items-center gap-1">
                <CheckCircle2 size={13} /> {totalCompleted}/1,000
              </span>
              <span className="text-white/30">•</span>
              <span className="text-[#FFD700] font-bold flex items-center gap-1">
                <Star size={13} className="fill-[#FFD700]" /> {totalStars}
              </span>
            </div>

            {/* Quick Continue Button */}
            <button
              onClick={handleContinueHighest}
              className="px-3.5 py-1.5 bg-[#FFD700] hover:bg-[#ffea00] text-black font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0_0_#B8860B] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 uppercase italic shrink-0"
              title={`Play highest unlocked level: Level ${highestLevel}`}
            >
              <span>RESUME LVL {highestLevel}</span>
              <ArrowRight size={13} />
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#24243e] hover:bg-[#302b63] border-2 border-white/60 text-white rounded-xl text-xs font-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 uppercase transition-all"
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------
            2. SECONDARY CONTROLS: SECTORS & DIFFICULTY QUICK SELECTOR
            ---------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          {/* Sector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedSector(0)}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-pixel font-bold uppercase whitespace-nowrap transition-all border ${
                selectedSector === 0
                  ? 'bg-white text-black border-white shadow-[2px_2px_0_0_#000]'
                  : 'bg-[#1e1b38] text-[#8E9299] hover:text-white border-white/20'
              }`}
            >
              ALL WORLDS
            </button>

            {SECTORS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  setSelectedSector(sec.id);
                  const startWorld = (sec.id - 1) * 20 + 1;
                  setCurrentWorldIndex(startWorld);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-pixel font-bold uppercase whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  selectedSector === sec.id
                    ? 'border-white shadow-[2px_2px_0_0_#000]'
                    : 'bg-[#1e1b38] text-[#8E9299] hover:text-white border-white/20'
                }`}
                style={selectedSector === sec.id ? { backgroundColor: sec.color, color: '#000' } : {}}
              >
                <span>{sec.icon}</span>
                <span>{sec.name.split(':')[0]}</span>
              </button>
            ))}
          </div>

          {/* Difficulty Quick Toggle & Free Play Checkbox */}
          <div className="flex items-center gap-2 shrink-0 justify-end">
            {/* Interactive Difficulty Button */}
            <div className="relative">
              <button
                onClick={() => setShowDiffPicker(!showDiffPicker)}
                className="px-2.5 py-1.5 bg-[#1e1b38] hover:bg-[#28244c] border-2 border-white/50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 uppercase shadow-[2px_2px_0_0_#000] transition-all"
                title="Change Game Difficulty"
              >
                <Flame size={13} style={{ color: diffConfig.color }} />
                <span className="font-pixel text-[9px]" style={{ color: diffConfig.color }}>
                  {diffConfig.badge}
                </span>
              </button>

              {/* Popover Difficulty Options */}
              {showDiffPicker && (
                <div className="absolute right-0 top-full mt-1.5 bg-[#1a1a2e] border-3 border-white rounded-2xl p-2 z-40 shadow-[6px_6px_0_0_#000] grid grid-cols-2 gap-1.5 w-64 animate-in fade-in zoom-in duration-150">
                  {ALL_DIFFICULTIES.map((d) => {
                    const conf = DIFFICULTY_CONFIGS[d];
                    const isSel = currentDifficulty === d;
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          soundManager.playCoin();
                          onUpdateDifficulty?.(d);
                          setShowDiffPicker(false);
                        }}
                        className={`p-1.5 rounded-lg border font-pixel text-[8px] font-black text-center transition-all ${
                          isSel ? 'border-black shadow-sm' : 'border-white/20 bg-[#24243e] text-[#8E9299]'
                        }`}
                        style={isSel ? { backgroundColor: conf.color, color: '#000' } : {}}
                      >
                        {conf.badge}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Free Play Toggle */}
            <button
              onClick={() => {
                soundManager.playCoin();
                setFreePlayUnlocked(!freePlayUnlocked);
              }}
              className={`px-2.5 py-1.5 rounded-xl border-2 text-[9px] font-pixel font-bold flex items-center gap-1 transition-all ${
                freePlayUnlocked
                  ? 'bg-[#00FFD1] text-black border-black shadow-[2px_2px_0_0_#000]'
                  : 'bg-[#1e1b38] text-[#8E9299] border-white/20 hover:text-white'
              }`}
              title="Unlock all 1000 levels for testing and sandbox traversal"
            >
              <Unlock size={11} />
              <span>FREE PLAY</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------
            3. WORLD NAVIGATION CAROUSEL, JUMP INPUT & BROWSE
            ---------------------------------------------------- */}
        <div className="bg-[#1e1b38] border-2 border-white/30 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-[4px_4px_0_0_#000] shrink-0">
          {/* World Stepper */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
            <button
              disabled={currentWorldIndex <= 1}
              onClick={() => {
                soundManager.playCoin();
                setCurrentWorldIndex((w) => Math.max(1, w - 1));
              }}
              className="p-2 bg-[#24243e] hover:bg-[#302b63] disabled:opacity-30 disabled:cursor-not-allowed border-2 border-white/50 text-white rounded-xl active:scale-95 transition-all shadow-sm"
              title="Previous World"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Current World Identity Card */}
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-pixel text-[9px] uppercase tracking-wider text-[#8E9299]">
                  WORLD {currentWorldIndex} OF {TOTAL_WORLDS}
                </span>
                <span
                  className="px-1.5 py-0.2 rounded text-[7.5px] font-pixel font-bold uppercase border border-black"
                  style={{ backgroundColor: currentWorld.color, color: '#000' }}
                >
                  {currentWorld.biome}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white italic tracking-tight uppercase leading-tight">
                {currentWorld.name}
              </h3>
              <span className="text-[10px] font-mono text-[#00FFD1] font-bold">
                Levels {currentWorld.startLevel} – {currentWorld.endLevel}
              </span>
            </div>

            <button
              disabled={currentWorldIndex >= TOTAL_WORLDS}
              onClick={() => {
                soundManager.playCoin();
                setCurrentWorldIndex((w) => Math.min(TOTAL_WORLDS, w + 1));
              }}
              className="p-2 bg-[#24243e] hover:bg-[#302b63] disabled:opacity-30 disabled:cursor-not-allowed border-2 border-white/50 text-white rounded-xl active:scale-95 transition-all shadow-sm"
              title="Next World"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Jump by Level Number & World Directory Toggle */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1 bg-[#141226] border-2 border-white/40 rounded-xl px-2 py-1">
              <span className="text-[9px] font-pixel text-[#8E9299]">LVL</span>
              <input
                type="number"
                min={1}
                max={TOTAL_LEVELS}
                placeholder="1-1000"
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleJumpToLevel();
                }}
                className="w-16 bg-transparent text-white font-mono text-xs font-bold outline-none text-center"
              />
              <button
                onClick={() => handleJumpToLevel()}
                className="px-2 py-0.5 bg-[#00FFD1] hover:bg-[#38bdf8] text-black font-black text-[9px] rounded font-pixel uppercase shadow-sm"
              >
                GO
              </button>
            </div>

            <button
              onClick={() => setShowWorldDirectory(!showWorldDirectory)}
              className="px-3 py-2 bg-[#24243e] hover:bg-[#302b63] border-2 border-white text-white rounded-xl text-xs font-black flex items-center gap-1.5 uppercase shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <Layers size={13} className="text-[#FFD700]" />
              <span className="hidden sm:inline">ALL</span> WORLDS
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------
            4. 100-WORLD DIRECTORY GRID MODAL OVERLAY
            ---------------------------------------------------- */}
        {showWorldDirectory && (
          <div className="bg-[#1a1a2e] border-3 border-[#FFD700] rounded-2xl p-3 sm:p-4 space-y-3 z-30 shadow-[6px_6px_0_0_#000] animate-in fade-in zoom-in duration-150 flex flex-col max-h-[50vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[10px] text-[#FFD700] font-black uppercase">
                  DIRECTORY OF 100 WORLDS
                </span>
                <span className="text-xs text-[#8E9299] font-mono">Select any world to inspect stages</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search World / Biome..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-2.5 py-1 bg-[#141226] border border-white/30 rounded-lg text-xs font-mono text-white placeholder-white/30 outline-none w-36 sm:w-48"
                  />
                  <Search size={11} className="absolute right-2 top-2 text-white/40" />
                </div>
                <button
                  onClick={() => setShowWorldDirectory(false)}
                  className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white text-[10px] font-pixel rounded"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 pr-1">
              {filteredWorlds.map((w) => {
                const isSelected = w.worldIndex === currentWorldIndex;
                const isWorldUnlocked =
                  freePlayUnlocked ||
                  w.startLevel <= highestLevel ||
                  (w.worldIndex > 1 &&
                    WORLDS[w.worldIndex - 2] &&
                    levelStats[`lvl_${WORLDS[w.worldIndex - 2].endLevel}`]?.completed);

                return (
                  <button
                    key={w.worldIndex}
                    onClick={() => {
                      soundManager.playCoin();
                      setCurrentWorldIndex(w.worldIndex);
                      setShowWorldDirectory(false);
                    }}
                    className={`p-2 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#FFD700] bg-[#302b63] shadow-[3px_3px_0_0_#FFD700]'
                        : isWorldUnlocked
                        ? 'border-white/30 bg-[#24243e] hover:border-white'
                        : 'border-white/10 bg-[#141226] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[8px] font-pixel text-[#8E9299]">
                      <span>W-{w.worldIndex}</span>
                      <span style={{ color: w.color }}>{w.biome}</span>
                    </div>
                    <span className="text-xs font-black text-white truncate uppercase italic mt-0.5">
                      {w.name}
                    </span>
                    <span className="text-[9px] font-mono text-[#00FFD1] font-bold">
                      Lvls {w.startLevel}–{w.endLevel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            5. CURRENT WORLD: 10 STAGE CARDS
            ---------------------------------------------------- */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentLevels.map((lvl) => {
              const isUnlocked = checkLevelUnlocked(lvl);
              const stats = levelStats[lvl.id] ||
                levelStats[`lvl_${lvl.levelNumber}`] || {
                  completed: false,
                  highScore: 0,
                  bestTime: null,
                  coinsCollected: 0,
                  stars: 0,
                };

              const isBoss = lvl.isBossStage || lvl.stageIndex === LEVELS_PER_WORLD;

              return (
                <div
                  key={lvl.id}
                  onClick={() => handleLevelClick(lvl, isUnlocked)}
                  className={`p-3 sm:p-3.5 rounded-2xl border-3 flex items-center justify-between gap-3 transition-all ${
                    isUnlocked
                      ? isBoss
                        ? 'bg-gradient-to-r from-[#2a1322] to-[#1e142c] border-[#FF416C] hover:border-[#FFD700] cursor-pointer shadow-[4px_4px_0_0_#000] hover:shadow-[4px_4px_0_0_#FF416C] active:translate-x-0.5 active:translate-y-0.5'
                        : 'bg-[#1e1b38] border-white/70 hover:border-[#00FFD1] hover:bg-[#28244c] cursor-pointer shadow-[3px_3px_0_0_#000] hover:shadow-[3px_3px_0_0_#00FFD1] active:translate-x-0.5 active:translate-y-0.5'
                      : 'bg-[#141226] border-white/15 opacity-40 cursor-not-allowed'
                  }`}
                >
                  {/* Left: Level Identifier Badge & Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-black border-2 border-black shrink-0 shadow-[2px_2px_0_0_#000] ${
                        isBoss
                          ? 'bg-[#FF416C] text-white animate-pulse'
                          : isUnlocked
                          ? 'bg-[#00FFD1] text-black'
                          : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {isUnlocked ? (
                        <>
                          <span className="text-[7px] font-pixel leading-none">LVL</span>
                          <span className="text-xs font-black leading-tight">{lvl.levelNumber}</span>
                        </>
                      ) : (
                        <Lock size={15} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-black text-white italic tracking-tight uppercase truncate">
                          {lvl.name}
                        </h4>
                        {isBoss && (
                          <span className="px-1.5 py-0.5 bg-[#FF416C] text-white text-[7.5px] font-pixel font-bold rounded border border-black shadow-sm uppercase">
                            TITAN
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-[#8E9299] font-mono mt-0.5">
                        <span>Par: {lvl.targetTime}s</span>
                        <span>•</span>
                        <span className="capitalize" style={{ color: currentWorld.color }}>
                          {lvl.biome}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Stars, Highscore & Play Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    {isUnlocked && (
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((star) => (
                            <Star
                              key={star}
                              size={13}
                              className={
                                star <= stats.stars
                                  ? 'fill-[#FFD700] text-[#FFD700]'
                                  : 'text-white/20 fill-white/5'
                              }
                            />
                          ))}
                        </div>
                        {stats.bestTime !== null && (
                          <span className="text-[10px] text-[#00FFD1] font-mono font-bold flex items-center gap-0.5">
                            <Clock size={10} /> {stats.bestTime.toFixed(1)}s
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      disabled={!isUnlocked && !freePlayUnlocked}
                      className={`px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1 uppercase transition-all border-2 ${
                        isUnlocked
                          ? isBoss
                            ? 'bg-[#FF416C] hover:bg-[#ff577f] text-white border-black shadow-[2px_2px_0_0_#000]'
                            : 'bg-[#FFD700] hover:bg-[#ffea00] text-black border-black shadow-[2px_2px_0_0_#B8860B]'
                          : 'bg-[#1a1a2e] text-[#8E9299] border-white/20'
                      }`}
                    >
                      <Play size={11} className="fill-current" />
                      <span>GO</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ----------------------------------------------------
            6. BOTTOM FAST SCRUBBER FOR 100 WORLDS
            ---------------------------------------------------- */}
        <div className="bg-[#1e1b38] p-2.5 rounded-2xl border border-white/20 flex items-center gap-3 text-xs font-mono shrink-0">
          <span className="text-[9px] font-pixel text-[#8E9299] shrink-0">WORLD SCRUBBER</span>
          <input
            type="range"
            min={1}
            max={TOTAL_WORLDS}
            value={currentWorldIndex}
            onChange={(e) => setCurrentWorldIndex(parseInt(e.target.value, 10))}
            className="flex-1 accent-[#00FFD1] cursor-pointer"
          />
          <span className="text-[#00FFD1] font-bold shrink-0">
            W-{currentWorldIndex} ({currentWorld.startLevel}–{currentWorld.endLevel})
          </span>
        </div>
      </div>
    </div>
  );
};
