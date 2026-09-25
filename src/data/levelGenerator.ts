import { LevelData, TileType } from '../types';
import { CAMPAIGN_LEVELS } from './defaultLevels';

export const TOTAL_LEVELS = 1000;
export const TOTAL_WORLDS = 100;
export const LEVELS_PER_WORLD = 10;

export interface WorldInfo {
  worldIndex: number;
  name: string;
  sectorName: string;
  biome: 'emerald' | 'caverns' | 'magma' | 'frost' | 'cyber';
  bgMusicTheme: 'ruins' | 'cave' | 'volcano' | 'cyber' | 'boss';
  color: string;
  description: string;
  startLevel: number;
  endLevel: number;
}

// 5 Grand Galactic Sectors spanning 100 Worlds
export const SECTORS = [
  {
    id: 1,
    name: 'Sector I: Verdant Emerald',
    icon: '🌲',
    range: 'Levels 1 – 200',
    worlds: 'Worlds 1 – 20',
    color: '#00FFD1',
    biome: 'emerald' as const,
  },
  {
    id: 2,
    name: 'Sector II: Crystalline Mines',
    icon: '💎',
    range: 'Levels 201 – 400',
    worlds: 'Worlds 21 – 40',
    color: '#a855f7',
    biome: 'caverns' as const,
  },
  {
    id: 3,
    name: 'Sector III: Molten Crucible',
    icon: '🌋',
    range: 'Levels 401 – 600',
    worlds: 'Worlds 41 – 60',
    color: '#FF6B6B',
    biome: 'magma' as const,
  },
  {
    id: 4,
    name: 'Sector IV: Frostpeak Glacier',
    icon: '❄️',
    range: 'Levels 601 – 800',
    worlds: 'Worlds 61 – 80',
    color: '#38bdf8',
    biome: 'frost' as const,
  },
  {
    id: 5,
    name: 'Sector V: Cyber Singularity',
    icon: '⚡',
    range: 'Levels 801 – 1000',
    worlds: 'Worlds 81 – 100',
    color: '#FF416C',
    biome: 'cyber' as const,
  },
];

const THEME_PREFIXES: Record<string, string[]> = {
  emerald: [
    'Verdant', 'Emerald', 'Mossy', 'Sunken', 'Ancient', 'Floral', 'Whispering', 'Bramble',
    'Jade', 'Timber', 'Mystic', 'Overgrown', 'Canopy', 'Druid', 'Silent', 'Enchanted',
    'Rootbound', 'Grove', 'Feral', 'Twilight',
  ],
  caverns: [
    'Crystalline', 'Amethyst', 'Glowstone', 'Deep', 'Stalactite', 'Obsidian', 'Quartz',
    'Sapphire', 'Chasm', 'Echoing', 'Hollow', 'Glimmer', 'Subterranean', 'Geode',
    'Phosphor', 'Prismatic', 'Dwarven', 'Abyssal', 'Mineral', 'Lapis',
  ],
  magma: [
    'Molten', 'Infernal', 'Brimstone', 'Cinder', 'Volcanic', 'Scorched', 'Ash', 'Pyre',
    'Blazing', 'Magmatic', 'Obsidian', 'Crucible', 'Hellfire', 'Smoldering', 'Ember',
    'Basalt', 'Lava', 'Ignited', 'Boiling', 'Torrid',
  ],
  frost: [
    'Frostpeak', 'Glacial', 'Blizzard', 'Arctic', 'Rime', 'Boreal', 'Subzero', 'Tundra',
    'Aurora', 'Icebound', 'Shiver', 'Permafrost', 'Crystal Ice', 'Alpine', 'Frozen',
    'Winter', 'Polar', 'Hailstone', 'Snowdrift', 'Glacier',
  ],
  cyber: [
    'Neon', 'Quantum', 'Matrix', 'Cyber', 'Digital', 'Null', 'Binary', 'Overclocked',
    'Synth', 'Data', 'Grid', 'Chroma', 'Laser', 'Holo', 'Subroutine', 'Virtual',
    'Nexus', 'Vector', 'Omega', 'Singularity',
  ],
};

const THEME_SUFFIXES: Record<string, string[]> = {
  emerald: ['Glade', 'Hollow', 'Canopy', 'Grove', 'Sanctuary', 'Trail', 'Thicket', 'Arbor', 'Vale', 'Ruins'],
  caverns: ['Chasm', 'Vault', 'Mines', 'Grotto', 'Depths', 'Crevasse', 'Cavern', 'Labyrinth', 'Pit', 'Abyss'],
  magma: ['Foundry', 'Caldera', 'Core', 'Furnace', 'Ridge', 'Crater', 'Shatter', 'Spire', 'Fissure', 'Chamber'],
  frost: ['Summit', 'Ridge', 'Spire', 'Pass', 'Shelf', 'Cavern', 'Canyon', 'Peaks', 'Wilds', 'Citadel'],
  cyber: ['Grid', 'Network', 'Gateway', 'Domain', 'Nexus', 'Terminal', 'Core', 'Matrix', 'Sanctum', 'Vault'],
};

// Generate world metadata for 100 worlds
export const WORLDS: WorldInfo[] = Array.from({ length: TOTAL_WORLDS }, (_, idx) => {
  const worldIndex = idx + 1;
  const startLevel = (worldIndex - 1) * LEVELS_PER_WORLD + 1;
  const endLevel = worldIndex * LEVELS_PER_WORLD;

  let sectorIndex = 0;
  let biome: 'emerald' | 'caverns' | 'magma' | 'frost' | 'cyber' = 'emerald';
  let bgMusicTheme: 'ruins' | 'cave' | 'volcano' | 'cyber' | 'boss' = 'ruins';
  let color = '#00FFD1';

  if (worldIndex <= 20) {
    sectorIndex = 0;
    biome = 'emerald';
    bgMusicTheme = 'ruins';
    color = '#00FFD1';
  } else if (worldIndex <= 40) {
    sectorIndex = 1;
    biome = 'caverns';
    bgMusicTheme = 'cave';
    color = '#a855f7';
  } else if (worldIndex <= 60) {
    sectorIndex = 2;
    biome = 'magma';
    bgMusicTheme = 'volcano';
    color = '#FF6B6B';
  } else if (worldIndex <= 80) {
    sectorIndex = 3;
    biome = 'frost';
    bgMusicTheme = 'cave';
    color = '#38bdf8';
  } else {
    sectorIndex = 4;
    biome = 'cyber';
    bgMusicTheme = 'cyber';
    color = '#FF416C';
  }

  const prefixes = THEME_PREFIXES[biome];
  const suffixes = THEME_SUFFIXES[biome];
  const pIdx = (worldIndex * 7 + 3) % prefixes.length;
  const sIdx = (worldIndex * 13 + 5) % suffixes.length;
  const name = `${prefixes[pIdx]} ${suffixes[sIdx]}`;

  return {
    worldIndex,
    name,
    sectorName: SECTORS[sectorIndex].name,
    biome,
    bgMusicTheme,
    color,
    description: `Ascend through 10 stages in ${name}, culminating in a high-stakes Sector Titan showdown!`,
    startLevel,
    endLevel,
  };
});

// Seeded PRNG for deterministic, 100% repeatable level generation
function createRng(seed: number) {
  let s = Math.abs(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// In-memory memoization cache for instant retrieval
const LEVEL_CACHE = new Map<number, LevelData>();

// Preload legacy handcrafted levels
const CURATED_LEVELS: LevelData[] = CAMPAIGN_LEVELS;

// Generate Level Data for any level number 1 to 1000
export function getLevelByNumber(levelNumber: number): LevelData {
  const num = Math.max(1, Math.min(TOTAL_LEVELS, levelNumber));

  if (LEVEL_CACHE.has(num)) {
    return LEVEL_CACHE.get(num)!;
  }

  // Use curated handcrafted levels for 1 - 8
  if (num <= 8) {
    const curated = CURATED_LEVELS[num - 1];
    const levelObj: LevelData = {
      ...curated,
      levelNumber: num,
      isBossStage: num === 6 || num === 8,
    };
    LEVEL_CACHE.set(num, levelObj);
    return levelObj;
  }

  // Deterministically generate levels 9 to 1000
  const worldIndex = Math.ceil(num / LEVELS_PER_WORLD);
  const stageIndex = ((num - 1) % LEVELS_PER_WORLD) + 1;
  const isBossStage = stageIndex === LEVELS_PER_WORLD;
  const world = WORLDS[worldIndex - 1] || WORLDS[0];

  const rng = createRng(num * 9973 + 12345);

  const width = isBossStage ? 56 : Math.min(80, 52 + Math.floor(rng() * 10) + Math.floor(worldIndex / 10));
  const height = 24;
  const tileSize = 16;

  // Initialize empty tile array
  const tiles: string[][] = Array.from({ length: height }, () => Array(width).fill('empty'));

  // Solid perimeter & bottom floor
  for (let x = 0; x < width; x++) {
    tiles[0][x] = 'solid'; // ceiling
    tiles[20][x] = 'solid'; // primary ground
    tiles[21][x] = 'solid';
    tiles[22][x] = 'solid';
    tiles[23][x] = 'solid';
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0] = 'solid'; // left boundary
    tiles[y][width - 1] = 'solid'; // right boundary
  }

  // Always safe spawn zone
  tiles[20][1] = 'solid';
  tiles[20][2] = 'solid';
  tiles[20][3] = 'solid';
  tiles[20][4] = 'solid';
  const spawnPoint = { x: 3, y: 18 };

  let targetTime = 30;
  let parScore = 3000;

  if (isBossStage) {
    // ----------------------------------------------------
    // BOSS ARENA LAYOUT (Every 10th level)
    // ----------------------------------------------------
    const midX = Math.floor(width / 2);

    // Lateral floating tiers
    for (let x = 6; x <= 16; x++) tiles[15][x] = 'solid_top';
    for (let x = width - 17; x <= width - 7; x++) tiles[15][x] = 'solid_top';

    // High command platform
    for (let x = midX - 8; x <= midX + 8; x++) tiles[10][x] = 'solid_top';

    // Spring boost pads on arena flanks
    tiles[19][5] = 'spring';
    tiles[19][width - 6] = 'spring';

    // Heart recovery items on high ledge
    tiles[9][midX - 5] = 'heart';
    tiles[9][midX + 5] = 'heart';

    // Side minion guards
    tiles[14][10] = rng() > 0.5 ? 'enemy_goblin' : 'enemy_skeleton';
    tiles[14][width - 11] = rng() > 0.5 ? 'enemy_goblin' : 'enemy_skeleton';

    // Supreme Boss Titan
    tiles[14][midX] = 'boss_titan';

    // Floating crystals for scoring
    for (let x = midX - 6; x <= midX + 6; x += 3) {
      tiles[6][x] = 'gem';
    }

    targetTime = 70 + Math.min(50, Math.floor(num / 20));
    parScore = 7500 + num * 10;
  } else {
    // ----------------------------------------------------
    // PROCEDURAL PLATFORMING STAGE LAYOUT
    // ----------------------------------------------------
    let currentX = 6;

    // Pit hazards and terrain variety based on biome
    const hazardType: TileType =
      world.biome === 'magma' ? 'lava' : world.biome === 'frost' ? 'ice' : 'spike_up';

    while (currentX < width - 8) {
      const segmentType = Math.floor(rng() * 6);
      const segmentWidth = Math.min(width - 8 - currentX, Math.floor(rng() * 4) + 4);

      if (segmentType === 0 && currentX < width - 14) {
        // Pit Trap (Gap in floor)
        const gapSize = Math.floor(rng() * 2) + 2; // 2 or 3 tiles gap (easily jumpable)
        for (let gx = currentX; gx < currentX + gapSize; gx++) {
          tiles[20][gx] = 'empty';
          tiles[21][gx] = 'empty';
          tiles[22][gx] = hazardType;
          tiles[23][gx] = 'solid';
        }
        // Floating platform above the pit
        const platY = 16;
        for (let gx = currentX - 1; gx <= currentX + gapSize; gx++) {
          tiles[platY][gx] = 'solid_top';
        }
        tiles[platY - 1][currentX + 1] = 'coin';
        currentX += gapSize + 2;
      } else if (segmentType === 1) {
        // Stepped Hill / Elevated Plateau
        const hillHeight = Math.floor(rng() * 3) + 1; // 1 to 3 blocks up
        for (let hx = currentX; hx < currentX + segmentWidth; hx++) {
          for (let hy = 20 - hillHeight; hy <= 20; hy++) {
            tiles[hy][hx] = 'solid';
          }
        }
        // Place coin arc or gem
        if (rng() > 0.4) {
          tiles[20 - hillHeight - 1][currentX + 1] = 'coin';
          tiles[20 - hillHeight - 2][currentX + 2] = 'coin';
          tiles[20 - hillHeight - 1][currentX + 3] = 'coin';
        } else {
          tiles[20 - hillHeight - 1][currentX + 2] = 'gem';
        }

        // Place enemy on hill
        if (rng() > 0.3) {
          const enemyType: TileType =
            rng() > 0.6 ? 'enemy_skeleton' : rng() > 0.3 ? 'enemy_slime' : 'enemy_goblin';
          tiles[20 - hillHeight - 1][currentX + 1] = enemyType;
        }

        currentX += segmentWidth + 1;
      } else if (segmentType === 2) {
        // High Floating Tier & Spring Pad
        const platY = 13;
        for (let px = currentX; px < currentX + segmentWidth; px++) {
          tiles[platY][px] = 'solid_top';
        }
        // Spring on floor to reach high platform
        tiles[19][currentX] = 'spring';
        tiles[platY - 1][currentX + 2] = 'gem';
        tiles[platY - 1][currentX + 3] = 'coin';

        // Bat in the airspace
        if (rng() > 0.4) {
          tiles[9][currentX + 2] = 'enemy_bat';
        }

        currentX += segmentWidth + 1;
      } else if (segmentType === 3) {
        // Breakable blocks cache
        for (let bx = currentX; bx < currentX + 3; bx++) {
          tiles[17][bx] = 'breakable';
        }
        tiles[16][currentX + 1] = 'heart';
        tiles[19][currentX + 1] = 'enemy_slime';
        currentX += 4;
      } else {
        // Flat run with spikes or crystal trail
        if (rng() > 0.5) {
          tiles[19][currentX + 1] = 'spike_up';
        }
        tiles[19][currentX + 2] = 'coin';
        tiles[19][currentX + 3] = 'coin';
        if (rng() > 0.4) {
          tiles[19][currentX] = 'enemy_slime';
        }
        currentX += segmentWidth;
      }
    }

    // ----------------------------------------------------
    // CHECKPOINT, KEY & LOCKED DOOR PLACEMENT
    // ----------------------------------------------------
    // 1. Mid-level Checkpoint
    const cpX = Math.floor(width * 0.45);
    tiles[20][cpX] = 'solid';
    tiles[19][cpX] = 'checkpoint';

    // 2. Key placement (elevated on platform guarded by enemies)
    const keyX = Math.floor(width * 0.65);
    tiles[15][keyX - 1] = 'solid_top';
    tiles[15][keyX] = 'solid_top';
    tiles[15][keyX + 1] = 'solid_top';
    tiles[14][keyX] = 'key';
    tiles[14][keyX - 1] = 'enemy_skeleton';

    // 3. Locked Door before the exit
    const doorX = width - 8;
    tiles[20][doorX] = 'solid';
    tiles[19][doorX] = 'door';

    // 4. Exit Portal behind the door
    const exitX = width - 4;
    tiles[20][exitX - 1] = 'solid';
    tiles[20][exitX] = 'solid';
    tiles[20][exitX + 1] = 'solid';
    tiles[18][exitX] = 'exit';

    targetTime = Math.round(28 + width * 0.42);
    parScore = 3200 + num * 6;
  }

  const generatedLevel: LevelData = {
    id: `lvl_${num}`,
    levelNumber: num,
    name: isBossStage
      ? `Boss: ${world.name} Overlord`
      : `${world.name}: Stage ${stageIndex}`,
    worldIndex,
    stageIndex,
    biome: world.biome,
    width,
    height,
    tileSize,
    tiles,
    spawnPoint,
    targetTime,
    parScore,
    bgMusicTheme: isBossStage ? 'boss' : world.bgMusicTheme,
    isBossStage,
  };

  LEVEL_CACHE.set(num, generatedLevel);
  return generatedLevel;
}

// Get array of all 10 levels in a given world
export function getWorldLevels(worldIndex: number): LevelData[] {
  const wIdx = Math.max(1, Math.min(TOTAL_WORLDS, worldIndex));
  const levels: LevelData[] = [];
  const start = (wIdx - 1) * LEVELS_PER_WORLD + 1;
  const end = wIdx * LEVELS_PER_WORLD;
  for (let i = start; i <= end; i++) {
    levels.push(getLevelByNumber(i));
  }
  return levels;
}

// Convert any legacy ID or number to LevelData
export function resolveLevel(identifier: string | number): LevelData {
  if (typeof identifier === 'number') {
    return getLevelByNumber(identifier);
  }

  const legacyMap: Record<string, number> = {
    w1_s1: 1,
    w1_s2: 2,
    w2_s1: 3,
    w2_s2: 4,
    w3_s1: 5,
    w3_s2: 6,
    w4_s1: 7,
    w4_s2: 8,
  };

  if (legacyMap[identifier]) {
    return getLevelByNumber(legacyMap[identifier]);
  }

  const match = identifier.match(/^(?:lvl_|level_)(\d+)$/);
  if (match) {
    return getLevelByNumber(parseInt(match[1], 10));
  }

  return getLevelByNumber(1);
}
