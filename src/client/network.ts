import { type Socket, io } from 'socket.io-client';
import type { ClientToServerEvents, PlayerInput, ServerToClientEvents } from '../shared/types';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;

export function connect(): GameSocket {
  if (socket?.connected === true) {
    return socket;
  }

  socket = io(window.location.origin, {
    transports: ['websocket'],
  }) as GameSocket;

  return socket;
}

export function getSocket(): GameSocket {
  if (socket === null) {
    throw new Error('Socket not connected');
  }
  return socket;
}

export function joinGame(name: string): void {
  getSocket().emit('player:join', name);
}

export function sendInput(input: PlayerInput): void {
  getSocket().emit('player:input', input);
}
