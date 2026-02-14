import { describe, expect, it } from 'vitest';
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
} from './lobby-logic';
import type { PlayerInfo } from './types';

function makePlayer(id: string, name = `Player ${id}`): PlayerInfo {
  return { id, name, color: 0xff0000, slot: 0 };
}

describe('createLobbyState', () => {
  it('creates lobby with host in slot 0', () => {
    const host = makePlayer('h1', 'Host');
    const lobby = createLobbyState('lobby1', 'My Lobby', host);

    expect(lobby.id).toBe('lobby1');
    expect(lobby.name).toBe('My Lobby');
    expect(lobby.hostId).toBe('h1');
    expect(lobby.status).toBe('waiting');
    expect(lobby.slots[0].player?.id).toBe('h1');
    expect(lobby.slots[1].player).toBeNull();
    expect(lobby.slots[2].player).toBeNull();
    expect(lobby.slots[3].player).toBeNull();
  });

  it('selects first map by default', () => {
    const host = makePlayer('h1');
    const lobby = createLobbyState('lobby1', 'Test', host);
    expect(lobby.selectedMapId).toBe('grasslands');
  });
});

describe('addPlayerToLobby', () => {
  it('adds player to first empty slot', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    const result = addPlayerToLobby(lobby, makePlayer('p2'));

    expect(result).toStrictEqual({ slotIndex: 1 });
    expect(lobby.slots[1].player?.id).toBe('p2');
    expect(lobby.slots[1].ready).toBe(false);
  });

  it('assigns correct slot number to player', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    addPlayerToLobby(lobby, makePlayer('p2'));

    expect(lobby.slots[1].player?.slot).toBe(1);
  });

  it('returns error when lobby is full', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    addPlayerToLobby(lobby, makePlayer('p2'));
    addPlayerToLobby(lobby, makePlayer('p3'));
    addPlayerToLobby(lobby, makePlayer('p4'));
    const result = addPlayerToLobby(lobby, makePlayer('p5'));

    expect(result).toStrictEqual({ error: 'Lobby is full' });
  });

  it('returns error for duplicate player', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    const result = addPlayerToLobby(lobby, makePlayer('h1'));

    expect(result).toStrictEqual({ error: 'Player already in lobby' });
  });

  it('returns error when lobby is not waiting', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    lobby.status = 'in_game';
    const result = addPlayerToLobby(lobby, makePlayer('p2'));

    expect(result).toStrictEqual({ error: 'Lobby is not accepting players' });
  });
});

describe('removePlayerFromLobby', () => {
  it('removes player and clears slot', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    addPlayerToLobby(lobby, makePlayer('p2'));
    const result = removePlayerFromLobby(lobby, 'p2');

    expect(result).toStrictEqual({ removedSlot: 1, newHostId: null });
    expect(lobby.slots[1].player).toBeNull();
  });

  it('reassigns host when host leaves', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    addPlayerToLobby(lobby, makePlayer('p2'));
    const result = removePlayerFromLobby(lobby, 'h1');

    expect('newHostId' in result).toBe(true);
    if ('newHostId' in result) {
      expect(result.newHostId).toBe('p2');
    }
    expect(lobby.hostId).toBe('p2');
  });

  it('returns null newHostId when last player leaves', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    const result = removePlayerFromLobby(lobby, 'h1');

    expect('newHostId' in result).toBe(true);
    if ('newHostId' in result) {
      expect(result.newHostId).toBeNull();
    }
  });

  it('returns error for unknown player', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    const result = removePlayerFromLobby(lobby, 'unknown');

    expect(result).toStrictEqual({ error: 'Player not in lobby' });
  });
});

describe('toggleReady', () => {
  it('toggles ready state', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    addPlayerToLobby(lobby, makePlayer('p2'));

    const result1 = toggleReady(lobby, 'p2');
    expect(result1).toStrictEqual({ slotIndex: 1, ready: true });
    expect(lobby.slots[1].ready).toBe(true);

    const result2 = toggleReady(lobby, 'p2');
    expect(result2).toStrictEqual({ slotIndex: 1, ready: false });
    expect(lobby.slots[1].ready).toBe(false);
  });

  it('prevents host from toggling ready', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    const result = toggleReady(lobby, 'h1');

    expect(result).toStrictEqual({ error: 'Host does not need to ready up' });
  });

  it('returns error for unknown player', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    const result = toggleReady(lobby, 'unknown');

    expect(result).toStrictEqual({ error: 'Player not in lobby' });
  });
});

describe('canStartGame', () => {
  it('allows host to start when all non-host are ready', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    addPlayerToLobby(lobby, makePlayer('p2'));
    toggleReady(lobby, 'p2');

    const result = canStartGame(lobby, 'h1');
    expect(result).toStrictEqual({ ok: true });
  });

  it('allows host to start solo', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    const result = canStartGame(lobby, 'h1');
    expect(result).toStrictEqual({ ok: true });
  });

  it('fails when non-host tries to start', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    addPlayerToLobby(lobby, makePlayer('p2'));
    const result = canStartGame(lobby, 'p2');

    expect(result).toStrictEqual({ error: 'Only host can start the game' });
  });

  it('fails when not all players are ready', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    addPlayerToLobby(lobby, makePlayer('p2'));
    const result = canStartGame(lobby, 'h1');

    expect(result).toStrictEqual({ error: 'Not all players are ready' });
  });

  it('fails when game already in progress', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    lobby.status = 'in_game';
    const result = canStartGame(lobby, 'h1');

    expect(result).toStrictEqual({ error: 'Game already starting or in progress' });
  });
});

describe('selectMap', () => {
  it('host can change map', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    const result = selectMap(lobby, 'h1', 'fortress');

    expect(result).toStrictEqual({ ok: true });
    expect(lobby.selectedMapId).toBe('fortress');
  });

  it('non-host cannot change map', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    addPlayerToLobby(lobby, makePlayer('p2'));
    const result = selectMap(lobby, 'p2', 'fortress');

    expect(result).toStrictEqual({ error: 'Only host can select map' });
  });

  it('rejects invalid map id', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    const result = selectMap(lobby, 'h1', 'nonexistent');

    expect(result).toStrictEqual({ error: 'Invalid map id' });
  });
});

describe('getPlayerCount', () => {
  it('counts occupied slots', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    expect(getPlayerCount(lobby)).toBe(1);

    addPlayerToLobby(lobby, makePlayer('p2'));
    expect(getPlayerCount(lobby)).toBe(2);
  });
});

describe('isLobbyEmpty', () => {
  it('returns false when players present', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    expect(isLobbyEmpty(lobby)).toBe(false);
  });

  it('returns true when all slots empty', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    removePlayerFromLobby(lobby, 'h1');
    expect(isLobbyEmpty(lobby)).toBe(true);
  });
});

describe('getPlayersInLobby', () => {
  it('returns all players', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    addPlayerToLobby(lobby, makePlayer('p2'));

    const players = getPlayersInLobby(lobby);
    expect(players).toHaveLength(2);
    expect(players.map((p) => p.id)).toStrictEqual(['h1', 'p2']);
  });

  it('returns empty array for empty lobby', () => {
    const lobby = createLobbyState('l1', 'Test', makePlayer('h1'));
    removePlayerFromLobby(lobby, 'h1');

    expect(getPlayersInLobby(lobby)).toHaveLength(0);
  });
});
