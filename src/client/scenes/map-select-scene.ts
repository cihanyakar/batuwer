import Phaser from 'phaser';
import { ALL_MAPS } from '../../shared/maps';
import { GAME_CONFIG, type MapDefinition } from '../../shared/types';
import { createButton } from '../ui/button';

const CARD_WIDTH = 350;
const CARD_HEIGHT = 280;
const CARD_GAP = 40;
const CARD_BG = 0x0f3460;
const CARD_SELECTED_BORDER = 0xe94560;
const CARD_BORDER = 0x16213e;
const PATH_COLOR = 0xffdd44;

interface MapSelectData {
  mode: 'single' | 'lobby';
  currentMapId?: string;
}

export class MapSelectScene extends Phaser.Scene {
  private selectedMapId = ALL_MAPS[0].id;
  private mode: 'single' | 'lobby' = 'single';
  private cardGraphics = new Map<string, Phaser.GameObjects.Graphics>();

  constructor() {
    super({ key: 'MapSelectScene' });
  }

  create(data: MapSelectData): void {
    this.mode = data.mode;
    this.selectedMapId = data.currentMapId ?? ALL_MAPS[0].id;
    this.cardGraphics.clear();

    const cx = GAME_CONFIG.WORLD_WIDTH / 2;

    this.add.text(cx, 50, 'SELECT MAP', {
      fontSize: '42px',
      fontFamily: 'monospace',
      color: '#e94560',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const totalWidth = ALL_MAPS.length * CARD_WIDTH + (ALL_MAPS.length - 1) * CARD_GAP;
    const startX = cx - totalWidth / 2 + CARD_WIDTH / 2;

    for (const [i, mapDef] of ALL_MAPS.entries()) {
      const cardX = startX + i * (CARD_WIDTH + CARD_GAP);
      this.createMapCard(cardX, 280, mapDef);
    }

    createButton({
      scene: this,
      x: cx,
      y: GAME_CONFIG.WORLD_HEIGHT - 100,
      width: 250,
      height: 55,
      label: this.mode === 'single' ? 'START GAME' : 'SELECT',
      onClick: () => {
        this.confirmSelection();
      },
    });

    createButton({
      scene: this,
      x: cx,
      y: GAME_CONFIG.WORLD_HEIGHT - 35,
      width: 150,
      height: 40,
      label: 'BACK',
      color: 0x533483,
      hoverColor: 0x7b52ab,
      fontSize: '18px',
      onClick: () => {
        this.goBack();
      },
    });
  }

  private createMapCard(x: number, y: number, mapDef: MapDefinition): void {
    const cardBg = this.add.graphics();
    this.cardGraphics.set(mapDef.id, cardBg);
    this.drawCardBorder(cardBg, x, y, mapDef.id === this.selectedMapId);

    // Map preview area
    const previewBg = this.add.graphics();
    previewBg.fillStyle(0x0a0a1a, 1);
    previewBg.fillRect(x - CARD_WIDTH / 2 + 15, y - CARD_HEIGHT / 2 + 15, CARD_WIDTH - 30, 150);

    // Draw paths
    this.drawMapPreview(x - CARD_WIDTH / 2 + 15, y - CARD_HEIGHT / 2 + 15, CARD_WIDTH - 30, 150, mapDef);

    // Map name
    this.add.text(x, y + 30, mapDef.name, {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Map description
    this.add.text(x, y + 60, mapDef.description, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#aaaacc',
      wordWrap: { width: CARD_WIDTH - 30 },
      align: 'center',
    }).setOrigin(0.5);

    // Info
    const infoText = `${String(mapDef.paths.length)} path${mapDef.paths.length > 1 ? 's' : ''} | ${String(mapDef.towerSlots.length)} tower slots`;
    this.add.text(x, y + 90, infoText, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#666688',
    }).setOrigin(0.5);

    // Clickable zone
    const zone = this.add.zone(x, y, CARD_WIDTH, CARD_HEIGHT).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      this.selectedMapId = mapDef.id;
      this.updateCardBorders();
    });
  }

  private drawCardBorder(graphics: Phaser.GameObjects.Graphics, x: number, y: number, selected: boolean): void {
    graphics.clear();
    graphics.fillStyle(CARD_BG, 0.9);
    graphics.fillRoundedRect(x - CARD_WIDTH / 2, y - CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 10);
    graphics.lineStyle(selected ? 3 : 1, selected ? CARD_SELECTED_BORDER : CARD_BORDER);
    graphics.strokeRoundedRect(x - CARD_WIDTH / 2, y - CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 10);
  }

  private updateCardBorders(): void {
    const totalWidth = ALL_MAPS.length * CARD_WIDTH + (ALL_MAPS.length - 1) * CARD_GAP;
    const cx = GAME_CONFIG.WORLD_WIDTH / 2;
    const startX = cx - totalWidth / 2 + CARD_WIDTH / 2;

    for (const [i, mapDef] of ALL_MAPS.entries()) {
      const cardX = startX + i * (CARD_WIDTH + CARD_GAP);
      const cardGraphics = this.cardGraphics.get(mapDef.id);
      if (cardGraphics !== undefined) {
        this.drawCardBorder(cardGraphics, cardX, 280, mapDef.id === this.selectedMapId);
      }
    }
  }

  private drawMapPreview(
    px: number,
    py: number,
    pw: number,
    ph: number,
    mapDef: MapDefinition,
  ): void {
    const scaleX = pw / mapDef.width;
    const scaleY = ph / mapDef.height;
    const graphics = this.add.graphics();

    // Draw paths
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

    // Draw tower slots
    for (const slot of mapDef.towerSlots) {
      graphics.fillStyle(0x4488ff, 0.6);
      graphics.fillRect(
        px + slot.position.x * scaleX - 4,
        py + slot.position.y * scaleY - 4,
        8,
        8,
      );
    }

    // Spawn points (green)
    for (const sp of mapDef.spawnPoints) {
      graphics.fillStyle(0x44ff44, 0.8);
      graphics.fillCircle(px + sp.position.x * scaleX, py + sp.position.y * scaleY, 5);
    }

    // End point (red)
    graphics.fillStyle(0xff4444, 0.8);
    graphics.fillCircle(px + mapDef.endPoint.x * scaleX, py + mapDef.endPoint.y * scaleY, 6);
  }

  private confirmSelection(): void {
    if (this.mode === 'single') {
      this.scene.start('GameScene', { mapId: this.selectedMapId, mode: 'single' });
    } else {
      this.scene.start('LobbyScene', { selectedMapId: this.selectedMapId });
    }
  }

  private goBack(): void {
    if (this.mode === 'single') {
      this.scene.start('MainMenuScene');
    } else {
      this.scene.start('LobbyScene');
    }
  }
}
