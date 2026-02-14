import Phaser from 'phaser';
import { GAME_CONFIG } from '../../shared/types';
import { createPanel } from '../ui/panel';

interface HudSceneData {
  mapName: string;
  playerCount: number;
}

export class HudScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HudScene' });
  }

  create(data: HudSceneData): void {
    createPanel({
      scene: this,
      x: GAME_CONFIG.WORLD_WIDTH - 200,
      y: 5,
      width: 195,
      height: 60,
    });

    this.add.text(GAME_CONFIG.WORLD_WIDTH - 190, 15, data.mapName, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#e94560',
      fontStyle: 'bold',
    });

    this.add.text(GAME_CONFIG.WORLD_WIDTH - 190, 38, `Players: ${String(data.playerCount)}`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff',
    });
  }
}
