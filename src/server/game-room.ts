import { EventEmitter } from 'node:events';
import { type Collectible, GAME_CONFIG, type GameState, type PlayerInput, type PlayerState } from '../shared/types';
import { checkCollision, createCollectible, movePlayer } from '../shared/game-logic';

export class GameRoom extends EventEmitter {
  private players = new Map<string, PlayerState>();
  private inputs = new Map<string, PlayerInput>();
  private collectibles = new Map<string, Collectible>();
  private colorIndex = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastTick = Date.now();

  addPlayer(id: string, name: string): PlayerState {
    const player: PlayerState = {
      id,
      name: name !== '' ? name : `Player ${String(this.players.size + 1)}`,
      x: Math.random() * (GAME_CONFIG.WORLD_WIDTH - 100) + 50,
      y: Math.random() * (GAME_CONFIG.WORLD_HEIGHT - 100) + 50,
      color: GAME_CONFIG.PLAYER_COLORS[this.colorIndex % GAME_CONFIG.PLAYER_COLORS.length],
      score: 0,
    };
    this.colorIndex++;
    this.players.set(id, player);
    this.inputs.set(id, { left: false, right: false, up: false, down: false });
    return player;
  }

  removePlayer(id: string): void {
    this.players.delete(id);
    this.inputs.delete(id);
  }

  setPlayerInput(id: string, input: PlayerInput): void {
    if (this.players.has(id)) {
      this.inputs.set(id, input);
    }
  }

  getState(): GameState {
    return {
      players: Object.fromEntries(this.players),
      collectibles: [...this.collectibles.values()],
    };
  }

  start(): void {
    this.spawnInitialCollectibles();
    const tickInterval = 1000 / GAME_CONFIG.TICK_RATE;
    this.lastTick = Date.now();
    this.intervalId = setInterval(() => {
      this.tick();
    }, tickInterval);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    const now = Date.now();
    const delta = (now - this.lastTick) / 1000;
    this.lastTick = now;

    for (const [id, player] of this.players) {
      const input = this.inputs.get(id);
      if (!input) {
        continue;
      }

      const prevX = player.x;
      const prevY = player.y;
      movePlayer(player, input, delta);

      if (player.x !== prevX || player.y !== prevY) {
        this.emit('player:moved', { id: player.id, x: player.x, y: player.y });
      }

      for (const [cId, collectible] of this.collectibles) {
        if (checkCollision(player, collectible)) {
          player.score += collectible.value;
          this.collectibles.delete(cId);
          this.emit('collectible:collected', cId);
          this.emit('player:scored', { id: player.id, score: player.score });
          this.trySpawnCollectible();
        }
      }
    }
  }

  private spawnInitialCollectibles(): void {
    const ids = new Set(this.collectibles.keys());
    for (let i = 0; i < GAME_CONFIG.MAX_COLLECTIBLES; i++) {
      const c = createCollectible(ids);
      ids.add(c.id);
      this.collectibles.set(c.id, c);
    }
  }

  private trySpawnCollectible(): void {
    if (this.collectibles.size < GAME_CONFIG.MAX_COLLECTIBLES) {
      const c = createCollectible(new Set(this.collectibles.keys()));
      this.collectibles.set(c.id, c);
      this.emit('collectible:spawned', c);
    }
  }
}
