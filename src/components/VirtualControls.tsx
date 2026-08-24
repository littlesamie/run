import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Sword, Zap, ArrowUp } from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';

interface VirtualControlsProps {
  engineRef: React.RefObject<GameEngine | null>;
  showOnScreen: boolean;
  isLandscapeOverlay?: boolean;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  engineRef,
  showOnScreen,
  isLandscapeOverlay = false,
}) => {
  const [hasGamepad, setHasGamepad] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    setIsTouchDevice(isTouch);
  }, []);

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

  // Touch control helper handlers with multi-touch support
  const handleButtonDown = (
    e: React.TouchEvent | React.PointerEvent,
    key: 'left' | 'right' | 'up' | 'down' | 'attack' | 'special'
  ) => {
    if (e.cancelable) e.preventDefault();
    if (!engineRef.current) return;
    if (key === 'up') {
      engineRef.current.keys.up = true;
      engineRef.current.keys.jumpPressed = true;
    } else {
      engineRef.current.keys[key] = true;
    }
  };

  const handleButtonUp = (
    e: React.TouchEvent | React.PointerEvent,
    key: 'left' | 'right' | 'up' | 'down' | 'attack' | 'special'
  ) => {
    if (e.cancelable) e.preventDefault();
    if (!engineRef.current) return;
    engineRef.current.keys[key] = false;
  };

  // Only display if explicitly enabled, or on touch devices, or in landscape mode
  const shouldRender = showOnScreen || isTouchDevice;

  if (!shouldRender && !isLandscapeOverlay) {
    return (
      <div className="w-full max-w-5xl px-4 py-2 hidden md:flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-5 text-xs text-[#8E9299] font-mono bg-[#1a1a2e] px-5 py-2.5 rounded-2xl border-3 border-white shadow-[4px_4px_0_0_#000] mx-auto">
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
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-5xl px-3 sm:px-6 py-2 flex items-end justify-between select-none pointer-events-auto ${
        isLandscapeOverlay
          ? 'absolute bottom-2 left-0 right-0 z-30 pointer-events-none px-4 sm:px-8'
          : 'relative'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* LEFT D-PAD (Movement: Left, Right, Drop Down, Jump Up) */}
      <div className="pointer-events-auto flex items-center">
        <div className="grid grid-cols-3 gap-1.5 bg-[#1a1a2e]/90 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl border-3 border-white shadow-[4px_4px_0_0_#000]">
          <div />
          <button
            onTouchStart={(e) => handleButtonDown(e, 'up')}
            onTouchEnd={(e) => handleButtonUp(e, 'up')}
            onTouchCancel={(e) => handleButtonUp(e, 'up')}
            onPointerDown={(e) => handleButtonDown(e, 'up')}
            onPointerUp={(e) => handleButtonUp(e, 'up')}
            onPointerLeave={(e) => handleButtonUp(e, 'up')}
            className="w-12 h-12 sm:w-13 sm:h-13 bg-[#24243e] active:bg-[#FFD700] text-[#FFD700] active:text-black rounded-xl sm:rounded-2xl flex items-center justify-center font-black border-2 border-white/80 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-transform touch-none"
            title="Jump / Up"
          >
            <ChevronUp size={24} className="stroke-[3]" />
          </button>
          <div />

          <button
            onTouchStart={(e) => handleButtonDown(e, 'left')}
            onTouchEnd={(e) => handleButtonUp(e, 'left')}
            onTouchCancel={(e) => handleButtonUp(e, 'left')}
            onPointerDown={(e) => handleButtonDown(e, 'left')}
            onPointerUp={(e) => handleButtonUp(e, 'left')}
            onPointerLeave={(e) => handleButtonUp(e, 'left')}
            className="w-12 h-12 sm:w-13 sm:h-13 bg-[#24243e] active:bg-[#FFD700] text-[#FFD700] active:text-black rounded-xl sm:rounded-2xl flex items-center justify-center font-black border-2 border-white/80 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-transform touch-none"
            title="Move Left"
          >
            <ChevronLeft size={24} className="stroke-[3]" />
          </button>
          <button
            onTouchStart={(e) => handleButtonDown(e, 'down')}
            onTouchEnd={(e) => handleButtonUp(e, 'down')}
            onTouchCancel={(e) => handleButtonUp(e, 'down')}
            onPointerDown={(e) => handleButtonDown(e, 'down')}
            onPointerUp={(e) => handleButtonUp(e, 'down')}
            onPointerLeave={(e) => handleButtonUp(e, 'down')}
            className="w-12 h-12 sm:w-13 sm:h-13 bg-[#24243e] active:bg-[#FFD700] text-[#FFD700] active:text-black rounded-xl sm:rounded-2xl flex items-center justify-center font-black border-2 border-white/80 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-transform touch-none"
            title="Drop Platform / Down"
          >
            <ChevronDown size={24} className="stroke-[3]" />
          </button>
          <button
            onTouchStart={(e) => handleButtonDown(e, 'right')}
            onTouchEnd={(e) => handleButtonUp(e, 'right')}
            onTouchCancel={(e) => handleButtonUp(e, 'right')}
            onPointerDown={(e) => handleButtonDown(e, 'right')}
            onPointerUp={(e) => handleButtonUp(e, 'right')}
            onPointerLeave={(e) => handleButtonUp(e, 'right')}
            className="w-12 h-12 sm:w-13 sm:h-13 bg-[#24243e] active:bg-[#FFD700] text-[#FFD700] active:text-black rounded-xl sm:rounded-2xl flex items-center justify-center font-black border-2 border-white/80 shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-transform touch-none"
            title="Move Right"
          >
            <ChevronRight size={24} className="stroke-[3]" />
          </button>
        </div>
      </div>

      {/* CENTER KEYBOARD GUIDE (Hidden in compact mobile landscape) */}
      {!isLandscapeOverlay && (
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
      )}

      {/* RIGHT ACTION BUTTONS: BOOST, ATTACK, JUMP */}
      <div className="pointer-events-auto flex items-center">
        <div className="flex items-center gap-2 sm:gap-2.5 bg-[#1a1a2e]/90 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl border-3 border-white shadow-[4px_4px_0_0_#000]">
          {/* SPECIAL / BOOST BUTTON */}
          <button
            onTouchStart={(e) => handleButtonDown(e, 'special')}
            onTouchEnd={(e) => handleButtonUp(e, 'special')}
            onTouchCancel={(e) => handleButtonUp(e, 'special')}
            onPointerDown={(e) => handleButtonDown(e, 'special')}
            onPointerUp={(e) => handleButtonUp(e, 'special')}
            onPointerLeave={(e) => handleButtonUp(e, 'special')}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-[#00B4DB] hover:bg-[#26c6da] active:bg-[#0097a7] text-black rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border-3 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-transform font-black touch-none"
            title="Special Skill / Boost [C]"
          >
            <Zap size={18} className="fill-black" />
            <span className="font-pixel text-[7px] sm:text-[8px] mt-0.5">BOOST</span>
          </button>

          {/* ATTACK BUTTON */}
          <button
            onTouchStart={(e) => handleButtonDown(e, 'attack')}
            onTouchEnd={(e) => handleButtonUp(e, 'attack')}
            onTouchCancel={(e) => handleButtonUp(e, 'attack')}
            onPointerDown={(e) => handleButtonDown(e, 'attack')}
            onPointerUp={(e) => handleButtonUp(e, 'attack')}
            onPointerLeave={(e) => handleButtonUp(e, 'attack')}
            className="w-13 h-13 sm:w-15 sm:h-15 bg-[#FF416C] hover:bg-[#ff577f] active:bg-[#e02856] text-white rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border-3 border-black shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-transform font-black touch-none"
            title="Attack / Slash [X]"
          >
            <Sword size={20} className="stroke-[2.5]" />
            <span className="font-pixel text-[7px] sm:text-[8px] mt-0.5">SLASH</span>
          </button>

          {/* JUMP BUTTON */}
          <button
            onTouchStart={(e) => handleButtonDown(e, 'up')}
            onTouchEnd={(e) => handleButtonUp(e, 'up')}
            onTouchCancel={(e) => handleButtonUp(e, 'up')}
            onPointerDown={(e) => handleButtonDown(e, 'up')}
            onPointerUp={(e) => handleButtonUp(e, 'up')}
            onPointerLeave={(e) => handleButtonUp(e, 'up')}
            className="w-13 h-13 sm:w-15 sm:h-15 bg-[#FFD700] hover:bg-[#ffea00] active:bg-[#e6c200] text-black rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border-3 border-black shadow-[4px_4px_0_0_#B8860B] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#B8860B] transition-transform font-black touch-none"
            title="Jump [Space]"
          >
            <ArrowUp size={22} className="stroke-[3]" />
            <span className="font-pixel text-[7px] sm:text-[8px] mt-0.5 font-bold">JUMP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
