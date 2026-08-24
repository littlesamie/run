import React from 'react';
import { Trophy, CheckCircle2, Lock, Award, Flame, Zap, Shield, Sparkles } from 'lucide-react';
import { Achievement } from '../types';

interface AchievementsModalProps {
  achievements: Achievement[];
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  achievements,
  onClose,
}) => {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="fixed inset-0 bg-[#0f0c29]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans">
      <div className="bg-[#1a1a2e] border-4 border-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-[8px_8px_0_0_#000] space-y-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b-2 border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase text-[#FFD700] tracking-widest">HALL OF FAME</span>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
              <Trophy size={24} className="text-[#FFD700]" /> TROPHY CABINET
            </h2>
            <p className="text-xs text-[#8E9299] mt-0.5 font-mono">
              UNLOCKED: <span className="text-[#00FFD1] font-bold">{unlockedCount} / {achievements.length}</span> BADGES
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#24243e] hover:bg-[#302b63] border-2 border-white text-white rounded-xl text-xs font-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 uppercase transition-all"
          >
            CLOSE
          </button>
        </div>

        {/* ACHIEVEMENTS LIST */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {achievements.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border-3 flex items-center gap-4 transition-all ${
                item.unlocked
                  ? 'bg-[#24243e] border-white shadow-[4px_4px_0_0_#000]'
                  : 'bg-[#141226] border-white/20 opacity-50'
              }`}
            >
              <div
                className={`w-13 h-13 rounded-2xl flex items-center justify-center text-2xl border-3 border-black shadow-[3px_3px_0_0_#000] ${
                  item.unlocked
                    ? 'bg-[#FFD700] text-black'
                    : 'bg-[#1a1a2e] text-[#8E9299]'
                }`}
              >
                {item.icon}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3
                    className={`text-sm font-black uppercase italic tracking-tight ${
                      item.unlocked ? 'text-white' : 'text-[#8E9299]'
                    }`}
                  >
                    {item.name}
                  </h3>
                  {item.unlocked ? (
                    <span className="text-[10px] text-[#00FFD1] font-black uppercase flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-[#00FFD1]/40">
                      <CheckCircle2 size={12} /> UNLOCKED
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#8E9299] font-black uppercase flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                      <Lock size={12} /> LOCKED
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8E9299] mt-1 font-sans">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
