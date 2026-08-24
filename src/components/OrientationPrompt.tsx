import React, { useEffect, useState } from 'react';
import { Smartphone, RotateCw, Maximize2, X } from 'lucide-react';

interface OrientationPromptProps {
  onDismiss?: () => void;
}

export const OrientationPrompt: React.FC<OrientationPromptProps> = ({ onDismiss }) => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobileOrTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

      // Check if width is narrower than height on mobile / small screens
      const isNarrowPortrait = window.innerWidth < window.innerHeight && window.innerWidth < 850;
      setIsPortrait(isMobileOrTouch && isNarrowPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleRequestFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      }

      // Try locking orientation to landscape if supported by browser
      if (screen.orientation && (screen.orientation as any).lock) {
        try {
          await (screen.orientation as any).lock('landscape');
        } catch (e) {
          // Orientation lock might require user gesture or not be supported on all browsers
        }
      }
    } catch (err) {
      console.warn('Fullscreen request error:', err);
    }
  };

  if (!isPortrait || dismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Landscape orientation notice"
      className="fixed inset-0 z-[100] bg-[#0f0c29]/95 backdrop-blur-xl flex items-center justify-center p-6 text-center select-none animate-in fade-in duration-300"
    >
      {/* Background Cyber Glow */}
      <div className="absolute inset-0 vibrant-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FF416C] rounded-full blur-[110px] opacity-25 pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#00FFD1] rounded-full blur-[110px] opacity-25 pointer-events-none" />

      <div className="relative bg-[#1a1a2e] border-4 border-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-[8px_8px_0_0_#000] flex flex-col items-center space-y-5">
        {/* Dismiss Button */}
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="absolute top-3 right-3 p-2 text-[#8E9299] hover:text-white bg-[#24243e] rounded-xl border-2 border-white/40 active:translate-x-0.5 active:translate-y-0.5"
          title="Dismiss notice"
        >
          <X size={16} />
        </button>

        {/* Animated Phone Rotate Icon */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#24243e] border-3 border-[#00FFD1] flex items-center justify-center shadow-[4px_4px_0_0_#000] animate-bounce">
            <Smartphone size={32} className="text-[#00FFD1] rotate-90" />
          </div>
          <div className="absolute -top-1 -right-1 bg-[#FFD700] text-black p-1.5 rounded-full border-2 border-black animate-spin">
            <RotateCw size={14} className="stroke-[3]" />
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase text-[#FFD700] tracking-widest">
            OPTIMAL DISPLAY MODE
          </span>
          <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">
            ROTATE TO LANDSCAPE
          </h3>
          <p className="text-xs text-[#8E9299] font-mono leading-relaxed pt-1">
            Pixel Quest is crafted for landscape mode on mobile devices for responsive dual-thumb controls and wide field of view.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full pt-1">
          <button
            onClick={handleRequestFullscreen}
            className="w-full py-3.5 bg-[#FFD700] hover:bg-[#ffea00] text-black font-black text-xs rounded-xl shadow-[4px_4px_0_0_#B8860B] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#B8860B] transition-all flex items-center justify-center gap-2 border-3 border-black uppercase italic"
          >
            <Maximize2 size={16} className="stroke-[3]" />
            <span>FULLSCREEN LANDSCAPE</span>
          </button>

          <button
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
            className="w-full py-2.5 bg-[#24243e] hover:bg-[#302b63] text-white font-black text-xs rounded-xl border-2 border-white/60 active:translate-x-0.5 active:translate-y-0.5 transition-all uppercase"
          >
            CONTINUE ANYWAY
          </button>
        </div>
      </div>
    </aside>
  );
};
