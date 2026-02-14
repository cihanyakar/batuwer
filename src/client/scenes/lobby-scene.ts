import Phaser from 'phaser';
import { getMapById } from '../../shared/maps';
import { GAME_CONFIG, type LobbyState, type MapDefinition } from '../../shared/types';
import { getSocket, leaveLobby, requestStartGame, toggleReady } from '../network';
import { createButton } from '../ui/button';
import { createPanel } from '../ui/panel';

const SLOT_HEIGHT = 60;
const SLOT_WIDTH = 450;
const SLOT_Y_START = 160;
const READY_COLOR = 0x44ff44;
const NOT_READY_COLOR = 0xff4444;
const HOST_COLOR = 0xffdd44;
const PREVIEW_X = 700;
const PREVIEW_Y = 160;
const PREVIEW_W = 420;
const PREVIEW_H = 280;
const PATH_COLOR = 0xffdd44;

interface LobbySceneData {
  lobbyState: LobbyState;
}

export class LobbyScene extends Phaser.Scene {
  private lobbyState: LobbyState | null = null;
  private slotContainers: Phaser.GameObjects.Container[] = [];
  private previewContainer: Phaser.GameObjects.Container | null = null;
  private actionButtons: Phaser.GameObjects.Container[] = [];
  private myId = '';

  constructor() {
    super({ key: 'LobbyScene' });
  }

  create(data: LobbySceneData): void {
    this.lobbyState = data.lobbyState;
    this.myId = getSocket().id ?? '';

    this.add.text(GAME_CONFIG.WORLD_WIDTH / 2, 40, this.lobbyState.name, {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#e94560',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_CONFIG.WORLD_WIDTH / 2, 80, 'LOBBY', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#533483',
    }).setOrigin(0.5);

    this.renderSlots();
    this.renderMapPreview();
    this.renderActionButtons();
    this.setupSocketListeners();
  }

  private renderSlots(): void {
    for (const container of this.slotContainers) {
      container.destroy();
    }
    this.slotContainers = [];

    if (this.lobbyState === null) {
      return;
    }

    this.add.text(60, SLOT_Y_START - 30, 'PLAYERS', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#666688',
    });

    for (let i = 0; i < GAME_CONFIG.MAX_PLAYERS_PER_LOBBY; i++) {
      const y = SLOT_Y_START + i * (SLOT_HEIGHT + 8);
      const container = this.add.container(0, 0);
      this.slotContainers.push(container);
      this.drawSlot(container, y, i);
    }
  }

  private drawSlot(container: Phaser.GameObjects.Container, y: number, slotIndex: number): void {
    container.removeAll(true);

    if (this.lobbyState === null) {
      return;
    }

    const slot = this.lobbyState.slots[slotIndex];
    const bg = this.add.graphics();
    bg.fillStyle(0x0f3460, 0.7);
    bg.fillRoundedRect(40, y, SLOT_WIDTH, SLOT_HEIGHT, 6);
    container.add(bg);

    if (slot.player !== null) {
      const { player } = slot;
      const isHost = player.id === this.lobbyState.hostId;

      // Color indicator
      const colorDot = this.add.circle(65, y + SLOT_HEIGHT / 2, 10, player.color);
      container.add(colorDot);

      // Player name
      const nameText = this.add.text(85, y + SLOT_HEIGHT / 2, player.name, {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#ffffff',
      }).setOrigin(0, 0.5);
      container.add(nameText);

      // Host indicator
      if (isHost) {
        const hostLabel = this.add.text(85 + nameText.width + 10, y + SLOT_HEIGHT / 2, 'HOST', {
          fontSize: '12px',
          fontFamily: 'monospace',
          color: `#${HOST_COLOR.toString(16)}`,
          fontStyle: 'bold',
        }).setOrigin(0, 0.5);
        container.add(hostLabel);
      }

      // Ready status (non-host only)
      if (!isHost) {
        const readyColor = slot.ready ? READY_COLOR : NOT_READY_COLOR;
        const readyLabel = slot.ready ? 'READY' : 'NOT READY';
        const readyText = this.add.text(SLOT_WIDTH - 10, y + SLOT_HEIGHT / 2, readyLabel, {
          fontSize: '14px',
          fontFamily: 'monospace',
          color: `#${readyColor.toString(16).padStart(6, '0')}`,
          fontStyle: 'bold',
        }).setOrigin(1, 0.5);
        container.add(readyText);
      }
    } else {
      const emptyText = this.add.text(65, y + SLOT_HEIGHT / 2, 'Empty Slot', {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#444466',
      }).setOrigin(0, 0.5);
      container.add(emptyText);
    }
  }

  private renderMapPreview(): void {
    this.previewContainer?.destroy();
    this.previewContainer = this.add.container(0, 0);

    if (this.lobbyState === null) {
      return;
    }

    const map = getMapById(this.lobbyState.selectedMapId);
    if (map === undefined) {
      return;
    }

    const panel = createPanel({
      scene: this,
      x: PREVIEW_X,
      y: PREVIEW_Y,
      width: PREVIEW_W,
      height: PREVIEW_H + 80,
      borderColor: 0x16213e,
    });
    this.previewContainer.add(panel);

    this.add.text(PREVIEW_X + PREVIEW_W / 2, PREVIEW_Y + 20, map.name, {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.drawMapPreview(PREVIEW_X + 15, PREVIEW_Y + 45, PREVIEW_W - 30, PREVIEW_H - 40, map);

    this.add.text(PREVIEW_X + PREVIEW_W / 2, PREVIEW_Y + PREVIEW_H + 20, map.description, {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#aaaacc',
      wordWrap: { width: PREVIEW_W - 30 },
      align: 'center',
    }).setOrigin(0.5);

    const info = `${String(map.paths.length)} path${map.paths.length > 1 ? 's' : ''} | ${String(map.towerSlots.length)} tower slots`;
    this.add.text(PREVIEW_X + PREVIEW_W / 2, PREVIEW_Y + PREVIEW_H + 45, info, {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#666688',
    }).setOrigin(0.5);
  }

  private drawMapPreview(px: number, py: number, pw: number, ph: number, mapDef: MapDefinition): void {
    const scaleX = pw / mapDef.width;
    const scaleY = ph / mapDef.height;
    const graphics = this.add.graphics();

    // Preview background
    graphics.fillStyle(0x0a0a1a, 1);
    graphics.fillRect(px, py, pw, ph);

    // Paths
    graphics.lineStyle(3, PATH_COLOR, 0.8);
    for (const path of mapDef.paths) {
      if (path.waypoints.length < 2) {
        continue;
      }
      graphics.beginPath();
      graphics.moveTo(px + path.waypoints[0].x * scaleX, py + path.waypoints[0].y * scaleY);
      for (let j = 1; j < path.waypoints.length; j++) {
        graphics.lineTo(px + path.waypoints[j].x * scaleX, py + path.waypoints[j].y * scaleY);
      }
      graphics.strokePath();
    }

    // Tower slots
    for (const slot of mapDef.towerSlots) {
      graphics.fillStyle(0x4488ff, 0.6);
      graphics.fillRect(px + slot.position.x * scaleX - 4, py + slot.position.y * scaleY - 4, 8, 8);
    }

    // Spawn points
    for (const sp of mapDef.spawnPoints) {
      graphics.fillStyle(0x44ff44, 0.8);
      graphics.fillCircle(px + sp.position.x * scaleX, py + sp.position.y * scaleY, 5);
    }

    // End point
    graphics.fillStyle(0xff4444, 0.8);
    graphics.fillCircle(px + mapDef.endPoint.x * scaleX, py + mapDef.endPoint.y * scaleY, 6);

    this.previewContainer?.add(graphics);
  }

  private renderActionButtons(): void {
    for (const btn of this.actionButtons) {
      btn.destroy();
    }
    this.actionButtons = [];

    if (this.lobbyState === null) {
      return;
    }

    const isHost = this.myId === this.lobbyState.hostId;
    const buttonY = GAME_CONFIG.WORLD_HEIGHT - 60;

    if (isHost) {
      // Change map button
      const changeMapBtn = createButton({
        scene: this,
        x: PREVIEW_X + PREVIEW_W / 2,
        y: PREVIEW_Y + PREVIEW_H + 75,
        width: 180,
        height: 38,
        label: 'CHANGE MAP',
        fontSize: '16px',
        color: 0x533483,
        hoverColor: 0x7b52ab,
        onClick: () => {
          this.scene.start('MapSelectScene', {
            mode: 'lobby',
            currentMapId: this.lobbyState?.selectedMapId,
          });
        },
      });
      this.actionButtons.push(changeMapBtn);

      // Start button
      const startBtn = createButton({
        scene: this,
        x: GAME_CONFIG.WORLD_WIDTH / 2,
        y: buttonY,
        width: 200,
        height: 50,
        label: 'START GAME',
        onClick: () => {
          requestStartGame();
        },
      });
      this.actionButtons.push(startBtn);
    } else {
      // Ready button
      const readyBtn = createButton({
        scene: this,
        x: GAME_CONFIG.WORLD_WIDTH / 2,
        y: buttonY,
        width: 200,
        height: 50,
        label: 'READY',
        onClick: () => {
          toggleReady();
        },
      });
      this.actionButtons.push(readyBtn);
    }

    // Leave button
    const leaveBtn = createButton({
      scene: this,
      x: 80,
      y: GAME_CONFIG.WORLD_HEIGHT - 40,
      width: 120,
      height: 40,
      label: 'LEAVE',
      fontSize: '18px',
      color: 0x533483,
      hoverColor: 0x7b52ab,
      onClick: () => {
        leaveLobby();
        this.cleanup();
        this.scene.start('LobbyBrowserScene');
      },
    });
    this.actionButtons.push(leaveBtn);
  }

  private setupSocketListeners(): void {
    const socket = getSocket();

    socket.on('lobby:player-joined', (slotIndex, player) => {
      if (this.lobbyState === null) {
        return;
      }
      this.lobbyState.slots[slotIndex] = { player, ready: false };
      this.refreshUi();
    });

    socket.on('lobby:player-left', (slotIndex) => {
      if (this.lobbyState === null) {
        return;
      }
      this.lobbyState.slots[slotIndex] = { player: null, ready: false };
      this.refreshUi();
    });

    socket.on('lobby:ready-changed', (slotIndex, ready) => {
      if (this.lobbyState === null) {
        return;
      }
      this.lobbyState.slots[slotIndex].ready = ready;
      this.refreshUi();
    });

    socket.on('lobby:map-changed', (mapId) => {
      if (this.lobbyState === null) {
        return;
      }
      this.lobbyState.selectedMapId = mapId;
      this.renderMapPreview();
    });

    socket.on('lobby:host-changed', (newHostId) => {
      if (this.lobbyState === null) {
        return;
      }
      this.lobbyState.hostId = newHostId;
      this.refreshUi();
    });

    socket.on('lobby:game-starting', () => {
      // Transition handled by game:started
    });

    socket.on('game:started', (mapId, players) => {
      this.cleanup();
      this.scene.start('GameScene', { mapId, mode: 'multiplayer', players });
    });

    socket.on('error', (message) => {
      console.warn('Lobby error:', message);
    });
  }

  private refreshUi(): void {
    if (this.lobbyState === null) {
      return;
    }
    for (let i = 0; i < GAME_CONFIG.MAX_PLAYERS_PER_LOBBY; i++) {
      this.drawSlot(this.slotContainers[i], SLOT_Y_START + i * (SLOT_HEIGHT + 8), i);
    }
    this.renderActionButtons();
  }

  private cleanup(): void {
    const socket = getSocket();
    socket.removeAllListeners('lobby:player-joined');
    socket.removeAllListeners('lobby:player-left');
    socket.removeAllListeners('lobby:ready-changed');
    socket.removeAllListeners('lobby:map-changed');
    socket.removeAllListeners('lobby:host-changed');
    socket.removeAllListeners('lobby:game-starting');
    socket.removeAllListeners('game:started');
    socket.removeAllListeners('error');
  }
}
