import { HeroClass, LevelData } from '../types';

export const HERO_CLASSES: Record<string, HeroClass> = {
  knight: {
    id: 'knight',
    name: 'Sir Galahad',
    title: 'The Steel Vanguard',
    description: 'Armored warrior with high defense and a sweeping broadsword slash that deflects minor projectiles.',
    maxHealth: 5,
    speed: 2.7,
    jumpForce: 7.2,
    doubleJump: false,
    wallJump: true,
    specialAbilityName: 'Shield Bash & Ground Slam',
    specialAbilityDesc: 'Charge forward or plunge downward to smash obstacles and stun enemies.',
    specialCooldown: 4.0,
    primaryColor: '#64748b',
    secondaryColor: '#f59e0b',
  },
  rogue: {
    id: 'rogue',
    name: 'Lyra Swift',
    title: 'Shadow Blade',
    description: 'Extremely agile assassin with double jump and an invincible shadow dash through hazards and enemies.',
    maxHealth: 3,
    speed: 3.4,
    jumpForce: 7.0,
    doubleJump: true,
    wallJump: true,
    specialAbilityName: 'Shadow Dash',
    specialAbilityDesc: 'Air dash granting invulnerability frames and instant burst momentum.',
    specialCooldown: 2.5,
    primaryColor: '#0d9488',
    secondaryColor: '#2dd4bf',
  },
  wizard: {
    id: 'wizard',
    name: 'Ignis Astral',
    title: 'Arcane Elementalist',
    description: 'Master of magic with ranged fireball projectiles and arcane levitation.',
    maxHealth: 3,
    speed: 2.5,
    jumpForce: 6.8,
    doubleJump: false,
    wallJump: false,
    specialAbilityName: 'Pyromancy Burst',
    specialAbilityDesc: 'Launches twin piercing fireballs across the screen.',
    specialCooldown: 3.0,
    primaryColor: '#7e22ce',
    secondaryColor: '#38bdf8',
  },
};

// Helper to create a level grid of given dimensions filled with 'empty'
function createBlankGrid(w: number, h: number): string[][] {
  const grid: string[][] = [];
  for (let y = 0; y < h; y++) {
    const row: string[] = [];
    for (let x = 0; x < w; x++) {
      row.push('empty');
    }
    grid.push(row);
  }
  return grid;
}

// ----------------------------------------------------
// LEVEL 1: EMERALD GLADE (WORLD 1, STAGE 1)
// ----------------------------------------------------
function buildLevel1(): LevelData {
  const w = 60;
  const h = 18;
  const tiles = createBlankGrid(w, h);

  // Ground floor with gaps
  for (let x = 0; x < w; x++) {
    if ((x >= 14 && x <= 16) || (x >= 32 && x <= 34)) {
      // Pit gap with spikes at bottom
      tiles[h - 1][x] = 'spike_up';
    } else {
      tiles[h - 2][x] = 'solid';
      tiles[h - 1][x] = 'solid';
    }
  }

  // Left boundary & right boundary
  for (let y = 0; y < h; y++) {
    tiles[y][0] = 'solid';
    tiles[y][w - 1] = 'solid';
  }

  // Platform 1: Step up
  for (let x = 6; x <= 10; x++) tiles[12][x] = 'solid';
  tiles[11][8] = 'coin';

  // Platform 2: Over gap 1
  for (let x = 13; x <= 18; x++) tiles[11][x] = 'solid';
  tiles[10][15] = 'gem';
  tiles[10][16] = 'coin';

  // Spring pad to reach high ledge
  tiles[15][21] = 'spring';

  // High ledge
  for (let x = 20; x <= 27; x++) tiles[8][x] = 'solid';
  tiles[7][23] = 'coin';
  tiles[7][24] = 'coin';
  tiles[7][25] = 'coin';

  // Checkpoint banner
  tiles[15][28] = 'checkpoint';

  // Moving platform zone / step sequence
  for (let x = 30; x <= 36; x++) tiles[12][x] = 'solid_top';
  tiles[11][33] = 'coin';

  // Slime enemy patrol
  tiles[15][10] = 'enemy_slime';
  tiles[7][26] = 'enemy_slime';
  tiles[15][40] = 'enemy_slime';

  // Wall jump tower
  for (let y = 6; y <= 15; y++) {
    tiles[y][46] = 'solid';
    tiles[y][50] = 'solid';
  }
  tiles[5][48] = 'gem';

  // Exit Portal
  tiles[15][56] = 'exit';

  return {
    id: 'w1_s1',
    name: 'Emerald Glade',
    worldIndex: 1,
    stageIndex: 1,
    biome: 'emerald',
    width: w,
    height: h,
    tileSize: 16,
    tiles,
    spawnPoint: { x: 3, y: 14 },
    targetTime: 25,
    parScore: 1200,
    bgMusicTheme: 'ruins',
  };
}

// ----------------------------------------------------
// LEVEL 2: OVERGROWN BASTION (WORLD 1, STAGE 2)
// ----------------------------------------------------
function buildLevel2(): LevelData {
  const w = 70;
  const h = 20;
  const tiles = createBlankGrid(w, h);

  // Ground with spikes
  for (let x = 0; x < w; x++) {
    if (x >= 22 && x <= 26) {
      tiles[h - 1][x] = 'spike_up';
    } else if (x >= 45 && x <= 50) {
      tiles[h - 1][x] = 'spike_up';
    } else {
      tiles[h - 2][x] = 'solid';
      tiles[h - 1][x] = 'solid';
    }
  }

  // Boundaries
  for (let y = 0; y < h; y++) {
    tiles[y][0] = 'solid';
    tiles[y][w - 1] = 'solid';
  }

  // Dungeon archway & Key Puzzle
  // Tower 1
  for (let y = 8; y <= 17; y++) tiles[y][15] = 'solid';
  tiles[14][15] = 'door'; // Locked Door

  // Key on upper ledge
  for (let x = 6; x <= 12; x++) tiles[12][x] = 'solid';
  for (let x = 3; x <= 8; x++) tiles[7][x] = 'solid';
  tiles[6][5] = 'key';
  tiles[6][6] = 'coin';

  // Enemy on ground
  tiles[17][9] = 'enemy_skeleton';
  tiles[17][32] = 'enemy_skeleton';

  // Platforms past door
  for (let x = 18; x <= 22; x++) tiles[13][x] = 'solid';
  for (let x = 27; x <= 32; x++) tiles[13][x] = 'solid';
  tiles[12][29] = 'gem';

  // Spring & High Castle Battlements
  tiles[17][36] = 'spring';
  for (let x = 38; x <= 45; x++) tiles[9][x] = 'solid';
  tiles[8][41] = 'enemy_bat';
  tiles[8][43] = 'coin';
  tiles[8][44] = 'coin';

  // Checkpoint
  tiles[8][39] = 'checkpoint';

  // Drop-through platforms over spike gorge
  for (let x = 46; x <= 49; x++) tiles[12][x] = 'solid_top';
  tiles[11][48] = 'coin';

  // Wall jump chasm
  for (let y = 4; y <= 17; y++) {
    tiles[y][55] = 'solid';
  }
  for (let x = 55; x <= 62; x++) tiles[4][x] = 'solid';
  tiles[3][58] = 'gem';
  tiles[17][60] = 'enemy_slime';

  // Exit
  tiles[17][66] = 'exit';

  return {
    id: 'w1_s2',
    name: 'Overgrown Bastion',
    worldIndex: 1,
    stageIndex: 2,
    biome: 'emerald',
    width: w,
    height: h,
    tileSize: 16,
    tiles,
    spawnPoint: { x: 3, y: 16 },
    targetTime: 35,
    parScore: 1800,
    bgMusicTheme: 'ruins',
  };
}

// ----------------------------------------------------
// LEVEL 3: CRYSTAL CAVERNS (WORLD 2, STAGE 1)
// ----------------------------------------------------
function buildLevel3(): LevelData {
  const w = 75;
  const h = 22;
  const tiles = createBlankGrid(w, h);

  // Cavern floor & ceiling
  for (let x = 0; x < w; x++) {
    tiles[0][x] = 'solid';
    tiles[1][x] = 'solid';
    if ((x >= 18 && x <= 22) || (x >= 40 && x <= 46)) {
      tiles[h - 1][x] = 'spike_up';
    } else {
      tiles[h - 2][x] = 'solid';
      tiles[h - 1][x] = 'solid';
    }
  }

  for (let y = 0; y < h; y++) {
    tiles[y][0] = 'solid';
    tiles[y][w - 1] = 'solid';
  }

  // Stalactites hanging from ceiling
  tiles[2][12] = 'spike_down';
  tiles[2][25] = 'spike_down';
  tiles[2][38] = 'spike_down';
  tiles[2][55] = 'spike_down';

  // Bats hanging and patrolling
  tiles[6][14] = 'enemy_bat';
  tiles[5][28] = 'enemy_bat';
  tiles[7][50] = 'enemy_bat';

  // Stepping stones
  for (let x = 6; x <= 10; x++) tiles[16][x] = 'solid';
  tiles[15][8] = 'coin';

  for (let x = 12; x <= 16; x++) tiles[13][x] = 'solid';
  tiles[12][14] = 'gem';

  for (let x = 19; x <= 23; x++) tiles[10][x] = 'solid_top';
  tiles[9][21] = 'heart';

  // Middle plateau
  for (let x = 26; x <= 34; x++) tiles[15][x] = 'solid';
  tiles[14][28] = 'enemy_skeleton';
  tiles[14][33] = 'checkpoint';

  // Vertical crystal ascent
  for (let x = 36; x <= 39; x++) tiles[11][x] = 'solid';
  for (let x = 42; x <= 45; x++) tiles[8][x] = 'solid';
  tiles[7][44] = 'gem';

  // Upper high bridge
  for (let x = 48; x <= 58; x++) tiles[6][x] = 'solid';
  tiles[5][52] = 'coin';
  tiles[5][53] = 'coin';
  tiles[5][54] = 'coin';
  tiles[5][56] = 'enemy_slime';

  // Spring descent
  tiles[19][62] = 'spring';
  for (let x = 64; x <= 72; x++) tiles[14][x] = 'solid';
  tiles[13][68] = 'exit';

  return {
    id: 'w2_s1',
    name: 'Crystalline Caverns',
    worldIndex: 2,
    stageIndex: 1,
    biome: 'caverns',
    width: w,
    height: h,
    tileSize: 16,
    tiles,
    spawnPoint: { x: 3, y: 18 },
    targetTime: 38,
    parScore: 2200,
    bgMusicTheme: 'cave',
  };
}

// ----------------------------------------------------
// LEVEL 4: MOLTEN FOUNDRY (WORLD 2, STAGE 2)
// ----------------------------------------------------
function buildLevel4(): LevelData {
  const w = 80;
  const h = 22;
  const tiles = createBlankGrid(w, h);

  // Lava floor everywhere except safe stone platforms
  for (let x = 0; x < w; x++) {
    tiles[h - 1][x] = 'lava';
    tiles[h - 2][x] = 'lava';
  }

  // Safe starting dock
  for (let x = 0; x <= 8; x++) {
    tiles[h - 2][x] = 'solid';
    tiles[h - 1][x] = 'solid';
  }

  // Outer walls
  for (let y = 0; y < h; y++) {
    tiles[y][0] = 'solid';
    tiles[y][w - 1] = 'solid';
  }

  // Lava stepping platforms
  for (let x = 11; x <= 15; x++) tiles[16][x] = 'solid';
  tiles[15][13] = 'coin';

  for (let x = 18; x <= 22; x++) tiles[13][x] = 'solid';
  tiles[12][20] = 'enemy_goblin';

  for (let x = 25; x <= 29; x++) tiles[11][x] = 'solid_top';
  tiles[10][27] = 'gem';

  // Middle Foundry Platform with Checkpoint & Fire Slime
  for (let x = 32; x <= 42; x++) tiles[15][x] = 'solid';
  tiles[14][34] = 'checkpoint';
  tiles[14][37] = 'enemy_slime'; // Fire variant
  tiles[14][40] = 'enemy_slime';

  // Spring over high lava geyser
  tiles[14][43] = 'spring';

  // High catwalk
  for (let x = 45; x <= 56; x++) tiles[8][x] = 'solid';
  tiles[7][48] = 'enemy_goblin';
  tiles[7][52] = 'coin';
  tiles[7][53] = 'coin';
  tiles[7][54] = 'key';

  // Lower locked vault
  for (let y = 9; y <= 16; y++) tiles[y][60] = 'solid';
  tiles[15][60] = 'door'; // Locked
  for (let x = 60; x <= 76; x++) tiles[16][x] = 'solid';

  tiles[15][66] = 'gem';
  tiles[15][68] = 'gem';
  tiles[15][72] = 'exit';

  return {
    id: 'w2_s2',
    name: 'Molten Foundry',
    worldIndex: 2,
    stageIndex: 2,
    biome: 'magma',
    width: w,
    height: h,
    tileSize: 16,
    tiles,
    spawnPoint: { x: 3, y: 18 },
    targetTime: 45,
    parScore: 2800,
    bgMusicTheme: 'volcano',
  };
}

// ----------------------------------------------------
// LEVEL 5: CLOCKWORK CITADEL (WORLD 3 - BOSS FIGHT)
// ----------------------------------------------------
function buildLevel5(): LevelData {
  const w = 50;
  const h = 20;
  const tiles = createBlankGrid(w, h);

  // Boss Arena Floor & Ceiling
  for (let x = 0; x < w; x++) {
    tiles[0][x] = 'solid';
    tiles[h - 2][x] = 'solid';
    tiles[h - 1][x] = 'solid';
  }

  // Arena Walls
  for (let y = 0; y < h; y++) {
    tiles[y][0] = 'solid';
    tiles[y][w - 1] = 'solid';
  }

  // Boss Arena Elevated Platforms
  for (let x = 6; x <= 14; x++) tiles[13][x] = 'solid_top';
  for (let x = 36; x <= 44; x++) tiles[13][x] = 'solid_top';
  for (let x = 18; x <= 32; x++) tiles[8][x] = 'solid_top';

  // Springs on sides for fast mobility
  tiles[17][4] = 'spring';
  tiles[17][45] = 'spring';

  // Heart containers for recovery
  tiles[7][24] = 'heart';
  tiles[7][26] = 'heart';

  // The Boss entity
  tiles[13][28] = 'boss_titan';

  return {
    id: 'w3_s1',
    name: 'Clockwork Citadel: The Titan',
    worldIndex: 3,
    stageIndex: 1,
    biome: 'cyber',
    width: w,
    height: h,
    tileSize: 16,
    tiles,
    spawnPoint: { x: 4, y: 16 },
    targetTime: 60,
    parScore: 5000,
    bgMusicTheme: 'boss',
  };
}

export const CAMPAIGN_LEVELS: LevelData[] = [
  buildLevel1(),
  buildLevel2(),
  buildLevel3(),
  buildLevel4(),
  buildLevel5(),
];
