import type Phaser from 'phaser';

export interface PanelConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: number;
  alpha?: number;
  borderColor?: number;
  borderWidth?: number;
}

const DEFAULT_PANEL_COLOR = 0x0f3460;
const DEFAULT_ALPHA = 0.85;

export function createPanel(config: PanelConfig): Phaser.GameObjects.Graphics {
  const {
    scene,
    x,
    y,
    width,
    height,
    color = DEFAULT_PANEL_COLOR,
    alpha = DEFAULT_ALPHA,
    borderColor,
    borderWidth = 2,
  } = config;

  const graphics = scene.add.graphics();
  graphics.fillStyle(color, alpha);
  graphics.fillRoundedRect(x, y, width, height, 8);

  if (borderColor !== undefined) {
    graphics.lineStyle(borderWidth, borderColor);
    graphics.strokeRoundedRect(x, y, width, height, 8);
  }

  return graphics;
}
