import { Rect, TileType } from '../types';

export function checkAABB(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function pointInRect(px: number, py: number, r: Rect): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export interface CollisionResult {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  isOnCeiling: boolean;
  isOnLeftWall: boolean;
  isOnRightWall: boolean;
  hitHazard: boolean;
  hitSpring: boolean;
}

export function resolveTileCollisions(
  entity: Rect & { vx: number; vy: number },
  tiles: string[][],
  tileSize: number,
  isDroppingDown: boolean = false
): CollisionResult {
  let { x, y, vx, vy, w, h } = entity;
  let isGrounded = false;
  let isOnCeiling = false;
  let isOnLeftWall = false;
  let isOnRightWall = false;
  let hitHazard = false;
  let hitSpring = false;

  const rows = tiles.length;
  const cols = tiles[0].length;

  // 1. Move horizontally & resolve X collisions
  x += vx;

  let minTileX = Math.max(0, Math.floor(x / tileSize));
  let maxTileX = Math.min(cols - 1, Math.floor((x + w - 0.01) / tileSize));
  let minTileY = Math.max(0, Math.floor(y / tileSize));
  let maxTileY = Math.min(rows - 1, Math.floor((y + h - 0.01) / tileSize));

  for (let ty = minTileY; ty <= maxTileY; ty++) {
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      const tile = tiles[ty][tx];
      if (tile === 'solid' || tile === 'breakable') {
        if (vx > 0) {
          x = tx * tileSize - w;
          vx = 0;
          isOnRightWall = true;
        } else if (vx < 0) {
          x = (tx + 1) * tileSize;
          vx = 0;
          isOnLeftWall = true;
        }
      }
    }
  }

  // 2. Move vertically & resolve Y collisions
  y += vy;

  minTileX = Math.max(0, Math.floor(x / tileSize));
  maxTileX = Math.min(cols - 1, Math.floor((x + w - 0.01) / tileSize));
  minTileY = Math.max(0, Math.floor(y / tileSize));
  maxTileY = Math.min(rows - 1, Math.floor((y + h - 0.01) / tileSize));

  for (let ty = minTileY; ty <= maxTileY; ty++) {
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      const tile = tiles[ty][tx];

      if (tile === 'solid' || tile === 'breakable') {
        if (vy > 0) {
          y = ty * tileSize - h;
          vy = 0;
          isGrounded = true;
        } else if (vy < 0) {
          y = (ty + 1) * tileSize;
          vy = 0;
          isOnCeiling = true;
        }
      } else if (tile === 'solid_top' && !isDroppingDown) {
        // One-way platform only collides when falling from above and previously above the top edge
        const platTop = ty * tileSize;
        const prevBottom = entity.y + h;
        if (vy >= 0 && prevBottom <= platTop + 4 && y + h >= platTop) {
          y = platTop - h;
          vy = 0;
          isGrounded = true;
        }
      } else if (tile.startsWith('spike') || tile === 'lava') {
        // Check inner hitbox for hazard
        const hazardRect = { x: tx * tileSize + 2, y: ty * tileSize + 2, w: tileSize - 4, h: tileSize - 4 };
        if (checkAABB({ x, y, w, h }, hazardRect)) {
          hitHazard = true;
        }
      } else if (tile === 'spring') {
        const springRect = { x: tx * tileSize, y: ty * tileSize + 4, w: tileSize, h: tileSize - 4 };
        if (checkAABB({ x, y, w, h }, springRect) && vy >= 0) {
          hitSpring = true;
        }
      }
    }
  }

  return {
    x,
    y,
    vx,
    vy,
    isGrounded,
    isOnCeiling,
    isOnLeftWall,
    isOnRightWall,
    hitHazard,
    hitSpring,
  };
}
