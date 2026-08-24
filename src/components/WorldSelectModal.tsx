import React from 'react';
import { Star, Trophy, Clock, Play, Lock, ChevronRight, Sparkles } from 'lucide-react';
import { LevelData, LevelStats } from '../types';
import { CAMPAIGN_LEVELS } from '../data/defaultLevels';
import { soundManager } from '../audio/SoundManager';

interface WorldSelectModalProps {
  levelStats: Record<string, LevelStats>;
  onSelectLevel: (level: LevelData) => void;
  onClose: () => void;
}

export const WorldSelectModal: React.FC<WorldSelectModalProps> = ({
  levelStats,
  onSelectLevel,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-[#0f0c29]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans">
      <div className="bg-[#1a1a2e] border-4 border-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-[8px_8px_0_0_#000] space-y-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b-2 border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase text-[#FF6B6B] tracking-widest">WORLD MAP</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter uppercase">CAMPAIGN REALMS</h2>
            <p className="text-xs text-[#8E9299] font-mono">Venture through mystical ruins, crystal mines, and the Clockwork Citadel.</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#24243e] hover:bg-[#302b63] border-2 border-white text-white rounded-xl text-xs font-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 uppercase transition-all"
          >
            CLOSE
          </button>
        </div>

        {/* STAGES LIST */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {CAMPAIGN_LEVELS.map((lvl, index) => {
            const stats = levelStats[lvl.id] || {
              completed: false,
              highScore: 0,
              bestTime: null,
              coinsCollected: 0,
              stars: 0,
            };

            // Unlocked if first level or previous level was completed
            const prevLvl = CAMPAIGN_LEVELS[index - 1];
            const isUnlocked = index === 0 || (prevLvl && levelStats[prevLvl.id]?.completed);

            return (
              <div
                key={lvl.id}
                onClick={() => {
                  if (isUnlocked) {
                    soundManager.playCheckpoint();
                    onSelectLevel(lvl);
                  }
                }}
                className={`p-4 rounded-2xl border-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                  isUnlocked
                    ? 'bg-[#24243e] border-white hover:border-[#FFD700] hover:bg-[#302b63] cursor-pointer shadow-[4px_4px_0_0_#000] hover:shadow-[4px_4px_0_0_#FFD700]'
                    : 'bg-[#141226] border-white/20 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Stage Number Badge */}
                  <div
                    className={`w-13 h-13 rounded-2xl flex items-center justify-center font-black text-sm border-3 border-black shadow-[3px_3px_0_0_#000] ${
                      lvl.biome === 'magma'
                        ? 'bg-[#FF6B6B] text-black'
                        : lvl.biome === 'caverns'
                        ? 'bg-[#00FFD1] text-black'
                        : lvl.biome === 'cyber'
                        ? 'bg-[#FF416C] text-white'
                        : 'bg-[#FFD700] text-black'
                    }`}
                  >
                    {isUnlocked ? `${lvl.worldIndex}-${lvl.stageIndex}` : <Lock size={18} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white italic tracking-tight uppercase">{lvl.name}</h3>
                      {lvl.biome === 'cyber' && (
                        <span className="px-2.5 py-0.5 bg-[#FF416C] border-2 border-black text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow-[1px_1px_0_0_#000]">
                          BOSS
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#8E9299] mt-1 font-mono">
                      <span>Par: {lvl.targetTime}s</span>
                      <span>•</span>
                      <span className="capitalize text-[#00FFD1]">{lvl.biome} Realm</span>
                    </div>
                  </div>
                </div>

                {/* Performance Stats & Stars */}
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  {isUnlocked && (
                    <div className="flex flex-col items-end gap-1">
                      {/* Star Rating */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={
                              star <= stats.stars
                                ? 'fill-[#FFD700] text-[#FFD700]'
                                : 'text-white/20 fill-white/10'
                            }
                          />
                        ))}
                      </div>
                      {stats.bestTime !== null && (
                        <span className="text-[11px] text-[#00FFD1] font-mono font-bold flex items-center gap-1">
                          <Clock size={12} /> {stats.bestTime.toFixed(1)}s
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    disabled={!isUnlocked}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 uppercase tracking-wide transition-all border-3 ${
                      isUnlocked
                        ? 'bg-[#FFD700] hover:bg-[#ffea00] text-black border-black shadow-[3px_3px_0_0_#B8860B] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#B8860B]'
                        : 'bg-[#1a1a2e] text-[#8E9299] border-white/20'
                    }`}
                  >
                    <Play size={14} className="fill-current" /> PLAY
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
