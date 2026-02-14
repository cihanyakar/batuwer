export interface PlayerState {
  id: string;
  x: number;
  y: number;
  color: number;
  name: string;
  score: number;
}

export interface GameState {
  players: Record<string, PlayerState>;
  collectibles: Collectible[];
}

export interface Collectible {
  id: string;
  x: number;
  y: number;
  value: number;
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export interface ServerToClientEvents {
  'game:state': (state: GameState) => void;
  'player:joined': (player: PlayerState) => void;
  'player:left': (playerId: string) => void;
  'player:moved': (player: Pick<PlayerState, 'id' | 'x' | 'y'>) => void;
  'player:scored': (player: Pick<PlayerState, 'id' | 'score'>) => void;
  'collectible:spawned': (collectible: Collectible) => void;
  'collectible:collected': (collectibleId: string) => void;
}

export interface ClientToServerEvents {
  'player:join': (name: string) => void;
  'player:input': (input: PlayerInput) => void;
}

export const GAME_CONFIG = {
  WORLD_WIDTH: 1200,
  WORLD_HEIGHT: 800,
  PLAYER_SPEED: 200,
  PLAYER_RADIUS: 20,
  COLLECTIBLE_RADIUS: 10,
  MAX_COLLECTIBLES: 10,
  TICK_RATE: 60,
  PLAYER_COLORS: [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff, 0xff8844, 0x8844ff],
} as const;
