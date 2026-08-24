import React from 'react';
import { Volume2, VolumeX, Monitor, Tv, Palette, Gamepad2, Sparkles, Check } from 'lucide-react';
import { GameSettings } from '../types';
import { soundManager } from '../audio/SoundManager';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-[#0f0c29]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans">
      <div className="bg-[#1a1a2e] border-4 border-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-[8px_8px_0_0_#000] space-y-6">
        <div className="flex items-center justify-between border-b-2 border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase text-[#00FFD1] tracking-widest">SYSTEM OPTIONS</span>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">RETRO SETTINGS</h2>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#24243e] hover:bg-[#302b63] border-2 border-white text-white rounded-xl text-xs font-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 uppercase transition-all"
          >
            CLOSE
          </button>
        </div>

        <div className="space-y-4 text-xs font-mono">
          {/* SOUND SFX & MUSIC */}
          <div className="space-y-3 bg-[#24243e] p-4 rounded-2xl border-3 border-white shadow-[4px_4px_0_0_#000]">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold flex items-center gap-2">
                <Volume2 size={16} className="text-[#FFD700]" /> SFX VOLUME
              </span>
              <span className="text-[#00FFD1] font-bold">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateSettings({ sfxVolume: val });
                soundManager.setVolumes(val, settings.musicVolume);
                soundManager.playCoin();
              }}
              className="w-full accent-[#FFD700] bg-[#0f0c29] h-2.5 rounded-lg cursor-pointer border border-black"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-white font-bold flex items-center gap-2">
                <Sparkles size={16} className="text-[#00B4DB]" /> 8-BIT CHIPTUNE MUSIC
              </span>
              <span className="text-[#00B4DB] font-bold">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateSettings({ musicVolume: val });
                soundManager.setVolumes(settings.sfxVolume, val);
              }}
              className="w-full accent-[#00B4DB] bg-[#0f0c29] h-2.5 rounded-lg cursor-pointer border border-black"
            />
          </div>

          {/* CRT SCANLINES TOGGLE */}
          <div className="flex items-center justify-between bg-[#24243e] p-4 rounded-2xl border-3 border-white shadow-[4px_4px_0_0_#000]">
            <div className="flex items-center gap-3">
              <Tv size={20} className="text-[#FF416C]" />
              <div>
                <div className="text-white font-black uppercase text-xs">CRT Scanline Shader</div>
                <div className="text-[10px] text-[#8E9299]">Authentic arcade tube scanlines & RGB phosphor glow</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ crtFilter: !settings.crtFilter })}
              className={`px-4 py-2 rounded-xl font-black text-[10px] transition-all border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 ${
                settings.crtFilter ? 'bg-[#FF416C] text-white shadow-[0_0_10px_#FF416C]' : 'bg-[#1a1a2e] text-[#8E9299]'
              }`}
            >
              {settings.crtFilter ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* COLOR PALETTES */}
          <div className="space-y-2 bg-[#24243e] p-4 rounded-2xl border-3 border-white shadow-[4px_4px_0_0_#000]">
            <div className="flex items-center gap-2 text-white font-bold">
              <Palette size={16} className="text-[#00FFD1]" /> RETRO COLOR PALETTE
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {[
                { id: 'default', name: '16-Bit Vibrant' },
                { id: 'gameboy', name: 'GameBoy Green' },
                { id: 'nes', name: 'NES Classic' },
                { id: 'cyberpunk', name: 'Neon Cyber' },
                { id: 'monochrome', name: 'Noir Classic' },
              ].map((pal) => (
                <button
                  key={pal.id}
                  onClick={() => onUpdateSettings({ colorPalette: pal.id as any })}
                  className={`p-2.5 rounded-xl border-2 text-[10px] font-black text-center transition-all ${
                    settings.colorPalette === pal.id
                      ? 'bg-[#FFD700] border-black text-black shadow-[2px_2px_0_0_#B8860B]'
                      : 'bg-[#1a1a2e] border-white/40 text-[#8E9299] hover:text-white hover:border-white'
                  }`}
                >
                  {pal.name}
                </button>
              ))}
            </div>
          </div>

          {/* TOUCH CONTROLS ON DESKTOP */}
          <div className="flex items-center justify-between bg-[#24243e] p-4 rounded-2xl border-3 border-white shadow-[4px_4px_0_0_#000]">
            <div className="flex items-center gap-3">
              <Gamepad2 size={20} className="text-[#FFD700]" />
              <div>
                <div className="text-white font-black uppercase text-xs">On-Screen Gamepad</div>
                <div className="text-[10px] text-[#8E9299]">Display virtual controls overlay</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ showTouchControls: !settings.showTouchControls })}
              className={`px-4 py-2 rounded-xl font-black text-[10px] transition-all border-2 border-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 ${
                settings.showTouchControls ? 'bg-[#FFD700] text-black' : 'bg-[#1a1a2e] text-[#8E9299]'
              }`}
            >
              {settings.showTouchControls ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-7 py-3.5 bg-[#FFD700] hover:bg-[#ffea00] text-black font-black text-xs rounded-xl shadow-[4px_4px_0_0_#B8860B] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#B8860B] transition-all border-3 border-black uppercase italic"
          >
            APPLY & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
