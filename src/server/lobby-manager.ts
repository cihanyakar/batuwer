import { EventEmitter } from 'node:events';
import {
  addPlayerToLobby,
  canStartGame,
  createLobbyState,
  getPlayerCount,
  getPlayersInLobby,
  isLobbyEmpty,
  removePlayerFromLobby,
  selectMap,
  toggleReady,
} from '../shared/lobby-logic';
import { GAME_CONFIG, type LobbyId, type LobbyListEntry, type LobbyState, type PlayerId, type PlayerInfo } from '../shared/types';
import { generateId } from '../shared/utils';

const ERR_ALREADY_IN_LOBBY = 'Player already in a lobby';
const ERR_NOT_IN_LOBBY = 'Player not in a lobby';
const ERR_LOBBY_NOT_FOUND = 'Lobby not found';

export class LobbyManager extends EventEmitter {
  private lobbies = new Map<LobbyId, LobbyState>();
  private playerToLobby = new Map<PlayerId, LobbyId>();

  createLobby(playerId: PlayerId, playerName: string, lobbyName: string): LobbyState | { error: string } {
    if (this.playerToLobby.has(playerId)) {
      return { error: ERR_ALREADY_IN_LOBBY };
    }

    const lobbyId = generateId('lobby');
    const colorIndex = 0;
    const host: PlayerInfo = {
      id: playerId,
      name: playerName,
      color: GAME_CONFIG.PLAYER_COLORS[colorIndex],
      slot: 0,
    };

    const state = createLobbyState(lobbyId, lobbyName, host);
    this.lobbies.set(lobbyId, state);
    this.playerToLobby.set(playerId, lobbyId);

    this.emit('lobby:created', this.toLobbyListEntry(state));
    return state;
  }

  joinLobby(
    lobbyId: LobbyId,
    playerId: PlayerId,
    playerName: string,
  ): { state: LobbyState; slotIndex: number } | { error: string } {
    if (this.playerToLobby.has(playerId)) {
      return { error: ERR_ALREADY_IN_LOBBY };
    }

    const state = this.lobbies.get(lobbyId);
    if (state === undefined) {
      return { error: ERR_LOBBY_NOT_FOUND };
    }

    const colorIndex = state.slots.filter((s) => s.player !== null).length;
    const player: PlayerInfo = {
      id: playerId,
      name: playerName,
      color: GAME_CONFIG.PLAYER_COLORS[colorIndex % GAME_CONFIG.PLAYER_COLORS.length],
      slot: 0,
    };

    const result = addPlayerToLobby(state, player);
    if ('error' in result) {
      return result;
    }

    this.playerToLobby.set(playerId, lobbyId);
    this.emit('lobby:player-joined', lobbyId, result.slotIndex, state.slots[result.slotIndex].player);
    this.emitLobbyUpdated(state);
    return { state, slotIndex: result.slotIndex };
  }

  leaveLobby(playerId: PlayerId): { lobbyId: LobbyId; removedSlot: number; newHostId: PlayerId | null } | { error: string } {
    const lobbyId = this.playerToLobby.get(playerId);
    if (lobbyId === undefined) {
      return { error: ERR_NOT_IN_LOBBY };
    }

    const state = this.lobbies.get(lobbyId);
    if (state === undefined) {
      return { error: ERR_LOBBY_NOT_FOUND };
    }

    const result = removePlayerFromLobby(state, playerId);
    if ('error' in result) {
      return result;
    }

    this.playerToLobby.delete(playerId);

    if (isLobbyEmpty(state)) {
      this.lobbies.delete(lobbyId);
      this.emit('lobby:removed', lobbyId);
    } else {
      if (result.newHostId !== null) {
        this.emit('lobby:host-changed', lobbyId, result.newHostId);
      }
      this.emit('lobby:player-left', lobbyId, result.removedSlot, playerId);
      this.emitLobbyUpdated(state);
    }

    return { lobbyId, ...result };
  }

  handleToggleReady(playerId: PlayerId): { lobbyId: LobbyId; slotIndex: number; ready: boolean } | { error: string } {
    const lobbyId = this.playerToLobby.get(playerId);
    if (lobbyId === undefined) {
      return { error: ERR_NOT_IN_LOBBY };
    }

    const state = this.lobbies.get(lobbyId);
    if (state === undefined) {
      return { error: ERR_LOBBY_NOT_FOUND };
    }

    const result = toggleReady(state, playerId);
    if ('error' in result) {
      return result;
    }

    this.emit('lobby:ready-changed', lobbyId, result.slotIndex, result.ready);
    return { lobbyId, ...result };
  }

  handleSelectMap(playerId: PlayerId, mapId: string): { lobbyId: LobbyId } | { error: string } {
    const lobbyId = this.playerToLobby.get(playerId);
    if (lobbyId === undefined) {
      return { error: ERR_NOT_IN_LOBBY };
    }

    const state = this.lobbies.get(lobbyId);
    if (state === undefined) {
      return { error: ERR_LOBBY_NOT_FOUND };
    }

    const result = selectMap(state, playerId, mapId);
    if ('error' in result) {
      return result;
    }

    this.emit('lobby:map-changed', lobbyId, mapId);
    this.emitLobbyUpdated(state);
    return { lobbyId };
  }

  handleStartGame(playerId: PlayerId): { lobbyId: LobbyId; mapId: string; players: PlayerInfo[] } | { error: string } {
    const lobbyId = this.playerToLobby.get(playerId);
    if (lobbyId === undefined) {
      return { error: ERR_NOT_IN_LOBBY };
    }

    const state = this.lobbies.get(lobbyId);
    if (state === undefined) {
      return { error: ERR_LOBBY_NOT_FOUND };
    }

    const result = canStartGame(state, playerId);
    if ('error' in result) {
      return result;
    }

    state.status = 'in_game';
    const players = getPlayersInLobby(state);

    this.emit('lobby:game-starting', lobbyId, state.selectedMapId, players);
    this.emitLobbyUpdated(state);

    return { lobbyId, mapId: state.selectedMapId, players };
  }

  getLobbies(): LobbyListEntry[] {
    return [...this.lobbies.values()].map((s) => this.toLobbyListEntry(s));
  }

  getLobbyForPlayer(playerId: PlayerId): LobbyState | undefined {
    const lobbyId = this.playerToLobby.get(playerId);
    if (lobbyId === undefined) {
      return undefined;
    }
    return this.lobbies.get(lobbyId);
  }

  getPlayerLobbyId(playerId: PlayerId): LobbyId | undefined {
    return this.playerToLobby.get(playerId);
  }

  private emitLobbyUpdated(state: LobbyState): void {
    this.emit('lobby:updated', this.toLobbyListEntry(state));
  }

  private toLobbyListEntry(state: LobbyState): LobbyListEntry {
    const host = state.slots.find((s) => s.player?.id === state.hostId);
    return {
      id: state.id,
      name: state.name,
      hostName: host?.player?.name ?? 'Unknown',
      playerCount: getPlayerCount(state),
      maxPlayers: GAME_CONFIG.MAX_PLAYERS_PER_LOBBY,
      selectedMapId: state.selectedMapId,
      status: state.status,
    };
  }
}
