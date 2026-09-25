import { EnemyType, HeroClassType } from '../types';

/**
 * Pixel Art Graphics Generator & Sprite Renderer
 * Direct Canvas 2D pixel drawing with authentic pixel-perfect geometry and vibrant retro palettes.
 */

// Helper to draw a pixel block
export function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, scale = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), scale, scale);
}

// Draw a matrix of pixel colors where matrix is array of strings or hex
export function drawPixelMatrix(
  ctx: CanvasRenderingContext2D,
  matrix: string[][],
  palette: Record<string, string>,
  destX: number,
  destY: number,
  scale = 1,
  flipX = false
) {
  const rows = matrix.length;
  const cols = matrix[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const char = matrix[r][c];
      if (char === '.' || char === ' ') continue;
      const color = palette[char] || char;
      if (!color || color === 'transparent') continue;

      const px = flipX ? destX + (cols - 1 - c) * scale : destX + c * scale;
      const py = destY + r * scale;

      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(px), Math.floor(py), scale, scale);
    }
  }
}

// ---- HERO SPRITE RENDERER ----

export function drawHero(
  ctx: CanvasRenderingContext2D,
  hero: HeroClassType,
  x: number,
  y: number,
  facing: 'left' | 'right',
  animState: string,
  frame: number,
  isInvulnerable: boolean,
  isDashing: boolean
) {
  ctx.save();

  // Flickering when invulnerable
  if (isInvulnerable && Math.floor(Date.now() / 60) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  // Dash ghost trail
  if (isDashing) {
    ctx.shadowColor = hero === 'rogue' ? '#06b6d4' : hero === 'wizard' ? '#a855f7' : '#f59e0b';
    ctx.shadowBlur = 8;
  }

  const flipX = facing === 'left';
  const drawX = Math.floor(x);
  const drawY = Math.floor(y);

  if (hero === 'knight') {
    drawKnightSprite(ctx, drawX, drawY, flipX, animState, frame);
  } else if (hero === 'rogue') {
    drawRogueSprite(ctx, drawX, drawY, flipX, animState, frame);
  } else {
    drawWizardSprite(ctx, drawX, drawY, flipX, animState, frame);
  }

  ctx.restore();
}

// --- KNIGHT SPRITE ---
function drawKnightSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flipX: boolean,
  animState: string,
  frame: number
) {
  ctx.save();
  if (flipX) {
    ctx.translate(x + 18, y);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(x, y);
  }

  const bob = animState === 'run' ? (frame % 2 === 0 ? -1 : 1) : animState === 'jump' ? -2 : 0;

  // Cape behind
  ctx.fillStyle = '#b91c1c'; // Deep red cape
  ctx.fillRect(-2, 8 + bob, 4, 10 + (animState === 'run' ? 2 : 0));
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(-1, 9 + bob, 3, 8);

  // Helmet / Head
  ctx.fillStyle = '#64748b'; // Steel base
  ctx.fillRect(4, 2 + bob, 10, 8);
  ctx.fillStyle = '#94a3b8'; // Steel highlight
  ctx.fillRect(5, 2 + bob, 8, 2);
  ctx.fillStyle = '#334155'; // Helmet shadow
  ctx.fillRect(4, 8 + bob, 10, 2);

  // Golden Plume
  ctx.fillStyle = '#f59e0b'; // Gold plume
  ctx.fillRect(3, 0 + bob, 4, 3);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(5, 1 + bob, 3, 2);

  // Visor Slit
  ctx.fillStyle = '#0f172a'; // Black slit
  ctx.fillRect(8, 5 + bob, 5, 2);
  ctx.fillStyle = '#38bdf8'; // Glowing blue eye slit
  ctx.fillRect(10, 5 + bob, 2, 2);

  // Armor Body / Chestplate
  ctx.fillStyle = '#475569';
  ctx.fillRect(4, 10 + bob, 10, 8);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(5, 11 + bob, 8, 5);
  ctx.fillStyle = '#fbbf24'; // Gold chest emblem
  ctx.fillRect(8, 12 + bob, 2, 3);
  ctx.fillRect(7, 13 + bob, 4, 1);

  // Legs / Boots
  ctx.fillStyle = '#334155';
  if (animState === 'run') {
    const legOffset = (frame % 4);
    if (legOffset === 0) {
      ctx.fillRect(4, 18, 4, 6);
      ctx.fillRect(10, 17, 4, 5);
    } else if (legOffset === 1) {
      ctx.fillRect(3, 17, 4, 5);
      ctx.fillRect(11, 18, 4, 6);
    } else if (legOffset === 2) {
      ctx.fillRect(2, 18, 4, 6);
      ctx.fillRect(12, 17, 4, 5);
    } else {
      ctx.fillRect(5, 17, 4, 5);
      ctx.fillRect(9, 18, 4, 6);
    }
  } else if (animState === 'jump') {
    ctx.fillRect(4, 17, 4, 5);
    ctx.fillRect(10, 16, 4, 6);
  } else {
    // Idle stance
    ctx.fillRect(4, 18, 4, 6);
    ctx.fillRect(10, 18, 4, 6);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(4, 22, 5, 2);
    ctx.fillRect(10, 22, 5, 2);
  }

  // Broadsword / Attack
  if (animState === 'attack') {
    // Slashing blade
    ctx.fillStyle = '#cbd5e1'; // Silver blade
    ctx.fillRect(14, 2 + bob, 12, 3);
    ctx.fillStyle = '#ffffff'; // Blade glint
    ctx.fillRect(16, 3 + bob, 9, 1);
    ctx.fillStyle = '#f59e0b'; // Gold crossguard
    ctx.fillRect(12, 0 + bob, 3, 7);
    ctx.fillStyle = '#78350f'; // Hilt
    ctx.fillRect(10, 3 + bob, 3, 2);

    // Slash Arc effect
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(14, 10 + bob, 16, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
  } else {
    // Resting Sword
    ctx.fillStyle = '#78350f'; // Hilt
    ctx.fillRect(12, 10 + bob, 2, 3);
    ctx.fillStyle = '#f59e0b'; // Crossguard
    ctx.fillRect(11, 12 + bob, 4, 2);
    ctx.fillStyle = '#cbd5e1'; // Blade
    ctx.fillRect(12, 14 + bob, 2, 9);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(13, 14 + bob, 1, 8);
  }

  ctx.restore();
}

// --- ROGUE SPRITE ---
function drawRogueSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flipX: boolean,
  animState: string,
  frame: number
) {
  ctx.save();
  if (flipX) {
    ctx.translate(x + 18, y);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(x, y);
  }

  const bob = animState === 'run' ? (frame % 2 === 0 ? -1 : 1) : 0;

  // Dark Teal Cloak / Scarf
  ctx.fillStyle = '#0f766e';
  ctx.fillRect(-2, 6 + bob, 5, 12);
  ctx.fillStyle = '#14b8a6';
  ctx.fillRect(-1, 7 + bob, 3, 10);

  // Hood & Head
  ctx.fillStyle = '#115e59';
  ctx.fillRect(4, 2 + bob, 10, 8);
  ctx.fillStyle = '#134e4a';
  ctx.fillRect(4, 2 + bob, 4, 8);

  // Face shadow & Emerald Eyes
  ctx.fillStyle = '#042f2e';
  ctx.fillRect(7, 5 + bob, 6, 4);
  ctx.fillStyle = '#2dd4bf'; // Glowing Cyan/Emerald Eyes
  ctx.fillRect(9, 6 + bob, 2, 2);
  ctx.fillRect(12, 6 + bob, 2, 2);

  // Leather Armor Body
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(5, 10 + bob, 8, 8);
  ctx.fillStyle = '#0d9488';
  ctx.fillRect(6, 11 + bob, 6, 6);

  // Legs / Agile boots
  ctx.fillStyle = '#0f172a';
  if (animState === 'run') {
    const legOffset = (frame % 4);
    if (legOffset === 0) {
      ctx.fillRect(4, 18, 3, 6);
      ctx.fillRect(10, 16, 3, 6);
    } else {
      ctx.fillRect(3, 16, 3, 6);
      ctx.fillRect(11, 18, 3, 6);
    }
  } else {
    ctx.fillRect(4, 18, 3, 6);
    ctx.fillRect(10, 18, 3, 6);
  }

  // Daggers
  if (animState === 'attack' || animState === 'dash') {
    // Twin Dagger strike
    ctx.fillStyle = '#5eead4'; // Glowing dagger 1
    ctx.fillRect(13, 8 + bob, 8, 2);
    ctx.fillRect(12, 13 + bob, 9, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(15, 8 + bob, 5, 1);
    ctx.fillRect(14, 13 + bob, 6, 1);
  } else {
    // Sheathed daggers
    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(12, 12 + bob, 2, 5);
  }

  ctx.restore();
}

// --- WIZARD SPRITE ---
function drawWizardSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flipX: boolean,
  animState: string,
  frame: number
) {
  ctx.save();
  if (flipX) {
    ctx.translate(x + 18, y);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(x, y);
  }

  const bob = animState === 'run' ? (frame % 2 === 0 ? -1 : 1) : 0;

  // Robe body
  ctx.fillStyle = '#581c87'; // Deep purple
  ctx.fillRect(3, 8 + bob, 11, 12);
  ctx.fillStyle = '#7e22ce';
  ctx.fillRect(4, 9 + bob, 9, 10);
  ctx.fillStyle = '#fbbf24'; // Gold trim
  ctx.fillRect(4, 18 + bob, 9, 2);
  ctx.fillRect(8, 9 + bob, 2, 9);

  // Wizard Hat
  ctx.fillStyle = '#6b21a8';
  ctx.fillRect(2, 4 + bob, 14, 3); // Brim
  ctx.fillStyle = '#7e22ce';
  ctx.fillRect(4, 0 + bob, 8, 4); // Cone
  ctx.fillStyle = '#a855f7';
  ctx.fillRect(6, -3 + bob, 4, 3); // Tip
  ctx.fillRect(8, -5 + bob, 3, 2);
  ctx.fillStyle = '#fbbf24'; // Hat buckle
  ctx.fillRect(7, 3 + bob, 4, 2);

  // Face & Beard
  ctx.fillStyle = '#fed7aa'; // Skin
  ctx.fillRect(6, 6 + bob, 6, 3);
  ctx.fillStyle = '#38bdf8'; // Glowing magical eyes
  ctx.fillRect(9, 6 + bob, 2, 2);
  ctx.fillStyle = '#e2e8f0'; // White beard
  ctx.fillRect(5, 8 + bob, 8, 4);
  ctx.fillRect(6, 12 + bob, 6, 2);

  // Magic Staff
  ctx.fillStyle = '#78350f'; // Wood staff
  ctx.fillRect(14, 2 + bob, 2, 20);
  ctx.fillStyle = '#f59e0b'; // Gold setting
  ctx.fillRect(13, 0 + bob, 4, 3);
  // Pulsing magic orb
  const pulse = Math.sin(Date.now() / 150) * 1.5;
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(15, 0 + bob, 3 + pulse * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(14, -1 + bob, 2, 2);

  ctx.restore();
}

// ---- ENEMY SPRITES ----

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: {
    type: EnemyType;
    x: number;
    y: number;
    w: number;
    h: number;
    facing: 'left' | 'right';
    state: string;
    animFrame: number;
    health: number;
    maxHealth: number;
    invulnerableTimer: number;
    isBoss?: boolean;
    bossPhase?: number;
  }
) {
  ctx.save();
  const x = Math.floor(enemy.x);
  const y = Math.floor(enemy.y);
  const flipX = enemy.facing === 'left';

  if (enemy.invulnerableTimer > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  switch (enemy.type) {
    case 'slime':
      drawSlime(ctx, x, y, enemy.w, enemy.h, '#22c55e', '#15803d', enemy.animFrame);
      break;
    case 'fire_slime':
      drawSlime(ctx, x, y, enemy.w, enemy.h, '#ef4444', '#b91c1c', enemy.animFrame);
      break;
    case 'skeleton':
      drawSkeleton(ctx, x, y, flipX, enemy.animFrame, enemy.state);
      break;
    case 'bat':
      drawBat(ctx, x, y, enemy.animFrame);
      break;
    case 'goblin':
      drawGoblin(ctx, x, y, flipX, enemy.animFrame);
      break;
    case 'boss_titan':
      drawBossTitan(ctx, x, y, enemy.w, enemy.h, enemy.health, enemy.maxHealth, enemy.bossPhase || 1, enemy.animFrame);
      break;
  }

  // Health bar for standard enemies if damaged
  if (!enemy.isBoss && enemy.health < enemy.maxHealth) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y - 6, enemy.w, 3);
    ctx.fillStyle = '#ef4444';
    const hpW = Math.max(0, (enemy.health / enemy.maxHealth) * enemy.w);
    ctx.fillRect(x, y - 6, hpW, 3);
  }

  ctx.restore();
}

function drawSlime(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  mainColor: string,
  darkColor: string,
  frame: number
) {
  const squash = (frame % 2 === 0) ? 1 : -1;
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2 + squash, w / 2, h / 2 - squash, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2 - 1 + squash, w / 2 - 2, h / 2 - 2 - squash, 0, 0, Math.PI * 2);
  ctx.fill();

  // Slime eyes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + w / 2 - 4, y + h / 2 - 3, 3, 3);
  ctx.fillRect(x + w / 2 + 2, y + h / 2 - 3, 3, 3);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + w / 2 - 3, y + h / 2 - 2, 2, 2);
  ctx.fillRect(x + w / 2 + 3, y + h / 2 - 2, 2, 2);
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flipX: boolean,
  frame: number,
  state: string
) {
  ctx.save();
  if (flipX) {
    ctx.translate(x + 16, y);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(x, y);
  }

  // Skull
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(4, 2, 8, 8);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(4, 2, 2, 8);
  // Red eye sockets
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(7, 5, 2, 2);
  ctx.fillRect(10, 5, 2, 2);
  // Teeth
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(6, 9, 5, 1);

  // Ribcage
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(7, 10, 2, 8); // Spine
  ctx.fillRect(4, 11, 8, 1); // Rib 1
  ctx.fillRect(5, 13, 6, 1); // Rib 2
  ctx.fillRect(6, 15, 4, 1); // Rib 3

  // Legs
  const legOffset = frame % 2 === 0 ? 0 : 2;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(4, 18, 2, 6 - legOffset);
  ctx.fillRect(10, 18, 2, 6 + legOffset);

  // Spear
  ctx.fillStyle = '#78350f'; // Shaft
  ctx.fillRect(12, 4, 2, 20);
  ctx.fillStyle = '#94a3b8'; // Tip
  ctx.fillRect(11, 0, 4, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(12, -2, 2, 2);

  ctx.restore();
}

function drawBat(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const wingUp = (frame % 2 === 0);

  ctx.fillStyle = '#1e1b4b'; // Dark purple body
  ctx.fillRect(x + 5, y + 5, 6, 6);

  // Glowing red eyes
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(x + 6, y + 6, 2, 2);
  ctx.fillRect(x + 9, y + 6, 2, 2);

  // Wings
  ctx.fillStyle = '#312e81';
  if (wingUp) {
    // Wings up
    ctx.fillRect(x, y + 1, 5, 4);
    ctx.fillRect(x + 11, y + 1, 5, 4);
    ctx.fillRect(x + 2, y, 3, 2);
    ctx.fillRect(x + 11, y, 3, 2);
  } else {
    // Wings down
    ctx.fillRect(x, y + 6, 5, 4);
    ctx.fillRect(x + 11, y + 6, 5, 4);
    ctx.fillRect(x + 1, y + 9, 3, 2);
    ctx.fillRect(x + 12, y + 9, 3, 2);
  }
}

function drawGoblin(ctx: CanvasRenderingContext2D, x: number, y: number, flipX: boolean, frame: number) {
  ctx.save();
  if (flipX) {
    ctx.translate(x + 16, y);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(x, y);
  }

  // Head & Big Ears
  ctx.fillStyle = '#16a34a'; // Green goblin
  ctx.fillRect(4, 4, 8, 7);
  ctx.fillRect(1, 4, 3, 3); // Left ear
  ctx.fillRect(12, 4, 3, 3); // Right ear
  ctx.fillStyle = '#facc15'; // Yellow eyes
  ctx.fillRect(7, 6, 2, 2);
  ctx.fillRect(10, 6, 2, 2);

  // Leather tunic
  ctx.fillStyle = '#78350f';
  ctx.fillRect(4, 11, 8, 6);

  // Bomb in hand
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(13, 14, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ef4444'; // Burning fuse
  ctx.fillRect(13, 9, 2, 2);

  // Legs
  ctx.fillStyle = '#14532d';
  ctx.fillRect(4, 17, 3, 5);
  ctx.fillRect(9, 17, 3, 5);

  ctx.restore();
}

function drawBossTitan(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  health: number,
  maxHealth: number,
  phase: number,
  frame: number
) {
  ctx.save();

  // Mechanical Titan Body
  ctx.fillStyle = '#1e293b'; // Slate hull
  ctx.fillRect(x + 4, y + 8, w - 8, h - 12);
  ctx.fillStyle = '#334155';
  ctx.fillRect(x + 8, y + 12, w - 16, h - 20);

  // Shoulder Plating
  ctx.fillStyle = '#475569';
  ctx.fillRect(x, y + 4, 12, 14);
  ctx.fillRect(x + w - 12, y + 4, 12, 14);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x + 2, y + 2, 8, 4);
  ctx.fillRect(x + w - 10, y + 2, 8, 4);

  // Glowing Core Reactor (Pulses with phase)
  const coreColor = phase === 2 ? '#ef4444' : '#38bdf8';
  const pulse = Math.sin(Date.now() / 120) * 2;
  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2 + 4, 8 + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2 + 4, 4, 0, Math.PI * 2);
  ctx.fill();

  // Titan Head & Visor
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + w / 2 - 10, y, 20, 10);
  ctx.fillStyle = phase === 2 ? '#f87171' : '#67e8f9';
  ctx.fillRect(x + w / 2 - 8, y + 3, 16, 4);

  // Heavy Metal Fists
  const fistBob = Math.sin(Date.now() / 200) * 4;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x - 6, y + h - 16 + fistBob, 12, 16);
  ctx.fillRect(x + w - 6, y + h - 16 - fistBob, 12, 16);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x - 4, y + h - 14 + fistBob, 8, 12);
  ctx.fillRect(x + w - 4, y + h - 14 - fistBob, 8, 12);

  ctx.restore();
}

// ---- TILE & PROPS RENDERING ----

export function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: string,
  x: number,
  y: number,
  size: number,
  biome: string
) {
  const drawX = Math.floor(x);
  const drawY = Math.floor(y);

  if (tile === 'empty') return;

  if (tile === 'solid') {
    drawSolidBlock(ctx, drawX, drawY, size, biome);
  } else if (tile === 'ice') {
    drawIceBlock(ctx, drawX, drawY, size);
  } else if (tile === 'solid_top') {
    drawOneWayPlatform(ctx, drawX, drawY, size, biome);
  } else if (tile.startsWith('spike')) {
    drawSpike(ctx, tile, drawX, drawY, size);
  } else if (tile === 'lava') {
    drawLava(ctx, drawX, drawY, size);
  } else if (tile === 'spring') {
    drawSpring(ctx, drawX, drawY, size);
  } else if (tile === 'breakable') {
    drawBreakableBlock(ctx, drawX, drawY, size, biome);
  }
}

function drawIceBlock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  // Translucent glacier ice block
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  // Gloss shine
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(x + 2, y + 2, size - 4, 3);
  ctx.fillRect(x + 2, y + 5, 3, size - 7);
  // Ice refraction line
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(x + 6, y + 7, size - 8, 2);
}

function drawSolidBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  biome: string
) {
  if (biome === 'emerald') {
    // Mossy Stone Ruins
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    // Grass top fringe
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x, y, size, 3);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x + 1, y, size - 2, 2);
    // Brick mortar lines
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 4, y + 6, size - 8, 1);
    ctx.fillRect(x + 8, y + 10, size - 10, 1);
  } else if (biome === 'caverns') {
    // Crystal Cavern Rock
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    // Cyan crystal flecks
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(x + 3, y + 3, 2, 2);
    ctx.fillRect(x + 10, y + 8, 2, 2);
  } else if (biome === 'magma') {
    // Dark Molten Obsidian
    ctx.fillStyle = '#18181b';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#27272a';
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    // Lava crack
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x + 2, y + 4, 3, 1);
    ctx.fillRect(x + 5, y + 5, 4, 1);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(x + 6, y + 5, 2, 1);
  } else if (biome === 'frost') {
    // Frostpeak Ice Stone with snow cap
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    // Snow cap
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x, y, size, 3);
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(x + 1, y + 3, size - 2, 2);
    // Frozen icicle fleck
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 4, y + 8, 2, 3);
  } else {
    // Cyber Matrix Tower
    ctx.fillStyle = '#09090b';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    // Neon grid border
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  }
}

function drawOneWayPlatform(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  biome: string
) {
  ctx.fillStyle = biome === 'magma' ? '#78350f' : '#3b82f6';
  ctx.fillRect(x, y, size, 4);
  ctx.fillStyle = '#93c5fd';
  ctx.fillRect(x + 1, y + 1, size - 2, 2);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, y + 4, size, 2);
}

function drawSpike(ctx: CanvasRenderingContext2D, tile: string, x: number, y: number, size: number) {
  ctx.fillStyle = '#dc2626'; // Red accent
  ctx.beginPath();
  if (tile === 'spike_up') {
    ctx.moveTo(x, y + size);
    ctx.lineTo(x + size / 2, y);
    ctx.lineTo(x + size, y + size);
  } else if (tile === 'spike_down') {
    ctx.moveTo(x, y);
    ctx.lineTo(x + size / 2, y + size);
    ctx.lineTo(x + size, y);
  } else if (tile === 'spike_left') {
    ctx.moveTo(x + size, y);
    ctx.lineTo(x, y + size / 2);
    ctx.lineTo(x + size, y + size);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y + size / 2);
    ctx.lineTo(x, y + size);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f87171'; // Highlight tip
  if (tile === 'spike_up') {
    ctx.fillRect(x + size / 2 - 1, y + 1, 2, 4);
  }
}

function drawLava(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#f97316';
  const wave = Math.sin((x + Date.now() / 150) / 8) * 2;
  ctx.fillRect(x, y + wave, size, 4);
  ctx.fillStyle = '#fde047';
  ctx.fillRect(x + 2, y + 2 + wave, 4, 2);
}

function drawSpring(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = '#475569';
  ctx.fillRect(x + 2, y + size - 4, size - 4, 4);
  ctx.fillStyle = '#eab308'; // Golden bounce pad
  ctx.fillRect(x + 1, y + size - 8, size - 2, 4);
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(x + 4, y + size - 12, size - 8, 4);
}

function drawBreakableBlock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, biome: string) {
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#92400e';
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.fillStyle = '#451a03';
  // Crack pattern
  ctx.fillRect(x + 3, y + 3, 2, 10);
  ctx.fillRect(x + 5, y + 7, 6, 2);
}

// ---- INTERACTIVE PROPS & PICKUPS ----

export function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, animTimer: number) {
  const frame = Math.floor(animTimer * 8) % 4;
  const widths = [size, size * 0.7, size * 0.3, size * 0.7];
  const w = widths[frame];
  const offset = (size - w) / 2;

  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(x + offset, y, w, size);
  ctx.fillStyle = '#eab308';
  ctx.fillRect(x + offset + 1, y + 1, Math.max(1, w - 2), size - 2);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x + offset + 2, y + 2, Math.max(1, w - 4), 2);
}

export function drawGem(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const pulse = Math.sin(Date.now() / 180) * 1.5;
  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.moveTo(x + size / 2, y);
  ctx.lineTo(x + size, y + size / 3);
  ctx.lineTo(x + size / 2, y + size + pulse);
  ctx.lineTo(x, y + size / 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#67e8f9';
  ctx.fillRect(x + size / 2 - 2, y + 2, 4, 4);
}

export function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(x + size * 0.3, y + size * 0.3, size * 0.3, Math.PI, 0, false);
  ctx.arc(x + size * 0.7, y + size * 0.3, size * 0.3, Math.PI, 0, false);
  ctx.lineTo(x + size * 0.5, y + size * 0.9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fca5a5';
  ctx.fillRect(x + size * 0.2, y + size * 0.2, 2, 2);
}

export function drawKey(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = '#eab308';
  ctx.fillRect(x + 2, y + 2, 6, 6);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 4, y + 4, 2, 2);
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(x + 6, y + 4, 8, 2);
  ctx.fillRect(x + 10, y + 6, 2, 3);
  ctx.fillRect(x + 12, y + 6, 2, 2);
}

export function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isOpen: boolean) {
  if (isOpen) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#eab308';
    ctx.strokeRect(x, y, w, h);
  } else {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    // Keyhole
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x + w / 2 - 2, y + h / 2 - 2, 4, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + w / 2 - 1, y + h / 2 - 1, 2, 2);
  }
}

export function drawCheckpoint(ctx: CanvasRenderingContext2D, x: number, y: number, activated: boolean) {
  // Pole
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x + 2, y + 4, 3, 20);

  if (activated) {
    // Lit Torch / Banner
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x + 5, y + 4, 12, 8);
    ctx.fillStyle = '#ef4444';
    const flameY = Math.sin(Date.now() / 100) * 2;
    ctx.fillRect(x + 1, y - 2 + flameY, 5, 6);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x + 2, y - 1 + flameY, 3, 3);
  } else {
    // Unlit banner
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 5, y + 4, 10, 8);
  }
}

export function drawExitPortal(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const time = Date.now() / 200;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  
  // Outer swirling vortex ring
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2, h / 2, time, 0, Math.PI * 2);
  ctx.stroke();

  // Inner core
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 3, h / 3, -time * 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
