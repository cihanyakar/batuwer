import Phaser from 'phaser';
import { getMapById } from '../../shared/maps';
import { GAME_CONFIG, type MapDefinition, type PlayerInfo } from '../../shared/types';
import { createButton } from '../ui/button';

const PATH_COLOR = 0xffdd44;
const SLOT_COLOR = 0x4488ff;
const SPAWN_COLOR = 0x44ff44;
const END_COLOR = 0xff4444;

interface GameSceneData {
  mapId: string;
  mode: 'single' | 'multiplayer';
  players?: PlayerInfo[];
}

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(data: GameSceneData): void {
    const mapDef = getMapById(data.mapId);
    if (mapDef === undefined) {
      this.scene.start('MainMenuScene');
      return;
    }

    this.drawBackground();
    this.drawMap(mapDef);

    this.add.text(GAME_CONFIG.WORLD_WIDTH / 2, 30, mapDef.name, {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const modeText = data.mode === 'single' ? 'Single Player' : `${String(data.players?.length ?? 0)} Players`;
    this.add.text(GAME_CONFIG.WORLD_WIDTH / 2, 60, modeText, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#aaaacc',
    }).setOrigin(0.5);

    this.add.text(GAME_CONFIG.WORLD_WIDTH / 2, GAME_CONFIG.WORLD_HEIGHT / 2, 'Game Coming Soon...', {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#e94560',
    }).setOrigin(0.5);

    createButton({
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
        this.scene.stop('HudScene');
        this.scene.start('MainMenuScene');
      },
    });

    this.scene.launch('HudScene', { mapName: mapDef.name, playerCount: data.players?.length ?? 1 });
  }

  private drawBackground(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x16213e, 0.3);
    for (let x = 0; x <= GAME_CONFIG.WORLD_WIDTH; x += 40) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, GAME_CONFIG.WORLD_HEIGHT);
    }
    for (let y = 0; y <= GAME_CONFIG.WORLD_HEIGHT; y += 40) {
      graphics.moveTo(0, y);
      graphics.lineTo(GAME_CONFIG.WORLD_WIDTH, y);
    }
    graphics.strokePath();
  }

  private drawMap(mapDef: MapDefinition): void {
    const graphics = this.add.graphics();

    // Paths
    graphics.lineStyle(6, PATH_COLOR, 0.4);
    for (const path of mapDef.paths) {
      if (path.waypoints.length < 2) {
        continue;
      }
      graphics.beginPath();
      graphics.moveTo(path.waypoints[0].x, path.waypoints[0].y);
      for (let j = 1; j < path.waypoints.length; j++) {
        graphics.lineTo(path.waypoints[j].x, path.waypoints[j].y);
      }
      graphics.strokePath();
    }

    // Path center line
    graphics.lineStyle(2, PATH_COLOR, 0.8);
    for (const path of mapDef.paths) {
      if (path.waypoints.length < 2) {
        continue;
      }
      graphics.beginPath();
      graphics.moveTo(path.waypoints[0].x, path.waypoints[0].y);
      for (let j = 1; j < path.waypoints.length; j++) {
        graphics.lineTo(path.waypoints[j].x, path.waypoints[j].y);
      }
      graphics.strokePath();
    }

    // Tower slots
    for (const slot of mapDef.towerSlots) {
      graphics.lineStyle(2, SLOT_COLOR, 0.8);
      graphics.strokeRect(slot.position.x - 15, slot.position.y - 15, 30, 30);
      graphics.fillStyle(SLOT_COLOR, 0.15);
      graphics.fillRect(slot.position.x - 15, slot.position.y - 15, 30, 30);
    }

    // Spawn points
    for (const sp of mapDef.spawnPoints) {
      graphics.fillStyle(SPAWN_COLOR, 0.8);
      graphics.fillCircle(sp.position.x, sp.position.y, 12);
      graphics.lineStyle(2, 0xffffff, 0.5);
      graphics.strokeCircle(sp.position.x, sp.position.y, 12);
    }

    // End point
    graphics.fillStyle(END_COLOR, 0.8);
    graphics.fillCircle(mapDef.endPoint.x, mapDef.endPoint.y, 14);
    graphics.lineStyle(2, 0xffffff, 0.5);
    graphics.strokeCircle(mapDef.endPoint.x, mapDef.endPoint.y, 14);

    // Legend
    this.drawLegend();
  }

  private drawLegend(): void {
    const lx = GAME_CONFIG.WORLD_WIDTH - 180;
    const ly = GAME_CONFIG.WORLD_HEIGHT - 100;

    const g = this.add.graphics();
    g.fillStyle(0x0f3460, 0.8);
    g.fillRoundedRect(lx - 10, ly - 10, 180, 90, 6);

    g.fillStyle(PATH_COLOR, 0.8);
    g.fillRect(lx, ly, 12, 3);
    this.add.text(lx + 20, ly, 'Enemy Path', { fontSize: '11px', fontFamily: 'monospace', color: '#ffffff' }).setOrigin(0, 0.3);

    g.fillStyle(SLOT_COLOR, 0.6);
    g.fillRect(lx, ly + 20, 10, 10);
    this.add.text(lx + 20, ly + 25, 'Tower Slot', { fontSize: '11px', fontFamily: 'monospace', color: '#ffffff' }).setOrigin(0, 0.3);

    g.fillStyle(SPAWN_COLOR, 0.8);
    g.fillCircle(lx + 5, ly + 50, 5);
    this.add.text(lx + 20, ly + 50, 'Spawn Point', { fontSize: '11px', fontFamily: 'monospace', color: '#ffffff' }).setOrigin(0, 0.3);

    g.fillStyle(END_COLOR, 0.8);
    g.fillCircle(lx + 5, ly + 70, 5);
    this.add.text(lx + 20, ly + 70, 'End Point', { fontSize: '11px', fontFamily: 'monospace', color: '#ffffff' }).setOrigin(0, 0.3);
  }
}
