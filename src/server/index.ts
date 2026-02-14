import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, Collectible, PlayerState, ServerToClientEvents } from '../shared/types';
import { GameRoom } from './game-room';

const PORT = 3000;

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*' },
});

const gameRoom = new GameRoom();
gameRoom.start();

io.on('connection', (socket) => {
  console.warn(`Player connected: ${socket.id}`);

  socket.on('player:join', (name: string) => {
    const player = gameRoom.addPlayer(socket.id, name);
    socket.emit('game:state', gameRoom.getState());
    socket.broadcast.emit('player:joined', player);
  });

  socket.on('player:input', (input) => {
    gameRoom.setPlayerInput(socket.id, input);
  });

  socket.on('disconnect', () => {
    console.warn(`Player disconnected: ${socket.id}`);
    gameRoom.removePlayer(socket.id);
    io.emit('player:left', socket.id);
  });
});

gameRoom.on('player:moved', (data: Pick<PlayerState, 'id' | 'x' | 'y'>) => {
  io.emit('player:moved', data);
});

gameRoom.on('player:scored', (data: Pick<PlayerState, 'id' | 'score'>) => {
  io.emit('player:scored', data);
});

gameRoom.on('collectible:spawned', (data: Collectible) => {
  io.emit('collectible:spawned', data);
});

gameRoom.on('collectible:collected', (data: string) => {
  io.emit('collectible:collected', data);
});

httpServer.listen(PORT, () => {
  console.warn(`Game server running on http://localhost:${String(PORT)}`);
});
