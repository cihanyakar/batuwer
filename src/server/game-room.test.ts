import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../shared/types';
import { GameRoom } from './game-room';

describe('GameRoom', () => {
  let room: GameRoom;

  beforeEach(() => {
    room = new GameRoom();
  });

  afterEach(() => {
    room.stop();
  });

  describe('addPlayer', () => {
    it('adds a player with given id and name', () => {
      const player = room.addPlayer('socket1', 'Alice');
      expect(player.id).toBe('socket1');
      expect(player.name).toBe('Alice');
      expect(player.score).toBe(0);
    });

    it('assigns position within world bounds', () => {
      const player = room.addPlayer('socket1', 'Alice');
      expect(player.x).toBeGreaterThan(0);
      expect(player.x).toBeLessThan(GAME_CONFIG.WORLD_WIDTH);
      expect(player.y).toBeGreaterThan(0);
      expect(player.y).toBeLessThan(GAME_CONFIG.WORLD_HEIGHT);
    });

    it('assigns different colors to different players', () => {
      const p1 = room.addPlayer('s1', 'A');
      const p2 = room.addPlayer('s2', 'B');
      expect(p1.color).not.toBe(p2.color);
    });

    it('uses default name when empty string provided', () => {
      const player = room.addPlayer('socket1', '');
      expect(player.name).toContain('Player');
    });
  });

  describe('removePlayer', () => {
    it('removes a player from the game', () => {
      room.addPlayer('socket1', 'Alice');
      room.removePlayer('socket1');
      const state = room.getState();
      expect(state.players.socket1).toBeUndefined();
    });

    it('handles removing non-existent player gracefully', () => {
      expect(() => {
        room.removePlayer('nonexistent');
      }).not.toThrow();
    });
  });

  describe('getState', () => {
    it('returns current game state with players and collectibles', () => {
      room.addPlayer('s1', 'A');
      room.start();
      const state = room.getState();
      expect(state.players).toBeDefined();
      expect(state.collectibles).toBeDefined();
      expect(Object.keys(state.players)).toHaveLength(1);
      expect(state.collectibles).toHaveLength(GAME_CONFIG.MAX_COLLECTIBLES);
    });

    it('returns empty state when no players', () => {
      const state = room.getState();
      expect(Object.keys(state.players)).toHaveLength(0);
    });
  });

  describe('setPlayerInput', () => {
    it('accepts input for existing player', () => {
      room.addPlayer('s1', 'A');
      expect(() => {
        room.setPlayerInput('s1', { left: true, right: false, up: false, down: false });
      }).not.toThrow();
    });

    it('ignores input for non-existent player', () => {
      expect(() => {
        room.setPlayerInput('nonexistent', { left: true, right: false, up: false, down: false });
      }).not.toThrow();
    });
  });

  describe('start/stop', () => {
    it('starts and stops without error', () => {
      expect(() => {
        room.start();
        room.stop();
      }).not.toThrow();
    });

    it('spawns collectibles on start', () => {
      room.start();
      const state = room.getState();
      expect(state.collectibles).toHaveLength(GAME_CONFIG.MAX_COLLECTIBLES);
    });
  });
});
