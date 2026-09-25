import { soundManager } from '../audio/SoundManager';
import { HERO_CLASSES } from '../data/defaultLevels';
import {
  drawCheckpoint,
  drawCoin,
  drawDoor,
  drawEnemy,
  drawExitPortal,
  drawGem,
  drawHeart,
  drawHero,
  drawKey,
  drawTile,
} from '../graphics/pixelSprites';
import {
  DifficultyMode,
  DIFFICULTY_CONFIGS,
  Enemy,
  FloatingText,
  HandheldSkin,
  HeroClassType,
  InteractiveObject,
  Item,
  LevelData,
  MovingPlatform,
  Particle,
  PlayerState,
  Projectile,
  SKIN_CONFIGS,
} from '../types';
import { checkAABB, resolveTileCollisions } from './physics';

export interface GameEngineCallbacks {
  onLevelComplete: (time: number, score: number, coins: number) => void;
  onGameOver: () => void;
  onScoreUpdate: (score: number, coins: number, keys: number) => void;
  onPlayerHurt: (currentHp: number, maxHp: number) => void;
  onBossHealthUpdate?: (hp: number, maxHp: number, name: string) => void;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public level: LevelData;
  public player: PlayerState;
  public enemies: Enemy[] = [];
  public items: Item[] = [];
  public interactiveObjs: InteractiveObject[] = [];
  public movingPlatforms: MovingPlatform[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  public callbacks: GameEngineCallbacks;
  public heroType: HeroClassType = 'knight';
  public difficulty: DifficultyMode = 'normal';
  public skin: HandheldSkin = 'vibrant';
  public lastCheckpoint: { x: number; y: number } = { x: 0, y: 0 };
  public levelTime: number = 0;
  public isPaused: boolean = false;
  public isGameOver: boolean = false;
  public isCompleted: boolean = false;
  private isOnIce: boolean = false;

  // Screen shake & camera
  public camera = { x: 0, y: 0, targetX: 0, targetY: 0 };
  public screenShake = { intensity: 0, timer: 0 };

  // Control keys
  public keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    attack: false,
    special: false,
    jumpPressed: false,
  };

  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private pendingTimeouts: number[] = [];

  private addTimeout(fn: () => void, ms: number) {
    const id = window.setTimeout(() => {
      this.pendingTimeouts = this.pendingTimeouts.filter((t) => t !== id);
      fn();
    }, ms);
    this.pendingTimeouts.push(id);
    return id;
  }

  public clearAllTimeouts() {
    this.pendingTimeouts.forEach((id) => clearTimeout(id));
    this.pendingTimeouts = [];
  }

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelData,
    heroType: HeroClassType,
    difficulty: DifficultyMode = 'normal',
    skin: HandheldSkin = 'vibrant',
    callbacks: GameEngineCallbacks
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.level = level;
    this.heroType = heroType;
    this.difficulty = difficulty;
    this.skin = skin;
    this.callbacks = callbacks;

    const heroConfig = HERO_CLASSES[heroType] || HERO_CLASSES.knight;
    const diffConfig = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.normal;
    const skinConfig = SKIN_CONFIGS[skin] || SKIN_CONFIGS.vibrant;
    const skinHpBonus = skinConfig.capability.healthBonus || 0;

    const calculatedMaxHp = Math.max(2, heroConfig.maxHealth + diffConfig.healthBonus + skinHpBonus);

    this.player = {
      x: level.spawnPoint.x * level.tileSize,
      y: level.spawnPoint.y * level.tileSize,
      vx: 0,
      vy: 0,
      width: 14,
      height: 22,
      health: calculatedMaxHp,
      maxHealth: calculatedMaxHp,
      isGrounded: false,
      isOnWall: false,
      wallDir: 0,
      isWallSliding: false,
      facing: 'right',
      animState: 'idle',
      animFrame: 0,
      animTimer: 0,
      isAttacking: false,
      attackTimer: 0,
      attackCooldown: 0,
      canDoubleJump: heroConfig.doubleJump,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      specialCooldownTimer: 0,
      isDashing: false,
      dashTimer: 0,
      invulnerableTimer: 0,
      coins: 0,
      score: 0,
      keys: 0,
      heroClass: heroType,
      mana: 100,
      maxMana: 100,
    };

    this.lastCheckpoint = { ...level.spawnPoint };
    this.loadLevelEntities();
  }

  public loadLevelEntities() {
    this.enemies = [];
    this.items = [];
    this.interactiveObjs = [];
    this.movingPlatforms = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];

    const tileSize = this.level.tileSize;

    for (let r = 0; r < this.level.height; r++) {
      for (let c = 0; c < this.level.width; c++) {
        const tile = this.level.tiles[r][c];
        const wx = c * tileSize;
        const wy = r * tileSize;

        if (tile === 'coin') {
          this.items.push({
            id: `coin_${r}_${c}`,
            type: 'coin',
            x: wx + 2,
            y: wy + 2,
            w: 12,
            h: 12,
            collected: false,
            animTimer: Math.random() * 2,
            value: 100,
          });
        } else if (tile === 'gem') {
          this.items.push({
            id: `gem_${r}_${c}`,
            type: 'gem',
            x: wx + 2,
            y: wy + 2,
            w: 12,
            h: 12,
            collected: false,
            animTimer: 0,
            value: 500,
          });
        } else if (tile === 'heart') {
          this.items.push({
            id: `heart_${r}_${c}`,
            type: 'heart',
            x: wx + 2,
            y: wy + 2,
            w: 12,
            h: 12,
            collected: false,
            animTimer: 0,
            value: 1,
          });
        } else if (tile === 'key') {
          this.items.push({
            id: `key_${r}_${c}`,
            type: 'key',
            x: wx + 2,
            y: wy + 2,
            w: 14,
            h: 14,
            collected: false,
            animTimer: 0,
            value: 1,
          });
        } else if (tile === 'door') {
          this.interactiveObjs.push({
            id: `door_${r}_${c}`,
            type: 'door',
            x: wx,
            y: wy,
            w: tileSize,
            h: tileSize * 2,
            state: false,
          });
        } else if (tile === 'checkpoint') {
          this.interactiveObjs.push({
            id: `cp_${r}_${c}`,
            type: 'checkpoint',
            x: wx,
            y: wy,
            w: 16,
            h: 24,
            state: false,
          });
        } else if (tile === 'exit') {
          this.interactiveObjs.push({
            id: `exit_${r}_${c}`,
            type: 'exit',
            x: wx,
            y: wy - 8,
            w: 24,
            h: 32,
            state: true,
          });
        } else if (tile === 'enemy_slime') {
          this.enemies.push({
            id: `slime_${r}_${c}`,
            type: 'slime',
            x: wx,
            y: wy + 2,
            vx: -0.6,
            vy: 0,
            w: 16,
            h: 14,
            health: 2,
            maxHealth: 2,
            facing: 'left',
            state: 'patrol',
            stateTimer: 0,
            startX: wx,
            patrolRange: 48,
            animFrame: 0,
            animTimer: 0,
            isGrounded: true,
            invulnerableTimer: 0,
          });
        } else if (tile === 'enemy_skeleton') {
          this.enemies.push({
            id: `skel_${r}_${c}`,
            type: 'skeleton',
            x: wx,
            y: wy - 6,
            vx: -0.7,
            vy: 0,
            w: 16,
            h: 22,
            health: 4,
            maxHealth: 4,
            facing: 'left',
            state: 'patrol',
            stateTimer: 0,
            startX: wx,
            patrolRange: 64,
            animFrame: 0,
            animTimer: 0,
            isGrounded: true,
            invulnerableTimer: 0,
          });
        } else if (tile === 'enemy_bat') {
          this.enemies.push({
            id: `bat_${r}_${c}`,
            type: 'bat',
            x: wx,
            y: wy,
            vx: -1.0,
            vy: 0,
            w: 16,
            h: 12,
            health: 1,
            maxHealth: 1,
            facing: 'left',
            state: 'patrol',
            stateTimer: 0,
            startX: wx,
            patrolRange: 70,
            animFrame: 0,
            animTimer: 0,
            isGrounded: false,
            invulnerableTimer: 0,
          });
        } else if (tile === 'enemy_goblin') {
          this.enemies.push({
            id: `goblin_${r}_${c}`,
            type: 'goblin',
            x: wx,
            y: wy - 4,
            vx: 0,
            vy: 0,
            w: 16,
            h: 20,
            health: 3,
            maxHealth: 3,
            facing: 'left',
            state: 'patrol',
            stateTimer: 0,
            startX: wx,
            patrolRange: 32,
            animFrame: 0,
            animTimer: 0,
            isGrounded: true,
            invulnerableTimer: 0,
            attackCooldown: 2.0,
          });
        } else if (tile === 'boss_titan') {
          this.enemies.push({
            id: `boss_titan`,
            type: 'boss_titan',
            x: wx,
            y: wy - 24,
            vx: 0.6,
            vy: 0,
            w: 44,
            h: 44,
            health: 25,
            maxHealth: 25,
            facing: 'left',
            state: 'patrol',
            stateTimer: 0,
            startX: wx,
            patrolRange: 160,
            animFrame: 0,
            animTimer: 0,
            isGrounded: true,
            invulnerableTimer: 0,
            isBoss: true,
            bossPhase: 1,
            attackCooldown: 3.0,
          });
        }
      }
    }

    soundManager.playBGM(this.level.bgMusicTheme);
  }

  public start() {
    this.lastTimestamp = performance.now();
    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
      this.lastTimestamp = timestamp;

      if (!this.isPaused && !this.isGameOver && !this.isCompleted) {
        this.update(dt);
      }
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    this.clearAllTimeouts();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    soundManager.stopBGM();
  }

  public resetToCheckpoint() {
    this.clearAllTimeouts();
    this.player.x = this.lastCheckpoint.x * this.level.tileSize;
    this.player.y = this.lastCheckpoint.y * this.level.tileSize;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.health = this.player.maxHealth;
    this.player.invulnerableTimer = 1.5;
    this.player.isAttacking = false;
    this.player.isDashing = false;
    this.player.animState = 'idle';
    this.isGameOver = false;
    this.isPaused = false;
    this.screenShake = { intensity: 0, timer: 0 };
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      attack: false,
      special: false,
      jumpPressed: false,
    };

    // Snap camera immediately to checkpoint
    const viewW = this.canvas.width;
    const viewH = this.canvas.height;
    const targetX = Math.max(0, Math.min(this.level.width * this.level.tileSize - viewW, this.player.x + this.player.width / 2 - viewW / 2));
    const targetY = Math.max(0, Math.min(this.level.height * this.level.tileSize - viewH, this.player.y + this.player.height / 2 - viewH / 2));
    this.camera.x = targetX;
    this.camera.y = targetY;
    this.camera.targetX = targetX;
    this.camera.targetY = targetY;

    this.callbacks.onPlayerHurt(this.player.health, this.player.maxHealth);
    soundManager.playBGM(this.level.bgMusicTheme);
  }

  public restartStage() {
    this.clearAllTimeouts();
    this.isPaused = false;
    this.isGameOver = false;
    this.isCompleted = false;
    this.levelTime = 0;
    this.screenShake = { intensity: 0, timer: 0 };
    this.isOnIce = false;

    // Reset control keys
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      attack: false,
      special: false,
      jumpPressed: false,
    };

    const heroConfig = HERO_CLASSES[this.heroType] || HERO_CLASSES.knight;
    const diffConfig = DIFFICULTY_CONFIGS[this.difficulty] || DIFFICULTY_CONFIGS.normal;
    const skinConfig = SKIN_CONFIGS[this.skin] || SKIN_CONFIGS.vibrant;
    const skinHpBonus = skinConfig.capability.healthBonus || 0;
    const calculatedMaxHp = Math.max(2, heroConfig.maxHealth + diffConfig.healthBonus + skinHpBonus);

    this.player.x = this.level.spawnPoint.x * this.level.tileSize;
    this.player.y = this.level.spawnPoint.y * this.level.tileSize;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.health = calculatedMaxHp;
    this.player.maxHealth = calculatedMaxHp;
    this.player.invulnerableTimer = 1.2;
    this.player.isAttacking = false;
    this.player.attackTimer = 0;
    this.player.attackCooldown = 0;
    this.player.specialCooldownTimer = 0;
    this.player.isDashing = false;
    this.player.dashTimer = 0;
    this.player.isGrounded = false;
    this.player.isOnWall = false;
    this.player.wallDir = 0;
    this.player.isWallSliding = false;
    this.player.facing = 'right';
    this.player.score = 0;
    this.player.coins = 0;
    this.player.keys = 0;
    this.player.mana = 100;
    this.player.maxMana = 100;
    this.player.animState = 'idle';
    this.player.animFrame = 0;
    this.player.animTimer = 0;

    this.lastCheckpoint = { ...this.level.spawnPoint };

    // Clear active projectiles, particles, and floating texts
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];

    // Reload all original coins, gems, enemies, bosses, and doors
    this.loadLevelEntities();

    // Snap camera immediately to spawn point so view does not lag or show empty void
    const viewW = this.canvas.width;
    const viewH = this.canvas.height;
    const targetX = Math.max(0, Math.min(this.level.width * this.level.tileSize - viewW, this.player.x + this.player.width / 2 - viewW / 2));
    const targetY = Math.max(0, Math.min(this.level.height * this.level.tileSize - viewH, this.player.y + this.player.height / 2 - viewH / 2));
    this.camera.x = targetX;
    this.camera.y = targetY;
    this.camera.targetX = targetX;
    this.camera.targetY = targetY;

    this.callbacks.onPlayerHurt(this.player.health, this.player.maxHealth);
    this.callbacks.onScoreUpdate(0, 0, 0);

    if (this.callbacks.onBossHealthUpdate) {
      this.callbacks.onBossHealthUpdate(0, 0, '');
    }

    soundManager.playBGM(this.level.bgMusicTheme);
  }

  // ----------------------------------------------------
  // UPDATE LOOP
  // ----------------------------------------------------
  public update(dt: number) {
    this.levelTime += dt;

    // 1. Update Player Controls & Movement
    this.updatePlayer(dt);

    // 2. Update Enemies AI
    this.updateEnemies(dt);

    // 3. Update Projectiles
    this.updateProjectiles(dt);

    // 4. Update Interactive Items & Objects
    this.updateItemsAndObjects(dt);

    // 5. Update Particles & Floating Text
    this.updateParticles(dt);

    // 6. Update Screen Shake & Camera
    this.updateCamera(dt);
  }

  private updatePlayer(dt: number) {
    const p = this.player;
    const heroConfig = HERO_CLASSES[this.heroType];

    // Timers
    if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;
    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.specialCooldownTimer > 0) p.specialCooldownTimer -= dt;
    if (p.jumpBufferTimer > 0) p.jumpBufferTimer -= dt;
    if (p.coyoteTimer > 0) p.coyoteTimer -= dt;

    // Dash logic
    if (p.isDashing) {
      p.dashTimer -= dt;
      p.vy = 0;
      p.vx = (p.facing === 'right' ? 1 : -1) * heroConfig.speed * 2.6;
      this.createDustParticle(p.x + p.width / 2, p.y + p.height / 2, '#06b6d4', 4);
      if (p.dashTimer <= 0) {
        p.isDashing = false;
      }
    } else {
      // Horizontal input with ice friction support
      const accel = this.isOnIce ? (p.isGrounded ? 0.18 : 0.14) : (p.isGrounded ? 0.4 : 0.25);
      const friction = this.isOnIce ? 0.985 : (p.isGrounded ? 0.78 : 0.92);

      if (this.keys.left) {
        p.vx -= accel;
        p.facing = 'left';
      } else if (this.keys.right) {
        p.vx += accel;
        p.facing = 'right';
      } else {
        p.vx *= friction;
        if (Math.abs(p.vx) < 0.05) p.vx = 0;
      }

      // Clamp horizontal speed with skin speed bonus
      const skinConfig = SKIN_CONFIGS[this.skin] || SKIN_CONFIGS.vibrant;
      const effectiveMaxSpeed = heroConfig.speed * (1 + (skinConfig.capability.speedBonus || 0));
      p.vx = Math.max(-effectiveMaxSpeed, Math.min(effectiveMaxSpeed, p.vx));

      // Skin-specific trail particles when moving fast
      if (Math.abs(p.vx) > 1.4 && Math.random() < 0.3) {
        let trailColor = '#00FFD1';
        if (this.skin === 'dmg_gameboy') trailColor = '#991b5b';
        else if (this.skin === 'nes_classic') trailColor = '#ef4444';
        else if (this.skin === 'snes') trailColor = '#a855f7';
        else if (this.skin === 'switch_neon') trailColor = Math.random() < 0.5 ? '#00c3e3' : '#ff3b56';

        this.particles.push({
          x: p.x + p.width / 2 + (Math.random() - 0.5) * 4,
          y: p.y + p.height - 2,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -Math.random() * 0.8,
          size: 2,
          color: trailColor,
          life: 0.25,
          maxLife: 0.25,
        });
      }

      // Gravity
      const gravity = 0.32;
      const maxFallSpeed = p.isWallSliding ? 1.5 : 8.0;
      p.vy = Math.min(maxFallSpeed, p.vy + gravity);

      // Jump Handling
      if (this.keys.jumpPressed) {
        p.jumpBufferTimer = 0.12; // Jump buffering
        this.keys.jumpPressed = false;
      }

      // Execute Jump
      if (p.jumpBufferTimer > 0) {
        if (p.isGrounded || p.coyoteTimer > 0) {
          // Standard jump
          p.vy = -heroConfig.jumpForce;
          p.isGrounded = false;
          p.coyoteTimer = 0;
          p.jumpBufferTimer = 0;
          p.canDoubleJump = heroConfig.doubleJump;
          soundManager.playJump();
          this.createDustParticle(p.x + p.width / 2, p.y + p.height, '#94a3b8', 6);
        } else if (p.isWallSliding && heroConfig.wallJump) {
          // Wall Jump kick
          p.vy = -heroConfig.jumpForce * 0.92;
          p.vx = -p.wallDir * heroConfig.speed * 1.3;
          p.facing = p.wallDir === 1 ? 'left' : 'right';
          p.jumpBufferTimer = 0;
          p.canDoubleJump = heroConfig.doubleJump;
          soundManager.playJump();
          this.createDustParticle(p.x + (p.wallDir === 1 ? p.width : 0), p.y + p.height / 2, '#94a3b8', 8);
        } else if (p.canDoubleJump && !p.isGrounded) {
          // Double Jump (Rogue)
          p.vy = -heroConfig.jumpForce * 0.9;
          p.canDoubleJump = false;
          p.jumpBufferTimer = 0;
          soundManager.playDoubleJump();
          this.createDustParticle(p.x + p.width / 2, p.y + p.height, '#2dd4bf', 8);
        }
      }

      // Variable jump height: release jump early cuts upward velocity
      if (!this.keys.up && p.vy < -2.0) {
        p.vy *= 0.55;
      }
    }

    // Special Ability Trigger
    if (this.keys.special && p.specialCooldownTimer <= 0) {
      this.triggerSpecialAbility();
      this.keys.special = false;
    }

    // Attack Trigger
    if (this.keys.attack && p.attackCooldown <= 0 && !p.isDashing) {
      this.triggerAttack();
      this.keys.attack = false;
    }

    // Attack timer
    if (p.isAttacking) {
      p.attackTimer -= dt;
      if (p.attackTimer <= 0) p.isAttacking = false;
    }

    // Move & Resolve Collisions
    const isDroppingDown = this.keys.down && this.keys.up; // Down + Jump drops through one-way platforms
    const col = resolveTileCollisions(
      { x: p.x, y: p.y, vx: p.vx, vy: p.vy, w: p.width, h: p.height },
      this.level.tiles,
      this.level.tileSize,
      isDroppingDown
    );

    // Hazard hit
    if (col.hitHazard && p.invulnerableTimer <= 0) {
      this.hurtPlayer(1, 'Spike Trap!');
    }

    // Spring boost
    if (col.hitSpring) {
      p.vy = -10.5;
      p.canDoubleJump = heroConfig.doubleJump;
      soundManager.playSpring();
      this.addFloatingText('BOING!', p.x, p.y - 8, '#fde047');
      this.createDustParticle(p.x + p.width / 2, p.y + p.height, '#fde047', 8);
    }

    // Update position and grounded state
    p.x = col.x;
    p.y = col.y;
    p.vx = col.vx;
    p.vy = col.vy;

    // Grounding & Coyote time
    if (col.isGrounded) {
      if (!p.isGrounded) {
        // Landing dust
        this.createDustParticle(p.x + p.width / 2, p.y + p.height, this.isOnIce ? '#38bdf8' : '#64748b', 4);
      }
      p.isGrounded = true;
      this.isOnIce = col.isOnIce;
      p.coyoteTimer = 0.1;
      p.canDoubleJump = heroConfig.doubleJump;
    } else {
      p.isGrounded = false;
      this.isOnIce = false;
    }

    // Wall slide detection
    p.isWallSliding = false;
    p.isOnWall = false;
    p.wallDir = 0;
    if (!p.isGrounded && p.vy > 0 && heroConfig.wallJump) {
      if (col.isOnLeftWall && this.keys.left) {
        p.isWallSliding = true;
        p.wallDir = -1;
      } else if (col.isOnRightWall && this.keys.right) {
        p.isWallSliding = true;
        p.wallDir = 1;
      }
    }

    // Animation state machine
    p.animTimer += dt;
    if (p.isDashing) {
      p.animState = 'dash';
    } else if (p.isAttacking) {
      p.animState = 'attack';
    } else if (p.isWallSliding) {
      p.animState = 'wall';
    } else if (!p.isGrounded) {
      p.animState = p.vy < 0 ? 'jump' : 'fall';
    } else if (Math.abs(p.vx) > 0.3) {
      p.animState = 'run';
      if (p.animTimer > 0.1) {
        p.animFrame++;
        p.animTimer = 0;
      }
    } else {
      p.animState = 'idle';
    }

    // Out of bounds check
    if (p.y > this.level.height * this.level.tileSize + 30) {
      const diffConfig = DIFFICULTY_CONFIGS[this.difficulty] || DIFFICULTY_CONFIGS.normal;
      if (diffConfig.damageTakenMultiplier === 0) {
        this.resetToCheckpoint();
        this.addFloatingText('SAVED!', p.x, p.y - 12, '#38bdf8');
      } else {
        this.hurtPlayer(p.maxHealth, 'Fell into the abyss!');
      }
    }
  }

  private triggerAttack() {
    const p = this.player;
    p.isAttacking = true;
    p.attackTimer = 0.2;
    p.attackCooldown = 0.35;
    soundManager.playAttack();

    // Hitbox for melee slash
    const reach = 22;
    const slashRect = {
      x: p.facing === 'right' ? p.x + p.width : p.x - reach,
      y: p.y - 4,
      w: reach,
      h: p.height + 8,
    };

    // Slash particles
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: slashRect.x + Math.random() * slashRect.w,
        y: slashRect.y + Math.random() * slashRect.h,
        vx: (p.facing === 'right' ? 2 : -2) + (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 3,
        color: '#38bdf8',
        life: 0.15,
        maxLife: 0.15,
      });
    }

    // Check hit on enemies
    this.enemies.forEach((enemy) => {
      if (checkAABB(slashRect, enemy) && enemy.invulnerableTimer <= 0) {
        this.damageEnemy(enemy, 2);
      }
    });
  }

  private triggerSpecialAbility() {
    const p = this.player;
    const heroConfig = HERO_CLASSES[this.heroType];
    const skinConfig = SKIN_CONFIGS[this.skin] || SKIN_CONFIGS.vibrant;
    const cdMult = 1 - (skinConfig.capability.cooldownReduction || 0);
    p.specialCooldownTimer = heroConfig.specialCooldown * cdMult;

    if (this.heroType === 'knight') {
      // Ground Slam / Shield Charge
      p.isAttacking = true;
      p.attackTimer = 0.3;
      p.vx = (p.facing === 'right' ? 1 : -1) * 6;
      soundManager.playExplosion();
      this.triggerScreenShake(4, 0.2);
      this.addFloatingText('SHIELD BASH!', p.x, p.y - 12, '#fbbf24');
    } else if (this.heroType === 'rogue') {
      // Shadow Dash
      p.isDashing = true;
      const dashMult = skinConfig.capability.dashDistanceMultiplier || 1.0;
      p.dashTimer = 0.22 * dashMult;
      p.invulnerableTimer = 0.25 * dashMult;
      soundManager.playDash();
      this.addFloatingText(dashMult > 1.1 ? 'HYPER DASH!' : 'SHADOW DASH!', p.x, p.y - 12, '#2dd4bf');
    } else if (this.heroType === 'wizard') {
      // Arcane Fireball
      soundManager.playFireball();
      const dir = p.facing === 'right' ? 1 : -1;
      this.projectiles.push({
        id: `fb_${Date.now()}`,
        x: p.x + (dir === 1 ? p.width + 4 : -12),
        y: p.y + 4,
        vx: dir * 5.5,
        vy: 0,
        radius: 6,
        color: '#f97316',
        isPlayer: true,
        damage: 3,
        life: 1.2,
        maxLife: 1.2,
        type: 'fireball',
      });
      this.addFloatingText('PYRO BLAST!', p.x, p.y - 12, '#f97316');
    }
  }

  // ----------------------------------------------------
  // ENEMY AI & COMBAT
  // ----------------------------------------------------
  private updateEnemies(dt: number) {
    const p = this.player;
    const diffConfig = DIFFICULTY_CONFIGS[this.difficulty] || DIFFICULTY_CONFIGS.normal;
    const speedMult = diffConfig.enemySpeedMultiplier;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.invulnerableTimer > 0) e.invulnerableTimer -= dt;
      e.animTimer += dt;
      if (e.animTimer > 0.15) {
        e.animFrame++;
        e.animTimer = 0;
      }

      if (e.type === 'slime') {
        // Patrol & hop
        e.x += e.vx * speedMult;
        if (Math.abs(e.x - e.startX) > e.patrolRange) {
          e.vx = -e.vx;
          e.facing = e.vx > 0 ? 'right' : 'left';
        }
      } else if (e.type === 'skeleton') {
        // March & thrust
        e.x += e.vx * speedMult;
        if (Math.abs(e.x - e.startX) > e.patrolRange) {
          e.vx = -e.vx;
          e.facing = e.vx > 0 ? 'right' : 'left';
        }
      } else if (e.type === 'bat') {
        // Sinusoidal flight
        e.x += e.vx * speedMult;
        e.y += Math.sin(this.levelTime * 4 + parseInt(e.id.slice(-1) || '0')) * 0.8;
        if (Math.abs(e.x - e.startX) > e.patrolRange) {
          e.vx = -e.vx;
          e.facing = e.vx > 0 ? 'right' : 'left';
        }
      } else if (e.type === 'goblin') {
        // Shoot bombs
        if (e.attackCooldown !== undefined) {
          e.attackCooldown -= dt;
          if (e.attackCooldown <= 0) {
            e.attackCooldown = Math.max(1.4, 2.5 / speedMult);
            const dir = p.x > e.x ? 1 : -1;
            e.facing = dir === 1 ? 'right' : 'left';
            this.projectiles.push({
              id: `bomb_${Date.now()}`,
              x: e.x + (dir === 1 ? e.w : -8),
              y: e.y + 4,
              vx: dir * 3.0 * speedMult,
              vy: -3.5,
              radius: 5,
              color: '#ef4444',
              isPlayer: false,
              damage: 1,
              life: 2.0,
              maxLife: 2.0,
              type: 'bomb',
            });
            soundManager.playFireball();
          }
        }
      } else if (e.type === 'boss_titan') {
        // Boss AI logic
        this.updateBossTitan(e, dt);
      }

      // Check Stomp Collision (Player jumping onto enemy head)
      const isPlayerFalling = p.vy > 0;
      const playerFeet = p.y + p.height;
      const enemyHead = e.y + 6;

      if (
        checkAABB(
          { x: p.x, y: p.y, w: p.width, h: p.height },
          { x: e.x, y: e.y, w: e.w, h: e.h }
        )
      ) {
        if (isPlayerFalling && playerFeet <= enemyHead + 8 && !p.isGrounded) {
          // Stomp success!
          p.vy = -7.5; // Bounce player up
          soundManager.playStomp();
          const skinConfig = SKIN_CONFIGS[this.skin] || SKIN_CONFIGS.vibrant;
          const stompDmg = 2 + (skinConfig.capability.stompDamageBonus || 0);
          this.damageEnemy(e, stompDmg);
          this.createDustParticle(e.x + e.w / 2, e.y, '#f59e0b', 8);

          // NES Classic: Pixel Stomp Quake shockwave!
          if (skinConfig.id === 'nes_classic') {
            this.triggerScreenShake(4, 0.2);
            this.addFloatingText('QUAKE STOMP!', e.x, e.y - 12, '#ef4444');
            // Deal shockwave damage to nearby enemies within 54px
            this.enemies.forEach((other) => {
              if (other !== e && Math.hypot(other.x - e.x, other.y - e.y) < 54) {
                this.damageEnemy(other, 1);
                this.createDustParticle(other.x + other.w / 2, other.y, '#ef4444', 4);
              }
            });
          } else {
            this.addFloatingText(`STOMP! ${stompDmg * 100}`, e.x, e.y - 10, '#fde047');
          }
        } else if (p.invulnerableTimer <= 0 && !p.isDashing) {
          // Player takes damage
          this.hurtPlayer(1, 'Hit by ' + e.type);
        }
      }
    }
  }

  private updateBossTitan(boss: Enemy, dt: number) {
    const p = this.player;
    boss.x += boss.vx;
    if (Math.abs(boss.x - boss.startX) > boss.patrolRange) {
      boss.vx = -boss.vx;
      boss.facing = boss.vx > 0 ? 'right' : 'left';
    }

    if (boss.health < boss.maxHealth / 2 && boss.bossPhase === 1) {
      boss.bossPhase = 2;
      boss.vx *= 1.4;
      this.triggerScreenShake(6, 0.4);
      this.addFloatingText('ENRAGED PHASE 2!', boss.x, boss.y - 16, '#ef4444');
      soundManager.playExplosion();
    }

    if (boss.attackCooldown !== undefined) {
      boss.attackCooldown -= dt;
      if (boss.attackCooldown <= 0) {
        boss.attackCooldown = boss.bossPhase === 2 ? 1.8 : 3.0;
        const dir = p.x > boss.x ? 1 : -1;
        boss.facing = dir === 1 ? 'right' : 'left';

        // Laser blast or shockwave
        for (let s = -1; s <= 1; s += 2) {
          this.projectiles.push({
            id: `laser_${Date.now()}_${s}`,
            x: boss.x + boss.w / 2,
            y: boss.y + boss.h / 2,
            vx: s * 4.2,
            vy: 0,
            radius: 7,
            color: boss.bossPhase === 2 ? '#ef4444' : '#38bdf8',
            isPlayer: false,
            damage: 1,
            life: 1.8,
            maxLife: 1.8,
            type: 'laser',
          });
        }
        soundManager.playExplosion();
      }
    }

    if (this.callbacks.onBossHealthUpdate) {
      this.callbacks.onBossHealthUpdate(boss.health, boss.maxHealth, 'The Iron Titan');
    }
  }

  public damageEnemy(enemy: Enemy, damage: number) {
    enemy.health -= damage;
    enemy.invulnerableTimer = 0.2;
    soundManager.playStomp();
    this.addFloatingText(`-${damage}`, enemy.x + enemy.w / 2, enemy.y - 6, '#ef4444');

    if (enemy.health <= 0) {
      // Enemy defeated
      soundManager.playExplosion();
      this.player.score += enemy.isBoss ? 2000 : 300;
      this.callbacks.onScoreUpdate(this.player.score, this.player.coins, this.player.keys);
      this.addFloatingText(enemy.isBoss ? '+2000' : '+300', enemy.x, enemy.y - 12, '#fbbf24');
      this.createDeathExplosion(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#f59e0b');

      // Drop coin or gem
      if (Math.random() > 0.4 || enemy.isBoss) {
        this.items.push({
          id: `drop_${Date.now()}`,
          type: enemy.isBoss ? 'gem' : 'coin',
          x: enemy.x + enemy.w / 2 - 6,
          y: enemy.y + enemy.h / 2 - 6,
          w: 12,
          h: 12,
          collected: false,
          animTimer: 0,
          value: enemy.isBoss ? 500 : 100,
        });
      }

      // Remove from list
      const idx = this.enemies.indexOf(enemy);
      if (idx !== -1) {
        this.enemies.splice(idx, 1);
      }

      if (enemy.isBoss) {
        this.addFloatingText('BOSS SLAIN!', enemy.x, enemy.y - 24, '#22c55e');
        this.addTimeout(() => {
          this.completeLevel();
        }, 1500);
      }
    }
  }

  public hurtPlayer(damage: number, reason = '') {
    const p = this.player;
    if (p.invulnerableTimer > 0 || this.isGameOver || this.isCompleted) return;

    const diffConfig = DIFFICULTY_CONFIGS[this.difficulty] || DIFFICULTY_CONFIGS.normal;
    if (diffConfig.damageTakenMultiplier === 0) {
      p.invulnerableTimer = 0.6;
      this.addFloatingText('IMMORTAL', p.x, p.y - 10, '#38bdf8');
      return;
    }

    const finalDamage = Math.max(1, Math.round(damage * diffConfig.damageTakenMultiplier));

    p.health -= finalDamage;
    p.invulnerableTimer = 1.2;
    p.vy = -4.0;
    p.vx = p.facing === 'right' ? -2.5 : 2.5;

    soundManager.playPlayerHurt();
    this.triggerScreenShake(5, 0.25);
    this.addFloatingText(`-${finalDamage} HP`, p.x, p.y - 10, '#ef4444');
    this.callbacks.onPlayerHurt(p.health, p.maxHealth);

    if (p.health <= 0) {
      this.gameOver();
    }
  }

  private gameOver() {
    this.isGameOver = true;
    soundManager.playExplosion();
    this.addFloatingText('GAME OVER', this.player.x, this.player.y - 16, '#ef4444');
    this.addTimeout(() => {
      this.callbacks.onGameOver();
    }, 1200);
  }

  public completeLevel() {
    if (this.isCompleted) return;
    this.isCompleted = true;
    soundManager.playVictory();
    this.addFloatingText('STAGE CLEAR!', this.player.x, this.player.y - 20, '#22c55e');

    const diffConfig = DIFFICULTY_CONFIGS[this.difficulty] || DIFFICULTY_CONFIGS.normal;
    const baseScore = this.player.score + Math.max(0, Math.floor((this.level.targetTime - this.levelTime) * 50));
    const finalScore = Math.round(baseScore * diffConfig.scoreMultiplier);

    this.addTimeout(() => {
      this.callbacks.onLevelComplete(this.levelTime, finalScore, this.player.coins);
    }, 1500);
  }

  // ----------------------------------------------------
  // PROJECTILES & PARTICLES
  // ----------------------------------------------------
  private updateProjectiles(dt: number) {
    const p = this.player;
    const tileSize = this.level.tileSize;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life -= dt;
      proj.x += proj.vx;
      proj.y += proj.vy;

      if (proj.type === 'bomb') {
        proj.vy += 0.2; // bomb gravity
      }

      // Check wall collision
      const tx = Math.floor(proj.x / tileSize);
      const ty = Math.floor(proj.y / tileSize);
      if (
        ty >= 0 &&
        ty < this.level.height &&
        tx >= 0 &&
        tx < this.level.width &&
        this.level.tiles[ty][tx] === 'solid'
      ) {
        this.createDeathExplosion(proj.x, proj.y, proj.color);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check player collision if enemy projectile
      if (!proj.isPlayer) {
        if (
          checkAABB(
            { x: p.x, y: p.y, w: p.width, h: p.height },
            { x: proj.x - proj.radius, y: proj.y - proj.radius, w: proj.radius * 2, h: proj.radius * 2 }
          )
        ) {
          if (p.invulnerableTimer <= 0 && !p.isDashing) {
            this.hurtPlayer(proj.damage, 'Enemy Projectile');
            this.createDeathExplosion(proj.x, proj.y, proj.color);
            this.projectiles.splice(i, 1);
            continue;
          }
        }
      } else {
        // Player projectile hitting enemy
        for (let j = 0; j < this.enemies.length; j++) {
          const enemy = this.enemies[j];
          if (
            checkAABB(
              { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h },
              { x: proj.x - proj.radius, y: proj.y - proj.radius, w: proj.radius * 2, h: proj.radius * 2 }
            ) &&
            enemy.invulnerableTimer <= 0
          ) {
            this.damageEnemy(enemy, proj.damage);
            this.createDeathExplosion(proj.x, proj.y, proj.color);
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }

      if (proj.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateItemsAndObjects(dt: number) {
    const p = this.player;
    const skinConfig = SKIN_CONFIGS[this.skin] || SKIN_CONFIGS.vibrant;
    const magnetRadius = skinConfig.capability.magnetRadius || 0;
    const crystalMultiplier = skinConfig.capability.crystalValueMultiplier || 1.0;

    // Collectibles
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (item.collected) continue;
      item.animTimer += dt;

      // GameBoy DMG-01: Coin & Gem Magnet Capability
      if (magnetRadius > 0 && (item.type === 'coin' || item.type === 'gem')) {
        const dx = p.x + p.width / 2 - (item.x + item.w / 2);
        const dy = p.y + p.height / 2 - (item.y + item.h / 2);
        const dist = Math.hypot(dx, dy);
        if (dist < magnetRadius && dist > 1) {
          item.x += (dx / dist) * 2.8;
          item.y += (dy / dist) * 2.8;
        }
      }

      if (checkAABB({ x: p.x, y: p.y, w: p.width, h: p.height }, item)) {
        item.collected = true;
        if (item.type === 'coin') {
          p.coins += 1;
          const scoreGain = Math.round(item.value * crystalMultiplier);
          p.score += scoreGain;
          soundManager.playCoin();
          this.addFloatingText(`+${scoreGain}`, item.x, item.y - 8, '#fde047');
        } else if (item.type === 'gem') {
          p.coins += 5;
          const scoreGain = Math.round(item.value * crystalMultiplier);
          p.score += scoreGain;
          soundManager.playGem();
          this.addFloatingText(`+${scoreGain} GEM!`, item.x, item.y - 8, '#67e8f9');
        } else if (item.type === 'heart') {
          p.health = Math.min(p.maxHealth, p.health + 1);
          soundManager.playGem();
          this.addFloatingText('+1 HP', item.x, item.y - 8, '#f87171');
          this.callbacks.onPlayerHurt(p.health, p.maxHealth);
        } else if (item.type === 'key') {
          p.keys += 1;
          soundManager.playCheckpoint();
          this.addFloatingText('+1 KEY!', item.x, item.y - 8, '#fbbf24');
        }
        this.callbacks.onScoreUpdate(p.score, p.coins, p.keys);
      }
    }

    // Interactive Objects
    for (let i = 0; i < this.interactiveObjs.length; i++) {
      const obj = this.interactiveObjs[i];

      if (obj.type === 'checkpoint' && !obj.state) {
        if (checkAABB({ x: p.x, y: p.y, w: p.width, h: p.height }, obj)) {
          obj.state = true;
          this.lastCheckpoint = {
            x: Math.floor(obj.x / this.level.tileSize),
            y: Math.floor(obj.y / this.level.tileSize),
          };
          soundManager.playCheckpoint();
          this.addFloatingText('CHECKPOINT!', obj.x - 10, obj.y - 12, '#38bdf8');
          this.createDustParticle(obj.x + 8, obj.y, '#38bdf8', 12);
        }
      } else if (obj.type === 'door') {
        if (!obj.state && p.keys > 0) {
          if (checkAABB({ x: p.x, y: p.y, w: p.width, h: p.height }, obj)) {
            obj.state = true;
            p.keys -= 1;
            soundManager.playCheckpoint();
            this.addFloatingText('DOOR UNLOCKED!', obj.x - 12, obj.y - 10, '#fbbf24');
            this.callbacks.onScoreUpdate(p.score, p.coins, p.keys);
          }
        }
      } else if (obj.type === 'exit') {
        if (checkAABB({ x: p.x, y: p.y, w: p.width, h: p.height }, obj)) {
          this.completeLevel();
        }
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += pt.gravity || 0.1;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= 0.6;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private updateCamera(dt: number) {
    // Smooth lerp camera to center on player
    const viewW = this.canvas.width;
    const viewH = this.canvas.height;
    const targetX = this.player.x + this.player.width / 2 - viewW / 2;
    const targetY = this.player.y + this.player.height / 2 - viewH / 2;

    const levelMaxX = this.level.width * this.level.tileSize - viewW;
    const levelMaxY = this.level.height * this.level.tileSize - viewH;

    this.camera.targetX = Math.max(0, Math.min(levelMaxX, targetX));
    this.camera.targetY = Math.max(0, Math.min(levelMaxY, targetY));

    this.camera.x += (this.camera.targetX - this.camera.x) * 0.12;
    this.camera.y += (this.camera.targetY - this.camera.y) * 0.12;

    // Screen Shake
    if (this.screenShake.timer > 0) {
      this.screenShake.timer -= dt;
    }
  }

  public triggerScreenShake(intensity: number, duration: number) {
    this.screenShake.intensity = intensity;
    this.screenShake.timer = duration;
  }

  public addFloatingText(text: string, x: number, y: number, color: string) {
    this.floatingTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      text,
      x,
      y,
      color,
      life: 0.8,
      maxLife: 0.8,
    });
  }

  public createDustParticle(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -Math.random() * 1.5,
        size: Math.floor(Math.random() * 3) + 2,
        color,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        gravity: 0.05,
      });
    }
  }

  public createDeathExplosion(x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      const speed = Math.random() * 3 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.floor(Math.random() * 4) + 2,
        color,
        life: 0.4 + Math.random() * 0.2,
        maxLife: 0.6,
        gravity: 0.08,
      });
    }
  }

  // ----------------------------------------------------
  // RENDER PIPELINE
  // ----------------------------------------------------
  public render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Background clearing & Parallax background
    this.renderParallaxBackground(ctx, w, h);

    // Apply Camera & Screen Shake
    let camX = Math.floor(this.camera.x);
    let camY = Math.floor(this.camera.y);

    if (this.screenShake.timer > 0) {
      const shakeOffset = (Math.random() - 0.5) * this.screenShake.intensity * 2;
      camX += shakeOffset;
      camY += shakeOffset;
    }

    ctx.translate(-camX, -camY);

    // Render Tilemap
    const tileSize = this.level.tileSize;
    const startCol = Math.max(0, Math.floor(camX / tileSize));
    const endCol = Math.min(this.level.width - 1, Math.ceil((camX + w) / tileSize));
    const startRow = Math.max(0, Math.floor(camY / tileSize));
    const endRow = Math.min(this.level.height - 1, Math.ceil((camY + h) / tileSize));

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.level.tiles[r][c];
        drawTile(ctx, tile, c * tileSize, r * tileSize, tileSize, this.level.biome);
      }
    }

    // Render Interactive Objects
    this.interactiveObjs.forEach((obj) => {
      if (obj.type === 'door') {
        drawDoor(ctx, obj.x, obj.y, obj.w, obj.h, obj.state);
      } else if (obj.type === 'checkpoint') {
        drawCheckpoint(ctx, obj.x, obj.y, obj.state);
      } else if (obj.type === 'exit') {
        drawExitPortal(ctx, obj.x, obj.y, obj.w, obj.h);
      }
    });

    // Render Collectible Items
    this.items.forEach((item) => {
      if (item.collected) return;
      if (item.type === 'coin') {
        drawCoin(ctx, item.x, item.y, item.w, item.animTimer);
      } else if (item.type === 'gem') {
        drawGem(ctx, item.x, item.y, item.w);
      } else if (item.type === 'heart') {
        drawHeart(ctx, item.x, item.y, item.w);
      } else if (item.type === 'key') {
        drawKey(ctx, item.x, item.y, item.w);
      }
    });

    // Render Enemies
    this.enemies.forEach((enemy) => {
      drawEnemy(ctx, enemy);
    });

    // Render Player
    drawHero(
      ctx,
      this.player.heroClass,
      this.player.x,
      this.player.y,
      this.player.facing,
      this.player.animState,
      this.player.animFrame,
      this.player.invulnerableTimer > 0,
      this.player.isDashing
    );

    // Render Projectiles
    this.projectiles.forEach((proj) => {
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render Particles
    this.particles.forEach((pt) => {
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.floor(pt.x), Math.floor(pt.y), pt.size, pt.size);
    });

    // Render Floating Text
    this.floatingTexts.forEach((ft) => {
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#000000';
      ctx.fillText(ft.text, ft.x - 1, ft.y + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    });

    ctx.restore();
  }

  private renderParallaxBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const biome = this.level.biome;

    if (biome === 'emerald') {
      // Lush sky + pixel clouds + mountains
      ctx.fillStyle = '#0c1a2e'; // Midnight blue top
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1e3a5f';
      ctx.fillRect(0, h * 0.35, w, h * 0.65);

      // Distant mountain silhouettes (moves at 0.1x speed)
      const mOffsetX = (this.camera.x * 0.1) % 120;
      ctx.fillStyle = '#0f2942';
      for (let i = -1; i < w / 120 + 2; i++) {
        const mx = i * 120 - mOffsetX;
        ctx.beginPath();
        ctx.moveTo(mx, h);
        ctx.lineTo(mx + 60, h - 80);
        ctx.lineTo(mx + 120, h);
        ctx.fill();
      }

      // Glowing Moon
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(w - 60, 45, 18, 0, Math.PI * 2);
      ctx.fill();
    } else if (biome === 'caverns') {
      // Dark cavern background
      ctx.fillStyle = '#050711';
      ctx.fillRect(0, 0, w, h);
      // Faint crystal stalactites in background
      ctx.fillStyle = '#0b1329';
      for (let x = 0; x < w; x += 40) {
        ctx.fillRect(x, 0, 14, 30);
      }
    } else if (biome === 'magma') {
      // Molten orange glow
      ctx.fillStyle = '#1c0a06';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#431407';
      ctx.fillRect(0, h * 0.5, w, h * 0.5);
      // Rising ember particles
      ctx.fillStyle = '#ea580c';
      const emberT = Date.now() / 400;
      for (let i = 0; i < 8; i++) {
        const ex = ((i * 57 + emberT * 20) % w);
        const ey = h - ((i * 33 + emberT * 40) % (h * 0.7));
        ctx.fillRect(ex, ey, 2, 2);
      }
    } else if (biome === 'frost') {
      // Frostpeak Arctic Twilight with starry skies & falling snow
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, h * 0.4, w, h * 0.6);

      // Distant Glacier Peaks
      const mOffsetX = (this.camera.x * 0.12) % 100;
      ctx.fillStyle = '#1e293b';
      for (let i = -1; i < w / 100 + 2; i++) {
        const mx = i * 100 - mOffsetX;
        ctx.beginPath();
        ctx.moveTo(mx, h);
        ctx.lineTo(mx + 50, h - 90);
        ctx.lineTo(mx + 100, h);
        ctx.fill();
      }

      // Aurora Borealis Ribbon
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.moveTo(0, 30);
      for (let x = 0; x <= w; x += 30) {
        ctx.lineTo(x, 25 + Math.sin((x + Date.now() / 200) / 40) * 12);
      }
      ctx.lineTo(w, 55);
      ctx.lineTo(0, 55);
      ctx.closePath();
      ctx.fill();

      // Falling Snow Particles
      ctx.fillStyle = '#ffffff';
      const snowT = Date.now() / 300;
      for (let i = 0; i < 16; i++) {
        const sx = ((i * 37 + snowT * 15) % w);
        const sy = ((i * 29 + snowT * 35) % h);
        ctx.fillRect(sx, sy, 2, 2);
      }
    } else {
      // Cyber Matrix Grid
      ctx.fillStyle = '#05050a';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#082f49';
      ctx.lineWidth = 1;
      const gridOffset = (this.camera.x * 0.2) % 32;
      for (let x = -gridOffset; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    }
  }
}
