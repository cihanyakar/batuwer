import { describe, expect, it } from 'vitest';
import { checkCollision, clamp, createCollectible, movePlayer } from './game-logic';
import { type Collectible, GAME_CONFIG, type PlayerState } from './types';

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'p1',
    x: 400,
    y: 300,
    color: 0xff0000,
    name: 'Test',
    score: 0,
    ...overrides,
  };
}

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('movePlayer', () => {
  it('moves player left', () => {
    const player = makePlayer({ x: 400 });
    movePlayer(player, { left: true, right: false, up: false, down: false }, 1);
    expect(player.x).toBe(400 - GAME_CONFIG.PLAYER_SPEED);
  });

  it('moves player right', () => {
    const player = makePlayer({ x: 400 });
    movePlayer(player, { left: false, right: true, up: false, down: false }, 1);
    expect(player.x).toBe(400 + GAME_CONFIG.PLAYER_SPEED);
  });

  it('moves player up', () => {
    const player = makePlayer({ y: 300 });
    movePlayer(player, { left: false, right: false, up: true, down: false }, 1);
    expect(player.y).toBe(300 - GAME_CONFIG.PLAYER_SPEED);
  });

  it('moves player down', () => {
    const player = makePlayer({ y: 300 });
    movePlayer(player, { left: false, right: false, up: false, down: true }, 1);
    expect(player.y).toBe(300 + GAME_CONFIG.PLAYER_SPEED);
  });

  it('clamps player within world bounds', () => {
    const player = makePlayer({ x: 5, y: 5 });
    movePlayer(player, { left: true, right: false, up: true, down: false }, 1);
    expect(player.x).toBe(GAME_CONFIG.PLAYER_RADIUS);
    expect(player.y).toBe(GAME_CONFIG.PLAYER_RADIUS);
  });

  it('clamps player at max bounds', () => {
    const player = makePlayer({ x: GAME_CONFIG.WORLD_WIDTH - 5, y: GAME_CONFIG.WORLD_HEIGHT - 5 });
    movePlayer(player, { left: false, right: true, up: false, down: true }, 1);
    expect(player.x).toBe(GAME_CONFIG.WORLD_WIDTH - GAME_CONFIG.PLAYER_RADIUS);
    expect(player.y).toBe(GAME_CONFIG.WORLD_HEIGHT - GAME_CONFIG.PLAYER_RADIUS);
  });

  it('does not move when no input', () => {
    const player = makePlayer({ x: 400, y: 300 });
    movePlayer(player, { left: false, right: false, up: false, down: false }, 1);
    expect(player.x).toBe(400);
    expect(player.y).toBe(300);
  });

  it('applies delta correctly', () => {
    const player = makePlayer({ x: 400 });
    movePlayer(player, { left: false, right: true, up: false, down: false }, 0.5);
    expect(player.x).toBe(400 + GAME_CONFIG.PLAYER_SPEED * 0.5);
  });
});

describe('checkCollision', () => {
  it('detects collision when overlapping', () => {
    const player = makePlayer({ x: 100, y: 100 });
    const collectible: Collectible = { id: 'c1', x: 110, y: 100, value: 1 };
    expect(checkCollision(player, collectible)).toBe(true);
  });

  it('returns false when far apart', () => {
    const player = makePlayer({ x: 100, y: 100 });
    const collectible: Collectible = { id: 'c1', x: 500, y: 500, value: 1 };
    expect(checkCollision(player, collectible)).toBe(false);
  });

  it('detects collision at exact boundary', () => {
    const player = makePlayer({ x: 100, y: 100 });
    const dist = GAME_CONFIG.PLAYER_RADIUS + GAME_CONFIG.COLLECTIBLE_RADIUS - 1;
    const collectible: Collectible = { id: 'c1', x: 100 + dist, y: 100, value: 1 };
    expect(checkCollision(player, collectible)).toBe(true);
  });

  it('returns false at just outside boundary', () => {
    const player = makePlayer({ x: 100, y: 100 });
    const dist = GAME_CONFIG.PLAYER_RADIUS + GAME_CONFIG.COLLECTIBLE_RADIUS + 1;
    const collectible: Collectible = { id: 'c1', x: 100 + dist, y: 100, value: 1 };
    expect(checkCollision(player, collectible)).toBe(false);
  });
});

describe('createCollectible', () => {
  it('creates a collectible with unique id', () => {
    const existing = new Set<string>();
    const c = createCollectible(existing);
    expect(c.id).toBeDefined();
    expect(c.id.startsWith('c_')).toBe(true);
  });

  it('creates collectible within world bounds', () => {
    const c = createCollectible(new Set());
    expect(c.x).toBeGreaterThanOrEqual(GAME_CONFIG.COLLECTIBLE_RADIUS);
    expect(c.x).toBeLessThanOrEqual(GAME_CONFIG.WORLD_WIDTH - GAME_CONFIG.COLLECTIBLE_RADIUS);
    expect(c.y).toBeGreaterThanOrEqual(GAME_CONFIG.COLLECTIBLE_RADIUS);
    expect(c.y).toBeLessThanOrEqual(GAME_CONFIG.WORLD_HEIGHT - GAME_CONFIG.COLLECTIBLE_RADIUS);
  });

  it('assigns value between 1 and 3', () => {
    for (let i = 0; i < 20; i++) {
      const c = createCollectible(new Set());
      expect(c.value).toBeGreaterThanOrEqual(1);
      expect(c.value).toBeLessThanOrEqual(3);
    }
  });
});
