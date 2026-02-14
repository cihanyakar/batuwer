import { type Socket, io } from 'socket.io-client';
import type { ClientToServerEvents, LobbyId, PlayerId, ServerToClientEvents } from '../shared/types';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;

export function connect(): GameSocket {
  if (socket?.connected === true) {
    return socket;
  }
  socket = io(window.location.origin, { transports: ['websocket'] }) as GameSocket;
  return socket;
}

export function disconnect(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): GameSocket {
  if (socket === null) {
    throw new Error('Socket not connected');
  }
  return socket;
}

export function isConnected(): boolean {
  return socket?.connected === true;
}

export function requestLobbyList(): void {
  getSocket().emit('lobby:list-request');
}

export function createLobby(lobbyName: string, playerName: string): void {
  getSocket().emit('lobby:create', lobbyName, playerName);
}

export function joinLobby(lobbyId: LobbyId, playerName: string): void {
  getSocket().emit('lobby:join', lobbyId, playerName);
}

export function leaveLobby(): void {
  getSocket().emit('lobby:leave');
}

export function toggleReady(): void {
  getSocket().emit('lobby:toggle-ready');
}

export function selectMap(mapId: string): void {
  getSocket().emit('lobby:select-map', mapId);
}

export function requestStartGame(): void {
  getSocket().emit('lobby:start-game');
}

export function kickPlayer(playerId: PlayerId): void {
  getSocket().emit('lobby:kick', playerId);
}
