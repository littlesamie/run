import React from 'react';
import {
  Gamepad2,
  Lock,
  Check,
  Sparkles,
  Zap,
  Shield,
  Flame,
  Award,
  ChevronRight,
  X,
} from 'lucide-react';
import { HandheldSkin, LevelStats, SKIN_CONFIGS, isSkinUnlocked, getHighestLevelReached } from '../types';
import { soundManager } from '../audio/SoundManager';

interface SkinsModalProps {
  currentSkin: HandheldSkin;
  levelStats: Record<string, LevelStats>;
  onSelectSkin: (skin: HandheldSkin) => void;
  onClose: () => void;
}

export const SkinsModal: React.FC<SkinsModalProps> = ({
  currentSkin,
  levelStats,
  onSelectSkin,
  onClose,
}) => {
  const skinsList = Object.values(SKIN_CONFIGS);
  const unlockedCount = skinsList.filter((s) => isSkinUnlocked(s.id, levelStats)).length;
  const highestLevelReached = getHighestLevelReached(levelStats);

  return (
    <div className="fixed inset-0 bg-[#0f0c29]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans">
      <div className="bg-[#1a1a2e] border-4 border-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-[8px_8px_0_0_#000] space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-white/10 pb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-[#00FFD1] tracking-widest">
                HARDWARE ARSENAL
              </span>
              <span className="px-2 py-0.5 bg-[#0f0c29] border border-[#FFD700] rounded text-[9px] font-pixel text-[#FFD700]">
                UNLOCKED: {unlockedCount} / {skinsList.length}
              </span>
              <span className="px-2 py-0.5 bg-[#24243e] border border-white/20 rounded text-[9px] font-pixel text-white/80">
                CAMPAIGN: REACHED LVL {highestLevelReached} / 1,000
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter uppercase">
              SKINS & CAPABILITIES
            </h2>
            <p className="text-xs text-[#8E9299] font-mono">
              Reach new campaign stages to unlock authentic Nintendo handhelds with powerful capabilities!
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-[#24243e] hover:bg-[#302b63] border-2 border-white text-white rounded-xl text-xs font-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Skins Grid / Cards */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {skinsList.map((skin) => {
            const unlocked = isSkinUnlocked(skin.id, levelStats);
            const isEquipped = currentSkin === skin.id;

            return (
              <div
                key={skin.id}
                onClick={() => {
                  if (unlocked) {
                    soundManager.playCoin();
                    onSelectSkin(skin.id);
                  } else {
                    soundManager.playPlayerHurt();
                  }
                }}
                className={`p-4 rounded-2xl border-3 transition-all relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isEquipped
                    ? 'bg-[#24243e] border-[#FFD700] shadow-[4px_4px_0_0_#FFD700]'
                    : unlocked
                    ? 'bg-[#1a1a2e] border-white hover:border-[#00FFD1] hover:bg-[#24243e] cursor-pointer shadow-[4px_4px_0_0_#000]'
                    : 'bg-[#121124] border-white/20 opacity-70 cursor-not-allowed'
                }`}
              >
                {/* Left Info: Icon & Names */}
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-13 h-13 rounded-2xl flex items-center justify-center font-black text-xl border-3 border-black shadow-[3px_3px_0_0_#000] shrink-0"
                    style={{ backgroundColor: skin.previewBg, color: skin.themeColor }}
                  >
                    {unlocked ? (
                      skin.id === 'dmg_gameboy' ? (
                        '👾'
                      ) : skin.id === 'nes_classic' ? (
                        '🕹️'
                      ) : skin.id === 'snes' ? (
                        '🎮'
                      ) : skin.id === 'switch_neon' ? (
                        '⚡'
                      ) : (
                        '💎'
                      )
                    ) : (
                      <Lock size={20} className="text-[#8E9299]" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase font-bold text-[#8E9299] tracking-wider font-mono">
                        {skin.era}
                      </span>
                      {isEquipped && (
                        <span className="px-2 py-0.5 bg-[#FFD700] text-black text-[8px] font-pixel font-bold rounded shadow-sm">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-white italic tracking-tight uppercase">
                      {skin.name}
                    </h3>

                    {/* Capability Perk Badge & Description */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 pt-0.5">
                      <span
                        className="px-2 py-0.5 rounded text-[8px] font-pixel font-bold uppercase w-fit border border-black shadow-sm"
                        style={{ backgroundColor: skin.themeColor, color: '#000' }}
                      >
                        {skin.capability.badge}
                      </span>
                      <span className="text-[11px] text-neutral-300 font-sans">
                        {skin.capability.description}
                      </span>
                    </div>

                    {/* Requirement Note if locked */}
                    {!unlocked && (
                      <p className="text-[10px] text-[#ef4444] font-mono pt-1 flex items-center gap-1">
                        <Lock size={11} /> Requires: {skin.unlockRequirementText}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="self-end sm:self-center shrink-0">
                  {isEquipped ? (
                    <div className="px-3.5 py-1.5 bg-[#FFD700] text-black font-black text-[10px] font-pixel rounded-xl border-2 border-black flex items-center gap-1.5 shadow-[2px_2px_0_0_#B8860B]">
                      <Check size={14} className="stroke-[3]" /> ACTIVE
                    </div>
                  ) : unlocked ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        soundManager.playCoin();
                        onSelectSkin(skin.id);
                      }}
                      className="px-4 py-2 bg-[#1a1a2e] hover:bg-[#00FFD1] hover:text-black border-2 border-white text-white font-black text-xs rounded-xl shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all uppercase"
                    >
                      EQUIP PERK
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 bg-black/40 border border-white/20 text-[#8E9299] text-[10px] font-pixel rounded-xl flex items-center gap-1">
                      <Lock size={12} /> {skin.unlockLevelStage}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-white/10 pt-3 shrink-0 text-xs font-mono">
          <span className="text-[#8E9299]">
            Active Perk:{' '}
            <span className="text-[#00FFD1] font-bold">
              {SKIN_CONFIGS[currentSkin]?.capability.name}
            </span>
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#FFD700] hover:bg-[#ffea00] text-black font-black text-xs rounded-xl shadow-[3px_3px_0_0_#B8860B] active:translate-x-0.5 active:translate-y-0.5 border-2 border-black uppercase italic"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
};
