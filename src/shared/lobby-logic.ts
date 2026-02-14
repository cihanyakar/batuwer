import { ALL_MAPS } from './maps';
import type {
  LobbyId,
  LobbySlots,
  LobbyState,
  PlayerId,
  PlayerInfo,
} from './types';

export function createLobbyState(
  lobbyId: LobbyId,
  lobbyName: string,
  host: PlayerInfo,
): LobbyState {
  const slots: LobbySlots = [
    { player: host, ready: false },
    { player: null, ready: false },
    { player: null, ready: false },
    { player: null, ready: false },
  ];
  return {
    id: lobbyId,
    name: lobbyName,
    hostId: host.id,
    selectedMapId: ALL_MAPS[0].id,
    status: 'waiting',
    slots,
  };
}

export function findEmptySlot(state: LobbyState): number {
  return state.slots.findIndex((s) => s.player === null);
}

export function addPlayerToLobby(
  state: LobbyState,
  player: PlayerInfo,
): { slotIndex: number } | { error: string } {
  if (state.status !== 'waiting') {
    return { error: 'Lobby is not accepting players' };
  }
  if (state.slots.some((s) => s.player?.id === player.id)) {
    return { error: 'Player already in lobby' };
  }
  const slotIndex = findEmptySlot(state);
  if (slotIndex === -1) {
    return { error: 'Lobby is full' };
  }
  state.slots[slotIndex] = { player: { ...player, slot: slotIndex }, ready: false };
  return { slotIndex };
}

export function removePlayerFromLobby(
  state: LobbyState,
  playerId: PlayerId,
): { removedSlot: number; newHostId: PlayerId | null } | { error: string } {
  const slotIndex = state.slots.findIndex((s) => s.player?.id === playerId);
  if (slotIndex === -1) {
    return { error: 'Player not in lobby' };
  }
  state.slots[slotIndex] = { player: null, ready: false };

  let newHostId: PlayerId | null = null;
  if (state.hostId === playerId) {
    const nextOccupied = state.slots.find((s) => s.player !== null);
    if (nextOccupied?.player !== undefined && nextOccupied.player !== null) {
      state.hostId = nextOccupied.player.id;
      newHostId = nextOccupied.player.id;
    } else {
      newHostId = null;
    }
  }

  return { removedSlot: slotIndex, newHostId };
}

export function toggleReady(
  state: LobbyState,
  playerId: PlayerId,
): { slotIndex: number; ready: boolean } | { error: string } {
  const slotIndex = state.slots.findIndex((s) => s.player?.id === playerId);
  if (slotIndex === -1) {
    return { error: 'Player not in lobby' };
  }
  if (playerId === state.hostId) {
    return { error: 'Host does not need to ready up' };
  }
  state.slots[slotIndex].ready = !state.slots[slotIndex].ready;
  return { slotIndex, ready: state.slots[slotIndex].ready };
}

export function canStartGame(
  state: LobbyState,
  requesterId: PlayerId,
): { ok: true } | { error: string } {
  if (requesterId !== state.hostId) {
    return { error: 'Only host can start the game' };
  }
  if (state.status !== 'waiting') {
    return { error: 'Game already starting or in progress' };
  }
  const occupiedSlots = state.slots.filter((s) => s.player !== null);
  if (occupiedSlots.length < 1) {
    return { error: 'Not enough players' };
  }
  const nonHostSlots = occupiedSlots.filter((s) => s.player?.id !== state.hostId);
  const allReady = nonHostSlots.every((s) => s.ready);
  if (!allReady) {
    return { error: 'Not all players are ready' };
  }
  return { ok: true };
}

export function selectMap(
  state: LobbyState,
  requesterId: PlayerId,
  mapId: string,
): { ok: true } | { error: string } {
  if (requesterId !== state.hostId) {
    return { error: 'Only host can select map' };
  }
  if (!ALL_MAPS.some((m) => m.id === mapId)) {
    return { error: 'Invalid map id' };
  }
  state.selectedMapId = mapId;
  return { ok: true };
}

export function getPlayerCount(state: LobbyState): number {
  return state.slots.filter((s) => s.player !== null).length;
}

export function isLobbyEmpty(state: LobbyState): boolean {
  return state.slots.every((s) => s.player === null);
}

export function getPlayersInLobby(state: LobbyState): PlayerInfo[] {
  return state.slots
    .filter((s): s is { player: PlayerInfo; ready: boolean } => s.player !== null)
    .map((s) => s.player);
}
