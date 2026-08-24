import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Sword, Zap, ArrowUp } from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';

interface VirtualControlsProps {
  engineRef: React.RefObject<GameEngine | null>;
  showOnScreen: boolean;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({ engineRef, showOnScreen }) => {
  const [hasGamepad, setHasGamepad] = useState(false);

  // Poll Gamepad API if connected
  useEffect(() => {
    let animId: number;

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0] || gamepads[1];

      if (gp && engineRef.current) {
        setHasGamepad(true);
        const engine = engineRef.current;

        // Left / Right Stick or D-pad
        const axisX = gp.axes[0] || 0;
        const axisY = gp.axes[1] || 0;
        const dpadLeft = gp.buttons[14]?.pressed;
        const dpadRight = gp.buttons[15]?.pressed;
        const dpadUp = gp.buttons[12]?.pressed;
        const dpadDown = gp.buttons[13]?.pressed;

        engine.keys.left = axisX < -0.3 || dpadLeft;
        engine.keys.right = axisX > 0.3 || dpadRight;
        engine.keys.down = axisY > 0.3 || dpadDown;

        // A Button / Cross (Jump)
        const btnA = gp.buttons[0]?.pressed;
        if (btnA && !engine.keys.up) {
          engine.keys.jumpPressed = true;
        }
        engine.keys.up = btnA || axisY < -0.3 || dpadUp;

        // X Button / Square (Attack)
        engine.keys.attack = gp.buttons[2]?.pressed || gp.buttons[1]?.pressed;

        // B / RB / RT (Special / Dash)
        engine.keys.special = gp.buttons[5]?.pressed || gp.buttons[7]?.pressed || gp.buttons[3]?.pressed;
      }

      animId = requestAnimationFrame(pollGamepad);
    };

    window.addEventListener('gamepadconnected', () => setHasGamepad(true));
    window.addEventListener('gamepaddisconnected', () => setHasGamepad(false));
    animId = requestAnimationFrame(pollGamepad);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [engineRef]);

  // Touch control helper handlers
  const handleTouchStart = (key: 'left' | 'right' | 'up' | 'down' | 'attack' | 'special') => {
    if (!engineRef.current) return;
    if (key === 'up') {
      engineRef.current.keys.up = true;
      engineRef.current.keys.jumpPressed = true;
    } else {
      engineRef.current.keys[key] = true;
    }
  };

  const handleTouchEnd = (key: 'left' | 'right' | 'up' | 'down' | 'attack' | 'special') => {
    if (!engineRef.current) return;
    engineRef.current.keys[key] = false;
  };

  return (
    <div className="w-full max-w-5xl px-4 py-2 flex items-center justify-between pointer-events-auto">
      {/* LEFT D-PAD (Movement) */}
      <div className={`flex items-center gap-2 ${showOnScreen ? 'flex' : 'hidden sm:hidden md:flex'}`}>
        <div className="grid grid-cols-3 gap-1 bg-[#1a1a2e] p-2.5 rounded-2xl border-3 border-white shadow-[4px_4px_0_0_#000]">
          <div />
          <button
            onPointerDown={() => handleTouchStart('up')}
            onPointerUp={() => handleTouchEnd('up')}
            onPointerLeave={() => handleTouchEnd('up')}
            className="w-11 h-11 bg-[#24243e] active:bg-[#FFD700] text-[#FFD700] active:text-black rounded-xl flex items-center justify-center font-black text-xs border-2 border-white/70 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Jump / Up"
          >
            <ChevronUp size={22} className="stroke-[3]" />
          </button>
          <div />

          <button
            onPointerDown={() => handleTouchStart('left')}
            onPointerUp={() => handleTouchEnd('left')}
            onPointerLeave={() => handleTouchEnd('left')}
            className="w-11 h-11 bg-[#24243e] active:bg-[#FFD700] text-[#FFD700] active:text-black rounded-xl flex items-center justify-center font-black text-xs border-2 border-white/70 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Move Left (A)"
          >
            <ChevronLeft size={22} className="stroke-[3]" />
          </button>
          <button
            onPointerDown={() => handleTouchStart('down')}
            onPointerUp={() => handleTouchEnd('down')}
            onPointerLeave={() => handleTouchEnd('down')}
            className="w-11 h-11 bg-[#24243e] active:bg-[#FFD700] text-[#FFD700] active:text-black rounded-xl flex items-center justify-center font-black text-xs border-2 border-white/70 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Drop Platform / Down (S)"
          >
            <ChevronDown size={22} className="stroke-[3]" />
          </button>
          <button
            onPointerDown={() => handleTouchStart('right')}
            onPointerUp={() => handleTouchEnd('right')}
            onPointerLeave={() => handleTouchEnd('right')}
            className="w-11 h-11 bg-[#24243e] active:bg-[#FFD700] text-[#FFD700] active:text-black rounded-xl flex items-center justify-center font-black text-xs border-2 border-white/70 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Move Right (D)"
          >
            <ChevronRight size={22} className="stroke-[3]" />
          </button>
        </div>
      </div>

      {/* KEYBOARD GUIDE (CENTER) */}
      <div className="hidden lg:flex items-center gap-5 text-xs text-[#8E9299] font-mono bg-[#1a1a2e] px-5 py-2.5 rounded-2xl border-3 border-white shadow-[4px_4px_0_0_#000]">
        <div className="flex items-center gap-1.5 font-bold">
          <kbd className="px-2 py-0.5 bg-[#FFD700] text-black rounded font-black border border-black shadow-[1px_1px_0_0_#000]">A</kbd>
          <kbd className="px-2 py-0.5 bg-[#FFD700] text-black rounded font-black border border-black shadow-[1px_1px_0_0_#000]">D</kbd>
          <span className="text-white text-[11px]">MOVE</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <kbd className="px-2 py-0.5 bg-[#FFD700] text-black rounded font-black border border-black shadow-[1px_1px_0_0_#000]">SPACE</kbd>
          <span className="text-white text-[11px]">JUMP</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <kbd className="px-2 py-0.5 bg-[#FF416C] text-white rounded font-black border border-black shadow-[1px_1px_0_0_#000]">X</kbd>
          <span className="text-white text-[11px]">ATTACK</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <kbd className="px-2 py-0.5 bg-[#00B4DB] text-black rounded font-black border border-black shadow-[1px_1px_0_0_#000]">C</kbd>
          <span className="text-white text-[11px]">BOOST</span>
        </div>
      </div>

      {/* RIGHT ACTION BUTTONS */}
      <div className={`flex items-center gap-3 ${showOnScreen ? 'flex' : 'hidden sm:hidden md:flex'}`}>
        <div className="flex items-center gap-2.5 bg-[#1a1a2e] p-2 rounded-2xl border-3 border-white shadow-[4px_4px_0_0_#000]">
          {/* SPECIAL / BOOST BUTTON */}
          <button
            onPointerDown={() => handleTouchStart('special')}
            onPointerUp={() => handleTouchEnd('special')}
            onPointerLeave={() => handleTouchEnd('special')}
            className="w-13 h-13 bg-[#00B4DB] hover:bg-[#26c6da] active:bg-[#0097a7] text-black rounded-2xl flex flex-col items-center justify-center border-3 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-all font-black"
            title="Special Skill / Boost [C]"
          >
            <Zap size={18} className="fill-black" />
            <span className="font-pixel text-[8px] mt-0.5">BOOST</span>
          </button>

          {/* ATTACK BUTTON */}
          <button
            onPointerDown={() => handleTouchStart('attack')}
            onPointerUp={() => handleTouchEnd('attack')}
            onPointerLeave={() => handleTouchEnd('attack')}
            className="w-14 h-14 bg-[#FF416C] hover:bg-[#ff577f] active:bg-[#e02856] text-white rounded-2xl flex flex-col items-center justify-center border-3 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-all font-black"
            title="Attack / Slash [X]"
          >
            <Sword size={20} className="stroke-[2.5]" />
            <span className="font-pixel text-[8px] mt-0.5">STRIKE</span>
          </button>

          {/* JUMP BUTTON */}
          <button
            onPointerDown={() => handleTouchStart('up')}
            onPointerUp={() => handleTouchEnd('up')}
            onPointerLeave={() => handleTouchEnd('up')}
            className="w-14 h-14 bg-[#FFD700] hover:bg-[#ffea00] active:bg-[#e6c200] text-black rounded-2xl flex flex-col items-center justify-center border-3 border-black shadow-[4px_4px_0_0_#B8860B] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#B8860B] transition-all font-black"
            title="Jump [Space]"
          >
            <ArrowUp size={22} className="stroke-[3]" />
            <span className="font-pixel text-[8px] mt-0.5 font-bold">JUMP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
