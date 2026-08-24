import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Save,
  FolderOpen,
  Download,
  Upload,
  RotateCcw,
  Eraser,
  Pencil,
  Sparkles,
  Layers,
  ChevronLeft,
  Info,
} from 'lucide-react';
import { HeroClassType, LevelData, TileType } from '../types';
import { drawTile } from '../graphics/pixelSprites';
import { soundManager } from '../audio/SoundManager';

interface LevelEditorProps {
  onPlayTest: (level: LevelData) => void;
  onExit: () => void;
}

const TILE_PALETTE: { id: string; name: string; category: string; color: string; icon: string }[] = [
  { id: 'solid', name: 'Solid Block', category: 'Terrain', color: '#475569', icon: '🧱' },
  { id: 'solid_top', name: 'Drop Platform', category: 'Terrain', color: '#3b82f6', icon: '➖' },
  { id: 'breakable', name: 'Crumble Block', category: 'Terrain', color: '#78350f', icon: '🟫' },
  { id: 'spike_up', name: 'Spike Up', category: 'Hazards', color: '#dc2626', icon: '🔺' },
  { id: 'spike_down', name: 'Spike Down', category: 'Hazards', color: '#dc2626', icon: '🔻' },
  { id: 'lava', name: 'Molten Lava', category: 'Hazards', color: '#ea580c', icon: '🔥' },
  { id: 'spring', name: 'Spring Pad', category: 'Interactive', color: '#eab308', icon: '🌀' },
  { id: 'coin', name: 'Gold Coin', category: 'Items', color: '#eab308', icon: '🪙' },
  { id: 'gem', name: 'Crystal Gem', category: 'Items', color: '#06b6d4', icon: '💎' },
  { id: 'heart', name: 'Heart HP', category: 'Items', color: '#ef4444', icon: '❤️' },
  { id: 'key', name: 'Golden Key', category: 'Items', color: '#facc15', icon: '🔑' },
  { id: 'door', name: 'Locked Door', category: 'Interactive', color: '#78350f', icon: '🚪' },
  { id: 'checkpoint', name: 'Checkpoint', category: 'Interactive', color: '#38bdf8', icon: '🚩' },
  { id: 'exit', name: 'Exit Portal', category: 'Interactive', color: '#a855f7', icon: '🌌' },
  { id: 'spawn', name: 'Player Start', category: 'Entities', color: '#10b981', icon: '🤺' },
  { id: 'enemy_slime', name: 'Green Slime', category: 'Entities', color: '#22c55e', icon: '🟢' },
  { id: 'enemy_skeleton', name: 'Skeleton Guard', category: 'Entities', color: '#cbd5e1', icon: '💀' },
  { id: 'enemy_bat', name: 'Vampire Bat', category: 'Entities', color: '#6366f1', icon: '🦇' },
  { id: 'enemy_goblin', name: 'Goblin Bomber', category: 'Entities', color: '#84cc16', icon: '💣' },
  { id: 'boss_titan', name: 'The Titan Boss', category: 'Entities', color: '#f43f5e', icon: '👾' },
  { id: 'empty', name: 'Eraser', category: 'Tools', color: '#18181b', icon: '🧹' },
];

export const LevelEditor: React.FC<LevelEditorProps> = ({ onPlayTest, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [levelName, setLevelName] = useState('My Custom Realm');
  const [biome, setBiome] = useState<'emerald' | 'caverns' | 'magma' | 'cyber'>('emerald');
  const [width, setWidth] = useState(60);
  const [height, setHeight] = useState(18);
  const [selectedTile, setSelectedTile] = useState<string>('solid');
  const [spawnPoint, setSpawnPoint] = useState<{ x: number; y: number }>({ x: 3, y: 14 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [grid, setGrid] = useState<string[][]>(() => {
    // Initial default blank map with ground floor
    const initialGrid: string[][] = [];
    for (let y = 0; y < 18; y++) {
      const row: string[] = [];
      for (let x = 0; x < 60; x++) {
        if (y >= 16 || x === 0 || x === 59) {
          row.push('solid');
        } else {
          row.push('empty');
        }
      }
      initialGrid.push(row);
    }
    // Default exit & coin
    initialGrid[15][55] = 'exit';
    initialGrid[14][10] = 'coin';
    return initialGrid;
  });

  const [savedLevels, setSavedLevels] = useState<{ id: string; name: string }[]>([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [jsonExport, setJsonExport] = useState('');
  const [showJsonModal, setShowJsonModal] = useState(false);

  const tileSize = 20;

  // Load saved custom level names from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pixel_quest_custom_levels');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedLevels(parsed.map((l: LevelData) => ({ id: l.id, name: l.name })));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Redraw Canvas on grid change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * tileSize;
    canvas.height = height * tileSize;

    // Background fill
    ctx.fillStyle = biome === 'emerald' ? '#0f172a' : biome === 'magma' ? '#1c0a06' : '#05050a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileSize, 0);
      ctx.lineTo(x * tileSize, height * tileSize);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * tileSize);
      ctx.lineTo(width * tileSize, y * tileSize);
      ctx.stroke();
    }

    // Draw Tiles
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const tile = grid[r]?.[c] || 'empty';
        if (tile !== 'empty') {
          drawTile(ctx, tile, c * tileSize, r * tileSize, tileSize, biome);
          // Label for entities/items
          const match = TILE_PALETTE.find((p) => p.id === tile);
          if (match && match.category !== 'Terrain') {
            ctx.font = '12px serif';
            ctx.fillText(match.icon, c * tileSize + 2, r * tileSize + 15);
          }
        }
      }
    }

    // Draw Spawn Point Marker
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(spawnPoint.x * tileSize, spawnPoint.y * tileSize, tileSize, tileSize);
    ctx.fillStyle = '#10b981';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('P', spawnPoint.x * tileSize + 4, spawnPoint.y * tileSize + 14);
  }, [grid, biome, width, height, spawnPoint]);

  const handleCanvasAction = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor(((e.clientX - rect.left) * scaleX) / tileSize);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / tileSize);

    if (x >= 0 && x < width && y >= 0 && y < height) {
      if (selectedTile === 'spawn') {
        setSpawnPoint({ x, y });
        soundManager.playCoin();
      } else {
        setGrid((prev) => {
          const next = prev.map((r) => [...r]);
          if (!next[y]) next[y] = [];
          next[y][x] = selectedTile;
          return next;
        });
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    handleCanvasAction(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      handleCanvasAction(e);
    }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleClearAll = () => {
    const next: string[][] = [];
    for (let y = 0; y < height; y++) {
      const row: string[] = [];
      for (let x = 0; x < width; x++) {
        row.push(y >= height - 2 ? 'solid' : 'empty');
      }
      next.push(row);
    }
    setGrid(next);
    soundManager.playExplosion();
  };

  const handleSaveToBrowser = () => {
    try {
      const newLevel: LevelData = {
        id: `custom_${Date.now()}`,
        name: levelName || 'Untitled Stage',
        worldIndex: 99,
        stageIndex: 1,
        biome,
        width,
        height,
        tileSize: 16,
        tiles: grid,
        spawnPoint,
        targetTime: 40,
        parScore: 2000,
        bgMusicTheme: biome === 'magma' ? 'volcano' : biome === 'caverns' ? 'cave' : 'ruins',
      };

      const stored = localStorage.getItem('pixel_quest_custom_levels');
      const levels: LevelData[] = stored ? JSON.parse(stored) : [];
      levels.push(newLevel);
      localStorage.setItem('pixel_quest_custom_levels', JSON.stringify(levels));
      setSavedLevels(levels.map((l) => ({ id: l.id, name: l.name })));
      soundManager.playVictory();
      alert(`Level "${levelName}" successfully saved to your browser!`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadLevel = (levelId: string) => {
    try {
      const stored = localStorage.getItem('pixel_quest_custom_levels');
      if (stored) {
        const levels: LevelData[] = JSON.parse(stored);
        const target = levels.find((l) => l.id === levelId);
        if (target) {
          setLevelName(target.name);
          setBiome(target.biome);
          setWidth(target.width);
          setHeight(target.height);
          setSpawnPoint(target.spawnPoint);
          setGrid(target.tiles);
          setShowSavedModal(false);
          soundManager.playCheckpoint();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportJson = () => {
    const levelExport: LevelData = {
      id: `custom_${Date.now()}`,
      name: levelName,
      worldIndex: 99,
      stageIndex: 1,
      biome,
      width,
      height,
      tileSize: 16,
      tiles: grid,
      spawnPoint,
      targetTime: 40,
      parScore: 2000,
      bgMusicTheme: biome === 'magma' ? 'volcano' : biome === 'caverns' ? 'cave' : 'ruins',
    };
    setJsonExport(JSON.stringify(levelExport, null, 2));
    setShowJsonModal(true);
  };

  const handleImportJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.tiles && parsed.width && parsed.height) {
        setLevelName(parsed.name || 'Imported Level');
        setBiome(parsed.biome || 'emerald');
        setWidth(parsed.width);
        setHeight(parsed.height);
        setSpawnPoint(parsed.spawnPoint || { x: 3, y: 14 });
        setGrid(parsed.tiles);
        setShowJsonModal(false);
        soundManager.playVictory();
      }
    } catch (e) {
      alert('Invalid level JSON code.');
    }
  };

  const handleStartPlayTest = () => {
    const testLevel: LevelData = {
      id: 'custom_test',
      name: levelName,
      worldIndex: 99,
      stageIndex: 1,
      biome,
      width,
      height,
      tileSize: 16,
      tiles: grid,
      spawnPoint,
      targetTime: 45,
      parScore: 2500,
      bgMusicTheme: biome === 'magma' ? 'volcano' : biome === 'caverns' ? 'cave' : 'ruins',
    };
    onPlayTest(testLevel);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0f0c29] text-white overflow-hidden select-none font-sans">
      {/* TOP HEADER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#1a1a2e] border-b-4 border-white shadow-[0_4px_0_0_#000] z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="px-3.5 py-2 bg-[#24243e] hover:bg-[#302b63] border-2 border-white text-white rounded-xl text-xs font-black shadow-[2px_2px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 uppercase transition-all flex items-center gap-1.5"
          >
            <ChevronLeft size={16} /> BACK
          </button>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={levelName}
              onChange={(e) => setLevelName(e.target.value)}
              className="bg-[#24243e] border-2 border-white/80 px-3.5 py-1.5 rounded-xl text-xs font-black text-[#FFD700] uppercase italic tracking-tight focus:outline-none focus:border-[#FFD700] w-48 sm:w-64 shadow-[2px_2px_0_0_#000]"
              placeholder="LEVEL TITLE..."
            />
          </div>
        </div>

        {/* Biome Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black text-[#8E9299] uppercase tracking-wider hidden sm:inline mr-1">BIOME:</span>
          {(['emerald', 'caverns', 'magma', 'cyber'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBiome(b)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                biome === b
                  ? 'bg-[#FFD700] text-black border-black shadow-[2px_2px_0_0_#B8860B]'
                  : 'bg-[#24243e] text-[#8E9299] border-white/40 hover:text-white hover:border-white'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveToBrowser}
            className="px-3.5 py-2 bg-[#24243e] hover:bg-[#302b63] text-white rounded-xl text-xs font-black flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 transition-all border-2 border-white shadow-[2px_2px_0_0_#000] uppercase"
            title="Save Level"
          >
            <Save size={14} className="text-[#FFD700]" /> SAVE
          </button>
          <button
            onClick={() => setShowSavedModal(true)}
            className="px-3.5 py-2 bg-[#24243e] hover:bg-[#302b63] text-white rounded-xl text-xs font-black flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 transition-all border-2 border-white shadow-[2px_2px_0_0_#000] uppercase"
            title="Load Level"
          >
            <FolderOpen size={14} className="text-[#00FFD1]" /> LOAD
          </button>
          <button
            onClick={handleExportJson}
            className="p-2 bg-[#24243e] hover:bg-[#302b63] text-[#FF416C] rounded-xl text-xs font-black active:translate-x-0.5 active:translate-y-0.5 transition-all border-2 border-white shadow-[2px_2px_0_0_#000]"
            title="Share / Import JSON Code"
          >
            <Download size={15} />
          </button>
          <button
            onClick={handleClearAll}
            className="p-2 bg-[#24243e] hover:bg-[#FF416C] text-[#FF6B6B] hover:text-white rounded-xl text-xs active:translate-x-0.5 active:translate-y-0.5 transition-all border-2 border-white shadow-[2px_2px_0_0_#000]"
            title="Clear Stage"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={handleStartPlayTest}
            className="px-5 py-2 bg-[#FFD700] hover:bg-[#ffea00] text-black font-black rounded-xl text-xs flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 transition-all border-3 border-black shadow-[3px_3px_0_0_#B8860B] uppercase italic tracking-wider"
          >
            <Play size={14} className="fill-black" /> TEST PLAY
          </button>
        </div>
      </div>

      {/* MAIN BUILDER WORKSPACE */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* TILE PALETTE SIDEBAR */}
        <div className="w-full md:w-64 bg-[#1e1e2f] border-r-4 border-white p-3.5 overflow-y-auto max-h-48 md:max-h-none flex flex-wrap md:flex-col gap-2">
          <div className="w-full text-[10px] font-black text-[#8E9299] uppercase tracking-wider mb-1">SELECT TOOL / TILE:</div>
          <div className="grid grid-cols-4 md:grid-cols-2 gap-1.5 w-full">
            {TILE_PALETTE.map((tile) => (
              <button
                key={tile.id}
                onClick={() => {
                  setSelectedTile(tile.id);
                  soundManager.playAttack();
                }}
                className={`p-2.5 rounded-xl border-2 flex items-center gap-2 text-left transition-all ${
                  selectedTile === tile.id
                    ? 'bg-[#FFD700] border-black text-black shadow-[2px_2px_0_0_#B8860B]'
                    : 'bg-[#24243e] border-white/30 text-white/90 hover:bg-[#302b63] hover:border-white'
                }`}
              >
                <span className="text-base">{tile.icon}</span>
                <span className="text-[10px] font-black uppercase truncate hidden md:inline">{tile.name}</span>
              </button>
            ))}
          </div>

          <div className="hidden md:block mt-4 p-3.5 bg-[#24243e] rounded-2xl border-2 border-white/60 text-xs text-[#8E9299] space-y-1.5 shadow-[3px_3px_0_0_#000]">
            <div className="flex items-center gap-1 font-black text-[#FFD700] uppercase text-[10px] tracking-wider">
              <Info size={14} /> INSTRUCTIONS
            </div>
            <p>• Click & drag on the grid to paint tiles.</p>
            <p>• Place a Player Start (🤺) and an Exit Portal (🌌) to make the level beatable.</p>
            <p>• Hit "Test Play" to jump straight into your stage!</p>
          </div>
        </div>

        {/* CANVAS SCROLLABLE VIEWPORT */}
        <div className="flex-1 bg-[#0f0c29] vibrant-grid overflow-auto p-6 flex items-center justify-center">
          <div className="relative border-4 border-white rounded-2xl shadow-[8px_8px_0_0_#000] overflow-hidden bg-black">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="cursor-crosshair block pixelated"
            />
          </div>
        </div>
      </div>

      {/* SAVED LEVELS MODAL */}
      {showSavedModal && (
        <div className="fixed inset-0 bg-[#0f0c29]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans">
          <div className="bg-[#1a1a2e] border-4 border-white p-7 rounded-3xl max-w-md w-full shadow-[8px_8px_0_0_#000]">
            <h3 className="text-xl font-black text-white italic tracking-tight uppercase mb-4 flex items-center gap-2">
              <FolderOpen size={22} className="text-[#00FFD1]" /> LOAD SAVED STAGE
            </h3>
            {savedLevels.length === 0 ? (
              <p className="text-xs text-[#8E9299] font-mono py-4">No custom levels saved in this browser yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {savedLevels.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => handleLoadLevel(lvl.id)}
                    className="w-full p-3.5 bg-[#24243e] hover:bg-[#302b63] border-2 border-white rounded-xl text-left text-xs font-black text-white flex items-center justify-between transition-all shadow-[2px_2px_0_0_#000] uppercase"
                  >
                    <span>{lvl.name}</span>
                    <span className="text-[10px] text-[#00FFD1] bg-black/40 px-2 py-0.5 rounded border border-[#00FFD1]/40">LOAD</span>
                  </button>
                ))}
              </div>
            )}
            <div className="pt-5 flex justify-end">
              <button
                onClick={() => setShowSavedModal(false)}
                className="px-5 py-2.5 bg-[#24243e] hover:bg-[#302b63] text-white border-2 border-white rounded-xl text-xs font-black shadow-[2px_2px_0_0_#000] uppercase"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT / IMPORT JSON MODAL */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-[#0f0c29]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans">
          <div className="bg-[#1a1a2e] border-4 border-white p-7 rounded-3xl max-w-lg w-full shadow-[8px_8px_0_0_#000]">
            <h3 className="text-xl font-black text-white italic tracking-tight uppercase mb-3 flex items-center gap-2">
              <Download size={20} className="text-[#FFD700]" /> SHARE / IMPORT STAGE JSON
            </h3>
            <p className="text-xs text-[#8E9299] mb-3">
              Copy this JSON to share your level or paste another level code below to load:
            </p>
            <textarea
              value={jsonExport}
              onChange={(e) => setJsonExport(e.target.value)}
              className="w-full h-44 bg-[#0f0c29] border-2 border-white/60 p-3.5 rounded-2xl text-[11px] font-mono text-[#00FFD1] focus:outline-none focus:border-[#00FFD1] resize-none shadow-inner"
            />
            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(jsonExport);
                  soundManager.playCoin();
                  alert('Level code copied to clipboard!');
                }}
                className="px-4 py-2.5 bg-[#24243e] hover:bg-[#302b63] text-[#FFD700] border-2 border-white rounded-xl text-xs font-black uppercase shadow-[2px_2px_0_0_#000]"
              >
                COPY CODE
              </button>
              <div className="flex gap-2.5">
                <button
                  onClick={() => handleImportJson(jsonExport)}
                  className="px-5 py-2.5 bg-[#FFD700] hover:bg-[#ffea00] text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0_0_#B8860B]"
                >
                  IMPORT
                </button>
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="px-4 py-2.5 bg-[#24243e] hover:bg-[#302b63] text-[#8E9299] border-2 border-white/40 rounded-xl text-xs font-black uppercase"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
