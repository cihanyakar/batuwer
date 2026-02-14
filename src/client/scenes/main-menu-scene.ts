import Phaser from 'phaser';
import { GAME_CONFIG } from '../../shared/types';
import { createButton } from '../ui/button';

const TITLE_COLOR = '#e94560';
const SUBTITLE_COLOR = '#533483';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const cx = GAME_CONFIG.WORLD_WIDTH / 2;
    const cy = GAME_CONFIG.WORLD_HEIGHT / 2;

    this.add.text(cx, cy - 200, 'BATUWER', {
      fontSize: '72px',
      fontFamily: 'monospace',
      color: TITLE_COLOR,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 130, 'Tower Defense', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: SUBTITLE_COLOR,
    }).setOrigin(0.5);

    createButton({
      scene: this,
      x: cx,
      y: cy - 30,
      width: 300,
      height: 55,
      label: 'SINGLE PLAYER',
      onClick: () => {
        this.scene.start('MapSelectScene', { mode: 'single' });
      },
    });

    createButton({
      scene: this,
      x: cx,
      y: cy + 45,
      width: 300,
      height: 55,
      label: 'MULTIPLAYER',
      onClick: () => {
        this.scene.start('LobbyBrowserScene');
      },
    });

    createButton({
      scene: this,
      x: cx,
      y: cy + 120,
      width: 300,
      height: 55,
      label: 'SETTINGS',
      color: 0x533483,
      hoverColor: 0x7b52ab,
      onClick: () => {
        this.scene.start('SettingsScene');
      },
    });

    this.add.text(cx, GAME_CONFIG.WORLD_HEIGHT - 30, 'v0.1.0', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#333355',
    }).setOrigin(0.5);
  }
}
