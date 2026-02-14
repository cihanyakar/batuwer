// ── Identifiers ─────────────────────────────────────────
export type PlayerId = string;
export type LobbyId = string;

// ── Game Configuration ──────────────────────────────────
export const GAME_CONFIG = {
  MAX_PLAYERS_PER_LOBBY: 4,
  PLAYER_NAME_MAX_LENGTH: 16,
  LOBBY_NAME_MAX_LENGTH: 24,
  WORLD_WIDTH: 1200,
  WORLD_HEIGHT: 800,
  PLAYER_COLORS: [0xff4444, 0x44ff44, 0x4444ff, 0xffff44] as readonly number[],
  TICK_RATE: 60,
} as const;

// ── Geometry ────────────────────────────────────────────
export interface Vec2 {
  x: number;
  y: number;
}

// ── Map Types ───────────────────────────────────────────
export interface MapPath {
  waypoints: Vec2[];
}

export interface TowerSlot {
  id: string;
  position: Vec2;
}

export interface SpawnPoint {
  id: string;
  position: Vec2;
  pathIndex: number;
}

export interface MapDefinition {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  paths: MapPath[];
  towerSlots: TowerSlot[];
  spawnPoints: SpawnPoint[];
  endPoint: Vec2;
  previewColor: number;
}

// ── Player ──────────────────────────────────────────────
export interface PlayerInfo {
  id: PlayerId;
  name: string;
  color: number;
  slot: number;
}

// ── Lobby ───────────────────────────────────────────────
export type LobbyStatus = 'waiting' | 'countdown' | 'in_game';

export interface LobbySlot {
  player: PlayerInfo | null;
  ready: boolean;
}

export type LobbySlots = [LobbySlot, LobbySlot, LobbySlot, LobbySlot];

export interface LobbyState {
  id: LobbyId;
  name: string;
  hostId: PlayerId;
  selectedMapId: string;
  status: LobbyStatus;
  slots: LobbySlots;
}

export interface LobbyListEntry {
  id: LobbyId;
  name: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  selectedMapId: string;
  status: LobbyStatus;
}

// ── Settings ────────────────────────────────────────────
export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  playerName: string;
}

export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 70,
  sfxVolume: 80,
  playerName: 'Player',
};

// ── Socket Events ───────────────────────────────────────
export interface ServerToClientEvents {
  'lobby:list': (lobbies: LobbyListEntry[]) => void;
  'lobby:created': (lobby: LobbyListEntry) => void;
  'lobby:removed': (lobbyId: LobbyId) => void;
  'lobby:updated': (lobby: LobbyListEntry) => void;

  'lobby:state': (state: LobbyState) => void;
  'lobby:player-joined': (slot: number, player: PlayerInfo) => void;
  'lobby:player-left': (slot: number, playerId: PlayerId) => void;
  'lobby:ready-changed': (slot: number, ready: boolean) => void;
  'lobby:map-changed': (mapId: string) => void;
  'lobby:host-changed': (newHostId: PlayerId) => void;
  'lobby:countdown': (seconds: number) => void;
  'lobby:game-starting': () => void;

  'game:started': (mapId: string, players: PlayerInfo[]) => void;

  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'lobby:list-request': () => void;
  'lobby:create': (lobbyName: string, playerName: string) => void;
  'lobby:join': (lobbyId: LobbyId, playerName: string) => void;
  'lobby:leave': () => void;

  'lobby:toggle-ready': () => void;
  'lobby:select-map': (mapId: string) => void;
  'lobby:start-game': () => void;
  'lobby:kick': (playerId: PlayerId) => void;
}
