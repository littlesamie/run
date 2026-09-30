import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { HandheldSkin } from '../types';
import { soundManager } from '../audio/SoundManager';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Zap,
  Sword,
  Shield,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';

interface NintendoControllerProps {
  engineRef: React.RefObject<GameEngine | null>;
  skin?: HandheldSkin;
  layout?: 'portrait_console' | 'landscape_wings' | 'compact_overlay';
  deviceType?: 'mobile' | 'tablet';
  isVirtualLandscape?: boolean;
  onTogglePause?: () => void;
  onRestart?: () => void;
  onSelectHero?: () => void;
  vibrationEnabled?: boolean;
}

export const NintendoController: React.FC<NintendoControllerProps> = ({
  engineRef,
  skin = 'vibrant',
  layout = 'compact_overlay',
  deviceType = 'mobile',
  isVirtualLandscape = false,
  onTogglePause,
  onRestart,
  onSelectHero,
  vibrationEnabled = true,
}) => {
  const dpadRef = useRef<HTMLDivElement>(null);
  const [activeDpadDir, setActiveDpadDir] = useState<{
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const [activeButtons, setActiveButtons] = useState<{
    a: boolean;
    b: boolean;
    x: boolean;
    y: boolean;
    l: boolean;
    r: boolean;
  }>({
    a: false,
    b: false,
    x: false,
    y: false,
    l: false,
    r: false,
  });

  // Haptic feedback trigger for tactile feel
  const triggerHaptic = useCallback(
    (duration = 15) => {
      if (!vibrationEnabled) return;
      try {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(duration);
        }
      } catch (e) {}
    },
    [vibrationEnabled]
  );

  // Poll physical Gamepad if connected
  useEffect(() => {
    let animId: number;
    let hasGamepad = false;

    const onConnect = () => {
      hasGamepad = true;
    };
    const onDisconnect = () => {
      hasGamepad = false;
    };
    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);

    // Initial check
    try {
      const initialGps = navigator.getGamepads ? navigator.getGamepads() : [];
      if (initialGps && (initialGps[0] || initialGps[1])) {
        hasGamepad = true;
      }
    } catch (e) {}

    // Track keys activated by gamepad so we only release what the gamepad pressed
    const gpKeys = { left: false, right: false, up: false, down: false, attack: false, special: false };

    const pollGamepad = () => {
      if (hasGamepad && engineRef.current) {
        try {
          const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
          const gp = gamepads[0] || gamepads[1];

          if (gp && gp.connected) {
            const engine = engineRef.current;
            const axisX = gp.axes[0] || 0;
            const axisY = gp.axes[1] || 0;
            const dpadLeft = !!gp.buttons[14]?.pressed;
            const dpadRight = !!gp.buttons[15]?.pressed;
            const dpadUp = !!gp.buttons[12]?.pressed;
            const dpadDown = !!gp.buttons[13]?.pressed;

            const left = axisX < -0.35 || dpadLeft;
            const right = axisX > 0.35 || dpadRight;
            const down = axisY > 0.35 || dpadDown;
            const btnA = !!(gp.buttons[0]?.pressed || gp.buttons[1]?.pressed);
            const up = btnA || axisY < -0.35 || dpadUp;
            const attack = !!(gp.buttons[2]?.pressed || gp.buttons[3]?.pressed);
            const special = !!(gp.buttons[5]?.pressed || gp.buttons[7]?.pressed || gp.buttons[4]?.pressed);

            if (left) {
              engine.keys.left = true;
              gpKeys.left = true;
            } else if (gpKeys.left) {
              engine.keys.left = false;
              gpKeys.left = false;
            }

            if (right) {
              engine.keys.right = true;
              gpKeys.right = true;
            } else if (gpKeys.right) {
              engine.keys.right = false;
              gpKeys.right = false;
            }

            if (down) {
              engine.keys.down = true;
              gpKeys.down = true;
            } else if (gpKeys.down) {
              engine.keys.down = false;
              gpKeys.down = false;
            }

            if (up) {
              if (!gpKeys.up) engine.keys.jumpPressed = true;
              engine.keys.up = true;
              gpKeys.up = true;
            } else if (gpKeys.up) {
              engine.keys.up = false;
              gpKeys.up = false;
            }

            if (attack) {
              engine.keys.attack = true;
              gpKeys.attack = true;
            } else if (gpKeys.attack) {
              engine.keys.attack = false;
              gpKeys.attack = false;
            }

            if (special) {
              engine.keys.special = true;
              gpKeys.special = true;
            } else if (gpKeys.special) {
              engine.keys.special = false;
              gpKeys.special = false;
            }
          }
        } catch (e) {}
      }

      animId = requestAnimationFrame(pollGamepad);
    };

    animId = requestAnimationFrame(pollGamepad);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('gamepadconnected', onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
    };
  }, [engineRef]);

  // Set keyboard key states on engine
  const setEngineKey = useCallback(
    (key: 'left' | 'right' | 'up' | 'down' | 'attack' | 'special', pressed: boolean) => {
      if (!engineRef.current) return;
      if (key === 'up') {
        engineRef.current.keys.up = pressed;
        if (pressed) {
          engineRef.current.keys.jumpPressed = true;
        }
      } else {
        engineRef.current.keys[key] = pressed;
      }
    },
    [engineRef]
  );

  // Smooth dragging D-pad handler using pointer events
  const handleDpadPointer = useCallback(
    (e: React.PointerEvent) => {
      if (!dpadRef.current) return;
      const rect = dpadRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = e.clientX - centerX;
      let dy = e.clientY - centerY;

      if (isVirtualLandscape) {
        // When container is rotated 90deg clockwise:
        // Screen X -> Local -Y
        // Screen Y -> Local +X
        const origDx = dx;
        const origDy = dy;
        dx = origDy;
        dy = -origDx;
      }

      const distance = Math.hypot(dx, dy);

      if (distance < 10) {
        setEngineKey('left', false);
        setEngineKey('right', false);
        setEngineKey('up', false);
        setEngineKey('down', false);
        setActiveDpadDir({ up: false, down: false, left: false, right: false });
        return;
      }

      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const left = angle > 110 || angle < -110;
      const right = angle > -70 && angle < 70;
      const up = angle > -160 && angle < -20;
      const down = angle > 20 && angle < 160;

      setEngineKey('left', left);
      setEngineKey('right', right);
      setEngineKey('up', up);
      setEngineKey('down', down);

      setActiveDpadDir({ up, down, left, right });
    },
    [setEngineKey, isVirtualLandscape]
  );

  const handleDpadEnd = useCallback(() => {
    setEngineKey('left', false);
    setEngineKey('right', false);
    setEngineKey('up', false);
    setEngineKey('down', false);
    setActiveDpadDir({ up: false, down: false, left: false, right: false });
  }, [setEngineKey]);

  // Action button down & up
  const handleActionDown = (action: 'jump' | 'attack' | 'special' | 'dash') => {
    triggerHaptic(15);
    if (action === 'jump') {
      setEngineKey('up', true);
      setActiveButtons((p) => ({ ...p, a: true }));
    } else if (action === 'attack') {
      setEngineKey('attack', true);
      setActiveButtons((p) => ({ ...p, b: true }));
    } else if (action === 'special') {
      setEngineKey('special', true);
      setActiveButtons((p) => ({ ...p, x: true, r: true }));
    } else if (action === 'dash') {
      setEngineKey('special', true);
      setActiveButtons((p) => ({ ...p, y: true, l: true }));
    }
  };

  const handleActionUp = (action: 'jump' | 'attack' | 'special' | 'dash') => {
    if (action === 'jump') {
      setEngineKey('up', false);
      setActiveButtons((p) => ({ ...p, a: false }));
    } else if (action === 'attack') {
      setEngineKey('attack', false);
      setActiveButtons((p) => ({ ...p, b: false }));
    } else if (action === 'special') {
      setEngineKey('special', false);
      setActiveButtons((p) => ({ ...p, x: false, r: false }));
    } else if (action === 'dash') {
      setEngineKey('special', false);
      setActiveButtons((p) => ({ ...p, y: false, l: false }));
    }
  };

  // Translucent styling for each skin (frosted glassmorphic palettes)
  const translucentStyles = {
    vibrant: {
      shellBg: 'bg-[#0f0c29]/50 backdrop-blur-xl',
      border: 'border-white/20',
      dpadArm: 'bg-black/40 backdrop-blur-md border border-white/25',
      dpadActive: 'bg-[#FFD700]/40 border-[#FFD700] text-[#FFD700] shadow-[0_0_12px_rgba(255,215,0,0.5)]',
      btnA: 'bg-[#FFD700]/30 hover:bg-[#FFD700]/45 active:bg-[#FFD700]/65 text-[#FFD700] border-2 border-[#FFD700]/70 backdrop-blur-md shadow-[0_0_14px_rgba(255,215,0,0.25)]',
      btnB: 'bg-[#FF416C]/30 hover:bg-[#FF416C]/45 active:bg-[#FF416C]/65 text-[#FF416C] border-2 border-[#FF416C]/70 backdrop-blur-md shadow-[0_0_14px_rgba(255,65,108,0.25)]',
      btnX: 'bg-[#00FFD1]/30 hover:bg-[#00FFD1]/45 active:bg-[#00FFD1]/65 text-[#00FFD1] border-2 border-[#00FFD1]/70 backdrop-blur-md shadow-[0_0_14px_rgba(0,255,209,0.25)]',
      btnY: 'bg-[#00B4DB]/30 hover:bg-[#00B4DB]/45 active:bg-[#00B4DB]/65 text-[#00B4DB] border-2 border-[#00B4DB]/70 backdrop-blur-md shadow-[0_0_14px_rgba(0,180,219,0.25)]',
      labelColor: 'text-white/60',
      shoulderBg: 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/25 backdrop-blur-md',
    },
    dmg_gameboy: {
      shellBg: 'bg-[#9ca3af]/40 backdrop-blur-xl',
      border: 'border-white/25',
      dpadArm: 'bg-black/50 backdrop-blur-md border border-white/25',
      dpadActive: 'bg-white/40 border-white text-white shadow-[0_0_10px_rgba(255,255,255,0.4)]',
      btnA: 'bg-[#991b5b]/45 hover:bg-[#991b5b]/60 active:bg-[#991b5b]/80 text-[#fbcfe8] border-2 border-[#f472b6]/60 backdrop-blur-md shadow-[0_0_12px_rgba(153,27,91,0.3)]',
      btnB: 'bg-[#991b5b]/45 hover:bg-[#991b5b]/60 active:bg-[#991b5b]/80 text-[#fbcfe8] border-2 border-[#f472b6]/60 backdrop-blur-md shadow-[0_0_12px_rgba(153,27,91,0.3)]',
      btnX: 'bg-[#831843]/45 hover:bg-[#831843]/60 active:bg-[#831843]/80 text-[#fbcfe8] border-2 border-[#f472b6]/50 backdrop-blur-md shadow-[0_0_12px_rgba(153,27,91,0.3)]',
      btnY: 'bg-[#831843]/45 hover:bg-[#831843]/60 active:bg-[#831843]/80 text-[#fbcfe8] border-2 border-[#f472b6]/50 backdrop-blur-md shadow-[0_0_12px_rgba(153,27,91,0.3)]',
      labelColor: 'text-neutral-200/70',
      shoulderBg: 'bg-black/30 hover:bg-black/45 text-white border border-white/25 backdrop-blur-md',
    },
    nes_classic: {
      shellBg: 'bg-black/55 backdrop-blur-xl',
      border: 'border-neutral-500/30',
      dpadArm: 'bg-neutral-900/60 backdrop-blur-md border border-neutral-400/30',
      dpadActive: 'bg-red-500/50 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]',
      btnA: 'bg-red-600/40 hover:bg-red-600/55 active:bg-red-600/75 text-red-100 border-2 border-red-500/70 backdrop-blur-md shadow-[0_0_14px_rgba(220,38,38,0.3)]',
      btnB: 'bg-red-600/40 hover:bg-red-600/55 active:bg-red-600/75 text-red-100 border-2 border-red-500/70 backdrop-blur-md shadow-[0_0_14px_rgba(220,38,38,0.3)]',
      btnX: 'bg-red-700/40 hover:bg-red-700/55 active:bg-red-700/75 text-red-100 border-2 border-red-500/60 backdrop-blur-md shadow-[0_0_14px_rgba(220,38,38,0.3)]',
      btnY: 'bg-red-700/40 hover:bg-red-700/55 active:bg-red-700/75 text-red-100 border-2 border-red-500/60 backdrop-blur-md shadow-[0_0_14px_rgba(220,38,38,0.3)]',
      labelColor: 'text-neutral-300/70',
      shoulderBg: 'bg-neutral-800/40 hover:bg-neutral-800/60 text-white border border-neutral-500/40 backdrop-blur-md',
    },
    snes: {
      shellBg: 'bg-[#6b7280]/40 backdrop-blur-xl',
      border: 'border-purple-300/25',
      dpadArm: 'bg-neutral-950/50 backdrop-blur-md border border-purple-300/25',
      dpadActive: 'bg-purple-600/50 border-purple-400 text-white shadow-[0_0_12px_rgba(147,51,234,0.5)]',
      btnA: 'bg-purple-700/40 hover:bg-purple-700/55 active:bg-purple-700/75 text-purple-100 border-2 border-purple-400/70 backdrop-blur-md shadow-[0_0_14px_rgba(126,34,206,0.3)]',
      btnB: 'bg-purple-600/40 hover:bg-purple-600/55 active:bg-purple-600/75 text-purple-100 border-2 border-purple-400/70 backdrop-blur-md shadow-[0_0_14px_rgba(126,34,206,0.3)]',
      btnX: 'bg-purple-400/35 hover:bg-purple-400/50 active:bg-purple-400/70 text-purple-100 border-2 border-purple-300/60 backdrop-blur-md shadow-[0_0_14px_rgba(168,85,247,0.3)]',
      btnY: 'bg-purple-400/35 hover:bg-purple-400/50 active:bg-purple-400/70 text-purple-100 border-2 border-purple-300/60 backdrop-blur-md shadow-[0_0_14px_rgba(168,85,247,0.3)]',
      labelColor: 'text-purple-200/70',
      shoulderBg: 'bg-purple-900/40 hover:bg-purple-900/60 text-white border border-purple-400/30 backdrop-blur-md',
    },
    switch_neon: {
      shellBg: 'bg-black/50 backdrop-blur-xl',
      border: 'border-white/20',
      dpadArm: 'bg-[#00c3e3]/20 backdrop-blur-md border border-[#00c3e3]/40',
      dpadActive: 'bg-[#00c3e3]/50 border-[#00c3e3] text-white shadow-[0_0_12px_#00c3e3]',
      btnA: 'bg-[#ff3b56]/35 hover:bg-[#ff3b56]/50 active:bg-[#ff3b56]/75 text-white border-2 border-[#ff3b56]/70 backdrop-blur-md shadow-[0_0_14px_rgba(255,59,86,0.35)]',
      btnB: 'bg-[#ff3b56]/35 hover:bg-[#ff3b56]/50 active:bg-[#ff3b56]/75 text-white border-2 border-[#ff3b56]/70 backdrop-blur-md shadow-[0_0_14px_rgba(255,59,86,0.35)]',
      btnX: 'bg-[#00c3e3]/35 hover:bg-[#00c3e3]/50 active:bg-[#00c3e3]/75 text-white border-2 border-[#00c3e3]/70 backdrop-blur-md shadow-[0_0_14px_rgba(0,195,227,0.35)]',
      btnY: 'bg-[#00c3e3]/35 hover:bg-[#00c3e3]/50 active:bg-[#00c3e3]/75 text-white border-2 border-[#00c3e3]/70 backdrop-blur-md shadow-[0_0_14px_rgba(0,195,227,0.35)]',
      labelColor: 'text-neutral-300/70',
      shoulderBg: 'bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md',
    },
    gba_sp: {
      shellBg: 'bg-[#1e293b]/50 backdrop-blur-xl',
      border: 'border-blue-400/30',
      dpadArm: 'bg-slate-900/60 backdrop-blur-md border border-blue-400/30',
      dpadActive: 'bg-blue-500/50 border-blue-400 text-white shadow-[0_0_12px_#3b82f6]',
      btnA: 'bg-blue-600/40 hover:bg-blue-600/55 active:bg-blue-600/75 text-blue-100 border-2 border-blue-400/70 backdrop-blur-md shadow-[0_0_14px_rgba(59,130,246,0.35)]',
      btnB: 'bg-blue-600/40 hover:bg-blue-600/55 active:bg-blue-600/75 text-blue-100 border-2 border-blue-400/70 backdrop-blur-md shadow-[0_0_14px_rgba(59,130,246,0.35)]',
      btnX: 'bg-cyan-500/40 hover:bg-cyan-500/55 active:bg-cyan-500/75 text-cyan-100 border-2 border-cyan-400/70 backdrop-blur-md shadow-[0_0_14px_rgba(6,182,212,0.35)]',
      btnY: 'bg-cyan-500/40 hover:bg-cyan-500/55 active:bg-cyan-500/75 text-cyan-100 border-2 border-cyan-400/70 backdrop-blur-md shadow-[0_0_14px_rgba(6,182,212,0.35)]',
      labelColor: 'text-blue-200/70',
      shoulderBg: 'bg-slate-800/40 hover:bg-slate-800/60 text-white border border-blue-400/30 backdrop-blur-md',
    },
    n64_gold: {
      shellBg: 'bg-[#27272a]/60 backdrop-blur-xl',
      border: 'border-yellow-400/30',
      dpadArm: 'bg-black/50 backdrop-blur-md border border-yellow-400/30',
      dpadActive: 'bg-yellow-500/50 border-yellow-400 text-black shadow-[0_0_12px_#eab308]',
      btnA: 'bg-blue-600/45 hover:bg-blue-600/60 active:bg-blue-600/80 text-blue-100 border-2 border-blue-400/70 backdrop-blur-md shadow-[0_0_14px_rgba(59,130,246,0.35)]',
      btnB: 'bg-green-600/45 hover:bg-green-600/60 active:bg-green-600/80 text-green-100 border-2 border-green-400/70 backdrop-blur-md shadow-[0_0_14px_rgba(34,197,94,0.35)]',
      btnX: 'bg-yellow-500/45 hover:bg-yellow-500/60 active:bg-yellow-500/80 text-black border-2 border-yellow-400/70 backdrop-blur-md shadow-[0_0_14px_rgba(234,179,8,0.35)]',
      btnY: 'bg-yellow-500/45 hover:bg-yellow-500/60 active:bg-yellow-500/80 text-black border-2 border-yellow-400/70 backdrop-blur-md shadow-[0_0_14px_rgba(234,179,8,0.35)]',
      labelColor: 'text-yellow-200/70',
      shoulderBg: 'bg-neutral-800/40 hover:bg-neutral-800/60 text-white border border-yellow-400/30 backdrop-blur-md',
    },
    cyber_omega: {
      shellBg: 'bg-[#0f172a]/70 backdrop-blur-xl',
      border: 'border-pink-500/40',
      dpadArm: 'bg-black/60 backdrop-blur-md border border-pink-500/40',
      dpadActive: 'bg-pink-600/60 border-pink-400 text-white shadow-[0_0_14px_#ec4899]',
      btnA: 'bg-pink-600/45 hover:bg-pink-600/60 active:bg-pink-600/80 text-pink-100 border-2 border-pink-400/70 backdrop-blur-md shadow-[0_0_16px_rgba(236,72,153,0.4)]',
      btnB: 'bg-rose-600/45 hover:bg-rose-600/60 active:bg-rose-600/80 text-rose-100 border-2 border-rose-400/70 backdrop-blur-md shadow-[0_0_16px_rgba(244,63,94,0.4)]',
      btnX: 'bg-purple-600/45 hover:bg-purple-600/60 active:bg-purple-600/80 text-purple-100 border-2 border-purple-400/70 backdrop-blur-md shadow-[0_0_16px_rgba(168,85,247,0.4)]',
      btnY: 'bg-cyan-500/45 hover:bg-cyan-500/60 active:bg-cyan-500/80 text-cyan-100 border-2 border-cyan-400/70 backdrop-blur-md shadow-[0_0_16px_rgba(6,182,212,0.4)]',
      labelColor: 'text-pink-200/80',
      shoulderBg: 'bg-slate-900/50 hover:bg-slate-900/70 text-white border border-pink-500/40 backdrop-blur-md',
    },
  }[skin] || {
    shellBg: 'bg-[#0f0c29]/50 backdrop-blur-xl',
    border: 'border-white/20',
    dpadArm: 'bg-black/40 backdrop-blur-md border border-white/25',
    dpadActive: 'bg-[#FFD700]/40 border-[#FFD700] text-[#FFD700] shadow-[0_0_12px_rgba(255,215,0,0.5)]',
    btnA: 'bg-[#FFD700]/30 hover:bg-[#FFD700]/45 active:bg-[#FFD700]/65 text-[#FFD700] border-2 border-[#FFD700]/70 backdrop-blur-md shadow-[0_0_14px_rgba(255,215,0,0.25)]',
    btnB: 'bg-[#FF416C]/30 hover:bg-[#FF416C]/45 active:bg-[#FF416C]/65 text-[#FF416C] border-2 border-[#FF416C]/70 backdrop-blur-md shadow-[0_0_14px_rgba(255,65,108,0.25)]',
    btnX: 'bg-[#00FFD1]/30 hover:bg-[#00FFD1]/45 active:bg-[#00FFD1]/65 text-[#00FFD1] border-2 border-[#00FFD1]/70 backdrop-blur-md shadow-[0_0_14px_rgba(0,255,209,0.25)]',
    btnY: 'bg-[#00B4DB]/30 hover:bg-[#00B4DB]/45 active:bg-[#00B4DB]/65 text-[#00B4DB] border-2 border-[#00B4DB]/70 backdrop-blur-md shadow-[0_0_14px_rgba(0,180,219,0.25)]',
    labelColor: 'text-white/60',
    shoulderBg: 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/25 backdrop-blur-md',
  };

  // ----------------------------------------------------
  // 1. TRANSLUCENT NINTENDO CROSS D-PAD
  // ----------------------------------------------------
  const isTablet = deviceType === 'tablet';

  const renderDpad = () => (
    <div
      ref={dpadRef}
      onPointerDown={(e) => {
        e.preventDefault();
        triggerHaptic(12);
        try {
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        } catch (err) {}
        handleDpadPointer(e);
      }}
      onPointerMove={(e) => {
        e.preventDefault();
        handleDpadPointer(e);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
        } catch (err) {}
        handleDpadEnd();
      }}
      onPointerCancel={(e) => {
        e.preventDefault();
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
        } catch (err) {}
        handleDpadEnd();
      }}
      className={`relative ${
        isTablet ? 'w-44 h-44 md:w-52 md:h-52' : 'w-36 h-36 sm:w-40 sm:h-40'
      } flex items-center justify-center select-none touch-none`}
      style={{ touchAction: 'none' }}
    >
      {/* Sunken Outer Translucent Well */}
      <div className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-md border border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.6)]" />

      {/* The Translucent Cross D-Pad */}
      <div
        className={`relative ${
          isTablet ? 'w-36 h-36 md:w-42 md:h-42' : 'w-30 h-30 sm:w-32 sm:h-32'
        } flex items-center justify-center`}
      >
        {/* Horizontal Arm */}
        <div
          className={`absolute left-0 right-0 ${
            isTablet ? 'h-12 md:h-14' : 'h-10 sm:h-11'
          } rounded-2xl flex justify-between px-2 sm:px-2.5 items-center pointer-events-none transition-all duration-150 ${
            activeDpadDir.left || activeDpadDir.right
              ? translucentStyles.dpadActive
              : translucentStyles.dpadArm
          }`}
        >
          <ChevronLeft
            size={isTablet ? 26 : 22}
            className={`transition-colors ${
              activeDpadDir.left ? 'text-[#FFD700] stroke-[3.5] drop-shadow-[0_0_8px_#FFD700]' : 'text-white/80'
            }`}
          />
          <ChevronRight
            size={isTablet ? 26 : 22}
            className={`transition-colors ${
              activeDpadDir.right ? 'text-[#FFD700] stroke-[3.5] drop-shadow-[0_0_8px_#FFD700]' : 'text-white/80'
            }`}
          />
        </div>

        {/* Vertical Arm */}
        <div
          className={`absolute top-0 bottom-0 ${
            isTablet ? 'w-12 md:w-14' : 'w-10 sm:w-11'
          } rounded-2xl flex flex-col justify-between py-2 sm:py-2.5 items-center pointer-events-none transition-all duration-150 ${
            activeDpadDir.up || activeDpadDir.down
              ? translucentStyles.dpadActive
              : translucentStyles.dpadArm
          }`}
        >
          <ChevronUp
            size={isTablet ? 26 : 22}
            className={`transition-colors ${
              activeDpadDir.up ? 'text-[#FFD700] stroke-[3.5] drop-shadow-[0_0_8px_#FFD700]' : 'text-white/80'
            }`}
          />
          <ChevronDown
            size={isTablet ? 26 : 22}
            className={`transition-colors ${
              activeDpadDir.down ? 'text-[#FFD700] stroke-[3.5] drop-shadow-[0_0_8px_#FFD700]' : 'text-white/80'
            }`}
          />
        </div>

        {/* Center Thumb Pivot (Translucent Concave Indent) */}
        <div
          className={`absolute ${
            isTablet ? 'w-9 h-9 md:w-11 md:h-11' : 'w-8 h-8 sm:w-9 sm:h-9'
          } rounded-full bg-white/10 border border-white/25 flex items-center justify-center pointer-events-none backdrop-blur-sm shadow-inner`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // 2. TRANSLUCENT ACTION BUTTONS (A, B, X, Y)
  // Ergonomic thumb arc cluster
  // ----------------------------------------------------
  const renderActionButtons = () => (
    <div className="relative select-none flex items-center justify-center">
      <div
        className={`relative ${
          isTablet ? 'w-48 h-48 md:w-56 md:h-56' : 'w-38 h-38 sm:w-42 sm:h-42'
        } flex items-center justify-center`}
      >
        {/* Subtle Frosted Backplate Plate */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-md rounded-full border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)]" />

        {/* X Button (Top-Right) - Special Skill */}
        <button
          onPointerDown={() => handleActionDown('special')}
          onPointerUp={() => handleActionUp('special')}
          onPointerLeave={() => handleActionUp('special')}
          className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 ${
            isTablet ? 'w-14 h-14 md:w-16 md:h-16' : 'w-12 h-12 sm:w-13 sm:h-13'
          } rounded-full flex flex-col items-center justify-center transition-all active:scale-90 active:ring-4 active:ring-[#00B4DB]/40 shadow-lg ${
            activeButtons.x ? 'bg-[#00B4DB]/60 ring-2 ring-white' : 'bg-[#00B4DB]/25 hover:bg-[#00B4DB]/35'
          } text-[#00B4DB] border-2 sm:border-3 border-[#00B4DB] backdrop-blur-md`}
          title="X - Special Skill"
        >
          <Shield size={isTablet ? 20 : 16} strokeWidth={2.5} className="-mb-0.5" />
          <span className="font-pixel text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider">SKILL</span>
        </button>

        {/* Y Button (Top-Left) - Dash / Boost */}
        <button
          onPointerDown={() => handleActionDown('dash')}
          onPointerUp={() => handleActionUp('dash')}
          onPointerLeave={() => handleActionUp('dash')}
          className={`absolute top-2 left-2 sm:top-2.5 sm:left-2.5 ${
            isTablet ? 'w-14 h-14 md:w-16 md:h-16' : 'w-12 h-12 sm:w-13 sm:h-13'
          } rounded-full flex flex-col items-center justify-center transition-all active:scale-90 active:ring-4 active:ring-[#FFD700]/40 shadow-lg ${
            activeButtons.y ? 'bg-[#FFD700]/60 ring-2 ring-white' : 'bg-[#FFD700]/25 hover:bg-[#FFD700]/35'
          } text-[#FFD700] border-2 sm:border-3 border-[#FFD700] backdrop-blur-md`}
          title="Y - Dash / Evade"
        >
          <Zap size={isTablet ? 20 : 16} strokeWidth={2.5} className="fill-[#FFD700] -mb-0.5" />
          <span className="font-pixel text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider">DASH</span>
        </button>

        {/* B Button (Bottom-Left) - Primary Attack / Slash */}
        <button
          onPointerDown={() => handleActionDown('attack')}
          onPointerUp={() => handleActionUp('attack')}
          onPointerLeave={() => handleActionUp('attack')}
          className={`absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 ${
            isTablet ? 'w-15 h-15 md:w-17 md:h-17' : 'w-13 h-13 sm:w-14.5 sm:h-14.5'
          } rounded-full flex flex-col items-center justify-center transition-all active:scale-90 active:ring-4 active:ring-[#FF416C]/40 shadow-lg ${
            activeButtons.b ? 'bg-[#FF416C]/60 ring-2 ring-white' : 'bg-[#FF416C]/25 hover:bg-[#FF416C]/35'
          } text-white border-2 sm:border-3 border-[#FF416C] backdrop-blur-md`}
          title="B - Attack / Slash"
        >
          <Sword size={isTablet ? 22 : 18} strokeWidth={2.5} className="-mb-0.5" />
          <span className="font-pixel text-[8px] sm:text-[9px] font-black uppercase tracking-wider">SLASH</span>
        </button>

        {/* A Button (Bottom-Right) - Primary Jump (Prominent) */}
        <button
          onPointerDown={() => handleActionDown('jump')}
          onPointerUp={() => handleActionUp('jump')}
          onPointerLeave={() => handleActionUp('jump')}
          className={`absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 ${
            isTablet ? 'w-16 h-16 md:w-19 md:h-19' : 'w-14 h-14 sm:w-15.5 sm:h-15.5'
          } rounded-full flex flex-col items-center justify-center transition-all active:scale-90 active:ring-4 active:ring-[#00FFD1]/40 shadow-[0_0_20px_rgba(0,255,209,0.35)] ${
            activeButtons.a ? 'bg-[#00FFD1]/65 ring-2 ring-white text-black' : 'bg-[#00FFD1]/25 hover:bg-[#00FFD1]/40 text-[#00FFD1]'
          } border-3 sm:border-4 border-[#00FFD1] backdrop-blur-md`}
          title="A - Jump"
        >
          <ChevronUp size={isTablet ? 26 : 22} strokeWidth={3.5} className="-mb-0.5" />
          <span className="font-pixel text-[9px] sm:text-[10px] font-black uppercase tracking-wider">JUMP</span>
        </button>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // 3. TRANSLUCENT SELECT & START BUTTONS
  // ----------------------------------------------------
  const renderSelectStart = () => (
    <div className="flex items-center justify-center gap-5 sm:gap-7 select-none py-1">
      {/* SELECT */}
      <div className="flex flex-col items-center gap-1">
        <button
          onPointerDown={() => {
            triggerHaptic(20);
            soundManager.playCoin();
            onSelectHero?.();
          }}
          className="w-10 sm:w-12 h-4 sm:h-4.5 bg-white/20 hover:bg-white/30 active:bg-white/50 -rotate-25 rounded-full border border-white/30 backdrop-blur-md shadow-sm active:translate-y-0.5 transition-transform"
          title="Select / Hero Switch"
        />
        <span className={`font-pixel text-[7.5px] font-black uppercase tracking-wider ${translucentStyles.labelColor}`}>
          SELECT
        </span>
      </div>

      {/* RESTART */}
      <div className="flex flex-col items-center gap-1">
        <button
          onPointerDown={() => {
            triggerHaptic(25);
            onRestart?.();
          }}
          className="w-10 sm:w-12 h-4 sm:h-4.5 bg-[#00FFD1]/25 hover:bg-[#00FFD1]/40 active:bg-[#00FFD1]/70 -rotate-25 rounded-full border border-[#00FFD1]/50 backdrop-blur-md shadow-sm active:translate-y-0.5 transition-transform"
          title="Restart Stage"
        />
        <span className="font-pixel text-[7.5px] font-black uppercase tracking-wider text-[#00FFD1]">
          RESTART
        </span>
      </div>

      {/* START */}
      <div className="flex flex-col items-center gap-1">
        <button
          onPointerDown={() => {
            triggerHaptic(25);
            soundManager.playCheckpoint();
            onTogglePause?.();
          }}
          className="w-10 sm:w-12 h-4 sm:h-4.5 bg-white/20 hover:bg-white/30 active:bg-white/50 -rotate-25 rounded-full border border-white/30 backdrop-blur-md shadow-sm active:translate-y-0.5 transition-transform"
          title="Start / Pause"
        />
        <span className={`font-pixel text-[7.5px] font-black uppercase tracking-wider ${translucentStyles.labelColor}`}>
          START
        </span>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // 4. TRANSLUCENT L & R SHOULDER BUTTONS
  // ----------------------------------------------------
  const renderShoulders = () => (
    <div className="w-full flex items-center justify-between px-3 sm:px-6 pb-1">
      <button
        onPointerDown={() => handleActionDown('dash')}
        onPointerUp={() => handleActionUp('dash')}
        className={`px-4 sm:px-5 py-1.5 rounded-xl font-pixel text-[9px] font-black active:translate-y-0.5 uppercase flex items-center gap-1.5 ${translucentStyles.shoulderBg}`}
      >
        <Shield size={12} /> L - SHIELD
      </button>

      <button
        onPointerDown={() => handleActionDown('special')}
        onPointerUp={() => handleActionUp('special')}
        className={`px-4 sm:px-5 py-1.5 rounded-xl font-pixel text-[9px] font-black active:translate-y-0.5 uppercase flex items-center gap-1.5 ${translucentStyles.shoulderBg}`}
      >
        <Zap size={12} /> R - BOOST
      </button>
    </div>
  );

  // ----------------------------------------------------
  // LAYOUT 1: PORTRAIT TRANSLUCENT HANDHELD CONSOLE
  // ----------------------------------------------------
  if (layout === 'portrait_console') {
    return (
      <div
        className={`w-full flex-1 flex flex-col justify-between p-3 sm:p-4 ${translucentStyles.shellBg} border-t ${translucentStyles.border} shadow-[0_-8px_32px_rgba(0,0,0,0.5)] select-none`}
        style={{ touchAction: 'none' }}
      >
        {/* Shoulder Buttons */}
        {renderShoulders()}

        {/* Main Controls Row: Translucent D-Pad & Action Buttons */}
        <div className="flex items-center justify-between px-2 sm:px-4 py-1">
          {renderDpad()}
          {renderActionButtons()}
        </div>

        {/* Select & Start + Translucent Speaker Slits */}
        <div className="flex flex-col items-center space-y-1.5 pt-1 pb-1">
          {renderSelectStart()}

          <div className="w-full flex items-center justify-between px-6 pt-1">
            <span className={`font-pixel text-[8px] font-black tracking-widest ${translucentStyles.labelColor}`}>
              TRANSLUCENT NINTENDO TOUCH
            </span>

            <div className="flex gap-1 -rotate-25 opacity-40">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-1.5 h-5 bg-white/30 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LAYOUT 2: LANDSCAPE TRANSLUCENT WINGS
  // ----------------------------------------------------
  if (layout === 'landscape_wings') {
    return (
      <div
        className="absolute inset-0 pointer-events-none z-30 flex justify-between select-none"
        style={{ touchAction: 'none' }}
      >
        {/* LEFT WING: Translucent L-Shoulder & D-Pad */}
        <div className="pointer-events-auto h-full flex flex-col justify-between p-2 sm:p-4 bg-black/25 backdrop-blur-sm border-r border-white/15 min-w-[140px] sm:min-w-[170px]">
          <button
            onPointerDown={() => handleActionDown('dash')}
            onPointerUp={() => handleActionUp('dash')}
            className={`px-3 py-1.5 rounded-xl font-pixel text-[8.5px] font-black uppercase shadow-sm ${translucentStyles.shoulderBg}`}
          >
            L - DASH
          </button>

          <div className="my-auto">{renderDpad()}</div>

          <div className="flex items-center gap-1.5">
            {onSelectHero && (
              <button
                onPointerDown={() => {
                  triggerHaptic(20);
                  onSelectHero();
                }}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-sm rounded-lg text-[8px] font-pixel text-white/80 active:translate-y-0.5"
              >
                HERO
              </button>
            )}
            <button
              onPointerDown={() => {
                triggerHaptic(25);
                onRestart?.();
              }}
              className="px-2.5 py-1 bg-[#00FFD1]/20 hover:bg-[#00FFD1]/30 border border-[#00FFD1]/40 backdrop-blur-sm rounded-lg text-[8px] font-pixel text-[#00FFD1] active:translate-y-0.5"
            >
              RESTART
            </button>
          </div>
        </div>

        {/* RIGHT WING: Translucent R-Shoulder & Action Buttons */}
        <div className="pointer-events-auto h-full flex flex-col justify-between p-2 sm:p-4 bg-black/25 backdrop-blur-sm border-l border-white/15 items-end min-w-[140px] sm:min-w-[170px]">
          <button
            onPointerDown={() => handleActionDown('special')}
            onPointerUp={() => handleActionUp('special')}
            className={`px-3 py-1.5 rounded-xl font-pixel text-[8.5px] font-black uppercase shadow-sm ${translucentStyles.shoulderBg}`}
          >
            R - BOOST
          </button>

          <div className="my-auto">{renderActionButtons()}</div>

          <button
            onPointerDown={() => {
              triggerHaptic(25);
              onTogglePause?.();
            }}
            className="px-3.5 py-1 bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-sm rounded-lg text-[8.5px] font-pixel text-[#FFD700] active:translate-y-0.5"
          >
            PAUSE
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LAYOUT 3: PROFESSIONAL ERGONOMIC TRANSLUCENT FLOATING OVERLAY (Default for Mobile & Tablet)
  // Perfectly placed in the natural thumb resting zones with no intrusive boxes!
  // ----------------------------------------------------
  return (
    <div
      className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* LEFT THUMB ZONE: Clean Floating Translucent D-Pad */}
      <div
        className={`absolute pointer-events-auto ${
          isTablet
            ? 'bottom-6 left-6 md:bottom-10 md:left-10'
            : 'bottom-3 left-3 sm:bottom-5 sm:left-5'
        }`}
      >
        {renderDpad()}
      </div>

      {/* RIGHT THUMB ZONE: Clean Floating Translucent Action Arc (Jump, Slash, Dash, Skill) */}
      <div
        className={`absolute pointer-events-auto ${
          isTablet
            ? 'bottom-6 right-6 md:bottom-10 md:right-10'
            : 'bottom-3 right-3 sm:bottom-5 sm:right-5'
        }`}
      >
        {renderActionButtons()}
      </div>

      {/* TOP UTILITY CORNER: Discreet Frosted Glass Pause & Restart Buttons (Out of Thumb Reach) */}
      <div
        className={`absolute pointer-events-auto flex items-center gap-2 ${
          isTablet
            ? 'top-14 right-6 md:top-16 md:right-8'
            : 'top-12 right-2.5 sm:top-14 sm:right-4'
        }`}
      >
        <button
          onPointerDown={() => {
            triggerHaptic(20);
            onRestart?.();
          }}
          className="px-2.5 sm:px-3 py-1 bg-black/40 hover:bg-black/60 active:scale-95 text-[#00FFD1] text-[8px] sm:text-[9px] font-pixel border border-white/20 backdrop-blur-md rounded-full shadow-md flex items-center gap-1 uppercase transition-all"
          title="Restart Stage"
        >
          <RotateCcw size={11} />
          <span>RESTART</span>
        </button>

        <button
          onPointerDown={() => {
            triggerHaptic(20);
            onTogglePause?.();
          }}
          className="px-2.5 sm:px-3 py-1 bg-black/40 hover:bg-black/60 active:scale-95 text-[#FFD700] text-[8px] sm:text-[9px] font-pixel border border-white/20 backdrop-blur-md rounded-full shadow-md flex items-center gap-1 uppercase transition-all"
          title="Pause Game"
        >
          <Pause size={11} />
          <span>PAUSE</span>
        </button>

        {onSelectHero && (
          <button
            onPointerDown={() => {
              triggerHaptic(20);
              onSelectHero();
            }}
            className="px-2.5 sm:px-3 py-1 bg-black/40 hover:bg-black/60 active:scale-95 text-white/90 text-[8px] sm:text-[9px] font-pixel border border-white/20 backdrop-blur-md rounded-full shadow-md flex items-center gap-1 uppercase transition-all"
            title="Switch Hero"
          >
            <span>HERO</span>
          </button>
        )}
      </div>
    </div>
  );
};
