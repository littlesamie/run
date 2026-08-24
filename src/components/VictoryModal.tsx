import React from 'react';
import { Star, Trophy, Clock, Coins, RotateCcw, ArrowRight, Home } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface VictoryModalProps {
  levelName: string;
  clearTime: number;
  score: number;
  coins: number;
  targetTime: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onMenu: () => void;
  hasNextLevel: boolean;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  levelName,
  clearTime,
  score,
  coins,
  targetTime,
  onNextLevel,
  onReplay,
  onMenu,
  hasNextLevel,
}) => {
  // Calculate stars:
  // 1 Star: Beat level
  // 2 Stars: Under targetTime * 1.3
  // 3 Stars: Under targetTime
  let stars = 1;
  if (clearTime <= targetTime) stars = 3;
  else if (clearTime <= targetTime * 1.35) stars = 2;

  const timeBonus = Math.max(0, Math.floor((targetTime - clearTime) * 60));

  return (
    <div className="fixed inset-0 bg-[#0f0c29]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in zoom-in-95 duration-200 font-sans">
      <div className="bg-[#1a1a2e] border-4 border-white rounded-3xl max-w-md w-full p-7 shadow-[8px_8px_0_0_#000] space-y-6 text-center">
        {/* HEADER */}
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-[#00FFD1] tracking-widest">
            VICTORY ACHIEVED
          </span>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">{levelName}</h2>
        </div>

        {/* STARS RATING ANIMATION */}
        <div className="flex justify-center items-center gap-3.5 py-1">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`p-3.5 rounded-2xl border-3 transition-all duration-300 ${
                starIdx <= stars
                  ? 'bg-[#FFD700] border-black text-black scale-110 shadow-[4px_4px_0_0_#B8860B] animate-bounce'
                  : 'bg-[#24243e] border-white/40 text-white/20'
              }`}
              style={{ animationDelay: `${starIdx * 150}ms`, animationIterationCount: 2 }}
            >
              <Star size={26} className={starIdx <= stars ? 'fill-black stroke-black' : 'stroke-white/20'} />
            </div>
          ))}
        </div>

        {/* STATS BREAKDOWN */}
        <div className="bg-[#24243e] border-3 border-white rounded-2xl p-4.5 space-y-2.5 text-xs font-mono shadow-[4px_4px_0_0_#000]">
          <div className="flex items-center justify-between text-white font-medium">
            <span className="flex items-center gap-1.5 text-[#00B4DB] font-bold">
              <Clock size={14} /> Clear Time:
            </span>
            <span>{clearTime.toFixed(1)}s (Par: {targetTime}s)</span>
          </div>

          <div className="flex items-center justify-between text-white font-medium">
            <span className="flex items-center gap-1.5 text-[#00FFD1] font-bold">
              <Coins size={14} /> Crystals Collected:
            </span>
            <span>+{coins}</span>
          </div>

          <div className="flex items-center justify-between text-white font-medium">
            <span className="flex items-center gap-1.5 text-[#FFD700] font-bold">
              <Trophy size={14} /> Time Bonus:
            </span>
            <span>+{timeBonus} PTS</span>
          </div>

          <div className="h-px bg-white/20 my-1.5" />

          <div className="flex items-center justify-between font-black text-sm text-[#FFD700] pt-1 italic tracking-tight">
            <span>TOTAL SCORE:</span>
            <span>{score} PTS</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col gap-2.5 pt-2">
          {hasNextLevel ? (
            <button
              onClick={() => {
                soundManager.playVictory();
                onNextLevel();
              }}
              className="w-full py-3.5 bg-[#FFD700] hover:bg-[#ffea00] text-black font-black text-xs rounded-xl shadow-[4px_4px_0_0_#B8860B] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#B8860B] transition-all flex items-center justify-center gap-2 border-3 border-black uppercase italic"
            >
              <span>NEXT REALM</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <div className="p-3 bg-[#00FFD1] border-3 border-black rounded-xl text-black font-black text-xs uppercase italic shadow-[3px_3px_0_0_#000]">
              🎉 ALL CAMPAIGN REALMS CONQUERED!
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onReplay}
              className="py-3 bg-[#24243e] hover:bg-[#302b63] text-white font-black text-xs rounded-xl border-3 border-white shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] flex items-center justify-center gap-1.5 uppercase transition-all"
            >
              <RotateCcw size={14} className="text-[#00FFD1]" /> REPLAY
            </button>
            <button
              onClick={onMenu}
              className="py-3 bg-[#24243e] hover:bg-[#302b63] text-white font-black text-xs rounded-xl border-3 border-white shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] flex items-center justify-center gap-1.5 uppercase transition-all"
            >
              <Home size={14} className="text-[#FFD700]" /> MAIN MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
