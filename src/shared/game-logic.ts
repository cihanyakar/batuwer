import { type Collectible, GAME_CONFIG, type PlayerInput, type PlayerState } from './types';

export function movePlayer(player: PlayerState, input: PlayerInput, delta: number): void {
  const speed = GAME_CONFIG.PLAYER_SPEED * delta;

  if (input.left) {
    player.x -= speed;
  }
  if (input.right) {
    player.x += speed;
  }
  if (input.up) {
    player.y -= speed;
  }
  if (input.down) {
    player.y += speed;
  }

  player.x = clamp(player.x, GAME_CONFIG.PLAYER_RADIUS, GAME_CONFIG.WORLD_WIDTH - GAME_CONFIG.PLAYER_RADIUS);
  player.y = clamp(player.y, GAME_CONFIG.PLAYER_RADIUS, GAME_CONFIG.WORLD_HEIGHT - GAME_CONFIG.PLAYER_RADIUS);
}

export function checkCollision(player: PlayerState, collectible: Collectible): boolean {
  const dx = player.x - collectible.x;
  const dy = player.y - collectible.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < GAME_CONFIG.PLAYER_RADIUS + GAME_CONFIG.COLLECTIBLE_RADIUS;
}

export function createCollectible(existingIds: Set<string>): Collectible {
  let id: string;
  do {
    id = `c_${String(Date.now())}_${Math.random().toString(36).slice(2, 6)}`;
  } while (existingIds.has(id));

  return {
    id,
    x: randomRange(GAME_CONFIG.COLLECTIBLE_RADIUS, GAME_CONFIG.WORLD_WIDTH - GAME_CONFIG.COLLECTIBLE_RADIUS),
    y: randomRange(GAME_CONFIG.COLLECTIBLE_RADIUS, GAME_CONFIG.WORLD_HEIGHT - GAME_CONFIG.COLLECTIBLE_RADIUS),
    value: Math.floor(Math.random() * 3) + 1,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
