import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, LobbyId, ServerToClientEvents } from '../shared/types';
import { LobbyManager } from './lobby-manager';

const PORT = 3000;

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*' },
});

const lobbyManager = new LobbyManager();

function lobbyRoom(lobbyId: LobbyId): string {
  return `lobby:${lobbyId}`;
}

io.on('connection', (socket) => {
  console.warn(`Connected: ${socket.id}`);

  socket.on('lobby:list-request', () => {
    socket.emit('lobby:list', lobbyManager.getLobbies());
  });

  socket.on('lobby:create', (lobbyName: string, playerName: string) => {
    const result = lobbyManager.createLobby(socket.id, playerName, lobbyName);
    if ('error' in result) {
      socket.emit('error', result.error);
      return;
    }
    void socket.join(lobbyRoom(result.id));
    socket.emit('lobby:state', result);
  });

  socket.on('lobby:join', (lobbyId: string, playerName: string) => {
    const result = lobbyManager.joinLobby(lobbyId, socket.id, playerName);
    if ('error' in result) {
      socket.emit('error', result.error);
      return;
    }
    void socket.join(lobbyRoom(lobbyId));
    socket.emit('lobby:state', result.state);
    const { player } = result.state.slots[result.slotIndex];
    if (player !== null) {
      socket.to(lobbyRoom(lobbyId)).emit('lobby:player-joined', result.slotIndex, player);
    }
  });

  socket.on('lobby:leave', () => {
    handleLeave();
  });

  socket.on('lobby:toggle-ready', () => {
    const result = lobbyManager.handleToggleReady(socket.id);
    if ('error' in result) {
      socket.emit('error', result.error);
      return;
    }
    io.to(lobbyRoom(result.lobbyId)).emit('lobby:ready-changed', result.slotIndex, result.ready);
  });

  socket.on('lobby:select-map', (mapId: string) => {
    const result = lobbyManager.handleSelectMap(socket.id, mapId);
    if ('error' in result) {
      socket.emit('error', result.error);
      return;
    }
    io.to(lobbyRoom(result.lobbyId)).emit('lobby:map-changed', mapId);
  });

  socket.on('lobby:start-game', () => {
    const result = lobbyManager.handleStartGame(socket.id);
    if ('error' in result) {
      socket.emit('error', result.error);
      return;
    }
    io.to(lobbyRoom(result.lobbyId)).emit('lobby:game-starting');
    io.to(lobbyRoom(result.lobbyId)).emit('game:started', result.mapId, result.players);
  });

  socket.on('lobby:kick', (_playerId: string) => {
    // Future: kick player implementation
  });

  socket.on('disconnect', () => {
    console.warn(`Disconnected: ${socket.id}`);
    handleLeave();
  });

  function handleLeave(): void {
    const lobbyId = lobbyManager.getPlayerLobbyId(socket.id);
    if (lobbyId === undefined) {
      return;
    }
    const result = lobbyManager.leaveLobby(socket.id);
    if ('error' in result) {
      return;
    }
    void socket.leave(lobbyRoom(lobbyId));
    io.to(lobbyRoom(lobbyId)).emit('lobby:player-left', result.removedSlot, socket.id);
    if (result.newHostId !== null) {
      io.to(lobbyRoom(lobbyId)).emit('lobby:host-changed', result.newHostId);
    }
  }
});

function broadcastLobbyList(): void {
  io.emit('lobby:list', lobbyManager.getLobbies());
}

lobbyManager.on('lobby:created', broadcastLobbyList);
lobbyManager.on('lobby:removed', broadcastLobbyList);
lobbyManager.on('lobby:updated', broadcastLobbyList);

httpServer.listen(PORT, () => {
  console.warn(`Server running on http://localhost:${String(PORT)}`);
});
