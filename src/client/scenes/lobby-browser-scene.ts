import Phaser from 'phaser';
import { getMapById } from '../../shared/maps';
import { GAME_CONFIG, type LobbyListEntry } from '../../shared/types';
import {
  connect,
  createLobby,
  disconnect,
  getSocket,
  joinLobby,
  requestLobbyList,
} from '../network';
import { getSettings } from '../settings-store';
import { createButton } from '../ui/button';
import { createPanel } from '../ui/panel';
import { type TextInputHandle, createTextInput } from '../ui/text-input';

const LIST_Y_START = 160;
const ROW_HEIGHT = 50;
const MAX_VISIBLE_ROWS = 8;

export class LobbyBrowserScene extends Phaser.Scene {
  private lobbies: LobbyListEntry[] = [];
  private lobbyRows: Phaser.GameObjects.Container[] = [];
  private createInput: TextInputHandle | null = null;
  private creatingLobby = false;

  constructor() {
    super({ key: 'LobbyBrowserScene' });
  }

  create(): void {
    const cx = GAME_CONFIG.WORLD_WIDTH / 2;
    const socket = connect();

    this.add.text(cx, 50, 'MULTIPLAYER', {
      fontSize: '42px',
      fontFamily: 'monospace',
      color: '#e94560',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    createButton({
      scene: this,
      x: cx - 120,
      y: 110,
      width: 200,
      height: 40,
      label: 'CREATE LOBBY',
      fontSize: '18px',
      onClick: () => {
        this.showCreateDialog();
      },
    });

    createButton({
      scene: this,
      x: cx + 120,
      y: 110,
      width: 140,
      height: 40,
      label: 'REFRESH',
      fontSize: '18px',
      color: 0x533483,
      hoverColor: 0x7b52ab,
      onClick: () => {
        requestLobbyList();
      },
    });

    createButton({
      scene: this,
      x: 80,
      y: GAME_CONFIG.WORLD_HEIGHT - 40,
      width: 120,
      height: 40,
      label: 'BACK',
      fontSize: '18px',
      color: 0x533483,
      hoverColor: 0x7b52ab,
      onClick: () => {
        this.cleanup();
        disconnect();
        this.scene.start('MainMenuScene');
      },
    });

    // List header
    this.add.text(60, LIST_Y_START - 25, 'LOBBY NAME', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#666688',
    });
    this.add.text(400, LIST_Y_START - 25, 'MAP', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#666688',
    });
    this.add.text(650, LIST_Y_START - 25, 'PLAYERS', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#666688',
    });

    // Socket listeners
    socket.on('lobby:list', (lobbies) => {
      this.lobbies = lobbies;
      this.renderLobbyList();
    });

    socket.on('lobby:state', (state) => {
      this.cleanup();
      this.scene.start('LobbyScene', { lobbyState: state });
    });

    socket.on('error', (message) => {
      console.warn('Lobby error:', message);
    });

    requestLobbyList();
  }

  private renderLobbyList(): void {
    for (const row of this.lobbyRows) {
      row.destroy();
    }
    this.lobbyRows = [];

    const waitingLobbies = this.lobbies.filter((l) => l.status === 'waiting');

    if (waitingLobbies.length === 0) {
      const emptyContainer = this.add.container(0, 0);
      const emptyText = this.add.text(GAME_CONFIG.WORLD_WIDTH / 2, LIST_Y_START + 80, 'No lobbies available.\nCreate one to get started!', {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#666688',
        align: 'center',
      }).setOrigin(0.5);
      emptyContainer.add(emptyText);
      this.lobbyRows.push(emptyContainer);
      return;
    }

    const visibleLobbies = waitingLobbies.slice(0, MAX_VISIBLE_ROWS);
    for (const [i, lobby] of visibleLobbies.entries()) {
      const rowY = LIST_Y_START + i * ROW_HEIGHT;
      this.createLobbyRow(rowY, lobby);
    }
  }

  private createLobbyRow(y: number, lobby: LobbyListEntry): void {
    const container = this.add.container(0, 0);

    const bg = this.add.graphics();
    bg.fillStyle(0x0f3460, 0.5);
    bg.fillRoundedRect(40, y, GAME_CONFIG.WORLD_WIDTH - 80, ROW_HEIGHT - 5, 6);
    container.add(bg);

    const nameText = this.add.text(60, y + ROW_HEIGHT / 2 - 2, lobby.name, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    container.add(nameText);

    const hostText = this.add.text(60, y + ROW_HEIGHT / 2 + 14, `Host: ${lobby.hostName}`, {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#888888',
    }).setOrigin(0, 0.5);
    container.add(hostText);

    const map = getMapById(lobby.selectedMapId);
    const mapText = this.add.text(400, y + ROW_HEIGHT / 2 - 2, map?.name ?? 'Unknown', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#aaaacc',
    }).setOrigin(0, 0.5);
    container.add(mapText);

    const playersText = this.add.text(650, y + ROW_HEIGHT / 2 - 2, `${String(lobby.playerCount)}/${String(lobby.maxPlayers)}`, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    container.add(playersText);

    const joinBtn = createButton({
      scene: this,
      x: GAME_CONFIG.WORLD_WIDTH - 100,
      y: y + ROW_HEIGHT / 2 - 2,
      width: 80,
      height: 32,
      label: 'JOIN',
      fontSize: '14px',
      onClick: () => {
        const settings = getSettings();
        joinLobby(lobby.id, settings.playerName);
      },
    });
    container.add(joinBtn);

    this.lobbyRows.push(container);
  }

  private showCreateDialog(): void {
    if (this.creatingLobby) {
      return;
    }
    this.creatingLobby = true;

    const cx = GAME_CONFIG.WORLD_WIDTH / 2;
    const cy = GAME_CONFIG.WORLD_HEIGHT / 2;

    const overlay = this.add.container(0, 0);

    const dimBg = this.add.graphics();
    dimBg.fillStyle(0x000000, 0.6);
    dimBg.fillRect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
    overlay.add(dimBg);

    const panel = createPanel({
      scene: this,
      x: cx - 220,
      y: cy - 120,
      width: 440,
      height: 240,
      borderColor: 0xe94560,
    });
    overlay.add(panel);

    const title = this.add.text(cx, cy - 90, 'CREATE LOBBY', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#e94560',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    overlay.add(title);

    const label = this.add.text(cx, cy - 50, 'Lobby Name', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    overlay.add(label);

    this.createInput = createTextInput({
      scene: this,
      x: cx,
      y: cy - 15,
      width: 350,
      maxLength: 24,
      placeholder: 'Enter lobby name...',
      onSubmit: (value) => {
        this.submitCreateLobby(value, overlay);
      },
    });
    overlay.add(this.createInput.container);

    const createBtn = createButton({
      scene: this,
      x: cx - 80,
      y: cy + 55,
      width: 140,
      height: 42,
      label: 'CREATE',
      fontSize: '18px',
      onClick: () => {
        if (this.createInput !== null) {
          this.submitCreateLobby(this.createInput.getValue(), overlay);
        }
      },
    });
    overlay.add(createBtn);

    const cancelBtn = createButton({
      scene: this,
      x: cx + 80,
      y: cy + 55,
      width: 140,
      height: 42,
      label: 'CANCEL',
      fontSize: '18px',
      color: 0x533483,
      hoverColor: 0x7b52ab,
      onClick: () => {
        this.createInput?.destroy();
        this.createInput = null;
        overlay.destroy();
        this.creatingLobby = false;
      },
    });
    overlay.add(cancelBtn);
  }

  private submitCreateLobby(name: string, overlay: Phaser.GameObjects.Container): void {
    const lobbyName = name.trim() !== '' ? name.trim() : 'New Lobby';
    const settings = getSettings();
    createLobby(lobbyName, settings.playerName);
    this.createInput?.destroy();
    this.createInput = null;
    overlay.destroy();
    this.creatingLobby = false;
  }

  private cleanup(): void {
    this.createInput?.destroy();
    this.createInput = null;
    const socket = getSocket();
    socket.removeAllListeners('lobby:list');
    socket.removeAllListeners('lobby:state');
    socket.removeAllListeners('error');
  }
}
