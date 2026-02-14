import Phaser from 'phaser';
import { GAME_CONFIG } from '../shared/types';
import { BootScene } from './scenes/boot-scene';
import { GameScene } from './scenes/game-scene';
import { HudScene } from './scenes/hud-scene';
import { LobbyScene } from './scenes/lobby-scene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WORLD_WIDTH,
  height: GAME_CONFIG.WORLD_HEIGHT,
  backgroundColor: '#1a1a2e',
  parent: document.body,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, LobbyScene, GameScene, HudScene],
};

new Phaser.Game(config);
