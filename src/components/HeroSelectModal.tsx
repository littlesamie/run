import React from 'react';
import { Shield, Zap, Sparkles, Heart, Gauge, ArrowUp, Check } from 'lucide-react';
import { HeroClassType } from '../types';
import { HERO_CLASSES } from '../data/defaultLevels';
import { soundManager } from '../audio/SoundManager';

interface HeroSelectModalProps {
  selectedHero: HeroClassType;
  onSelectHero: (hero: HeroClassType) => void;
  onClose: () => void;
}

export const HeroSelectModal: React.FC<HeroSelectModalProps> = ({
  selectedHero,
  onSelectHero,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-[#0f0c29]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans">
      <div className="bg-[#1a1a2e] border-4 border-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-[8px_8px_0_0_#000] space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-black uppercase text-[#00FFD1] tracking-widest">ROSTER SELECTION</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter uppercase">CHOOSE YOUR HERO</h2>
          <p className="text-xs text-[#8E9299] font-mono">Each champion features unique combat mechanics, stats, and special abilities.</p>
        </div>

        {/* HERO CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(HERO_CLASSES) as HeroClassType[]).map((heroKey) => {
            const hero = HERO_CLASSES[heroKey];
            const isSelected = selectedHero === heroKey;

            return (
              <div
                key={heroKey}
                onClick={() => {
                  onSelectHero(heroKey);
                  soundManager.playCheckpoint();
                }}
                className={`relative rounded-2xl border-3 p-4 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#302b63] border-[#FFD700] shadow-[6px_6px_0_0_#B8860B] scale-[1.02]'
                    : 'bg-[#24243e] border-white hover:border-[#00FFD1] hover:bg-[#2b2b48] shadow-[4px_4px_0_0_#000]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 bg-[#FFD700] text-black p-1 rounded-full border border-black shadow-[1px_1px_0_0_#000]">
                    <Check size={12} className="stroke-[3]" />
                  </div>
                )}

                {/* Hero Character Visual Tag */}
                <div className="flex flex-col items-center text-center space-y-2 mb-3">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-3 border-black shadow-[3px_3px_0_0_#000]"
                    style={{ backgroundColor: heroKey === 'knight' ? '#FFD700' : heroKey === 'rogue' ? '#00FFD1' : '#FF416C' }}
                  >
                    {heroKey === 'knight' ? '🛡️' : heroKey === 'rogue' ? '🗡️' : '🔮'}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white italic tracking-tighter uppercase">{hero.name}</h3>
                    <span className="text-[10px] text-[#FFD700] font-mono font-bold">{hero.title}</span>
                  </div>
                </div>

                {/* Stat Bars */}
                <div className="space-y-2 py-2 border-t border-b border-white/20 text-[10px]">
                  {/* Health */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E9299] font-bold flex items-center gap-1">
                      <Heart size={11} className="text-[#FF416C] fill-[#FF416C]" /> HP:
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-2 rounded-xs border border-black ${
                            i < hero.maxHealth ? 'bg-[#FF416C]' : 'bg-[#0f0c29]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Speed */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E9299] font-bold flex items-center gap-1">
                      <Gauge size={11} className="text-[#00B4DB]" /> SPEED:
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-2 rounded-xs border border-black ${
                            i < Math.round(hero.speed) ? 'bg-[#00B4DB]' : 'bg-[#0f0c29]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Agility / Jump */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E9299] font-bold flex items-center gap-1">
                      <ArrowUp size={11} className="text-[#00FFD1]" /> JUMP:
                    </span>
                    <span className="text-[#00FFD1] font-mono font-bold">
                      {hero.doubleJump ? 'Double Jump' : 'Standard'}
                    </span>
                  </div>
                </div>

                {/* Ability Info */}
                <div className="mt-3 pt-1 text-[11px] text-[#8E9299] leading-tight font-mono">
                  <span className="text-white font-bold block text-xs mb-0.5">
                    ✨ {hero.specialAbilityName}
                  </span>
                  {hero.specialAbilityDesc}
                </div>
              </div>
            );
          })}
        </div>

        {/* CLOSE / CONFIRM */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => {
              soundManager.playVictory();
              onClose();
            }}
            className="px-7 py-3.5 bg-[#FFD700] hover:bg-[#ffea00] text-black font-black text-xs rounded-xl shadow-[4px_4px_0_0_#B8860B] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#B8860B] transition-all border-3 border-black uppercase italic"
          >
            CONFIRM HERO
          </button>
        </div>
      </div>
    </div>
  );
};
