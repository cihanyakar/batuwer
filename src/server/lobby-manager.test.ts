import { describe, expect, it, vi } from 'vitest';
import { LobbyManager } from './lobby-manager';

describe('LobbyManager', () => {
  it('creates a lobby', () => {
    const manager = new LobbyManager();
    const result = manager.createLobby('p1', 'Alice', 'Test Lobby');

    expect('id' in result).toBe(true);
    if ('id' in result) {
      expect(result.name).toBe('Test Lobby');
      expect(result.hostId).toBe('p1');
      expect(result.slots[0].player?.name).toBe('Alice');
    }
  });

  it('emits lobby:created event', () => {
    const manager = new LobbyManager();
    const handler = vi.fn();
    manager.on('lobby:created', handler);

    manager.createLobby('p1', 'Alice', 'Test Lobby');

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].name).toBe('Test Lobby');
  });

  it('prevents creating lobby when already in one', () => {
    const manager = new LobbyManager();
    manager.createLobby('p1', 'Alice', 'Lobby 1');
    const result = manager.createLobby('p1', 'Alice', 'Lobby 2');

    expect(result).toStrictEqual({ error: 'Player already in a lobby' });
  });

  it('lists lobbies', () => {
    const manager = new LobbyManager();
    manager.createLobby('p1', 'Alice', 'Lobby 1');
    manager.createLobby('p2', 'Bob', 'Lobby 2');

    const lobbies = manager.getLobbies();
    expect(lobbies).toHaveLength(2);
    expect(lobbies.map((l) => l.name).sort((a, b) => a.localeCompare(b))).toStrictEqual(['Lobby 1', 'Lobby 2']);
  });

  it('joins a lobby', () => {
    const manager = new LobbyManager();
    const lobby = manager.createLobby('p1', 'Alice', 'Test');
    if ('error' in lobby) {
      throw new Error('Unexpected error');
    }

    const result = manager.joinLobby(lobby.id, 'p2', 'Bob');
    expect('slotIndex' in result).toBe(true);
    if ('slotIndex' in result) {
      expect(result.slotIndex).toBe(1);
    }
  });

  it('prevents joining non-existent lobby', () => {
    const manager = new LobbyManager();
    const result = manager.joinLobby('fake', 'p1', 'Alice');
    expect(result).toStrictEqual({ error: 'Lobby not found' });
  });

  it('prevents joining when already in a lobby', () => {
    const manager = new LobbyManager();
    const lobby = manager.createLobby('p1', 'Alice', 'Test');
    if ('error' in lobby) {
      throw new Error('Unexpected error');
    }

    const result = manager.joinLobby(lobby.id, 'p1', 'Alice');
    expect(result).toStrictEqual({ error: 'Player already in a lobby' });
  });

  it('leaves a lobby', () => {
    const manager = new LobbyManager();
    const lobby = manager.createLobby('p1', 'Alice', 'Test');
    if ('error' in lobby) {
      throw new Error('Unexpected error');
    }
    manager.joinLobby(lobby.id, 'p2', 'Bob');

    const result = manager.leaveLobby('p2');
    expect('removedSlot' in result).toBe(true);
    if ('removedSlot' in result) {
      expect(result.removedSlot).toBe(1);
    }
  });

  it('removes empty lobby after last player leaves', () => {
    const manager = new LobbyManager();
    const lobby = manager.createLobby('p1', 'Alice', 'Test');
    if ('error' in lobby) {
      throw new Error('Unexpected error');
    }

    manager.leaveLobby('p1');
    expect(manager.getLobbies()).toHaveLength(0);
  });

  it('reassigns host when host leaves', () => {
    const manager = new LobbyManager();
    const lobby = manager.createLobby('p1', 'Alice', 'Test');
    if ('error' in lobby) {
      throw new Error('Unexpected error');
    }
    manager.joinLobby(lobby.id, 'p2', 'Bob');

    const hostChangedHandler = vi.fn();
    manager.on('lobby:host-changed', hostChangedHandler);

    manager.leaveLobby('p1');
    expect(hostChangedHandler).toHaveBeenCalledOnce();
  });

  it('toggles ready', () => {
    const manager = new LobbyManager();
    const lobby = manager.createLobby('p1', 'Alice', 'Test');
    if ('error' in lobby) {
      throw new Error('Unexpected error');
    }
    manager.joinLobby(lobby.id, 'p2', 'Bob');

    const result = manager.handleToggleReady('p2');
    expect('ready' in result).toBe(true);
    if ('ready' in result) {
      expect(result.ready).toBe(true);
    }
  });

  it('selects map', () => {
    const manager = new LobbyManager();
    const lobby = manager.createLobby('p1', 'Alice', 'Test');
    if ('error' in lobby) {
      throw new Error('Unexpected error');
    }

    const result = manager.handleSelectMap('p1', 'fortress');
    expect('lobbyId' in result).toBe(true);

    const state = manager.getLobbyForPlayer('p1');
    expect(state?.selectedMapId).toBe('fortress');
  });

  it('starts game when all ready', () => {
    const manager = new LobbyManager();
    const lobby = manager.createLobby('p1', 'Alice', 'Test');
    if ('error' in lobby) {
      throw new Error('Unexpected error');
    }
    manager.joinLobby(lobby.id, 'p2', 'Bob');
    manager.handleToggleReady('p2');

    const result = manager.handleStartGame('p1');
    expect('mapId' in result).toBe(true);
    if ('mapId' in result) {
      expect(result.players).toHaveLength(2);
    }
  });

  it('prevents starting when not all ready', () => {
    const manager = new LobbyManager();
    const lobby = manager.createLobby('p1', 'Alice', 'Test');
    if ('error' in lobby) {
      throw new Error('Unexpected error');
    }
    manager.joinLobby(lobby.id, 'p2', 'Bob');

    const result = manager.handleStartGame('p1');
    expect(result).toStrictEqual({ error: 'Not all players are ready' });
  });

  it('tracks player lobby mapping', () => {
    const manager = new LobbyManager();
    const lobby = manager.createLobby('p1', 'Alice', 'Test');
    if ('error' in lobby) {
      throw new Error('Unexpected error');
    }

    expect(manager.getPlayerLobbyId('p1')).toBe(lobby.id);
    expect(manager.getPlayerLobbyId('unknown')).toBeUndefined();
  });
});
