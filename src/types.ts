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
  biome: 'emerald' | 'caverns' | 'magma' | 'cyber' | 'boss';
  width: number; // in tiles (e.g. 60)
  height: number; // in tiles (e.g. 20)
  tileSize: number; // 16
  tiles: string[][]; // 2D array of tile ids or types
  spawnPoint: { x: number; y: number };
  targetTime: number; // target time in seconds for 3 stars
  parScore: number;
  bgMusicTheme: 'ruins' | 'cave' | 'volcano' | 'cyber' | 'boss';
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
}

export interface LevelStats {
  completed: boolean;
  highScore: number;
  bestTime: number | null; // in seconds
  coinsCollected: number;
  stars: number; // 0-3
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
