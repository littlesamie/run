export type HeroClassType = 'knight' | 'rogue' | 'wizard';

export interface HeroClass {
  id: HeroClassType;
  name: string;
  title: string;
  description: string;
  maxHealth: number;
  speed: number;
  jumpForce: number;
  doubleJump: boolean;
  wallJump: boolean;
  specialAbilityName: string;
  specialAbilityDesc: string;
  specialCooldown: number; // in seconds
  primaryColor: string;
  secondaryColor: string;
}

export type DifficultyMode =
  | 'zen'
  | 'easy'
  | 'normal'
  | 'heroic'
  | 'hard'
  | 'expert'
  | 'nightmare'
  | 'inferno';

export type HandheldSkin =
  | 'vibrant'
  | 'dmg_gameboy'
  | 'nes_classic'
  | 'snes'
  | 'switch_neon'
  | 'gba_sp'
  | 'n64_gold'
  | 'cyber_omega';

export interface SkinCapability {
  name: string;
  badge: string;
  description: string;
  healthBonus?: number;
  cooldownReduction?: number; // e.g. 0.20 for 20%
  speedBonus?: number; // e.g. 0.15 for 15%
  stompDamageBonus?: number; // e.g. 1
  dashDistanceMultiplier?: number; // e.g. 1.35
  crystalValueMultiplier?: number; // e.g. 1.5
  magnetRadius?: number; // e.g. 60px
}

export interface SkinConfig {
  id: HandheldSkin;
  name: string;
  era: string;
  themeColor: string;
  previewBg: string;
  borderAccent: string;
  requiredLevel: number;
  unlockLevelId: string; // '' means unlocked from beginning
  unlockLevelStage: string;
  unlockRequirementText: string;
  capability: SkinCapability;
}

export const SKIN_CONFIGS: Record<HandheldSkin, SkinConfig> = {
  vibrant: {
    id: 'vibrant',
    name: 'Cyber Vibrant',
    era: 'Neo-Arcade',
    themeColor: '#00FFD1',
    previewBg: '#1a1a2e',
    borderAccent: '#FFD700',
    requiredLevel: 1,
    unlockLevelId: '',
    unlockLevelStage: 'Level 1: Emerald Glade',
    unlockRequirementText: 'Available from the start.',
    capability: {
      name: 'Neon Overcharge',
      badge: '-20% SKILL CD',
      description: '-20% Special Ability recharge cooldown & radiant spark jump trail.',
      cooldownReduction: 0.2,
    },
  },
  dmg_gameboy: {
    id: 'dmg_gameboy',
    name: 'GameBoy DMG-01',
    era: '1989 Classic',
    themeColor: '#991b5b',
    previewBg: '#cfcecb',
    borderAccent: '#94938f',
    requiredLevel: 2,
    unlockLevelId: 'w1_s1',
    unlockLevelStage: 'Reach Level 2: Emerald Depths',
    unlockRequirementText: 'Reach Level 2 (Clear Stage 1-1) to unlock.',
    capability: {
      name: '8-Bit Thick Armor',
      badge: '+1 HEART & MAGNET',
      description: '+1 Extra Maximum Heart container & 60px crystal attraction magnet.',
      healthBonus: 1,
      magnetRadius: 60,
    },
  },
  nes_classic: {
    id: 'nes_classic',
    name: 'NES Classic',
    era: '1983 Heritage',
    themeColor: '#ef4444',
    previewBg: '#262626',
    borderAccent: '#dc2626',
    requiredLevel: 3,
    unlockLevelId: 'w1_s2',
    unlockLevelStage: 'Reach Level 3: Crystal Caverns',
    unlockRequirementText: 'Reach Level 3 (Clear Stage 1-2) to unlock.',
    capability: {
      name: 'Pixel Stomp Quake',
      badge: '+1 STOMP & SHOCKWAVE',
      description: 'Stomp deals +1 bonus damage and triggers a radial 54px seismic shockwave.',
      stompDamageBonus: 1,
    },
  },
  snes: {
    id: 'snes',
    name: 'SNES Lilac',
    era: '1990 16-Bit',
    themeColor: '#a855f7',
    previewBg: '#d8d8d8',
    borderAccent: '#7c3aed',
    requiredLevel: 5,
    unlockLevelId: 'w2_s2',
    unlockLevelStage: 'Reach Level 5: Frostpeak Summit',
    unlockRequirementText: 'Reach Level 5 (Clear Stage 2-2) to unlock.',
    capability: {
      name: 'Mode-7 Hyper Dash',
      badge: '+35% DASH DISTANCE',
      description: 'Dash travels +35% farther with prolonged invulnerability frames.',
      dashDistanceMultiplier: 1.35,
    },
  },
  switch_neon: {
    id: 'switch_neon',
    name: 'Neon Switch Elite',
    era: 'Modern Hybrid',
    themeColor: '#00c3e3',
    previewBg: '#18181b',
    borderAccent: '#ff3b56',
    requiredLevel: 7,
    unlockLevelId: 'w3_s2',
    unlockLevelStage: 'Reach Level 7: Neon Underworld',
    unlockRequirementText: 'Reach Level 7 (Defeat Titan in Stage 3-2) to unlock.',
    capability: {
      name: 'Joy-Con Overdrive',
      badge: '+15% SPEED & 1.5x SCORE',
      description: '+15% Movement speed & +50% bonus score value on all collected crystals.',
      speedBonus: 0.15,
      crystalValueMultiplier: 1.5,
    },
  },
  gba_sp: {
    id: 'gba_sp',
    name: 'GameBoy Advance SP',
    era: '2003 Clamshell',
    themeColor: '#3b82f6',
    previewBg: '#1e293b',
    borderAccent: '#60a5fa',
    requiredLevel: 20,
    unlockLevelId: 'lvl_20',
    unlockLevelStage: 'Reach Level 20 (World 2 Titan)',
    unlockRequirementText: 'Conquer World 2 (Clear Level 20 Boss) to unlock.',
    capability: {
      name: 'Advance Crystal Aegis',
      badge: '+2 HEARTS & 80px MAGNET',
      description: '+2 Maximum Heart containers & wide 80px crystal attraction magnet.',
      healthBonus: 2,
      magnetRadius: 80,
    },
  },
  n64_gold: {
    id: 'n64_gold',
    name: 'Nintendo 64 Gold',
    era: '1996 64-Bit',
    themeColor: '#eab308',
    previewBg: '#27272a',
    borderAccent: '#facc15',
    requiredLevel: 50,
    unlockLevelId: 'lvl_50',
    unlockLevelStage: 'Reach Level 50 (World 5 Titan)',
    unlockRequirementText: 'Conquer 50 Levels (Clear World 5 Boss) to unlock.',
    capability: {
      name: 'Ultra 64 Titan Core',
      badge: '+20% SPEED & 2x SCORE',
      description: '+20% Speed boost, +2 Stomp damage & double crystal score value.',
      speedBonus: 0.2,
      stompDamageBonus: 2,
      crystalValueMultiplier: 2.0,
    },
  },
  cyber_omega: {
    id: 'cyber_omega',
    name: 'Cyber Omega Singularity',
    era: 'Quantum Millennium',
    themeColor: '#ec4899',
    previewBg: '#0f172a',
    borderAccent: '#f43f5e',
    requiredLevel: 100,
    unlockLevelId: 'lvl_100',
    unlockLevelStage: 'Reach Level 100 (World 10 Boss)',
    unlockRequirementText: 'Master 100 Levels (Conquer Sector I) to unlock.',
    capability: {
      name: 'Omega Overdrive',
      badge: '+50% DASH & -35% CD',
      description: '+50% Dash distance, -35% Special cooldown & +1 Heart container.',
      healthBonus: 1,
      cooldownReduction: 0.35,
      dashDistanceMultiplier: 1.5,
    },
  },
};

export function getHighestLevelReached(levelStats: Record<string, LevelStats>): number {
  let highestCompleted = 0;
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

  for (const [key, stats] of Object.entries(levelStats)) {
    if (stats?.completed) {
      let num = 0;
      if (legacyMap[key]) {
        num = legacyMap[key];
      } else if (key.startsWith('lvl_') || key.startsWith('level_')) {
        const parsed = parseInt(key.replace(/^(lvl_|level_)/, ''), 10);
        if (!isNaN(parsed)) num = parsed;
      }
      if (num > highestCompleted) {
        highestCompleted = num;
      }
    }
  }

  // Highest reachable level is highest completed + 1 (clamp to 1000)
  return Math.min(1000, Math.max(1, highestCompleted + 1));
}

export function isSkinUnlocked(skinId: HandheldSkin, levelStats: Record<string, LevelStats>): boolean {
  const conf = SKIN_CONFIGS[skinId];
  if (!conf || !conf.requiredLevel || conf.requiredLevel <= 1) return true;
  return getHighestLevelReached(levelStats) >= conf.requiredLevel;
}

export type MobileControlMode = 'handheld' | 'overlay';

export interface DifficultyConfig {
  id: DifficultyMode;
  name: string;
  tagline: string;
  description: string;
  color: string;
  badge: string;
  healthBonus: number; // added to base max health
  damageTakenMultiplier: number;
  enemySpeedMultiplier: number;
  parTimeMultiplier: number;
  scoreMultiplier: number;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyMode, DifficultyConfig> = {
  zen: {
    id: 'zen',
    name: 'Zen / Immortal',
    tagline: 'Relaxed sandbox exploration',
    description: 'Immortal! Take 0 damage, infinite health, explore all 1000 levels stress-free. 0.5x score.',
    color: '#38bdf8',
    badge: 'ZEN',
    healthBonus: 10,
    damageTakenMultiplier: 0,
    enemySpeedMultiplier: 0.75,
    parTimeMultiplier: 2.0,
    scoreMultiplier: 0.5,
  },
  easy: {
    id: 'easy',
    name: 'Casual / Novice',
    tagline: 'Forgiving retro journey',
    description: '+2 Bonus Hearts, 0.5x hazard damage, relaxed par times, 0.8x score multiplier.',
    color: '#00FFD1',
    badge: 'CASUAL',
    healthBonus: 2,
    damageTakenMultiplier: 0.5,
    enemySpeedMultiplier: 0.85,
    parTimeMultiplier: 1.35,
    scoreMultiplier: 0.8,
  },
  normal: {
    id: 'normal',
    name: 'Standard Hero',
    tagline: 'Authentic 90s console balance',
    description: 'Standard health, full enemy aggression, 1.0x score multiplier. Recommended for all players.',
    color: '#FFD700',
    badge: 'NORMAL',
    healthBonus: 0,
    damageTakenMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
    parTimeMultiplier: 1.0,
    scoreMultiplier: 1.0,
  },
  heroic: {
    id: 'heroic',
    name: 'Heroic Knight',
    tagline: 'Brisk pacing & higher stakes',
    description: '1.15x enemy speed, 1.25x damage taken, tighter par time, 1.4x score multiplier.',
    color: '#a855f7',
    badge: 'HEROIC',
    healthBonus: 0,
    damageTakenMultiplier: 1.25,
    enemySpeedMultiplier: 1.15,
    parTimeMultiplier: 0.9,
    scoreMultiplier: 1.4,
  },
  hard: {
    id: 'hard',
    name: 'Knightmare',
    tagline: 'High-octane arcade challenge',
    description: '1.5x enemy damage, 1.25x enemy move speed, tighter par times, 1.8x score multiplier.',
    color: '#FF6B6B',
    badge: 'HARD',
    healthBonus: 0,
    damageTakenMultiplier: 1.5,
    enemySpeedMultiplier: 1.25,
    parTimeMultiplier: 0.85,
    scoreMultiplier: 1.8,
  },
  expert: {
    id: 'expert',
    name: 'Master Shinobi',
    tagline: 'Precision acrobatics required',
    description: '-1 Heart penalty, 2.0x enemy damage, aggressive foes, 2.5x score multiplier.',
    color: '#f97316',
    badge: 'EXPERT',
    healthBonus: -1,
    damageTakenMultiplier: 2.0,
    enemySpeedMultiplier: 1.35,
    parTimeMultiplier: 0.8,
    scoreMultiplier: 2.5,
  },
  nightmare: {
    id: 'nightmare',
    name: 'NES Retro Hardcore',
    tagline: 'Ruthless 8-bit brutality',
    description: 'Fixed 2 Hearts max! Hazards are fatal, hyper-aggressive foes, 3.5x score multiplier & Golden Crown badge.',
    color: '#FF416C',
    badge: 'HARDCORE',
    healthBonus: -2,
    damageTakenMultiplier: 2.5,
    enemySpeedMultiplier: 1.45,
    parTimeMultiplier: 0.75,
    scoreMultiplier: 3.5,
  },
  inferno: {
    id: 'inferno',
    name: 'Inferno Grandmaster',
    tagline: 'One hit from oblivion',
    description: '1 Heart survival trial! Lightning-fast foes, razor-sharp par times, 5.0x score & Inferno Crown badge.',
    color: '#dc2626',
    badge: 'INFERNO',
    healthBonus: -3,
    damageTakenMultiplier: 3.0,
    enemySpeedMultiplier: 1.6,
    parTimeMultiplier: 0.7,
    scoreMultiplier: 5.0,
  },
};

export type TileType = 
  | 'empty'
  | 'solid'
  | 'solid_top' // one-way platform
  | 'spike_up'
  | 'spike_down'
  | 'spike_left'
  | 'spike_right'
  | 'lava'
  | 'ice'
  | 'spring'
  | 'breakable'
  | 'ladder'
  | 'coin'
  | 'gem'
  | 'heart'
  | 'key'
  | 'door'
  | 'checkpoint'
  | 'exit'
  | 'moving_plat_h'
  | 'moving_plat_v'
  | 'enemy_slime'
  | 'enemy_skeleton'
  | 'enemy_bat'
  | 'enemy_goblin'
  | 'boss_titan';

export interface TileCoord {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  isGrounded: boolean;
  isOnWall: boolean;
  wallDir: number; // -1 for left wall, 1 for right wall
  isWallSliding: boolean;
  facing: 'left' | 'right';
  animState: 'idle' | 'run' | 'jump' | 'fall' | 'attack' | 'dash' | 'wall' | 'hurt' | 'cast';
  animFrame: number;
  animTimer: number;
  isAttacking: boolean;
  attackTimer: number;
  attackCooldown: number;
  canDoubleJump: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  specialCooldownTimer: number;
  isDashing: boolean;
  dashTimer: number;
  invulnerableTimer: number;
  coins: number;
  score: number;
  keys: number;
  heroClass: HeroClassType;
  mana: number;
  maxMana: number;
}

export type EnemyType = 'slime' | 'fire_slime' | 'skeleton' | 'bat' | 'goblin' | 'boss_titan';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  health: number;
  maxHealth: number;
  facing: 'left' | 'right';
  state: 'patrol' | 'alert' | 'attack' | 'hurt' | 'jump' | 'charge' | 'cast';
  stateTimer: number;
  startX: number;
  patrolRange: number;
  animFrame: number;
  animTimer: number;
  isGrounded: boolean;
  invulnerableTimer: number;
  isBoss?: boolean;
  bossPhase?: number;
  attackCooldown?: number;
}

export interface MovingPlatform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'horizontal' | 'vertical' | 'falling';
  startX: number;
  startY: number;
  distance: number;
  speed: number;
  dir: number;
  fallTimer?: number;
  isFalling?: boolean;
  respawnTimer?: number;
}

export interface Item {
  id: string;
  type: 'coin' | 'gem' | 'heart' | 'key' | 'mana';
  x: number;
  y: number;
  w: number;
  h: number;
  collected: boolean;
  animTimer: number;
  value: number;
}

export interface InteractiveObject {
  id: string;
  type: 'door' | 'checkpoint' | 'spring' | 'exit' | 'switch';
  x: number;
  y: number;
  w: number;
  h: number;
  state: boolean; // open/closed, activated/unactivated
  targetId?: string;
  data?: any;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  w?: number;
  h?: number;
  color: string;
  isPlayer: boolean;
  damage: number;
  life: number;
  maxLife: number;
  type: 'fireball' | 'arrow' | 'bomb' | 'slash' | 'laser' | 'rock';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity?: number;
  shape?: 'square' | 'circle' | 'spark' | 'smoke';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface LevelData {
  id: string;
  name: string;
  worldIndex: number;
  stageIndex: number;
  biome: 'emerald' | 'caverns' | 'magma' | 'frost' | 'cyber' | 'boss';
  width: number; // in tiles (e.g. 60)
  height: number; // in tiles (e.g. 20)
  tileSize: number; // 16
  tiles: string[][]; // 2D array of tile ids or types
  spawnPoint: { x: number; y: number };
  targetTime: number; // target time in seconds for 3 stars
  parScore: number;
  bgMusicTheme: 'ruins' | 'cave' | 'volcano' | 'cyber' | 'boss';
  levelNumber?: number; // 1 to 1000
  isBossStage?: boolean;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
  crtFilter: boolean;
  colorPalette: 'default' | 'gameboy' | 'nes' | 'cyberpunk' | 'monochrome';
  showFps: boolean;
  showTouchControls: boolean;
  screenShake: boolean;
  difficulty: DifficultyMode;
  handheldSkin: HandheldSkin;
  mobileControlMode: MobileControlMode;
  vibrationEnabled: boolean;
  forceOrientation: 'auto' | 'landscape' | 'portrait';
}

export interface LevelStats {
  completed: boolean;
  highScore: number;
  bestTime: number | null; // in seconds
  coinsCollected: number;
  stars: number; // 0-3
  difficulty?: DifficultyMode;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}
