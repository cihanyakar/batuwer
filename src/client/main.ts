import Phaser from 'phaser';
import { GAME_CONFIG } from '../shared/types';
import { BootScene } from './scenes/boot-scene';
import { GameScene } from './scenes/game-scene';
import { HudScene } from './scenes/hud-scene';
import { LobbyBrowserScene } from './scenes/lobby-browser-scene';
import { LobbyScene } from './scenes/lobby-scene';
import { MainMenuScene } from './scenes/main-menu-scene';
import { MapSelectScene } from './scenes/map-select-scene';
import { SettingsScene } from './scenes/settings-scene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WORLD_WIDTH,
  height: GAME_CONFIG.WORLD_HEIGHT,
  backgroundColor: '#1a1a2e',
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    MainMenuScene,
    SettingsScene,
    MapSelectScene,
    LobbyBrowserScene,
    LobbyScene,
    GameScene,
    HudScene,
  ],
};

new Phaser.Game(config);
