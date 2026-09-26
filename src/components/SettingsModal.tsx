import React from 'react';
import {
  Volume2,
  VolumeX,
  Monitor,
  Tv,
  Palette,
  Gamepad2,
  Sparkles,
  Smartphone,
  Flame,
  Shield,
  Vibrate,
  RotateCw,
  Lock,
} from 'lucide-react';
import {
  DIFFICULTY_CONFIGS,
  DifficultyMode,
  GameSettings,
  HandheldSkin,
  LevelStats,
  MobileControlMode,
  SKIN_CONFIGS,
  isSkinUnlocked,
} from '../types';
import { soundManager } from '../audio/SoundManager';

interface SettingsModalProps {
  settings: GameSettings;
  levelStats?: Record<string, LevelStats>;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onOpenSkinsModal?: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  levelStats = {},
  onUpdateSettings,
  onOpenSkinsModal,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-[#0f0c29]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans">
      <div className="bg-[#1a1a2e] border-4 border-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-[8px_8px_0_0_#000] space-y-5 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b-2 border-white/10 pb-3 shrink-0">
          <div>
            <span className="text-[10px] font-black uppercase text-[#00FFD1] tracking-widest">SYSTEM OPTIONS</span>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">RETRO CONFIG</h2>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#24243e] hover:bg-[#302b63] border-2 border-white text-white rounded-xl text-xs font-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 uppercase transition-all"
          >
            CLOSE
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 text-xs font-mono pr-1">
          {/* 1. CAMPAIGN DIFFICULTY SELECTOR */}
          <div className="bg-[#24243e] p-4 rounded-2xl border-3 border-white shadow-[4px_4px_0_0_#000] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold flex items-center gap-2">
                <Flame size={16} className="text-[#FF416C]" /> GAME DIFFICULTY
              </span>
              <span
                className="px-2 py-0.5 rounded text-[9px] font-pixel font-bold uppercase border border-black"
                style={{
                  backgroundColor: DIFFICULTY_CONFIGS[settings.difficulty || 'normal']?.color || '#FFD700',
                  color: '#000',
                }}
              >
                {DIFFICULTY_CONFIGS[settings.difficulty || 'normal']?.badge}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  'zen',
                  'easy',
                  'normal',
                  'heroic',
                  'hard',
                  'expert',
                  'nightmare',
                  'inferno',
                ] as DifficultyMode[]
              ).map((d) => {
                const conf = DIFFICULTY_CONFIGS[d];
                const isSelected = settings.difficulty === d;
                return (
                  <button
                    key={d}
                    onClick={() => {
                      soundManager.playCoin();
                      onUpdateSettings({ difficulty: d });
                    }}
                    className={`p-2.5 rounded-xl border-2 font-pixel text-[8.5px] font-black text-center transition-all ${
                      isSelected
                        ? 'border-black shadow-[2px_2px_0_0_#000] scale-[1.02]'
                        : 'bg-[#1a1a2e] border-white/30 text-[#8E9299] hover:text-white'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: conf.color, color: '#000' }
                        : {}
                    }
                  >
                    {conf.badge}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-[#8E9299] font-sans leading-relaxed pt-1">
              {DIFFICULTY_CONFIGS[settings.difficulty || 'normal']?.description}
            </p>
          </div>

          {/* 2. NINTENDO HANDHELD SKIN & CONTROLLER STYLE */}
          <div className="bg-[#24243e] p-4 rounded-2xl border-3 border-white shadow-[4px_4px_0_0_#000] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold">
                <Gamepad2 size={16} className="text-[#00FFD1]" /> HARDWARE SKINS & CAPABILITIES
              </div>
              {onOpenSkinsModal && (
                <button
                  onClick={onOpenSkinsModal}
                  className="px-2.5 py-1 bg-[#1a1a2e] hover:bg-[#00FFD1] hover:text-black border border-white/40 text-[#00FFD1] text-[9px] font-pixel rounded-lg transition-all"
                >
                  FULL ARSENAL ↗
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'vibrant', name: 'Cyber Vibrant' },
                { id: 'dmg_gameboy', name: 'GameBoy DMG-01' },
                { id: 'nes_classic', name: 'NES Classic' },
                { id: 'snes', name: 'SNES Lilac' },
                { id: 'switch_neon', name: 'Neon Switch' },
              ].map((skin) => {
                const conf = SKIN_CONFIGS[skin.id as HandheldSkin];
                const unlocked = isSkinUnlocked(skin.id as HandheldSkin, levelStats);
                const isSel = (settings.handheldSkin || 'vibrant') === skin.id;

                return (
                  <button
                    key={skin.id}
                    onClick={() => {
                      if (unlocked) {
                        soundManager.playCoin();
                        onUpdateSettings({ handheldSkin: skin.id as HandheldSkin });
                      } else {
                        soundManager.playPlayerHurt();
                      }
                    }}
                    className={`p-2.5 rounded-xl border-2 text-[10px] font-black text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSel
                        ? 'bg-[#00FFD1] border-black text-black shadow-[2px_2px_0_0_#000]'
                        : unlocked
                        ? 'bg-[#1a1a2e] border-white/40 text-[#8E9299] hover:text-white'
                        : 'bg-[#121124] border-white/20 text-neutral-500 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {!unlocked && <Lock size={10} className="text-red-400" />}
                      <span>{skin.name}</span>
                    </div>
                    {conf && (
                      <span
                        className="text-[7.5px] font-pixel px-1 rounded uppercase truncate max-w-full"
                        style={{
                          backgroundColor: isSel ? '#00000020' : conf.themeColor + '30',
                          color: isSel ? '#000' : conf.themeColor,
                        }}
                      >
                        {unlocked ? conf.capability.badge : `LVL ${conf.requiredLevel}`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* HAPTIC VIBRATION TOGGLE */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-white flex items-center gap-2">
                <Vibrate size={15} className="text-[#FFD700]" /> HAPTIC TACTILE VIBRATION
              </span>
              <button
                onClick={() => onUpdateSettings({ vibrationEnabled: !(settings.vibrationEnabled ?? true) })}
                className={`px-3 py-1 rounded-lg font-black text-[9px] border border-black ${
                  settings.vibrationEnabled ?? true ? 'bg-[#FFD700] text-black' : 'bg-[#1a1a2e] text-[#8E9299]'
                }`}
              >
                {settings.vibrationEnabled ?? true ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* TOUCH CONTROLS STYLE */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-white flex items-center gap-2">
                  <Gamepad2 size={15} className="text-[#00FFD1]" /> MOBILE & TABLET CONTROL STYLE
                </span>
                <span className="text-[9px] text-[#FFD700] uppercase font-pixel">
                  {settings.mobileControlMode === 'handheld' ? 'HANDHELD' : 'TRANSPARENT OVERLAY'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    soundManager.playCoin();
                    onUpdateSettings({ mobileControlMode: 'overlay' });
                  }}
                  className={`p-2 rounded-xl border-2 font-pixel text-[8.5px] uppercase transition-all ${
                    (settings.mobileControlMode || 'overlay') === 'overlay'
                      ? 'bg-[#00FFD1] text-black border-black font-black shadow-[2px_2px_0_0_#000]'
                      : 'bg-[#1a1a2e] text-[#8E9299] border-white/30 hover:text-white'
                  }`}
                >
                  TRANSPARENT OVERLAY
                </button>
                <button
                  onClick={() => {
                    soundManager.playCoin();
                    onUpdateSettings({ mobileControlMode: 'handheld' });
                  }}
                  className={`p-2 rounded-xl border-2 font-pixel text-[8.5px] uppercase transition-all ${
                    settings.mobileControlMode === 'handheld'
                      ? 'bg-[#FFD700] text-black border-black font-black shadow-[2px_2px_0_0_#000]'
                      : 'bg-[#1a1a2e] text-[#8E9299] border-white/30 hover:text-white'
                  }`}
                >
                  HANDHELD CONSOLE
                </button>
              </div>
            </div>

            {/* ON-SCREEN TOUCH CONTROLS ON PC TOGGLE */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="space-y-0.5">
                <span className="text-white flex items-center gap-2">
                  <Monitor size={15} className="text-[#00FFD1]" /> CONTROLS ON PC
                </span>
                <span className="text-[9px] text-[#8E9299] block font-sans">
                  {settings.showTouchControls
                    ? 'Always visible (translucent touch overlay)'
                    : 'Hidden on PC (keyboard active) • Translucent on mobile'}
                </span>
              </div>
              <button
                onClick={() => onUpdateSettings({ showTouchControls: !settings.showTouchControls })}
                className={`px-3 py-1 rounded-lg font-black text-[9px] border border-black ${
                  settings.showTouchControls ? 'bg-[#00FFD1] text-black' : 'bg-[#1a1a2e] text-[#8E9299]'
                }`}
              >
                {settings.showTouchControls ? 'ALWAYS ON' : 'AUTO (OFF ON PC)'}
              </button>
            </div>
          </div>

          {/* 3. MOBILE ORIENTATION PREFERENCE */}
          <div className="bg-[#24243e] p-4 rounded-2xl border-3 border-white shadow-[4px_4px_0_0_#000] space-y-2.5">
            <div className="flex items-center gap-2 text-white font-bold">
              <Smartphone size={16} className="text-[#FFD700]" /> DISPLAY ORIENTATION MODE
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'auto', name: 'Auto Detect' },
                { id: 'landscape', name: 'Landscape Only' },
                { id: 'portrait', name: 'Portrait Handheld' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    soundManager.playCoin();
                    onUpdateSettings({ forceOrientation: mode.id as any });
                  }}
                  className={`p-2 rounded-xl border-2 text-[10px] font-black text-center transition-all ${
                    (settings.forceOrientation || 'auto') === mode.id
                      ? 'bg-[#FFD700] border-black text-black shadow-[2px_2px_0_0_#000]'
                      : 'bg-[#1a1a2e] border-white/40 text-[#8E9299] hover:text-white'
                  }`}
                >
                  {mode.name}
                </button>
              ))}
            </div>
          </div>

          {/* 4. AUDIO SFX & CHIPTUNE VOLUMES */}
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

          {/* 5. CRT SHADER & COLOR PALETTES */}
          <div className="flex items-center justify-between bg-[#24243e] p-4 rounded-2xl border-3 border-white shadow-[4px_4px_0_0_#000]">
            <div className="flex items-center gap-3">
              <Tv size={20} className="text-[#FF416C]" />
              <div>
                <div className="text-white font-black uppercase text-xs">CRT Scanline Shader</div>
                <div className="text-[10px] text-[#8E9299]">Authentic arcade tube scanlines & phosphor glow</div>
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

          {/* 6. COLOR PALETTES */}
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
                      : 'bg-[#1a1a2e] border-white/40 text-[#8E9299] hover:text-white'
                  }`}
                >
                  {pal.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 shrink-0">
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
